import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { userClusterApi, User, Cluster } from '@/lib/api'

// Mock data
const mockUsers: User[] = [
  {
    user_id: 'bryan',
    user_name: 'Bryan',
    associated_cluster_uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
  },
  {
    user_id: 'david',
    user_name: 'David',
    associated_cluster_uuid: '40fd90d6-7c7d-4099-8564-fe53b02a8abf'
  }
]

const mockClusters: Cluster[] = [
  {
    uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
    cluster_name: 'demo-123'
  },
  {
    uuid: '40fd90d6-7c7d-4099-8564-fe53b02a8abf',
    cluster_name: 'demo-456'
  }
]

// Mock API server
const server = setupServer(
  // Get user endpoint
  http.get('http://localhost:3333/api/user/:userId', ({ params }) => {
    const { userId } = params
    
    const user = mockUsers.find(u => u.user_id === userId)
    
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }
    
    return HttpResponse.json(user)
  }),
  
  // Get cluster endpoint
  http.get('http://localhost:3333/api/cluster/:uuid', ({ params }) => {
    const { uuid } = params
    
    const cluster = mockClusters.find(c => c.uuid === uuid)
    
    if (!cluster) {
      return HttpResponse.json(
        { error: 'Cluster not found' }, 
        { status: 404 }
      )
    }
    
    return HttpResponse.json(cluster)
  }),
  
  // Get user cluster association endpoint
  http.get('http://localhost:3333/api/user/:userId/cluster', ({ params }) => {
    const { userId } = params
    
    const user = mockUsers.find(u => u.user_id === userId)
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }
    
    const cluster = mockClusters.find(c => c.uuid === user.associated_cluster_uuid)
    if (!cluster) {
      return HttpResponse.json(
        { error: 'Associated cluster not found' }, 
        { status: 404 }
      )
    }
    
    return HttpResponse.json({ user, cluster })
  }),
  
  // Get all users with clusters endpoint
  http.get('http://localhost:3333/api/users-clusters', () => {
    const usersWithClusters = mockUsers.map(user => {
      const cluster = mockClusters.find(c => c.uuid === user.associated_cluster_uuid)
      return { user, cluster }
    })
    
    return HttpResponse.json(usersWithClusters)
  })
)

// Setup and teardown
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('User-Cluster API', () => {
  describe('Get User', () => {
    it('fetches user successfully', async () => {
      const result = await userClusterApi.getUser('bryan')
      
      expect(result).toMatchObject({
        user_id: 'bryan',
        user_name: 'Bryan',
        associated_cluster_uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
      })
    })
    
    it('fetches different users', async () => {
      const bryan = await userClusterApi.getUser('bryan')
      const david = await userClusterApi.getUser('david')
      
      expect(bryan.user_name).toBe('Bryan')
      expect(bryan.associated_cluster_uuid).toBe('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      expect(david.user_name).toBe('David')
      expect(david.associated_cluster_uuid).toBe('40fd90d6-7c7d-4099-8564-fe53b02a8abf')
    })
    
    it('handles user not found', async () => {
      await expect(userClusterApi.getUser('nonexistent')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      })
    })
    
    it('handles empty user ID', async () => {
      await expect(userClusterApi.getUser('')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      })
    })
  })
  
  describe('Get Cluster', () => {
    it('fetches cluster successfully', async () => {
      const result = await userClusterApi.getCluster('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      expect(result).toMatchObject({
        uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
        cluster_name: 'demo-123'
      })
    })
    
    it('fetches different clusters', async () => {
      const cluster1 = await userClusterApi.getCluster('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      const cluster2 = await userClusterApi.getCluster('40fd90d6-7c7d-4099-8564-fe53b02a8abf')
      
      expect(cluster1.cluster_name).toBe('demo-123')
      expect(cluster2.cluster_name).toBe('demo-456')
    })
    
    it('handles cluster not found', async () => {
      await expect(userClusterApi.getCluster('nonexistent-uuid')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'Cluster not found' }
        }
      })
    })
    
    it('handles invalid UUID format', async () => {
      await expect(userClusterApi.getCluster('invalid-uuid')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'Cluster not found' }
        }
      })
    })
  })
  
  describe('Get User Cluster Association', () => {
    it('fetches user cluster association successfully', async () => {
      const result = await userClusterApi.getUserCluster('bryan')
      
      expect(result).toMatchObject({
        user: {
          user_id: 'bryan',
          user_name: 'Bryan',
          associated_cluster_uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
        },
        cluster: {
          uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
          cluster_name: 'demo-123'
        }
      })
    })
    
    it('fetches correct associations for different users', async () => {
      const bryanAssoc = await userClusterApi.getUserCluster('bryan')
      const davidAssoc = await userClusterApi.getUserCluster('david')
      
      expect(bryanAssoc.user.user_name).toBe('Bryan')
      expect(bryanAssoc.cluster.cluster_name).toBe('demo-123')
      
      expect(davidAssoc.user.user_name).toBe('David')
      expect(davidAssoc.cluster.cluster_name).toBe('demo-456')
    })
    
    it('handles user not found in association', async () => {
      await expect(userClusterApi.getUserCluster('nonexistent')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      })
    })
    
    it('validates association data structure', async () => {
      const result = await userClusterApi.getUserCluster('bryan')
      
      // Check top-level structure
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('cluster')
      
      // Check user structure
      expect(result.user).toHaveProperty('user_id')
      expect(result.user).toHaveProperty('user_name')
      expect(result.user).toHaveProperty('associated_cluster_uuid')
      
      // Check cluster structure
      expect(result.cluster).toHaveProperty('uuid')
      expect(result.cluster).toHaveProperty('cluster_name')
      
      // Check consistency
      expect(result.user.associated_cluster_uuid).toBe(result.cluster.uuid)
    })
  })
  
  describe('Get All Users with Clusters', () => {
    it('fetches all user cluster associations', async () => {
      const result = await userClusterApi.getAllUsersWithClusters()
      
      expect(result).toHaveLength(2)
      
      const bryan = result.find(item => item.user.user_id === 'bryan')
      const david = result.find(item => item.user.user_id === 'david')
      
      expect(bryan).toBeDefined()
      expect(david).toBeDefined()
      
      expect(bryan!.user.user_name).toBe('Bryan')
      expect(bryan!.cluster!.cluster_name).toBe('demo-123')
      
      expect(david!.user.user_name).toBe('David')
      expect(david!.cluster!.cluster_name).toBe('demo-456')
    })
    
    it('validates all associations data structure', async () => {
      const result = await userClusterApi.getAllUsersWithClusters()
      
      result.forEach(item => {
        // Check structure
        expect(item).toHaveProperty('user')
        expect(item).toHaveProperty('cluster')
        
        // Check user properties
        expect(item.user).toHaveProperty('user_id')
        expect(item.user).toHaveProperty('user_name')
        expect(item.user).toHaveProperty('associated_cluster_uuid')
        
        // Check cluster properties
        expect(item.cluster).toHaveProperty('uuid')
        expect(item.cluster).toHaveProperty('cluster_name')
        
        // Check consistency
        expect(item.user.associated_cluster_uuid).toBe(item.cluster!.uuid)
      })
    })
    
    it('returns consistent data across calls', async () => {
      const result1 = await userClusterApi.getAllUsersWithClusters()
      const result2 = await userClusterApi.getAllUsersWithClusters()
      
      expect(result1).toEqual(result2)
    })
  })
  
  describe('Data Validation', () => {
    it('validates user data structure', async () => {
      const user = await userClusterApi.getUser('bryan')
      
      expect(typeof user.user_id).toBe('string')
      expect(typeof user.user_name).toBe('string')
      expect(typeof user.associated_cluster_uuid).toBe('string')
      
      expect(user.user_id.length).toBeGreaterThan(0)
      expect(user.user_name.length).toBeGreaterThan(0)
      expect(user.associated_cluster_uuid.length).toBeGreaterThan(0)
    })
    
    it('validates cluster data structure', async () => {
      const cluster = await userClusterApi.getCluster('f2398d2e-f92d-482a-ab2d-4b9a9f79186c')
      
      expect(typeof cluster.uuid).toBe('string')
      expect(typeof cluster.cluster_name).toBe('string')
      
      expect(cluster.uuid.length).toBeGreaterThan(0)
      expect(cluster.cluster_name.length).toBeGreaterThan(0)
    })
    
    it('validates UUID format consistency', async () => {
      const associations = await userClusterApi.getAllUsersWithClusters()
      
      associations.forEach(item => {
        // UUID should be in proper format (contains hyphens)
        expect(item.cluster!.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        expect(item.user.associated_cluster_uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      })
    })
  })
  
  describe('Edge Cases', () => {
    it('handles special characters in user IDs', async () => {
      // Add a special test user
      server.use(
        http.get('http://localhost:3333/api/user/test-user_123', () => {
          return HttpResponse.json({
            user_id: 'test-user_123',
            user_name: 'Test User',
            associated_cluster_uuid: 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'
          })
        })
      )
      
      const result = await userClusterApi.getUser('test-user_123')
      expect(result.user_id).toBe('test-user_123')
    })
    
    it('handles case sensitivity', async () => {
      // Test that user IDs are case sensitive
      await expect(userClusterApi.getUser('BRYAN')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      })
      
      await expect(userClusterApi.getUser('Bryan')).rejects.toMatchObject({
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      })
    })
    
    it('handles cluster names with special characters', async () => {
      // Add a special test cluster
      server.use(
        http.get('http://localhost:3333/api/cluster/special-cluster-uuid', () => {
          return HttpResponse.json({
            uuid: 'special-cluster-uuid',
            cluster_name: 'demo-cluster_TEST-2024'
          })
        })
      )
      
      const result = await userClusterApi.getCluster('special-cluster-uuid')
      expect(result.cluster_name).toBe('demo-cluster_TEST-2024')
    })
  })
  
  describe('Performance Tests', () => {
    it('handles multiple concurrent user requests', async () => {
      const userIds = ['bryan', 'david']
      const requests = userIds.map(id => userClusterApi.getUser(id))
      
      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(2)
      expect(results[0].user_id).toBe('bryan')
      expect(results[1].user_id).toBe('david')
    })
    
    it('handles multiple concurrent cluster requests', async () => {
      const clusterIds = [
        'f2398d2e-f92d-482a-ab2d-4b9a9f79186c',
        '40fd90d6-7c7d-4099-8564-fe53b02a8abf'
      ]
      
      const requests = clusterIds.map(id => userClusterApi.getCluster(id))
      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(2)
      expect(results[0].uuid).toBe(clusterIds[0])
      expect(results[1].uuid).toBe(clusterIds[1])
    })
    
    it('completes requests within reasonable time', async () => {
      const startTime = Date.now()
      
      await userClusterApi.getAllUsersWithClusters()
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })
  
  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      // Override server to simulate network failure
      server.use(
        http.get('http://localhost:3333/api/user/bryan', () => {
          return HttpResponse.error()
        })
      )
      
      await expect(userClusterApi.getUser('bryan')).rejects.toThrow()
    })
    
    it('handles malformed responses', async () => {
      // Override server to return malformed data
      server.use(
        http.get('http://localhost:3333/api/user/bryan', () => {
          return HttpResponse.json({ invalid: 'data' })
        })
      )
      
      // Should still return the data (let the application handle validation)
      const result = await userClusterApi.getUser('bryan')
      expect(result).toEqual({ invalid: 'data' })
    })
    
    it('handles server errors', async () => {
      // Override server to return 500 error
      server.use(
        http.get('http://localhost:3333/api/user/bryan', () => {
          return HttpResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
          )
        })
      )
      
      await expect(userClusterApi.getUser('bryan')).rejects.toMatchObject({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      })
    })
  })
})