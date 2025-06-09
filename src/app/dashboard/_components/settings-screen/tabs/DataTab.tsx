// File: components/settings/tabs/DataTab.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { mapAuthErrorCodeToMessage } from '@/app/api/auth/firebase/helpers';
import { Input } from '@/components/ui/input';
import { onAuthStateChanged } from 'firebase/auth';

const DataTab = () => {
  const router = useRouter();
  const deleteUserAndData = useMutation(api.userMutations.deleteUserAndData);
  const createUser = useMutation(api.userMutations.create_user);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
    }
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserId(firebaseUser?.uid);
      setUserEmail(firebaseUser?.email);
    });
    return () => unsubscribe();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) {
      toast.error('No authenticated user.');
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const code = error.code || error.message || 'unknown';
      toast.error(mapAuthErrorCodeToMessage(code));
      console.error('Change password error:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('No authenticated user.');
      return;
    }
    if (!deletePassword) {
      setDeletePasswordError('Please enter your password to confirm.');
      return;
    }
    setIsDeleting(true);
    setDeletePasswordError(null);
    try {
      // Step 0: Re-authenticate with password
      try {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      } catch (error: any) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setIsDeleting(false);
        return;
      }
      // Step 1: Delete Convex user data FIRST
      try {
        await deleteUserAndData({ userId: user.uid });
      } catch (error: any) {
        toast.error('Failed to delete user data from database.');
        console.error('Convex deleteUserAndData error:', error);
        setIsDeleting(false);
        return; // Stop here if database deletion fails
      }
      // Step 2: Delete Firebase user AFTER data is cleaned up
      try {
        await user.delete();
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          toast.error('Please re-authenticate and try again.');
        } else {
          toast.error('Failed to delete user account. Your data has been removed but you may need to contact support.');
        }
        console.error('Firebase user delete error:', error);
        setIsDeleting(false);
        return;
      }
      // Success
      toast.success('Account deleted successfully.');
      try { localStorage.clear(); } catch (e) { /* ignore */ }
      try { sessionStorage.clear(); } catch (e) { /* ignore */ }
      router.push('/auth/login');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeletePassword('');
    }
  };

  return (
    <div className="grid gap-4 sm:gap-6 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Security & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password Section */}
          <form onSubmit={handleChangePassword} className="flex flex-col p-4 bg-gray-50 rounded-lg gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium">Change Password</h3>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword || isDeleting}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={isChangingPassword || isDeleting}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword || isDeleting}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isChangingPassword || isDeleting}
                className="w-full sm:w-auto"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
            <div>
              <h3 className="font-medium">Data Collection</h3>
              <p className="text-sm text-gray-600">
                By using HeyContent, you consent to us saving, using, and analyzing your data from your integrations. We use this to improve your experience and our services.
              </p>
            </div>
            <Button variant="outline" disabled={isDeleting}>Configure</Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3 border border-red-100">
            <div>
              <h3 className="font-medium text-red-600">Delete Account</h3>
              <p className="text-sm text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="mb-2 font-semibold text-red-700">Are you absolutely sure?</div>
                    <div className="mb-4">This action cannot be undone. This will permanently delete your account and all associated data.</div>
                    <div className="mb-2">Please enter your password to confirm account deletion:</div>
                    <div className="relative mb-2">
                      <Input
                        type={showDeletePassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={deletePassword}
                        onChange={e => { setDeletePassword(e.target.value); setDeletePasswordError(null); }}
                        disabled={isDeleting}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {deletePasswordError && <div className="text-red-600 text-sm mb-2">{deletePasswordError}</div>}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataTab