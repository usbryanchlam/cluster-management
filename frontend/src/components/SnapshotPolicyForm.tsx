'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { policyApi, userClusterApi, SnapshotPolicy } from '@/lib/api'
import { RotateCcw } from 'lucide-react'

interface SnapshotPolicyFormProps {
  userId?: string // Optional, defaults to "bryan"
}

export function SnapshotPolicyForm({ userId = "bryan" }: SnapshotPolicyFormProps) {
  const queryClient = useQueryClient()

  // First, get the user's associated cluster
  const { data: userCluster, isLoading: isLoadingUserCluster } = useQuery({
    queryKey: ['userCluster', userId],
    queryFn: () => userClusterApi.getUserCluster(userId),
  })

  // Then, get the policy for that cluster
  const { data: policy, isLoading: isLoadingPolicy } = useQuery({
    queryKey: ['policy', userCluster?.cluster.uuid],
    queryFn: () => policyApi.getPolicy(userCluster!.cluster.uuid),
    enabled: !!userCluster?.cluster.uuid, // Only run when we have cluster UUID
  })

  const isLoading = isLoadingUserCluster || isLoadingPolicy

  const [formData, setFormData] = useState<Partial<SnapshotPolicy>>({})

  useEffect(() => {
    if (policy) {
      setFormData(policy)
    }
  }, [policy])

  // Auto-disable locking when deletion is set to manually
  useEffect(() => {
    if (formData.deletion?.type === 'manually' && formData.locking?.enabled) {
      setFormData(prev => ({
        ...prev,
        locking: { enabled: false }
      }))
    }
  }, [formData.deletion?.type, formData.locking?.enabled])

  const updateMutation = useMutation({
    mutationFn: (data: Omit<SnapshotPolicy, 'uuid' | 'createdAt' | 'updatedAt'>) => {
      if (!userCluster?.cluster.uuid) {
        throw new Error('No cluster UUID available')
      }
      return policyApi.updatePolicy(userCluster.cluster.uuid, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy', userCluster?.cluster.uuid] })
      queryClient.invalidateQueries({ queryKey: ['userCluster', userId] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.directory && formData.schedule && formData.deletion && formData.locking !== undefined) {
      // Ensure deletion has proper defaults when type is 'automatically'
      const deletion = formData.deletion.type === 'automatically' 
        ? {
            ...formData.deletion,
            after: formData.deletion.after || 14,
            unit: formData.deletion.unit || 'days'
          }
        : {
            type: 'manually' as const
          }
      
      // Disable locking when deletion is set to manually
      const locking = formData.deletion.type === 'manually'
        ? { enabled: false }
        : formData.locking

      updateMutation.mutate({
        name: formData.name,
        directory: formData.directory,
        schedule: formData.schedule,
        deletion,
        locking,
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

  const handleCancel = () => {
    setFormData(policy || {})
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-main-bg p-4">
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <RotateCcw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-slate-400">
              {isLoadingUserCluster ? 'Loading user and cluster data...' : 'Loading policy...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-main-bg p-4 overflow-y-auto">
      <div className="max-w-4xl">
        <h1 className="text-lg text-slate-300 mb-4">
          Edit Snapshot Policy{userCluster ? ` - ${userCluster.cluster.cluster_name}` : ''}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-1">
          {/* Policy Name */}
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Policy Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1 mb-1 text-sm bg-input-bg border border-input-border rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ProjectX_Daily"
              required
            />
          </div>

          {/* Apply to Directory */}
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Apply to Directory</label>
            <div className="flex">
              <div className="flex items-center justify-center px-2 mb-1 text-sm bg-main-bg border border-r-0 border-slate-600 rounded-l text-slate-300">
                /
              </div>
              <input
                type="text"
                value={formData.directory || ''}
                onChange={(e) => setFormData({ ...formData, directory: e.target.value })}
                className="flex-1 px-2 py-1 mb-1 text-sm bg-input-bg border border-slate-600 rounded-r text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Production/ProjectX"
                required
              />
            </div>
          </div>

          {/* Run Policy on the Following Schedule */}
          <div>
            <label className="block text-slate-300 mb-1 text-sm">Run Policy on the Following Schedule</label>
            <div className="bg-sidebar-bg border border-input-border p-4 space-y-4">
              {/* Select Schedule Type */}
              <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
                <label className="text-slate-300 text-right text-sm">Select Schedule Type</label>
                <select
                  value={formData.schedule?.type || 'daily'}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule!,
                      type: e.target.value as 'daily' | 'weekly',
                    },
                  })}
                  className="w-64 px-2 py-1 text-sm bg-input-bg border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Set to Time Zone */}
              <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
                <label className="text-slate-300 text-right text-sm">Set to Time Zone</label>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300 text-sm">America/Los Angeles</span>
                  <div 
                    className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center cursor-help"
                    title="Same as the time zone setting of the cluster"
                  >
                    <span className="text-white text-xs">?</span>
                  </div>
                </div>
              </div>

              {/* Take a Snapshot at */}
              <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
                <label className="text-slate-300 text-right text-sm">Take a Snapshot at</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={String(formData.schedule?.time?.hour || 7).padStart(2, '0')}
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
                    className="w-16 px-2 py-1 text-sm bg-input-bg border border-slate-600 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-slate-300">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={String(formData.schedule?.time?.minute || 0).padStart(2, '0')}
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
                    className="w-16 px-2 py-1 text-sm bg-input-bg border border-slate-600 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* On the Following Day(s) */}
              <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
                <label className="text-slate-300 text-right pt-1 text-sm">On the Following Day(s)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!formData.schedule?.days || formData.schedule.days.length === 7}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            schedule: {
                              ...formData.schedule!,
                              days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                            },
                          })
                        } else {
                          setFormData({
                            ...formData,
                            schedule: {
                              ...formData.schedule!,
                              days: [],
                            },
                          })
                        }
                      }}
                      className="w-3 h-3 text-blue-600 bg-input-bg border-slate-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Every day</span>
                  </label>

                  {[
                    { value: 'mon', label: 'Mon' },
                    { value: 'tue', label: 'Tue' },
                    { value: 'wed', label: 'Wed' },
                    { value: 'thu', label: 'Thur' },
                    { value: 'fri', label: 'Fri' },
                    { value: 'sat', label: 'Sat' },
                    { value: 'sun', label: 'Sun' },
                  ].map((day) => (
                    <label key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.schedule?.days?.includes(day.value) ?? (day.value !== 'sat' && day.value !== 'sun')}
                        onChange={() => handleDayToggle(day.value)}
                        className="w-3 h-3 text-blue-600 bg-input-bg border-slate-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delete Each Snapshot */}
              <div className="grid grid-cols-[200px_1fr] gap-4 items-center">
                <label className="text-slate-300 text-right text-sm">Delete Each Snapshot</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="deletion"
                      checked={formData.deletion?.type === 'manually'}
                      onChange={() => setFormData({
                        ...formData,
                        deletion: { type: 'manually' },
                      })}
                      className="w-3 h-3 text-blue-600 bg-input-bg border-slate-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Never</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="deletion"
                      checked={formData.deletion?.type === 'automatically'}
                      onChange={() => setFormData({
                        ...formData,
                        deletion: { type: 'automatically', after: 14, unit: 'days' },
                      })}
                      className="w-3 h-3 text-blue-600 bg-input-bg border-slate-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-300 text-sm">Automatically after</span>
                    <input
                      type="number"
                      min="1"
                      value={formData.deletion?.after || 14}
                      onChange={(e) => setFormData({
                        ...formData,
                        deletion: {
                          ...formData.deletion!,
                          after: parseInt(e.target.value),
                        },
                      })}
                      disabled={formData.deletion?.type === 'manually'}
                      className="w-16 px-2 py-1 text-sm bg-input-bg border border-slate-600 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <select 
                      value={formData.deletion?.unit || 'days'}
                      onChange={(e) => setFormData({
                        ...formData,
                        deletion: {
                          ...formData.deletion!,
                          unit: e.target.value as 'days' | 'weeks',
                        },
                      })}
                      disabled={formData.deletion?.type === 'manually'}
                      className="px-2 py-1 text-sm bg-input-bg border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="days">day(s)</option>
                      <option value="weeks">week(s)</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Snapshot Locking */}
          <div>
            <h3 className="text-slate-300 mb-2 text-sm">Snapshot Locking</h3>
            <p className="text-slate-400 text-xs mb-3">
              Locked snapshots cannot be deleted before the deletion schedule expires. For this feature to be available, snapshots must be set to automatically delete.
            </p>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.locking?.enabled || false}
                onChange={(e) => setFormData({
                  ...formData,
                  locking: { enabled: e.target.checked },
                })}
                disabled={formData.deletion?.type === 'manually'}
                className="w-3 h-3 text-blue-600 bg-input-bg border-slate-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${formData.deletion?.type === 'manually' ? 'text-slate-500' : 'text-slate-300'}`}>Enable locked snapshots</span>
            </label>
          </div>

          {/* Enable Policy */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.enabled ?? true}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-3 h-3 text-blue-600 bg-input-bg border-slate-600 rounded focus:ring-blue-500"
              />
              <span className="text-slate-300 text-sm">Enable policy</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-8 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Policy'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-8 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
            >
              Cancel
            </button>
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
      </div>
    </div>
  )
}