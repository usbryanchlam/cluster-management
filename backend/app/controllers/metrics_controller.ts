import type { HttpContext } from '@adonisjs/core/http'

// Type definitions for time series data API
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

export default class MetricsController {
  /**
   * Automatically determines optimal resolution based on time range to ensure
   * chart performance. Strategy: keep data points between 60-168 for smooth rendering
   * while maintaining meaningful granularity for the selected time window.
   */
  private getResolution(timeRange: TimeRange): Resolution {
    switch (timeRange) {
      case '1h': return '1min'   // 60 data points - high granularity for short term
      case '6h': return '5min'   // 72 data points - balance detail vs performance
      case '24h': return '15min' // 96 data points - good for daily patterns
      case '7d': return '1h'     // 168 data points - hourly trends over week
      case '30d': return '6h'    // 120 data points - daily patterns over month
      case '90d': return '1d'    // 90 data points - long-term trend analysis
      default: return '1h'
    }
  }

  /**
   * Generates realistic mock time series data for demonstration purposes.
   * Uses mathematical functions to create believable patterns:
   * - Sine/cosine waves for cyclical patterns (simulating daily/weekly cycles)
   * - Random noise for realistic variance
   * - Different base values for read vs write operations (read typically higher)
   * - Correlated throughput based on IOPS (throughput = IOPS × average block size)
   */
  private generateMockData(resolution: Resolution, timeRange: TimeRange): MetricsResponse['data'] {
    const now = new Date()
    const dataPoints = this.getDataPointCount(timeRange)
    const intervalMs = this.getIntervalMs(resolution)
    
    const timestamps: string[] = []
    const iopsRead: number[] = []
    const iopsWrite: number[] = []
    const throughputRead: number[] = []
    const throughputWrite: number[] = []

    // Generate data points working backwards from current time
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMs))
      timestamps.push(timestamp.toISOString())
      
      // Create realistic patterns with mathematical functions
      // Sin/cos create cyclical patterns, random adds realistic noise
      const baseIopsRead = 1000 + Math.sin(i / 10) * 200 + Math.random() * 100
      const baseIopsWrite = 600 + Math.cos(i / 8) * 150 + Math.random() * 80
      
      // Throughput correlates with IOPS (simulating average block sizes of 12KB read, 15KB write)
      const baseThroughputRead = baseIopsRead * 12 + Math.random() * 1000
      const baseThroughputWrite = baseIopsWrite * 15 + Math.random() * 800
      
      iopsRead.push(Math.round(baseIopsRead))
      iopsWrite.push(Math.round(baseIopsWrite))
      throughputRead.push(Math.round(baseThroughputRead))
      throughputWrite.push(Math.round(baseThroughputWrite))
    }

    return {
      timestamps,
      iops: { read: iopsRead, write: iopsWrite },
      throughput: { read: throughputRead, write: throughputWrite }
    }
  }

  /**
   * Returns the number of data points for each time range.
   * These values are carefully chosen to balance chart performance with data granularity.
   */
  private getDataPointCount(timeRange: TimeRange): number {
    switch (timeRange) {
      case '1h': return 60    // 1 minute intervals
      case '6h': return 72    // 5 minute intervals  
      case '24h': return 96   // 15 minute intervals
      case '7d': return 168   // 1 hour intervals (24 * 7)
      case '30d': return 120  // 6 hour intervals (4 * 30)
      case '90d': return 90   // 1 day intervals
      default: return 96
    }
  }

  /**
   * Converts resolution strings to milliseconds for timestamp calculation.
   * Used to generate evenly spaced timestamps for the time series data.
   */
  private getIntervalMs(resolution: Resolution): number {
    switch (resolution) {
      case '1min': return 60 * 1000                    // 1 minute
      case '5min': return 5 * 60 * 1000                // 5 minutes
      case '15min': return 15 * 60 * 1000              // 15 minutes
      case '1h': return 60 * 60 * 1000                 // 1 hour
      case '6h': return 6 * 60 * 60 * 1000             // 6 hours
      case '1d': return 24 * 60 * 60 * 1000            // 1 day
      default: return 60 * 60 * 1000                   // Default to 1 hour
    }
  }

  /**
   * Main API endpoint for fetching time series metrics data.
   * Supports automatic resolution selection for optimal chart performance.
   * 
   * Query parameters:
   * - clusterId (required): UUID of the cluster to fetch metrics for
   * - timeRange (optional): Time window for data (defaults to '24h')
   * - resolution (optional): Data granularity (auto-selected if not provided)
   */
  public async index({ request, response }: HttpContext) {
    try {
      const clusterId = request.qs().clusterId as string
      const timeRange = (request.qs().timeRange as TimeRange) || '24h'
      const resolution = request.qs().resolution as Resolution

      // Validate required parameters
      if (!clusterId) {
        return response.status(400).json({ error: 'clusterId is required' })
      }

      // Auto-determine optimal resolution if not explicitly provided
      // This ensures charts render smoothly regardless of time range
      const actualResolution = resolution || this.getResolution(timeRange)
      
      // Generate mock data (in production, this would query actual metrics database)
      const data = this.generateMockData(actualResolution, timeRange)

      // Construct response with metadata for frontend caching and display
      const result: MetricsResponse = {
        clusterId,
        timeRange,
        resolution: actualResolution,
        data,
        metadata: {
          totalPoints: data.timestamps.length,
          startTime: data.timestamps[0],
          endTime: data.timestamps[data.timestamps.length - 1],
          aggregationMethod: 'avg' // Indicates how data was aggregated from raw metrics
        }
      }

      return response.json(result)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return response.status(500).json({ error: 'Failed to load metrics data' })
    }
  }
}