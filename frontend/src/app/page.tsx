'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/Sidebar'
import { MetricsDashboard } from '@/components/MetricsDashboard'
import { SnapshotPolicyForm } from '@/components/SnapshotPolicyForm'
import { userClusterApi } from '@/lib/api'

// Default cluster ID - Bryan's cluster UUID as fallback
const DEFAULT_CLUSTER_ID = 'f2398d2e-f92d-482a-ab2d-4b9a9f79186c'

export default function HomePage() {
  const [activeView, setActiveView] = useState<'metrics' | 'policy'>('metrics')
  const [currentUserId, setCurrentUserId] = useState<string>('bryan')
  
  // Get user's cluster information for display
  const { data: userCluster } = useQuery({
    queryKey: ['userCluster', currentUserId],
    queryFn: () => userClusterApi.getUserCluster(currentUserId),
  })

  // Get all users for switching functionality
  const { data: allUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => userClusterApi.getAllUsersWithClusters(),
  })

  // Handle user switching
  const handleUserSwitch = (newUserId: string) => {
    setCurrentUserId(newUserId)
    // Force re-render by clearing the current view and setting it back
    setActiveView('metrics')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        clusterName={userCluster?.cluster.cluster_name || "Loading..."} 
        userName={userCluster?.user.user_name || "Loading..."}
        currentUserId={currentUserId}
        allUsers={allUsers}
        onUserSwitch={handleUserSwitch}
      />
      
      {activeView === 'metrics' ? (
        <MetricsDashboard clusterId={userCluster?.cluster.uuid || DEFAULT_CLUSTER_ID} />
      ) : (
        <SnapshotPolicyForm userId={currentUserId} />
      )}
    </div>
  )
}