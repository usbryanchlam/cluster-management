'use client'

import React from 'react'
import { MetricsResponse } from '@/lib/api'

interface MetricsPanelProps {
  data: MetricsResponse | undefined
}

export function MetricsPanel({ data }: MetricsPanelProps) {
  if (!data) {
    return (
      <div className="w-64 bg-slate-800 p-6 text-white">
        <div className="text-slate-400">Loading metrics...</div>
      </div>
    )
  }

  // Get the latest values (last in the arrays)
  const latestIndex = data.data.timestamps.length - 1
  const latestTimestamp = data.data.timestamps[latestIndex]
  const currentTime = new Date(latestTimestamp)

  const readIOPS = data.data.iops.read[latestIndex]
  const writeIOPS = data.data.iops.write[latestIndex]
  const readThroughput = data.data.throughput.read[latestIndex]
  const writeThroughput = data.data.throughput.write[latestIndex]

  const formatNumber = (num: number, unit: string) => {
    if (unit === 'IOPS') {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k ${unit}`
      }
      return `${num.toFixed(1)} ${unit}`
    } else {
      // KB/s
      return `${num.toFixed(1)} ${unit}`
    }
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + ', ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="w-64 bg-slate-800 p-6 text-white">
      {/* Timestamp */}
      <div className="text-slate-400 text-sm mb-6">
        {formatDateTime(currentTime)}
      </div>

      {/* IOPS Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">IOPS</h3>
        <div className="space-y-3">
          <div>
            <div className="text-slate-400 text-sm">Read</div>
            <div className="text-xl font-medium">
              {formatNumber(readIOPS, 'IOPS')}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Write</div>
            <div className="text-xl font-medium">
              {formatNumber(writeIOPS, 'IOPS')}
            </div>
          </div>
        </div>
      </div>

      {/* Throughput Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Throughput</h3>
        <div className="space-y-3">
          <div>
            <div className="text-slate-400 text-sm">Read</div>
            <div className="text-xl font-medium">
              {formatNumber(readThroughput, 'KB/s')}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Write</div>
            <div className="text-xl font-medium">
              {formatNumber(writeThroughput, 'KB/s')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}