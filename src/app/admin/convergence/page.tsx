'use client';

/**
 * Convergence Admin Dashboard
 * 
 * Admin-only interface for managing Convergence optimization system.
 * Features: trigger runs, configure systems, monitor performance.
 * 
 * Access: Admin and Super Admin roles only
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/app/lib/admin-auth';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { Tab, TabId } from './types';
import { ConvergenceHeader } from './components/ConvergenceHeader';
import { ConvergenceTabs } from './components/ConvergenceTabs';
import { OptimizationRunner } from './components/tabs/OptimizationRunner';
import { ExperimentsView } from './components/tabs/ExperimentsView';
import { ConfigsView } from './components/tabs/ConfigsView';
import { RLMetaView } from './components/tabs/RLMetaView';
import { RunsView } from './components/tabs/RunsView';
import { TerminalView } from './components/tabs/TerminalView';

const TABS: Tab[] = [
  {
    id: 'runner',
    label: 'OPTIMIZER',
    cmd: 'convergence optimize',
  },
  {
    id: 'experiments',
    label: 'EXPERIMENTS',
    cmd: 'query experiments --live',
  },
  {
    id: 'configs',
    label: 'CONFIG_VAULT',
    cmd: 'convex deploy --configs',
  },
  {
    id: 'rl_meta',
    label: 'RL_META',
    cmd: 'query rl_episodes --agent all',
  },
  {
    id: 'runs',
    label: 'ARCHIVES',
    cmd: 'query optimization_runs --history',
  },
  {
    id: 'terminal',
    label: 'TERMINAL',
    cmd: 'tail -f logs/optimization.log',
  },
];

export default function ConvergenceDashboard() {
  const router = useRouter();
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabId>('runner');

  const hasAccess = isAdmin || isSuperAdmin;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Shield className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">
                  You don't have permission to access the Convergence dashboard.
                </p>
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Return to Admin Panel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'runner':
        return <OptimizationRunner />;
      case 'experiments':
        return <ExperimentsView />;
      case 'configs':
        return <ConfigsView />;
      case 'rl_meta':
        return <RLMetaView />;
      case 'runs':
        return <RunsView />;
      case 'terminal':
        return <TerminalView />;
      default:
        return <OptimizationRunner />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Scan lines overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)',
        }}
      />
      
      <ConvergenceHeader
        totalSessions={7}
        activeExperiments={42}
        legacyEntries={156}
      />

      <ConvergenceTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="bg-black">
        {renderTabContent()}
      </div>
    </div>
  );
}

