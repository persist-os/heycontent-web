"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PersonaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const createPersona = useMutation(api.personas.createPersona);
  const [currentPersona, setCurrentPersona] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonaLoading(true);
    setPersonaSuccess(null);
    setPersonaError(null);
    try {
      if (!user) throw new Error("You must be logged in to save your persona.");
      if (!currentPersona) throw new Error("Current Persona is required.");
      await createPersona({
        userId: user.uid,
        preferredName: user.displayName || "",
        currentPersona,
        futureVision,
      });
      setPersonaSuccess("Persona saved!");
      setShowContinue(true);
    } catch (err: any) {
      setPersonaError(err.message || "Failed to save persona.");
    } finally {
      setPersonaLoading(false);
    }
  };

  const handleContinue = () => {
    router.push("/auth/register/upgrade");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <form onSubmit={handleSavePersona} className="space-y-4 bg-white shadow-lg rounded-xl p-4 sm:p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">AI Persona Understanding</h2>
          <p className="text-sm text-gray-600 mb-4 text-center">Help Content understand your journey and goals</p>
          <div>
            <label className="block text-sm font-medium mb-1">Current Persona</label>
            <textarea
              value={currentPersona}
              onChange={e => setCurrentPersona(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="w-full border rounded px-3 py-2"
              placeholder="Describe who you are today..."
              required
            />
            <div className="text-xs text-gray-400 text-right">{currentPersona.length}/500</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Future Vision</label>
            <textarea
              value={futureVision}
              onChange={e => setFutureVision(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="w-full border rounded px-3 py-2"
              placeholder="Describe your goals and aspirations..."
            />
            <div className="text-xs text-gray-400 text-right">{futureVision.length}/500</div>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded disabled:opacity-50 mb-2"
            disabled={personaLoading || !user || !currentPersona}
          >
            {personaLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="w-full border border-gray-300 text-gray-600 py-2 rounded mb-2 hover:bg-gray-50 transition"
            onClick={handleContinue}
            disabled={personaLoading}
          >
            Skip for now, I'll add this later in Settings
          </button>
          {personaSuccess && <div className="text-green-600 text-sm mb-2">{personaSuccess}</div>}
          {personaError && <div className="text-red-600 text-sm mb-2">{personaError}</div>}
          {showContinue && (
            <button
              type="button"
              className="w-full bg-blue-600 text-white py-2 rounded mt-2"
              onClick={handleContinue}
            >
              Continue
            </button>
          )}
        </form>
      </div>
    </div>
  );
} 