/**
 * Displays user's current usage and free tier limit.
 * Shows upgrade prompt when approaching limit.
 */
'use client';

import { useEffect, useState } from 'react';
import { fetchWithApiKey } from '@/app/lib/api-helpers';

interface UsageData {
  used: number;
  included: number;
  plan: string;
}

export function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetchWithApiKey('/api/subscription/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage({
            used: data.used_requests || 0,
            included: data.included_requests || 50,
            plan: data.plan || 'free',
          });
        }
      } catch (error) {
        console.error('[UsageIndicator] Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading || !usage) return null;

  // Only show for free tier users
  if (usage.plan !== 'free') return null;

  const percentage = (usage.used / usage.included) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <div className={`
      rounded-lg p-4 mb-4
      ${isNearLimit ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'}
      border
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Free Tier Usage
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {usage.used} / {usage.included} requests used
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {Math.round(percentage)}%
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isNearLimit && (
        <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
          You're running low on free requests. 
          <a href="/settings/subscription" className="underline ml-1 hover:text-yellow-800 dark:hover:text-yellow-200">
            Upgrade now
          </a>
        </p>
      )}
    </div>
  );
}

