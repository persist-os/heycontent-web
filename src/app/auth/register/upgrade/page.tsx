"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';
import UpgradeModal from "@/app/dashboard/_components/settings-screen/tabs/subscription/upgrade-modal";

export default function UpgradePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  const handleUpgradeSuccess = () => {
    setOpen(false);
    router.push("/auth/register/waitlist");
  };

  const handleUpgradeClose = () => {
    // Prevent closing modal without selecting a plan
    setOpen(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <UpgradeModal
        open={open}
        onClose={handleUpgradeClose}
        onSelectPlan={handleUpgradeSuccess}
      />
    </div>
  );
} 