// File: components/settings/tabs/DataTab.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
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
import { AutomaticEmbeddingStatus } from './platform-connect/AutomaticEmbeddingStatus';

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
    <div className="space-y-12">
      {/* Security Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tight text-foreground">Security</h2>
          <p className="text-muted-foreground">Manage your password and account security</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword || isDeleting}
                  required
                  className="pr-10 border-border/50 focus:border-foreground/20 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={isChangingPassword || isDeleting}
                  required
                  className="pr-10 border-border/50 focus:border-foreground/20 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword || isDeleting}
                  required
                  className="pr-10 border-border/50 focus:border-foreground/20 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isChangingPassword || isDeleting}
              className="bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* Privacy Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tight text-foreground">Privacy</h2>
          <p className="text-muted-foreground">Control how your data is collected and used</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between py-4">
            <div className="space-y-1 flex-1">
              <h3 className="font-medium text-foreground">Data Collection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                We collect and analyze data from your connected platforms to provide personalized insights and improve your content strategy. This helps us deliver better recommendations and features.
              </p>
            </div>
            <Button 
              variant="ghost" 
              disabled={isDeleting}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 ml-6"
            >
              Configure
            </Button>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* Danger Zone */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tight text-foreground">Danger Zone</h2>
          <p className="text-muted-foreground">Irreversible actions that affect your account</p>
        </div>

        <div className="border border-red-200/50 dark:border-red-800/30 rounded-2xl p-6 bg-red-50/30 dark:bg-red-950/20">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Permanently delete your account and all associated data. This action cannot be undone and will immediately remove all your content, connections, and settings.
              </p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)} 
                  disabled={isDeleting}
                  className="ml-6 bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                >
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader className="space-y-3">
                  <AlertDialogTitle className="text-xl font-light tracking-tight">Delete Account</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4 text-sm leading-relaxed">
                    <div className="font-medium text-red-600 dark:text-red-400">
                      This action cannot be undone.
                    </div>
                    <div className="text-muted-foreground">
                      This will permanently delete your account and all associated data, including your content, connections, and settings.
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Enter your password to confirm:
                      </label>
                      <div className="relative">
                        <Input
                          type={showDeletePassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={deletePassword}
                          onChange={e => { setDeletePassword(e.target.value); setDeletePasswordError(null); }}
                          disabled={isDeleting}
                          required
                          className="pr-10 border-border/50 focus:border-red-400/50 transition-colors duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePassword(!showDeletePassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                          tabIndex={-1}
                        >
                          {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {deletePasswordError && (
                        <div className="text-red-600 dark:text-red-400 text-sm">{deletePasswordError}</div>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel 
                    disabled={isDeleting}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword}
                      className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      {/* Content Intelligence Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tight text-foreground">Content Intelligence</h2>
          <p className="text-muted-foreground">Smart search and AI-powered insights for your content</p>
        </div>

        <AutomaticEmbeddingStatus />
      </div>
    </div>
  )
}

export default DataTab