import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs/promises'
import path from 'path'

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
   * Determines which aggregation level to use based on time range.
   * Maps time ranges to appropriate JSON file types for optimal performance.
   */
  private getAggregationLevel(timeRange: TimeRange): string {
    switch (timeRange) {
      case '1h':
      case '6h':
      case '24h':
        return 'raw-metrics' // Use raw 1-minute data for short ranges
      case '7d':
      case '30d':
        return 'hourly-aggregated' // Use hourly data for medium ranges
      case '90d':
        return 'daily-aggregated' // Use daily data for long ranges
      default:
        return 'hourly-aggregated'
    }
  }

  /**
   * Reads time-series data from consolidated JSON files based on cluster ID and time range.
   * Uses optimized file structure - one file per time range for maximum performance.
   */
  private async readMetricsFromFiles(clusterId: string, timeRange: TimeRange): Promise<MetricsResponse['data']> {
    const dataDir = path.join(process.cwd(), 'data', clusterId)
    
    // Map time ranges to consolidated file names
    let fileName: string
    switch (timeRange) {
      case '1h':
        fileName = 'raw-metrics-1h.json'
        break
      case '6h':
        fileName = 'raw-metrics-6h.json'
        break
      case '24h':
        fileName = 'raw-metrics-24h.json'
        break
      case '7d':
        fileName = 'hourly-aggregated-7d.json'
        break
      case '30d':
        fileName = 'hourly-aggregated-30d.json'
        break
      case '90d':
        fileName = 'daily-aggregated-90d.json'
        break
      default:
        fileName = 'raw-metrics-24h.json'
    }

    const filePath = path.join(dataDir, fileName)
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(fileContent)
      
      // Data is already in the expected format from consolidated files
      return data.data
    } catch (error) {
      console.error(`Could not read consolidated metrics file: ${filePath}`, error)
      throw new Error(`Failed to load metrics data for cluster ${clusterId} and time range ${timeRange}`)
    }
  }

  /**
   * Applies optimal sampling to consolidated data if needed.
   * For raw metrics: samples to target resolution (5min, 15min intervals)
   * For aggregated data: returns as-is since it's already optimally sized
   */
  private applyOptimalSampling(data: MetricsResponse['data'], targetResolution: Resolution, timeRange: TimeRange): MetricsResponse['data'] {
    const targetPoints = this.getDataPointCount(timeRange)
    const currentPoints = data.timestamps.length
    
    // If data is already optimal size, return as-is
    if (currentPoints <= targetPoints) {
      return data
    }

    // Sample data for raw metrics files that have too many points
    const step = currentPoints / targetPoints
    const sampledIndices: number[] = []
    
    for (let i = 0; i < targetPoints; i++) {
      const index = Math.floor(i * step)
      if (index < currentPoints) {
        sampledIndices.push(index)
      }
    }

    return {
      timestamps: sampledIndices.map(i => data.timestamps[i]),
      iops: {
        read: sampledIndices.map(i => data.iops.read[i]),
        write: sampledIndices.map(i => data.iops.write[i])
      },
      throughput: {
        read: sampledIndices.map(i => data.throughput.read[i]),
        write: sampledIndices.map(i => data.throughput.write[i])
      }
    }
  }

  /**
   * Legacy sampling method - kept for backward compatibility
   */
  private sampleDataForResolution(data: any[], targetResolution: Resolution, timeRange: TimeRange): any[] {
    const targetPoints = this.getDataPointCount(timeRange)
    
    if (data.length <= targetPoints) {
      return data
    }

    // Sample evenly across the data
    const step = data.length / targetPoints
    const sampledData: any[] = []
    
    for (let i = 0; i < targetPoints; i++) {
      const index = Math.floor(i * step)
      if (index < data.length) {
        sampledData.push(data[index])
      }
    }

    return sampledData
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
      
      // Read data from consolidated JSON files based on cluster and time range
      const rawData = await this.readMetricsFromFiles(clusterId, timeRange)
      
      // Apply resolution-based sampling for raw metrics files that might have too many points
      const targetResolution = this.getResolution(timeRange)
      const data = this.applyOptimalSampling(rawData, targetResolution, timeRange)

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