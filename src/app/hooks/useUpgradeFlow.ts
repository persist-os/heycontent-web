/**
 * Hook for handling upgrade flow when free tier limit is reached.
 * 
 * Detects 402 Payment Required responses and triggers upgrade modal.
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UpgradeFlowState {
  showUpgradeModal: boolean;
  upgradeReason: 'limit_reached' | 'feature_required' | null;
}

export function useUpgradeFlow() {
  const router = useRouter();
  const [state, setState] = useState<UpgradeFlowState>({
    showUpgradeModal: false,
    upgradeReason: null,
  });

  /**
   * Call this when an API request returns 402 Payment Required
   */
  const handlePaymentRequired = useCallback((reason: 'limit_reached' | 'feature_required' = 'limit_reached') => {
    console.log('[UpgradeFlow] Payment required:', reason);
    setState({
      showUpgradeModal: true,
      upgradeReason: reason,
    });
  }, []);

  /**
   * Handle user selecting a plan
   */
  const handleSelectPlan = useCallback(async (planId: string) => {
    console.log('[UpgradeFlow] Plan selected:', planId);
    
    // Close modal
    setState({
      showUpgradeModal: false,
      upgradeReason: null,
    });
    
    // Redirect to subscription page with selected plan
    router.push(`/settings/subscription?plan=${planId}`);
  }, [router]);

  /**
   * Handle user closing modal without selecting plan
   */
  const handleClose = useCallback(() => {
    console.log('[UpgradeFlow] Modal closed without selection');
    setState({
      showUpgradeModal: false,
      upgradeReason: null,
    });
  }, []);

  return {
    showUpgradeModal: state.showUpgradeModal,
    upgradeReason: state.upgradeReason,
    handlePaymentRequired,
    handleSelectPlan,
    handleClose,
  };
}

