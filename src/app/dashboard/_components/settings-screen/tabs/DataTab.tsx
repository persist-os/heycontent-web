// File: components/settings/tabs/DataTab.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { auth } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const DataTab = () => {
  const router = useRouter();
  const deleteUserAndData = useMutation(api.userMutations.deleteUserAndData);

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser) {
      toast.error('No authenticated user.');
      return;
    }
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account and all data? This action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      // 1. Delete all Convex data
      await deleteUserAndData({ userId: auth.currentUser.uid });
      // 2. Delete Firebase Auth user
      await auth.currentUser.delete();
      toast.success('Account deleted.');
      // 3. Redirect to login and clear local storage
      localStorage.clear();
      sessionStorage.clear();
      router.push('/auth/login');
      window.location.reload();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please re-authenticate and try again.');
      } else {
        toast.error('Failed to delete account.');
      }
      console.error('Delete account error:', error);
    }
  };

  return (
    <div className="grid gap-4 sm:gap-6 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Data Export & Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Export All Data</h3>
              <p className="text-sm text-gray-600">Download all your data in a single file</p>
            </div>
            <Button className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Automatic Backups</h3>
              <p className="text-sm text-gray-600">Keep your data safe with regular backups</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Privacy & Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Data Collection</h3>
              <p className="text-sm text-gray-600">
                By using HeyContent, you consent to us saving, using, and analyzing your data from your integrations. We use this to improve your experience and our services.
              </p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium text-red-600">Delete Account</h3>
              <p className="text-sm text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataTab
