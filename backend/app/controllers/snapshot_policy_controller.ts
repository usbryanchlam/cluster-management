import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs'
import path from 'path'

// Type definitions for snapshot policy configuration
export interface SnapshotPolicy {
  uuid: string
  name: string
  directory: string
  schedule: {
    type: 'daily' | 'weekly'
    timezone: string
    time: {
      hour: number
      minute: number
    }
    days: string[] // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  }
  deletion: {
    type: 'automatically' | 'manually'
    after?: number // Days after which to delete (only for automatic deletion)
  }
  locking: {
    enabled: boolean // Prevents accidental deletion when enabled
  }
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// Request payload for creating/updating policies (excludes system fields)
export interface SnapshotPolicyRequest {
  name: string
  directory: string
  schedule: {
    type: 'daily' | 'weekly'
    timezone: string
    time: {
      hour: number
      minute: number
    }
    days: string[]
  }
  deletion: {
    type: 'automatically' | 'manually'
    after?: number
  }
  locking: {
    enabled: boolean
  }
  enabled: boolean
}

export default class SnapshotPolicyController {
  private dataDir = path.join(process.cwd(), 'data/policies')

  constructor() {
    // Ensure data directory exists for JSON file storage
    // In production, this would be replaced with database initialization
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  /**
   * Constructs the file path for storing policy JSON files.
   * Uses UUID as filename to ensure uniqueness and easy lookup.
   */
  private getPolicyFilePath(uuid: string): string {
    return path.join(this.dataDir, `${uuid}.json`)
  }

  /**
   * Generates a realistic default policy for demonstration purposes.
   * Creates a business-friendly weekday backup schedule with automatic cleanup.
   * In production, this would be replaced with proper policy templates.
   */
  private generateMockPolicy(uuid: string): SnapshotPolicy {
    return {
      uuid,
      name: 'ProjectX_Daily',
      directory: '/Production/ProjectX',
      schedule: {
        type: 'daily',
        timezone: 'America/Los_Angeles', // West Coast business hours
        time: {
          hour: 7,   // 7 AM - before business hours
          minute: 0
        },
        days: ['mon', 'tue', 'wed', 'thu', 'fri'] // Weekdays only
      },
      deletion: {
        type: 'automatically',
        after: 14 // 2 weeks retention - balances storage cost vs recovery needs
      },
      locking: {
        enabled: false // Start unlocked for easier initial management
      },
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Retrieves a snapshot policy by UUID.
   * Creates a default policy if none exists (useful for demo/development).
   * In production, this would return 404 for non-existent policies.
   */
  public async show({ params, response }: HttpContext) {
    try {
      const { uuid } = params

      if (!uuid) {
        return response.status(400).json({ error: 'UUID is required' })
      }

      const filePath = this.getPolicyFilePath(uuid)

      // Auto-create policy for demonstration purposes
      // Production systems would return 404 for missing policies
      if (!fs.existsSync(filePath)) {
        const mockPolicy = this.generateMockPolicy(uuid)
        fs.writeFileSync(filePath, JSON.stringify(mockPolicy, null, 2))
        return response.json(mockPolicy)
      }

      // Load existing policy from JSON file
      const policyData = fs.readFileSync(filePath, 'utf-8')
      const policy: SnapshotPolicy = JSON.parse(policyData)

      return response.json(policy)
    } catch (error) {
      console.error('Error fetching snapshot policy:', error)
      return response.status(500).json({ error: 'Failed to load snapshot policy' })
    }
  }

  /**
   * Updates an existing snapshot policy or creates a new one.
   * Preserves system fields (uuid, createdAt) while updating user-configurable settings.
   * Validates business rules like required fields and timezone formats.
   */
  public async update({ params, request, response }: HttpContext) {
    try {
      const { uuid } = params
      const policyRequest = request.body() as SnapshotPolicyRequest

      if (!uuid) {
        return response.status(400).json({ error: 'UUID is required' })
      }

      // Validate essential fields for backup functionality
      if (!policyRequest.name || !policyRequest.directory) {
        return response.status(400).json({ error: 'Name and directory are required' })
      }

      const filePath = this.getPolicyFilePath(uuid)
      let existingPolicy: SnapshotPolicy

      // Load existing policy to preserve system fields, or create base policy
      if (fs.existsSync(filePath)) {
        const policyData = fs.readFileSync(filePath, 'utf-8')
        existingPolicy = JSON.parse(policyData)
      } else {
        // Create new policy if it doesn't exist (upsert behavior)
        existingPolicy = this.generateMockPolicy(uuid)
      }

      // Merge user updates with existing policy, preserving system fields
      const updatedPolicy: SnapshotPolicy = {
        ...existingPolicy,        // Base policy with system fields
        ...policyRequest,         // User-provided updates
        uuid,                     // Ensure UUID cannot be changed
        createdAt: existingPolicy.createdAt, // Preserve original creation time
        updatedAt: new Date().toISOString()  // Update modification timestamp
      }

      // Persist policy changes to JSON file
      // In production, this would be a database transaction
      fs.writeFileSync(filePath, JSON.stringify(updatedPolicy, null, 2))

      return response.json(updatedPolicy)
    } catch (error) {
      console.error('Error updating snapshot policy:', error)
      return response.status(500).json({ error: 'Failed to update snapshot policy' })
    }
  }
}