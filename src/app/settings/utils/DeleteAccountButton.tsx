import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { T } from '@/components/translation/T';

export function DeleteAccountButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const deleteUserAndData = useMutation(api.userMutations.deleteUserAndData);
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!email) {
      toast.error(<T context="toast.settings.account.deleted.email.required">Please enter your email to confirm account deletion.</T>);
      return;
    }

    setIsSubmitting(true);
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      toast.error(<T context="toast.settings.account.deleted.auth.missing">No authenticated user found.</T>);
      setIsSubmitting(false);
      return;
    }

    // Verify email matches current user's email
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      toast.error(<T context="toast.settings.account.deleted.email.mismatch">Email does not match your account email.</T>);
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Get fresh Firebase token
      let token: string;
      try {
        token = await user.getIdToken(true); // Force refresh
      } catch (error: any) {
        console.error('Error getting Firebase token:', error);
        toast.error(<T context="toast.settings.account.deleted.auth.error">Authentication error. Please try again.</T>);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Cancel Stripe subscription and delete customer via backend
      try {
        const response = await fetch('/api/user/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid, token }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('Backend account deletion failed:', data);
          toast.error(<T context="toast.settings.account.deleted.subscription.failed">Failed to cancel subscription. Please contact support.</T>);
          setIsSubmitting(false);
          return;
        }

        if (data.errors) {
          // Account deletion completed with warnings
        }
      } catch (error: any) {
        console.error('Error calling backend delete-account:', error);
        toast.error(<T context="toast.settings.account.deleted.subscription.error">Failed to cancel subscription. Please contact support.</T>);
        setIsSubmitting(false);
        return;
      }

      // Step 3: Delete Convex user data
      try {
        await deleteUserAndData({ userId: user.uid });
      } catch (error: any) {
        console.error('Error deleting user data from database:', error);
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        toast.error(<T context="toast.settings.account.deleted.data.error">Failed to delete user data: {errorMessage}</T>);
        setIsSubmitting(false);
        return;
      }

      // Step 4: Delete Firebase user
      try {
        await user.delete();
      } catch (error: any) {
        console.error('Error deleting Firebase user:', error);
        // If we get a "requires recent login" error, the data is already deleted
        // so we can proceed to sign out
        if (error.code === 'auth/requires-recent-login') {
          toast.error(<T context="toast.settings.account.deleted.auth.recent_login">Please sign in again to complete account deletion.</T>);
          await auth.signOut();
          router.push('/auth/login');
          return;
        }
        throw error;
      }
      
      // Redirect to home page after successful deletion
      router.push('/');
      toast.success(<T context="toast.settings.account.deleted.success">Your account has been successfully deleted.</T>);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(<T context="toast.settings.account.deleted.generic.error">{error.message || 'Failed to delete account. Please try again.'}</T>);
    } finally {
      setIsSubmitting(false);
      setEmail('');
      setShowEmailInput(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className={`w-full mt-4 ${className}`} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {showEmailInput && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter your email address to confirm account deletion:
            </p>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full"
              autoFocus
            />
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setShowEmailInput(false);
            setEmail('');
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              if (!showEmailInput) {
                setShowEmailInput(true);
              } else {
                handleDeleteAccount();
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isSubmitting || (showEmailInput && !email)}
          >
            {isSubmitting ? 'Deleting...' : showEmailInput ? 'Delete Account' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}