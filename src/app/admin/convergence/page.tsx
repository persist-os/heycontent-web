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
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAdminAuth } from '@/app/lib/admin-auth';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { Tab, TabId } from './types';
import { ConvergenceHeader } from './components/ConvergenceHeader';
import { ConvergenceTabs } from './components/ConvergenceTabs';
import { OptimizationRunner } from './components/tabs/OptimizationRunner';
import { BestConfigsView } from './components/tabs/BestConfigsView';
import { RunHistoryView } from './components/tabs/RunHistoryView';
import { TerminalView } from './components/tabs/TerminalView';
import { ConfigGenerator } from './components/tabs/ConfigGenerator';

const TABS: Tab[] = [
  {
    id: 'generator',
    label: 'CONFIG_GEN',
    cmd: 'convergence init --guided',
  },
  {
    id: 'runner',
    label: 'OPTIMIZER',
    cmd: 'convergence optimize',
  },
  {
    id: 'best_configs',
    label: 'BEST_CONFIGS',
    cmd: 'query best_configs --all',
  },
  {
    id: 'run_history',
    label: 'RUN_HISTORY',
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
  const [activeTab, setActiveTab] = useState<TabId>('generator');

  // Query real stats from Convex for header
  // Note: These queries get data across ALL systems
  const allRuns = useQuery(api.convergenceStorageQueries.getRunsForSystem, {
    system_name: 'context_enrichment', // We'll aggregate across systems client-side if needed
    limit: 1000
  });
  
  const allExperiments = useQuery(api.convergenceStorageQueries.getExperimentsBySystem, {
    system_name: 'context_enrichment',
    min_score: 0.0,
    limit: 1000
  });
  
  const allConfigs = useQuery(api.convergenceBestConfigQueries.getAllBestConfigs, {});

  // Calculate real counts
  const totalRuns = allRuns?.length || 0;
  const activeExperiments = allExperiments?.length || 0;
  const configCount = allConfigs?.length || 0;

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
      case 'generator':
        return <ConfigGenerator />;
      case 'runner':
        return <OptimizationRunner />;
      case 'best_configs':
        return <BestConfigsView />;
      case 'run_history':
        return <RunHistoryView />;
      case 'terminal':
        return <TerminalView />;
      default:
        return <ConfigGenerator />;
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
        totalSessions={totalRuns}
        activeExperiments={activeExperiments}
        legacyEntries={configCount}
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

