import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// User interface
export interface User {
  user_id: string
  user_name: string
  associated_cluster_uuid: string
}

// Cluster interface
export interface Cluster {
  uuid: string
  cluster_name: string
}

export default class UserClusterController {
  private dataDir = path.join(process.cwd(), 'data')
  private usersFile = path.join(this.dataDir, 'users.json')
  private clustersFile = path.join(this.dataDir, 'clusters.json')

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
    
    // Initialize sample data if files don't exist
    this.initializeSampleData()
  }

  /**
   * Initialize sample data with the specified users and clusters
   */
  private initializeSampleData() {
    // Generate UUIDs for clusters
    const cluster1Uuid = randomUUID()
    const cluster2Uuid = randomUUID()

    // Create clusters data
    const clusters: Cluster[] = [
      {
        uuid: cluster1Uuid,
        cluster_name: "demo-123"
      },
      {
        uuid: cluster2Uuid,
        cluster_name: "demo-456"
      }
    ]

    // Create users data with cluster associations
    const users: User[] = [
      {
        user_id: "bryan",
        user_name: "Bryan",
        associated_cluster_uuid: cluster1Uuid
      },
      {
        user_id: "david",
        user_name: "David", 
        associated_cluster_uuid: cluster2Uuid
      }
    ]

    // Write data files if they don't exist
    if (!fs.existsSync(this.clustersFile)) {
      fs.writeFileSync(this.clustersFile, JSON.stringify(clusters, null, 2))
    }

    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2))
    }
  }

  /**
   * Get user information by user_id
   */
  public async getUser({ params, response }: HttpContext) {
    try {
      const { userId } = params

      if (!userId) {
        return response.status(400).json({ error: 'User ID is required' })
      }

      const usersData = fs.readFileSync(this.usersFile, 'utf-8')
      const users: User[] = JSON.parse(usersData)
      
      const user = users.find(u => u.user_id === userId)
      
      if (!user) {
        return response.status(404).json({ error: 'User not found' })
      }

      return response.json(user)
    } catch (error) {
      console.error('Error fetching user:', error)
      return response.status(500).json({ error: 'Failed to load user data' })
    }
  }

  /**
   * Get cluster information by cluster UUID
   */
  public async getCluster({ params, response }: HttpContext) {
    try {
      const { uuid } = params

      if (!uuid) {
        return response.status(400).json({ error: 'Cluster UUID is required' })
      }

      const clustersData = fs.readFileSync(this.clustersFile, 'utf-8')
      const clusters: Cluster[] = JSON.parse(clustersData)
      
      const cluster = clusters.find(c => c.uuid === uuid)
      
      if (!cluster) {
        return response.status(404).json({ error: 'Cluster not found' })
      }

      return response.json(cluster)
    } catch (error) {
      console.error('Error fetching cluster:', error)
      return response.status(500).json({ error: 'Failed to load cluster data' })
    }
  }

  /**
   * Get cluster associated with a user
   */
  public async getUserCluster({ params, response }: HttpContext) {
    try {
      const { userId } = params

      if (!userId) {
        return response.status(400).json({ error: 'User ID is required' })
      }

      // Get user data
      const usersData = fs.readFileSync(this.usersFile, 'utf-8')
      const users: User[] = JSON.parse(usersData)
      const user = users.find(u => u.user_id === userId)
      
      if (!user) {
        return response.status(404).json({ error: 'User not found' })
      }

      // Get associated cluster
      const clustersData = fs.readFileSync(this.clustersFile, 'utf-8')
      const clusters: Cluster[] = JSON.parse(clustersData)
      const cluster = clusters.find(c => c.uuid === user.associated_cluster_uuid)
      
      if (!cluster) {
        return response.status(404).json({ error: 'Associated cluster not found' })
      }

      return response.json({
        user,
        cluster
      })
    } catch (error) {
      console.error('Error fetching user cluster association:', error)
      return response.status(500).json({ error: 'Failed to load user cluster data' })
    }
  }

  /**
   * Get all users and their associated clusters
   */
  public async getAllUsersWithClusters({ response }: HttpContext) {
    try {
      const usersData = fs.readFileSync(this.usersFile, 'utf-8')
      const clustersData = fs.readFileSync(this.clustersFile, 'utf-8')
      
      const users: User[] = JSON.parse(usersData)
      const clusters: Cluster[] = JSON.parse(clustersData)

      const usersWithClusters = users.map(user => {
        const cluster = clusters.find(c => c.uuid === user.associated_cluster_uuid)
        return {
          user,
          cluster
        }
      })

      return response.json(usersWithClusters)
    } catch (error) {
      console.error('Error fetching all users with clusters:', error)
      return response.status(500).json({ error: 'Failed to load users and clusters data' })
    }
  }
}