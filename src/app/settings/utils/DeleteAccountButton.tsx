import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export function DeleteAccountButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const deleteUserAndData = useMutation(api.userMutations.deleteUserAndData);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      toast.error('Please enter your password to confirm account deletion.');
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

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
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
      setPassword('');
      setShowPasswordInput(false);
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
        
        {showPasswordInput && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter your password to confirm account deletion:
            </p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full"
              autoFocus
            />
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setShowPasswordInput(false);
            setPassword('');
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              if (!showPasswordInput) {
                setShowPasswordInput(true);
              } else {
                handleDeleteAccount();
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isSubmitting || (showPasswordInput && !password)}
          >
            {isSubmitting ? 'Deleting...' : showPasswordInput ? 'Delete Account' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
