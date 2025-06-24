'use client'

import React from 'react'
import { Activity, Calendar, HardDrive, User } from 'lucide-react'

interface SidebarProps {
  activeView: 'metrics' | 'policy'
  onViewChange: (view: 'metrics' | 'policy') => void
  clusterName?: string
}

export function Sidebar({ activeView, onViewChange, clusterName = '[Cluster Name]' }: SidebarProps) {
  return (
    <div className="w-64 bg-slate-800 text-white h-screen flex flex-col">
      {/* Cluster Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-cyan-400" />
          <span className="text-lg font-medium">{clusterName}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onViewChange('metrics')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'metrics' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Performance Metrics</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onViewChange('policy')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeView === 'policy' 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Edit Snapshot Policy</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2 text-slate-300">
          <User className="w-4 h-4" />
          <span className="text-sm">ADuser</span>
        </div>
      </div>
    </div>
  )
}