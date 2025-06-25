'use client'

import React from 'react'
import { Activity, Calendar, User } from 'lucide-react'
import Image from 'next/image'

interface SidebarProps {
  activeView: 'metrics' | 'policy'
  onViewChange: (view: 'metrics' | 'policy') => void
  clusterName?: string
}

export function Sidebar({ activeView, onViewChange, clusterName = '[Cluster Name]' }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar-bg text-white h-screen flex flex-col">
      {/* Cluster Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Image 
            src="/logo.svg" 
            alt="Cluster Logo" 
            width={20} 
            height={20}
            className="w-5 h-5"
          />
          <span className="text-lg font-medium">{clusterName}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onViewChange('metrics')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeView === 'metrics'
                ? 'bg-selectedfunc-bg text-white'
                : 'text-slate-300 hover:text-white hover:bg-selectedfunc-bg'
                }`}
            >
              <Activity className="w-4 h-4" />
              <span>Performance Metrics</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => onViewChange('policy')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeView === 'policy'
                ? 'bg-selectedfunc-bg text-white'
                : 'text-slate-300 hover:text-white hover:bg-selectedfunc-bg'
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