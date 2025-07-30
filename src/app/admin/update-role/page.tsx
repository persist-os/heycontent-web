'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function UpdateRolePage() {
  const { firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const setAdminRole = useMutation(api.setAdminRole.setAdminRole);

  const handleUpdateRole = async () => {
    if (!firebaseUser?.email) return;

    setIsLoading(true);
    setResult(null);

    try {
      await setAdminRole({
        userEmail: firebaseUser.email,
        role: 'super_admin',
      });
      setResult({
        success: true,
        message: `Successfully updated ${firebaseUser.email} to super_admin`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Update Your Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Current email: <strong>{firebaseUser?.email}</strong></p>
            <p>This will update your role to <strong>super_admin</strong></p>
          </div>

          <Button 
            onClick={handleUpdateRole} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update to Super Admin'}
          </Button>

          {result && (
            <div className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
              result.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          {result?.success && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ✅ Role updated! You can now access the admin dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 