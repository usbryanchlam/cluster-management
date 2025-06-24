'use client'

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { MetricsResponse } from '@/lib/api'

interface MetricsChartProps {
  data: MetricsResponse
  type: 'iops' | 'throughput'
}

export function MetricsChart({ data, type }: MetricsChartProps) {
  const [hoveredData, setHoveredData] = useState<{
    fullTime: string
    read: number
    write: number
  } | null>(null)

  // Transform the data for Recharts with smart date labeling
  const chartData = data.data.timestamps.map((timestamp, index) => {
    const date = new Date(timestamp)

    // For multi-day data, show date labels at key points
    let shouldShowDate = false
    if (index === 0) {
      // Always show the first point
      shouldShowDate = true
    } else if (index === data.data.timestamps.length - 1) {
      // Always show the last point
      shouldShowDate = true
    } else if (date.getHours() === 0) {
      // Show date at midnight (start of new day)
      shouldShowDate = true
    }

    const readValue = type === 'iops' ? data.data.iops.read[index] : data.data.throughput.read[index]
    const writeValue = type === 'iops' ? data.data.iops.write[index] : data.data.throughput.write[index]

    return {
      time: shouldShowDate ? date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }) : '',
      fullTime: timestamp,
      originalIndex: index,
      read: readValue,
      write: writeValue,
    }
  })

  const title = type === 'iops' ? 'IOPS' : 'Throughput'
  const yAxisMax = type === 'iops' ? 100000 : 2000 // 100k for IOPS, 2GB/s for throughput

  const formatYAxisLabel = (value: number) => {
    if (type === 'iops') {
      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
      return value.toString()
    } else {
      if (value >= 1000) return `${(value / 1000).toFixed(0)} GB/s`
      return `${value} GB/s`
    }
  }

  const formatNumber = (num: number) => {
    if (type === 'iops') {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k IOPS`
      }
      return `${num.toFixed(1)} IOPS`
    } else {
      return `${num.toFixed(1)} KB/s`
    }
  }

  const formatTimestamp = (timestamp: string, useUTC: boolean = false) => {
    // Convert timestamp to Date object if it's not already
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp provided');
    }

    // Month abbreviations
    const months = [
      'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.',
      'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'
    ];

    // Get date components - use UTC methods if useUTC is true
    const month = months[useUTC ? date.getUTCMonth() : date.getMonth()];
    const day = useUTC ? date.getUTCDate() : date.getDate();
    let hours = useUTC ? date.getUTCHours() : date.getHours();
    const minutes = useUTC ? date.getUTCMinutes() : date.getMinutes();

    // Convert to 12-hour format and determine AM/PM
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    // Format minutes with leading zero if needed
    const formattedMinutes = minutes.toString().padStart(2, '0');

    // Combine all parts
    return `${month} ${day}, ${hours}:${formattedMinutes}${ampm}`;
  }

  const formatHoverTime = (timestamp: string) => {
    // const date = new Date(timestamp)
    // return date.toLocaleDateString('en-US', {
    //   weekday: 'short',
    //   month: 'short',
    //   day: 'numeric'
    // }) + ', ' + date.toLocaleTimeString('en-US', {
    //   hour: 'numeric',
    //   minute: '2-digit',
    //   hour12: true
    // })
    // Convert timestamp to Date object if it's not already
    const isUTCString = typeof timestamp === 'string' && timestamp.endsWith('Z');
    return formatTimestamp(timestamp, isUTCString);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const payload = e.activePayload[0].payload
      setHoveredData(payload)
    }
  }

  const handleMouseLeave = () => {
    setHoveredData(null)
  }

  // Get latest values for the side panel
  const latestIndex = data.data.timestamps.length - 1
  const latestRead = type === 'iops' ? data.data.iops.read[latestIndex] : data.data.throughput.read[latestIndex]
  const latestWrite = type === 'iops' ? data.data.iops.write[latestIndex] : data.data.throughput.write[latestIndex]

  return (
    <div style={{ 
      backgroundColor: '#1B222C', 
      borderRadius: '4px'
    }} className="p-6 flex font-nunito">
      {/* Chart Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ 
            fontSize: '18px',
            fontWeight: 400,
            color: '#C7CACC',
            lineHeight: '24px'
          }}>{title}</h3>
          {hoveredData && (
            <div style={{
              fontSize: '12px',
              color: '#FFFFFF',
              fontWeight: 400
            }}>
              {formatHoverTime(hoveredData.fullTime)}
            </div>
          )}
        </div>

        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CartesianGrid
                strokeDasharray="none"
                stroke="#646B72"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#A6AAAE' }}
                interval={0}
                minTickGap={80}
                height={40}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#A6AAAE' }}
                tickFormatter={formatYAxisLabel}
                domain={[0, yAxisMax]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload

                    return (
                      <div style={{
                        backgroundColor: '#242C35',
                        border: '1px solid #373F48',
                        borderRadius: '4px',
                        padding: '12px'
                      }} className="shadow-lg">
                        <div style={{
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 400,
                          marginBottom: '8px'
                        }}>
                          {formatHoverTime(data.fullTime)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: '#955FD5',
                              borderRadius: '50%'
                            }}></div>
                            <span style={{
                              color: '#A6AAAE',
                              fontSize: '14px',
                              fontWeight: 500
                            }}>Read: </span>
                            <span style={{
                              color: '#955FD5',
                              fontSize: '14px',
                              fontWeight: 400
                            }}>{formatNumber(data.read)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: '#00A3CA',
                              borderRadius: '50%'
                            }}></div>
                            <span style={{
                              color: '#A6AAAE',
                              fontSize: '14px',
                              fontWeight: 500
                            }}>Write: </span>
                            <span style={{
                              color: '#00A3CA',
                              fontSize: '14px',
                              fontWeight: 400
                            }}>{formatNumber(data.write)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
                cursor={{
                  stroke: '#F3F4F4',
                  strokeWidth: 1,
                  strokeDasharray: 'none'
                }}
              />
              <Line
                type="monotone"
                dataKey="read"
                stroke="#955FD5"
                strokeWidth={2}
                dot={false}
                name="Read"
              />
              <Line
                type="monotone"
                dataKey="write"
                stroke="#00A3CA"
                strokeWidth={2}
                dot={false}
                name="Write"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Values Panel */}
      <div style={{ 
        width: '160px',
        marginLeft: '16px'
      }} className="flex flex-col">
        {/* Legend Title */}
        <div style={{
          fontSize: '18px',
          fontWeight: 400,
          color: '#858B90',
          marginBottom: '16px',
          lineHeight: '24px'
        }}>{title}</div>

        {/* Read Legend */}
        <div style={{
          backgroundColor: 'rgba(34, 44, 54, 0.3)',
          border: '1px solid rgba(51, 59, 68, 0.5)',
          padding: '8px 12px',
          marginBottom: '0px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            color: '#A6AAAE',
            marginBottom: '4px',
            lineHeight: '20px'
          }}>Read</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 400,
            color: '#955FD5',
            lineHeight: '20px'
          }}>
            {formatNumber(hoveredData ? hoveredData.read : latestRead)}
          </div>
        </div>

        {/* Write Legend */}
        <div style={{
          backgroundColor: 'rgba(34, 44, 54, 0.3)',
          border: '1px solid rgba(51, 59, 68, 0.5)',
          borderTop: 'none',
          padding: '8px 12px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            color: '#A6AAAE',
            marginBottom: '4px',
            lineHeight: '20px'
          }}>Write</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 400,
            color: '#00A3CA',
            lineHeight: '20px'
          }}>
            {formatNumber(hoveredData ? hoveredData.write : latestWrite)}
          </div>
        </div>
      </div>
    </div>
  )
}