import { test } from '@japa/runner'
import fs from 'fs'
import path from 'path'

test.group('Snapshot Policy API Integration Tests', (group) => {
  let testDataDir: string

  group.setup(() => {
    // Create test data directory
    testDataDir = path.join(process.cwd(), 'data/policies-test')
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
  })
  
  group.teardown(() => {
    // Clean up test data
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true })
    }
  })

  test('GET - should return 404 for missing route parameter', async ({ client, assert }) => {
    const response = await client.get('/api/snapshot-policy/')
    
    // Should return 404 for missing route parameter, not reach the controller
    assert.equal(response.status(), 404)
  })

  test('GET - should create and return mock policy for new UUID', async ({ client, assert }) => {
    const uuid = 'new-policy-123'
    const response = await client.get(`/api/snapshot-policy/${uuid}`)
    
    assert.equal(response.status(), 200)
    
    const policy = response.body()
    assert.equal(policy.uuid, uuid)
    assert.property(policy, 'name')
    assert.property(policy, 'directory')
    assert.property(policy, 'schedule')
    assert.property(policy, 'deletion')
    assert.property(policy, 'locking')
    assert.property(policy, 'enabled')
    assert.property(policy, 'createdAt')
    assert.property(policy, 'updatedAt')
    
    // Verify file was created
    const filePath = path.join(process.cwd(), 'data/policies', `${uuid}.json`)
    assert.isTrue(fs.existsSync(filePath))
  })

  test('GET - should return existing policy for known UUID', async ({ client, assert }) => {
    const uuid = 'existing-policy-456'
    
    // First request creates the policy
    const response1 = await client.get(`/api/snapshot-policy/${uuid}`)
    assert.equal(response1.status(), 200)
    const originalPolicy = response1.body()
    
    // Second request should return the same policy
    const response2 = await client.get(`/api/snapshot-policy/${uuid}`)
    assert.equal(response2.status(), 200)
    const retrievedPolicy = response2.body()
    
    assert.deepEqual(retrievedPolicy, originalPolicy)
  })

  test('GET - should return valid policy structure', async ({ client, assert }) => {
    const uuid = 'structure-test-789'
    const response = await client.get(`/api/snapshot-policy/${uuid}`)
    
    assert.equal(response.status(), 200)
    
    const policy = response.body()
    
    // Validate schedule structure
    assert.property(policy.schedule, 'type')
    assert.property(policy.schedule, 'timezone')
    assert.property(policy.schedule, 'time')
    assert.property(policy.schedule, 'days')
    assert.property(policy.schedule.time, 'hour')
    assert.property(policy.schedule.time, 'minute')
    
    assert.include(['daily', 'weekly'], policy.schedule.type)
    assert.isString(policy.schedule.timezone)
    assert.isArray(policy.schedule.days)
    assert.isNumber(policy.schedule.time.hour)
    assert.isNumber(policy.schedule.time.minute)
    
    // Validate deletion structure
    assert.property(policy.deletion, 'type')
    assert.include(['automatically', 'manually'], policy.deletion.type)
    
    // Validate locking structure
    assert.property(policy.locking, 'enabled')
    assert.isBoolean(policy.locking.enabled)
    
    // Validate timestamps
    assert.doesNotThrow(() => new Date(policy.createdAt))
    assert.doesNotThrow(() => new Date(policy.updatedAt))
  })

  test('PUT - should return 404 for missing route parameter', async ({ client, assert }) => {
    const response = await client.put('/api/snapshot-policy/').json({
      name: 'Test Policy',
      directory: '/test'
    })
    
    // Should return 404 for missing route parameter
    assert.equal(response.status(), 404)
  })

  test('PUT - should return 400 without required fields', async ({ client, assert }) => {
    const uuid = 'validation-test-123'
    
    // Missing name field
    const response1 = await client.put(`/api/snapshot-policy/${uuid}`).json({
      directory: '/test/directory'
    })
    assert.equal(response1.status(), 400)
    assert.property(response1.body(), 'error')
    
    // Missing directory field
    const response2 = await client.put(`/api/snapshot-policy/${uuid}`).json({
      name: 'Test Policy'
    })
    assert.equal(response2.status(), 400)
    assert.property(response2.body(), 'error')
  })

  test('PUT - should create new policy with valid data', async ({ client, assert }) => {
    const uuid = 'create-test-456'
    const policyData = {
      name: 'New Test Policy',
      directory: '/production/new-project',
      schedule: {
        type: 'daily',
        timezone: 'UTC',
        time: { hour: 2, minute: 30 },
        days: ['mon', 'tue', 'wed', 'thu', 'fri']
      },
      deletion: {
        type: 'automatically',
        after: 30
      },
      locking: {
        enabled: true
      },
      enabled: true
    }
    
    const response = await client.put(`/api/snapshot-policy/${uuid}`).json(policyData)
    
    assert.equal(response.status(), 200)
    
    const policy = response.body()
    assert.equal(policy.uuid, uuid)
    assert.equal(policy.name, policyData.name)
    assert.equal(policy.directory, policyData.directory)
    assert.deepEqual(policy.schedule, policyData.schedule)
    assert.deepEqual(policy.deletion, policyData.deletion)
    assert.deepEqual(policy.locking, policyData.locking)
    assert.equal(policy.enabled, policyData.enabled)
    
    // Verify file was created
    const filePath = path.join(process.cwd(), 'data/policies', `${uuid}.json`)
    assert.isTrue(fs.existsSync(filePath))
  })

  test('PUT - should update existing policy while preserving system fields', async ({ client, assert }) => {
    const uuid = 'update-test-789'
    
    // Create initial policy
    const initialData = {
      name: 'Initial Policy',
      directory: '/initial/directory',
      schedule: {
        type: 'daily',
        timezone: 'America/New_York',
        time: { hour: 6, minute: 0 },
        days: ['mon', 'wed', 'fri']
      },
      deletion: {
        type: 'manually'
      },
      locking: {
        enabled: false
      },
      enabled: false
    }
    
    const createResponse = await client.put(`/api/snapshot-policy/${uuid}`).json(initialData)
    assert.equal(createResponse.status(), 200)
    const originalPolicy = createResponse.body()
    
    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Update policy
    const updateData = {
      name: 'Updated Policy',
      directory: '/updated/directory',
      schedule: {
        type: 'weekly',
        timezone: 'UTC',
        time: { hour: 12, minute: 30 },
        days: ['sat', 'sun']
      },
      deletion: {
        type: 'automatically',
        after: 7
      },
      locking: {
        enabled: true
      },
      enabled: true
    }
    
    const updateResponse = await client.put(`/api/snapshot-policy/${uuid}`).json(updateData)
    assert.equal(updateResponse.status(), 200)
    const updatedPolicy = updateResponse.body()
    
    // Verify updates
    assert.equal(updatedPolicy.name, updateData.name)
    assert.equal(updatedPolicy.directory, updateData.directory)
    assert.deepEqual(updatedPolicy.schedule, updateData.schedule)
    assert.deepEqual(updatedPolicy.deletion, updateData.deletion)
    assert.deepEqual(updatedPolicy.locking, updateData.locking)
    assert.equal(updatedPolicy.enabled, updateData.enabled)
    
    // Verify system fields are preserved/updated correctly
    assert.equal(updatedPolicy.uuid, uuid)
    assert.equal(updatedPolicy.createdAt, originalPolicy.createdAt) // Should be preserved
    assert.notEqual(updatedPolicy.updatedAt, originalPolicy.updatedAt) // Should be updated
  })

  test('PUT - should persist changes to file system', async ({ client, assert }) => {
    const uuid = 'persistence-test'
    const policyData = {
      name: 'Persistence Test Policy',
      directory: '/persistence/test',
      schedule: {
        type: 'weekly',
        timezone: 'America/Los_Angeles',
        time: { hour: 23, minute: 45 },
        days: ['sat']
      },
      deletion: {
        type: 'automatically',
        after: 90
      },
      locking: {
        enabled: true
      },
      enabled: true
    }
    
    const response = await client.put(`/api/snapshot-policy/${uuid}`).json(policyData)
    assert.equal(response.status(), 200)
    
    // Read file directly from filesystem
    const filePath = path.join(process.cwd(), 'data/policies', `${uuid}.json`)
    assert.isTrue(fs.existsSync(filePath))
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const savedPolicy = JSON.parse(fileContent)
    
    assert.equal(savedPolicy.name, policyData.name)
    assert.equal(savedPolicy.directory, policyData.directory)
    assert.deepEqual(savedPolicy.schedule, policyData.schedule)
    assert.deepEqual(savedPolicy.deletion, policyData.deletion)
    assert.deepEqual(savedPolicy.locking, policyData.locking)
    assert.equal(savedPolicy.enabled, policyData.enabled)
  })
})