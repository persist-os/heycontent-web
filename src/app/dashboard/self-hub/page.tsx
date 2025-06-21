'use client'

import React, { useEffect, useState } from 'react';
import { PersonaTab } from './PersonaTab';
import { UsageHeatmap } from './UsageHeatmap';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SelfHubPage() {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
    }
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex-1 px-4 py-4 md:p-6 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="mb-4 md:mb-6 text-center">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
              Self
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 leading-relaxed">
              Manage your persona and activity.
            </p>
          </div>
          
          <Tabs defaultValue="persona" className="space-y-4">
            <TabsList>
              <TabsTrigger value="persona">Persona</TabsTrigger>
              <TabsTrigger value="usage">Activity</TabsTrigger>
             
            </TabsList>
            <TabsContent value="usage" className="space-y-4">
              {userId ? (
                <UsageHeatmap userId={userId} />
              ) : (
                <div className="flex justify-center items-center min-h-[200px] px-4 rounded-lg border border-dashed">
                  <p className="text-gray-600 text-sm">Please sign in to view your activity.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="persona" className="space-y-4">
              <PersonaTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 