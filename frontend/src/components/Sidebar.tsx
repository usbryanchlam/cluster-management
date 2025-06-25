'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Activity, Calendar, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { UserClusterAssociation } from '@/lib/api'

interface SidebarProps {
  activeView: 'metrics' | 'policy'
  onViewChange: (view: 'metrics' | 'policy') => void
  clusterName?: string
  userName?: string
  currentUserId?: string
  allUsers?: UserClusterAssociation[]
  onUserSwitch?: (userId: string) => void
}

export function Sidebar({ 
  activeView, 
  onViewChange, 
  clusterName = '[Cluster Name]', 
  userName = 'User',
  currentUserId = 'bryan',
  allUsers = [],
  onUserSwitch
}: SidebarProps) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get the other user (not the current one)
  const otherUser = allUsers.find(userAssociation => userAssociation.user.user_id !== currentUserId)

  const handleUserSelect = (userId: string) => {
    setIsUserDropdownOpen(false)
    if (onUserSwitch) {
      onUserSwitch(userId)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
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
      <div className="p-4 border-t border-slate-700 relative" ref={dropdownRef}>
        <div 
          className="flex items-center justify-between text-slate-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{userName}</span>
          </div>
          {/* Down Arrow */}
          <ChevronDown className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* User Dropdown */}
        {isUserDropdownOpen && otherUser && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg">
            <div 
              className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors rounded-lg"
              onClick={() => handleUserSelect(otherUser.user.user_id)}
            >
              {/* Other User Avatar */}
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {otherUser.user.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{otherUser.user.user_name}</div>
                <div className="text-xs text-slate-400">{otherUser.cluster.cluster_name}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}