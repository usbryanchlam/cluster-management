import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { policyApi, SnapshotPolicy } from '@/lib/api'

// Mock policy data
const mockPolicy: SnapshotPolicy = {
  uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
  name: 'ProjectX_Daily',
  directory: '/Production/ProjectX',
  schedule: {
    type: 'daily',
    timezone: 'America/Los_Angeles',
    time: { hour: 7, minute: 0 },
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  },
  deletion: {
    type: 'automatically',
    after: 14,
    unit: 'days'
  },
  locking: { enabled: false },
  enabled: true,
  createdAt: '2025-06-25T10:00:00.000Z',
  updatedAt: '2025-06-25T10:00:00.000Z'
}

// Mock API server
const server = setupServer(
  // GET policy endpoint
  http.get('http://localhost:3333/api/snapshot-policy/:uuid', ({ params }) => {
    const { uuid } = params
    
    // Invalid UUID format
    if (typeof uuid !== 'string' || uuid.length < 10) {
      return HttpResponse.json(
        { error: 'Invalid UUID format' }, 
        { status: 400 }
      )
    }
    
    // Not found
    if (uuid === 'not-found-uuid') {
      return HttpResponse.json(
        { error: 'Policy not found' }, 
        { status: 404 }
      )
    }
    
    // Server error
    if (uuid === 'error-uuid') {
      return HttpResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      )
    }
    
    // Return mock policy with the requested UUID
    return HttpResponse.json({
      ...mockPolicy,
      uuid: uuid as string
    })
  }),
  
  // PUT policy endpoint
  http.put('http://localhost:3333/api/snapshot-policy/:uuid', async ({ params, request }) => {
    const { uuid } = params
    const body = await request.json() as Partial<SnapshotPolicy>
    
    // Invalid UUID format
    if (typeof uuid !== 'string' || uuid.length < 10) {
      return HttpResponse.json(
        { error: 'Invalid UUID format' }, 
        { status: 400 }
      )
    }
    
    // Validation errors
    if (!body.name || body.name.trim() === '') {
      return HttpResponse.json(
        { error: 'Name is required' }, 
        { status: 400 }
      )
    }
    
    if (!body.directory || body.directory.trim() === '') {
      return HttpResponse.json(
        { error: 'Directory is required' }, 
        { status: 400 }
      )
    }
    
    // Server error simulation
    if (uuid === 'error-uuid') {
      return HttpResponse.json(
        { error: 'Failed to save policy' }, 
        { status: 500 }
      )
    }
    
    // Simulate save conflict
    if (body.name === 'ConflictPolicy') {
      return HttpResponse.json(
        { error: 'Policy name already exists' }, 
        { status: 409 }
      )
    }
    
    // Success - return updated policy
    const updatedPolicy: SnapshotPolicy = {
      ...mockPolicy,
      ...body,
      uuid: uuid as string,
      updatedAt: new Date().toISOString()
    }
    
    return HttpResponse.json(updatedPolicy)
  })
)

// Setup and teardown
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Policy API', () => {
  describe('Get Policy', () => {
    it('fetches policy successfully', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const result = await policyApi.getPolicy(uuid)
      
      expect(result).toMatchObject({
        uuid,
        name: 'ProjectX_Daily',
        directory: '/Production/ProjectX',
        enabled: true
      })
      
      expect(result.schedule).toMatchObject({
        type: 'daily',
        timezone: 'America/Los_Angeles',
        time: { hour: 7, minute: 0 }
      })
      
      expect(result.deletion).toMatchObject({
        type: 'automatically',
        after: 14,
        unit: 'days'
      })
    })
    
    it('handles different cluster UUIDs', async () => {
      const uuids = [
        'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
        '40fd90d6-7c7d-4099-8564-fe53b02a8abf',
        'custom-cluster-uuid-123'
      ]
      
      for (const uuid of uuids) {
        const result = await policyApi.getPolicy(uuid)
        expect(result.uuid).toBe(uuid)
      }
    })
    
    it('handles policy not found', async () => {
      await expect(policyApi.getPolicy('not-found-uuid')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'Policy not found' }
        }
      })
    })
    
    it('handles invalid UUID format', async () => {
      await expect(policyApi.getPolicy('invalid')).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'Invalid UUID format' }
        }
      })
    })
    
    it('handles server errors', async () => {
      await expect(policyApi.getPolicy('error-uuid')).rejects.toMatchObject({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      })
    })
  })
  
  describe('Update Policy', () => {
    const validPolicy = {
      name: 'UpdatedPolicy',
      directory: '/Updated/Directory',
      schedule: {
        type: 'weekly' as const,
        timezone: 'UTC',
        time: { hour: 12, minute: 30 },
        days: ['mon', 'wed', 'fri']
      },
      deletion: {
        type: 'automatically' as const,
        after: 30,
        unit: 'days' as const
      },
      locking: { enabled: true },
      enabled: true
    }
    
    it('updates policy successfully', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const result = await policyApi.updatePolicy(uuid, validPolicy)
      
      expect(result).toMatchObject({
        uuid,
        name: 'UpdatedPolicy',
        directory: '/Updated/Directory',
        enabled: true
      })
      
      expect(result.schedule).toMatchObject({
        type: 'weekly',
        timezone: 'UTC',
        time: { hour: 12, minute: 30 },
        days: ['mon', 'wed', 'fri']
      })
      
      // Should have updated timestamp
      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(
        new Date(mockPolicy.updatedAt).getTime()
      )
    })
    
    it('handles partial updates', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const partialUpdate = {
        name: 'PartialUpdate',
        enabled: false
      }
      
      const result = await policyApi.updatePolicy(uuid, partialUpdate)
      
      expect(result.name).toBe('PartialUpdate')
      expect(result.enabled).toBe(false)
      // Other fields should remain from original
      expect(result.directory).toBe('/Production/ProjectX')
    })
    
    it('validates required fields', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      
      // Missing name
      await expect(policyApi.updatePolicy(uuid, {
        directory: '/Valid/Directory',
        enabled: true
      })).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'Name is required' }
        }
      })
      
      // Empty name
      await expect(policyApi.updatePolicy(uuid, {
        name: '',
        directory: '/Valid/Directory',
        enabled: true
      })).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'Name is required' }
        }
      })
      
      // Missing directory
      await expect(policyApi.updatePolicy(uuid, {
        name: 'ValidName',
        enabled: true
      })).rejects.toMatchObject({
        response: {
          status: 400,
          data: { error: 'Directory is required' }
        }
      })
    })
    
    it('handles schedule type variations', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      
      // Daily schedule
      const dailyPolicy = {
        ...validPolicy,
        schedule: {
          type: 'daily' as const,
          timezone: 'America/New_York',
          time: { hour: 6, minute: 0 },
          days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        }
      }
      
      const result = await policyApi.updatePolicy(uuid, dailyPolicy)
      expect(result.schedule.type).toBe('daily')
      expect(result.schedule.days).toHaveLength(7)
    })
    
    it('handles deletion type variations', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      
      // Manual deletion
      const manualPolicy = {
        ...validPolicy,
        deletion: { type: 'manually' as const },
        locking: { enabled: false } // Should be disabled for manual
      }
      
      const result = await policyApi.updatePolicy(uuid, manualPolicy)
      expect(result.deletion.type).toBe('manually')
      expect(result.locking.enabled).toBe(false)
    })
    
    it('handles conflict errors', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const conflictPolicy = {
        ...validPolicy,
        name: 'ConflictPolicy'
      }
      
      await expect(policyApi.updatePolicy(uuid, conflictPolicy)).rejects.toMatchObject({
        response: {
          status: 409,
          data: { error: 'Policy name already exists' }
        }
      })
    })
    
    it('handles server errors during update', async () => {
      await expect(policyApi.updatePolicy('error-uuid', validPolicy)).rejects.toMatchObject({
        response: {
          status: 500,
          data: { error: 'Failed to save policy' }
        }
      })
    })
  })
  
  describe('Data Validation', () => {
    it('validates policy structure on fetch', async () => {
      const result = await policyApi.getPolicy('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      // Required top-level fields
      expect(result).toHaveProperty('uuid')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('directory')
      expect(result).toHaveProperty('schedule')
      expect(result).toHaveProperty('deletion')
      expect(result).toHaveProperty('locking')
      expect(result).toHaveProperty('enabled')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')
      
      // Schedule structure
      expect(result.schedule).toHaveProperty('type')
      expect(result.schedule).toHaveProperty('timezone')
      expect(result.schedule).toHaveProperty('time')
      expect(result.schedule).toHaveProperty('days')
      expect(result.schedule.time).toHaveProperty('hour')
      expect(result.schedule.time).toHaveProperty('minute')
      
      // Deletion structure
      expect(result.deletion).toHaveProperty('type')
      if (result.deletion.type === 'automatically') {
        expect(result.deletion).toHaveProperty('after')
        expect(result.deletion).toHaveProperty('unit')
      }
      
      // Locking structure
      expect(result.locking).toHaveProperty('enabled')
    })
    
    it('validates schedule type values', async () => {
      const result = await policyApi.getPolicy('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      expect(['daily', 'weekly']).toContain(result.schedule.type)
    })
    
    it('validates deletion type values', async () => {
      const result = await policyApi.getPolicy('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      expect(['automatically', 'manually']).toContain(result.deletion.type)
    })
    
    it('validates time values', async () => {
      const result = await policyApi.getPolicy('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      expect(result.schedule.time.hour).toBeGreaterThanOrEqual(0)
      expect(result.schedule.time.hour).toBeLessThan(24)
      expect(result.schedule.time.minute).toBeGreaterThanOrEqual(0)
      expect(result.schedule.time.minute).toBeLessThan(60)
    })
    
    it('validates days array', async () => {
      const result = await policyApi.getPolicy('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      expect(Array.isArray(result.schedule.days)).toBe(true)
      result.schedule.days.forEach(day => {
        expect(validDays).toContain(day)
      })
    })
  })
  
  describe('Edge Cases', () => {
    it('handles very long policy names', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const longName = 'A'.repeat(200)
      
      const policy = {
        name: longName,
        directory: '/Test',
        enabled: true
      }
      
      const result = await policyApi.updatePolicy(uuid, policy)
      expect(result.name).toBe(longName)
    })
    
    it('handles special characters in directory paths', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const specialDir = '/Production/Project-X_2024/データベース'
      
      const policy = {
        name: 'SpecialPolicy',
        directory: specialDir,
        enabled: true
      }
      
      const result = await policyApi.updatePolicy(uuid, policy)
      expect(result.directory).toBe(specialDir)
    })
    
    it('handles timezone edge cases', async () => {
      const uuid = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      const timezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ]
      
      for (const timezone of timezones) {
        const policy = {
          name: 'TimezoneTest',
          directory: '/Test',
          schedule: {
            type: 'daily' as const,
            timezone,
            time: { hour: 12, minute: 0 },
            days: ['mon', 'tue', 'wed', 'thu', 'fri']
          },
          enabled: true
        }
        
        const result = await policyApi.updatePolicy(uuid, policy)
        expect(result.schedule.timezone).toBe(timezone)
      }
    })
  })
  
  describe('Performance Tests', () => {
    it('handles multiple concurrent policy fetches', async () => {
      const uuids = Array.from({ length: 5 }, (_, i) => `cluster-uuid-${i}`)
      
      const requests = uuids.map(uuid => policyApi.getPolicy(uuid))
      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(5)
      results.forEach((result, i) => {
        expect(result.uuid).toBe(uuids[i])
      })
    })
    
    it('completes requests within reasonable time', async () => {
      const startTime = Date.now()
      
      await policyApi.getPolicy('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})