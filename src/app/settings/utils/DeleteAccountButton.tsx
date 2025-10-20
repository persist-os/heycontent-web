import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export function DeleteAccountButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const deleteUserAndData = useMutation(api.userMutations.deleteUserAndData);
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!email) {
      toast.error('Please enter your email to confirm account deletion.');
      return;
    }

    setIsSubmitting(true);
    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      toast.error('No authenticated user found.');
      setIsSubmitting(false);
      return;
    }

    // Verify email matches current user's email
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      toast.error('Email does not match your account email.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Delete Convex user data first
      try {
        await deleteUserAndData({ userId: user.uid });
      } catch (error: any) {
        console.error('Error deleting user data from database:', error);
        // Continue with Firebase deletion even if Convex deletion fails
      }

      // Delete Firebase user
      await user.delete();
      
      // Redirect to home page after successful deletion
      router.push('/');
      toast.success('Your account has been successfully deleted.');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
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