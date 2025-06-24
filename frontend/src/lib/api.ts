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