import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types from backend
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | '90d'
export type Resolution = '1min' | '5min' | '15min' | '1h' | '6h' | '1d'

export interface MetricsResponse {
  clusterId: string
  timeRange: TimeRange
  resolution: Resolution
  data: {
    timestamps: string[]
    iops: {
      read: number[]
      write: number[]
    }
    throughput: {
      read: number[]
      write: number[]
    }
  }
  metadata: {
    totalPoints: number
    startTime: string
    endTime: string
    aggregationMethod: string
  }
}

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
    days: string[]
  }
  deletion: {
    type: 'automatically' | 'manually'
    after?: number
    unit?: 'days' | 'weeks'
  }
  locking: {
    enabled: boolean
  }
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// API functions
export const metricsApi = {
  getMetrics: async (clusterId: string, timeRange: TimeRange = '24h', resolution?: Resolution): Promise<MetricsResponse> => {
    const params = new URLSearchParams({
      clusterId,
      timeRange,
      ...(resolution && { resolution })
    })
    
    const response = await api.get(`/api/metrics?${params}`)
    return response.data
  }
}

// User and Cluster interfaces
export interface User {
  user_id: string
  user_name: string
  associated_cluster_uuid: string
}

export interface Cluster {
  uuid: string
  cluster_name: string
}

export interface UserClusterAssociation {
  user: User
  cluster: Cluster
}

export const policyApi = {
  getPolicy: async (uuid: string): Promise<SnapshotPolicy> => {
    const response = await api.get(`/api/snapshot-policy/${uuid}`)
    return response.data
  },
  
  updatePolicy: async (uuid: string, policy: Omit<SnapshotPolicy, 'uuid' | 'createdAt' | 'updatedAt'>): Promise<SnapshotPolicy> => {
    const response = await api.put(`/api/snapshot-policy/${uuid}`, policy)
    return response.data
  }
}

export const userClusterApi = {
  getUser: async (userId: string): Promise<User> => {
    const response = await api.get(`/api/user/${userId}`)
    return response.data
  },

  getCluster: async (uuid: string): Promise<Cluster> => {
    const response = await api.get(`/api/cluster/${uuid}`)
    return response.data
  },

  getUserCluster: async (userId: string): Promise<UserClusterAssociation> => {
    const response = await api.get(`/api/user/${userId}/cluster`)
    return response.data
  },

  getAllUsersWithClusters: async (): Promise<UserClusterAssociation[]> => {
    const response = await api.get(`/api/users-clusters`)
    return response.data
  }
}