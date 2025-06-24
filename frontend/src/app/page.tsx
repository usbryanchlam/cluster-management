'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { MetricsDashboard } from '@/components/MetricsDashboard'
import { SnapshotPolicyForm } from '@/components/SnapshotPolicyForm'

// Demo cluster ID - in a real app, this would come from routing or selection
const DEMO_CLUSTER_ID = 'demo-cluster-123'
const DEMO_POLICY_ID = 'demo-policy-456'

export default function HomePage() {
  const [activeView, setActiveView] = useState<'metrics' | 'policy'>('metrics')

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        clusterName="Demo Cluster" 
      />
      
      {activeView === 'metrics' ? (
        <MetricsDashboard clusterId={DEMO_CLUSTER_ID} />
      ) : (
        <SnapshotPolicyForm policyId={DEMO_POLICY_ID} />
      )}
    </div>
  )
}