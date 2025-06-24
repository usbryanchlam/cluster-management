'use client'

import React from 'react'
import { Activity, Calendar, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface NavigationProps {
  activeView: 'metrics' | 'policy'
  onViewChange: (view: 'metrics' | 'policy') => void
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Cluster Management</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant={activeView === 'metrics' ? 'primary' : 'ghost'}
              onClick={() => onViewChange('metrics')}
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Performance Metrics</span>
            </Button>
            
            <Button
              variant={activeView === 'policy' ? 'primary' : 'ghost'}
              onClick={() => onViewChange('policy')}
              className="flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Snapshot Policy</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}