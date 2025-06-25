import { metricsApi, policyApi, userClusterApi } from '@/lib/api'

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe('API Client', () => {
  describe('metricsApi', () => {
    it('should have getMetrics method', () => {
      expect(typeof metricsApi.getMetrics).toBe('function')
    })
  })

  describe('policyApi', () => {
    it('should have getPolicy method', () => {
      expect(typeof policyApi.getPolicy).toBe('function')
    })

    it('should have updatePolicy method', () => {
      expect(typeof policyApi.updatePolicy).toBe('function')
    })
  })

  describe('userClusterApi', () => {
    it('should have getUser method', () => {
      expect(typeof userClusterApi.getUser).toBe('function')
    })

    it('should have getCluster method', () => {
      expect(typeof userClusterApi.getCluster).toBe('function')
    })

    it('should have getUserCluster method', () => {
      expect(typeof userClusterApi.getUserCluster).toBe('function')
    })

    it('should have getAllUsersWithClusters method', () => {
      expect(typeof userClusterApi.getAllUsersWithClusters).toBe('function')
    })
  })
})