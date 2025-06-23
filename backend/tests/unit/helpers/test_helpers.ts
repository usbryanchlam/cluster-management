/**
 * Test utility functions and helpers for consistent testing across the application
 */

import { SnapshotPolicy } from '#controllers/snapshot_policy_controller'
import type { TimeRange, Resolution } from '#controllers/metrics_controller'

/**
 * Creates a valid snapshot policy object for testing
 */
export function createTestSnapshotPolicy(overrides: Partial<SnapshotPolicy> = {}): SnapshotPolicy {
  const basePolicy: SnapshotPolicy = {
    uuid: 'test-policy-123',
    name: 'Test Policy',
    directory: '/test/directory',
    schedule: {
      type: 'daily',
      timezone: 'UTC',
      time: {
        hour: 9,
        minute: 0
      },
      days: ['mon', 'tue', 'wed', 'thu', 'fri']
    },
    deletion: {
      type: 'automatically',
      after: 30
    },
    locking: {
      enabled: false
    },
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { ...basePolicy, ...overrides }
}

/**
 * Creates a valid snapshot policy request object for testing
 */
export function createTestPolicyRequest(overrides: any = {}) {
  const baseRequest = {
    name: 'Test Policy Request',
    directory: '/test/request/directory',
    schedule: {
      type: 'daily' as const,
      timezone: 'America/New_York',
      time: {
        hour: 2,
        minute: 30
      },
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    },
    deletion: {
      type: 'manually' as const
    },
    locking: {
      enabled: true
    },
    enabled: false
  }

  return { ...baseRequest, ...overrides }
}

/**
 * Validates that a timestamp string is a valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    return date.toISOString() === dateString
  } catch {
    return false
  }
}

/**
 * Validates that a schedule time is within valid bounds
 */
export function isValidScheduleTime(hour: number, minute: number): boolean {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

/**
 * Validates that days array contains valid day abbreviations
 */
export function areValidDays(days: string[]): boolean {
  const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return days.every(day => validDays.includes(day)) && days.length > 0
}

/**
 * Creates test metrics query parameters
 */
export function createTestMetricsQuery(overrides: any = {}) {
  const baseQuery = {
    clusterId: 'test-cluster-123',
    timeRange: '24h' as TimeRange,
    resolution: undefined as Resolution | undefined
  }

  return { ...baseQuery, ...overrides }
}

/**
 * Validates that metrics data has the correct structure
 */
export function validateMetricsDataStructure(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  
  // Check required properties
  const requiredProps = ['timestamps', 'iops', 'throughput']
  if (!requiredProps.every(prop => prop in data)) return false
  
  // Check iops structure
  if (!data.iops || !data.iops.read || !data.iops.write) return false
  if (!Array.isArray(data.iops.read) || !Array.isArray(data.iops.write)) return false
  
  // Check throughput structure
  if (!data.throughput || !data.throughput.read || !data.throughput.write) return false
  if (!Array.isArray(data.throughput.read) || !Array.isArray(data.throughput.write)) return false
  
  // Check array lengths match
  const length = data.timestamps.length
  if (data.iops.read.length !== length) return false
  if (data.iops.write.length !== length) return false
  if (data.throughput.read.length !== length) return false
  if (data.throughput.write.length !== length) return false
  
  return true
}

/**
 * Validates that all values in a metrics array are positive numbers
 */
export function areValidMetricValues(values: any[]): boolean {
  return values.every(value => 
    typeof value === 'number' && 
    !isNaN(value) && 
    value > 0
  )
}

/**
 * Validates that timestamps are in chronological order
 */
export function areTimestampsChronological(timestamps: string[]): boolean {
  if (timestamps.length < 2) return true
  
  for (let i = 1; i < timestamps.length; i++) {
    const prev = new Date(timestamps[i - 1]).getTime()
    const current = new Date(timestamps[i]).getTime()
    if (prev >= current) return false
  }
  
  return true
}

/**
 * Expected data points for each time range (for validation)
 */
export const EXPECTED_DATA_POINTS: Record<TimeRange, number> = {
  '1h': 60,
  '6h': 72,
  '24h': 96,
  '7d': 168,
  '30d': 120,
  '90d': 90
}

/**
 * Expected resolution for each time range (for validation)
 */
export const EXPECTED_RESOLUTION: Record<TimeRange, Resolution> = {
  '1h': '1min',
  '6h': '5min',
  '24h': '15min',
  '7d': '1h',
  '30d': '6h',
  '90d': '1d'
}

/**
 * Creates a temporary directory for testing file operations
 */
export function createTempTestDirectory(): string {
  const crypto = require('crypto')
  const path = require('path')
  const fs = require('fs')
  
  const randomId = crypto.randomBytes(8).toString('hex')
  const tempDir = path.join(process.cwd(), 'tests', 'temp', `test-${randomId}`)
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  
  return tempDir
}

/**
 * Cleans up a temporary test directory
 */
export function cleanupTempTestDirectory(dirPath: string): void {
  const fs = require('fs')
  
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

/**
 * Waits for a specified number of milliseconds (for timing-dependent tests)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generates a random UUID for testing
 */
export function generateTestUUID(): string {
  const crypto = require('crypto')
  return crypto.randomUUID()
}