'use client'

import React from 'react'
import { TimeRange } from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface TimeRangeSelectorProps {
  selected: TimeRange
  onSelect: (timeRange: TimeRange) => void
}

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
]

export function TimeRangeSelector({ selected, onSelect }: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {timeRangeOptions.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}