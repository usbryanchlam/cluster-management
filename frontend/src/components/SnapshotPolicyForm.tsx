'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { policyApi, SnapshotPolicy } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Save, Lock, Unlock, RotateCcw } from 'lucide-react'

interface SnapshotPolicyFormProps {
  policyId: string
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
]

const days = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
]

export function SnapshotPolicyForm({ policyId }: SnapshotPolicyFormProps) {
  const queryClient = useQueryClient()
  
  const { data: policy, isLoading } = useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => policyApi.getPolicy(policyId),
  })

  const [formData, setFormData] = useState<Partial<SnapshotPolicy>>({})

  useEffect(() => {
    if (policy) {
      setFormData(policy)
    }
  }, [policy])

  const updateMutation = useMutation({
    mutationFn: (data: Omit<SnapshotPolicy, 'uuid' | 'createdAt' | 'updatedAt'>) =>
      policyApi.updatePolicy(policyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy', policyId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.directory && formData.schedule && formData.deletion && formData.locking !== undefined) {
      updateMutation.mutate({
        name: formData.name,
        directory: formData.directory,
        schedule: formData.schedule,
        deletion: formData.deletion,
        locking: formData.locking,
        enabled: formData.enabled ?? true,
      })
    }
  }

  const handleDayToggle = (day: string) => {
    if (!formData.schedule) return
    
    const currentDays = formData.schedule.days || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        days: newDays,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-900 p-6">
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <RotateCcw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-slate-400">Loading policy...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-900 p-6">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-medium text-white mb-6">Edit Snapshot Policy</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Production_Daily"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Directory Path
                </label>
                <input
                  type="text"
                  value={formData.directory || ''}
                  onChange={(e) => setFormData({ ...formData, directory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., /production/database"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.enabled ?? true}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-300">
                  Enable this policy
                </span>
              </label>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Schedule Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Schedule Type
                </label>
                <select
                  value={formData.schedule?.type || 'daily'}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule!,
                      type: e.target.value as 'daily' | 'weekly',
                    },
                  })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hour (24h)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.schedule?.time?.hour || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule!,
                      time: {
                        ...formData.schedule!.time!,
                        hour: parseInt(e.target.value),
                      },
                    },
                  })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minute
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.schedule?.time?.minute || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule!,
                      time: {
                        ...formData.schedule!.time!,
                        minute: parseInt(e.target.value),
                      },
                    },
                  })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Timezone
              </label>
              <select
                value={formData.schedule?.timezone || 'UTC'}
                onChange={(e) => setFormData({
                  ...formData,
                  schedule: {
                    ...formData.schedule!,
                    timezone: e.target.value,
                  },
                })}
                className="w-full md:w-64 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Active Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {days.map(day => (
                  <label key={day.value} className="flex items-center space-x-2 cursor-pointer bg-slate-700 px-3 py-2 rounded-md">
                    <input
                      type="checkbox"
                      checked={formData.schedule?.days?.includes(day.value) || false}
                      onChange={() => handleDayToggle(day.value)}
                      className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-white">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Deletion Policy */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4">Deletion Policy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deletion Type
                </label>
                <select
                  value={formData.deletion?.type || 'automatically'}
                  onChange={(e) => setFormData({
                    ...formData,
                    deletion: {
                      ...formData.deletion!,
                      type: e.target.value as 'automatically' | 'manually',
                    },
                  })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="automatically">Automatically</option>
                  <option value="manually">Manually</option>
                </select>
              </div>

              {formData.deletion?.type === 'automatically' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delete after (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.deletion?.after || 30}
                    onChange={(e) => setFormData({
                      ...formData,
                      deletion: {
                        ...formData.deletion!,
                        after: parseInt(e.target.value),
                      },
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Locking Configuration */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
              {formData.locking?.enabled ? (
                <Lock className="w-5 h-5 text-red-400" />
              ) : (
                <Unlock className="w-5 h-5 text-green-400" />
              )}
              <span>Snapshot Locking</span>
            </h2>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.locking?.enabled || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    locking: { enabled: e.target.checked },
                  })}
                  className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-300">
                  Enable snapshot locking to prevent accidental deletion
                </span>
              </label>
              <p className="text-sm text-slate-400 mt-2">
                When enabled, snapshots cannot be deleted until manually unlocked.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData(policy || {})}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>

          {updateMutation.isError && (
            <div className="text-red-400 text-sm">
              Failed to save policy: {updateMutation.error instanceof Error ? updateMutation.error.message : 'Unknown error'}
            </div>
          )}

          {updateMutation.isSuccess && (
            <div className="text-green-400 text-sm">
              Policy saved successfully!
            </div>
          )}
        </form>

        {/* Policy Info */}
        {policy && (
          <div className="bg-slate-800 rounded-lg p-6 mt-6">
            <h2 className="text-lg font-medium text-white mb-4">Policy Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Policy UUID</p>
                <p className="font-mono text-white">{policy.uuid}</p>
              </div>
              <div>
                <p className="text-slate-400">Created</p>
                <p className="text-white">{new Date(policy.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="text-white">{new Date(policy.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}