'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TimeRange, metricsApi } from '@/lib/api'
import { MetricsChart } from '@/components/MetricsChart'
import { Select } from '@/components/ui/Select'

interface MetricsDashboardProps {
  clusterId: string
}

const timeRangeOptions = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export function MetricsDashboard({ clusterId }: MetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d') // Default to 7 days to match the design
  
  const { data: metricsData, isLoading, error } = useQuery({
    queryKey: ['metrics', clusterId, timeRange],
    queryFn: () => metricsApi.getMetrics(clusterId, timeRange),
    // Disabled real-time updates - data is read from static JSON files
    // refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (error) {
    return (
      <div className="flex-1 bg-slate-900 p-6">
        <div className="text-center text-white">
          <p className="text-red-400 mb-2">Failed to load metrics</p>
          <p className="text-slate-400 text-sm">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-white">Performance Metrics</h1>
        <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          options={timeRangeOptions}
          className="w-40"
        />
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-slate-400">Loading metrics...</p>
          </div>
        </div>
      ) : metricsData ? (
        <div className="space-y-6">
          <MetricsChart data={metricsData} type="iops" />
          <MetricsChart data={metricsData} type="throughput" />
        </div>
      ) : null}
    </div>
  )
}