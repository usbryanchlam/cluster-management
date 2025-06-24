'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function Select({ value, onValueChange, options, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between px-3 py-2 bg-slate-700 text-white border border-slate-600 rounded-md hover:bg-slate-600 transition-colors',
          className
        )}
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-md shadow-lg z-20">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onValueChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-white hover:bg-slate-600 transition-colors first:rounded-t-md last:rounded-b-md',
                  option.value === value && 'bg-slate-600'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}