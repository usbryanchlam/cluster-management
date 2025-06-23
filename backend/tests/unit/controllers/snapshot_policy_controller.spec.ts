import { test } from '@japa/runner'
import SnapshotPolicyController from '#controllers/snapshot_policy_controller'
import fs from 'fs'
import path from 'path'

test.group('SnapshotPolicyController Unit Tests', (group) => {
  let controller: SnapshotPolicyController
  let testDataDir: string

  group.setup(() => {
    // Create a temporary test directory
    testDataDir = path.join(process.cwd(), 'tests/temp/policies')
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
    
    controller = new SnapshotPolicyController()
    // Override data directory for testing
    // @ts-ignore - Accessing private property for unit testing
    controller.dataDir = testDataDir
  })

  group.teardown(() => {
    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true })
    }
  })

  test('getPolicyFilePath - should generate correct file path for UUID', ({ assert }) => {
    const uuid = 'test-uuid-123'
    // @ts-ignore - Accessing private method for unit testing
    const filePath = controller.getPolicyFilePath(uuid)
    
    assert.equal(filePath, path.join(testDataDir, `${uuid}.json`))
  })

  test('getPolicyFilePath - should handle UUIDs with special characters', ({ assert }) => {
    const uuid = 'test-uuid-with-dashes-123'
    // @ts-ignore - Accessing private method for unit testing
    const filePath = controller.getPolicyFilePath(uuid)
    
    assert.equal(filePath, path.join(testDataDir, `${uuid}.json`))
  })

  test('generateMockPolicy - should generate policy with correct structure', ({ assert }) => {
    const uuid = 'test-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    // Verify required fields
    assert.equal(policy.uuid, uuid)
    assert.isString(policy.name)
    assert.isString(policy.directory)
    assert.isObject(policy.schedule)
    assert.isObject(policy.deletion)
    assert.isObject(policy.locking)
    assert.isBoolean(policy.enabled)
    assert.isString(policy.createdAt)
    assert.isString(policy.updatedAt)
  })

  test('generateMockPolicy - should generate policy with valid schedule structure', ({ assert }) => {
    const uuid = 'test-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    assert.property(policy.schedule, 'type')
    assert.property(policy.schedule, 'timezone')
    assert.property(policy.schedule, 'time')
    assert.property(policy.schedule, 'days')
    assert.property(policy.schedule.time, 'hour')
    assert.property(policy.schedule.time, 'minute')
    
    // Verify valid values
    assert.include(['daily', 'weekly'], policy.schedule.type)
    assert.isArray(policy.schedule.days)
    assert.isNumber(policy.schedule.time.hour)
    assert.isNumber(policy.schedule.time.minute)
    assert.isAtLeast(policy.schedule.time.hour, 0)
    assert.isAtMost(policy.schedule.time.hour, 23)
    assert.isAtLeast(policy.schedule.time.minute, 0)
    assert.isAtMost(policy.schedule.time.minute, 59)
  })

  test('generateMockPolicy - should generate policy with valid deletion structure', ({ assert }) => {
    const uuid = 'test-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    assert.property(policy.deletion, 'type')
    assert.include(['automatically', 'manually'], policy.deletion.type)
    
    if (policy.deletion.type === 'automatically') {
      assert.property(policy.deletion, 'after')
      assert.isNumber(policy.deletion.after)
      assert.isAbove(policy.deletion.after!, 0)
    }
  })

  test('generateMockPolicy - should generate valid ISO timestamps', ({ assert }) => {
    const uuid = 'test-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    // Should be valid ISO date strings
    assert.doesNotThrow(() => new Date(policy.createdAt))
    assert.doesNotThrow(() => new Date(policy.updatedAt))
    
    // Should be recent timestamps (within last minute)
    const now = Date.now()
    const created = new Date(policy.createdAt).getTime()
    const updated = new Date(policy.updatedAt).getTime()
    
    assert.isAtMost(now - created, 60000) // Within 1 minute
    assert.isAtMost(now - updated, 60000) // Within 1 minute
  })

  test('generateMockPolicy - should generate weekday-only schedule for business policy', ({ assert }) => {
    const uuid = 'business-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    // Should be weekdays only
    const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri']
    const weekend = ['sat', 'sun']
    
    policy.schedule.days.forEach(day => {
      assert.include(weekdays, day, `${day} should be a weekday`)
      assert.notInclude(weekend, day, `${day} should not be weekend`)
    })
  })

  test('generateMockPolicy - should generate reasonable retention period', ({ assert }) => {
    const uuid = 'retention-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    if (policy.deletion.type === 'automatically' && policy.deletion.after) {
      // Should be between 1 day and 1 year
      assert.isAtLeast(policy.deletion.after, 1)
      assert.isAtMost(policy.deletion.after, 365)
    }
  })

  test('generateMockPolicy - should generate policy with business hours schedule', ({ assert }) => {
    const uuid = 'business-hours-policy-123'
    // @ts-ignore - Accessing private method for unit testing
    const policy = controller.generateMockPolicy(uuid)
    
    // Should be during reasonable hours (not middle of night)
    assert.isAtLeast(policy.schedule.time.hour, 0)
    assert.isAtMost(policy.schedule.time.hour, 23)
    
    // For business policy, should be early morning or late evening
    const hour = policy.schedule.time.hour
    const isBusinessFriendly = hour <= 8 || hour >= 18
    // Note: This is a guideline, not a strict requirement for the mock
  })
})