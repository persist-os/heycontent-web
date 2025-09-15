"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsernameRequiredModalProps {
  isOpen: boolean;
  onUsernameSet: () => void;
}

export function UsernameRequiredModal({ isOpen, onUsernameSet }: UsernameRequiredModalProps) {
  const { firebaseUser } = useAuth();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ available: boolean; error: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateUsernameMutation = useMutation(api.userMutations.updateUsername);

  // Query for username availability check
  const usernameCheckQuery = useQuery(
    api.userQueries.checkUsernameAvailability,
    username.length >= 3 ? { username } : "skip"
  );

  // Update check result when query result changes
  useEffect(() => {
    if (username.length < 3) {
      setCheckResult(null);
      setIsChecking(false);
      return;
    }

    if (usernameCheckQuery === undefined) {
      setIsChecking(true);
    } else {
      setIsChecking(false);
      setCheckResult(usernameCheckQuery);
    }
  }, [username, usernameCheckQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser?.uid || !username || !checkResult?.available) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateUsernameMutation({
        userId: firebaseUser.uid,
        username: username.trim()
      });
      
      onUsernameSet();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to set username');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationIcon = () => {
    if (isChecking) {
      return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    }
    if (checkResult?.available) {
      return <Check className="w-4 h-4 text-green-500" />;
    }
    if (checkResult?.error) {
      return <X className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (username.length === 0) return null;
    if (username.length < 3) return "Username must be at least 3 characters";
    if (isChecking) return "Checking availability...";
    if (checkResult?.available) return "Username is available!";
    if (checkResult?.error) return checkResult.error;
    return null;
  };

  const isFormValid = username.length >= 3 && checkResult?.available && !isChecking;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Choose Your Username</h2>
          <p className="text-muted-foreground">
            You need to set a username to continue using the app. This will be your unique identifier.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={cn(
                  "pr-10",
                  checkResult?.available && "border-green-500 focus:border-green-500",
                  checkResult?.error && "border-red-500 focus:border-red-500"
                )}
                maxLength={20}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
            <div className="min-h-[20px]">
              {getValidationMessage() && (
                <p className={cn(
                  "text-sm",
                  checkResult?.available ? "text-green-600" : "text-red-600"
                )}>
                  {getValidationMessage()}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting Username...
              </>
            ) : (
              'Set Username'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Your username cannot be changed later, so choose carefully!
          </p>
        </div>
      </div>
    </div>
  );
}
