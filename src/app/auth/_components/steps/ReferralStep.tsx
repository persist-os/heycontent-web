import React from 'react';
import { Key } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { T } from '@/components/translation';

interface ReferralStepProps {
  referralCode: string;
  handleReferralCodeChange: (code: string) => void;
  referralCodeValid: boolean;
  checkReferralCode: any;
  referredById: string | null;
  onNext: () => void;
  onSkip: () => void;
}

interface GoogleSignInWithReferralProps extends ReferralStepProps {
  onGoogleSignInError: (error: string) => void;
}

export const ReferralStep: React.FC<ReferralStepProps & { onGoogleSignInError?: (error: string) => void }> = ({
  referralCode,
  handleReferralCodeChange,
  referralCodeValid,
  checkReferralCode,
  referredById,
  onNext,
  onSkip,
  onGoogleSignInError
}) => {
  const [skipped, setSkipped] = React.useState(false);
  const [showGoogleFlow, setShowGoogleFlow] = React.useState(true);

  const handleSkip = () => {
    setSkipped(true);
    onSkip();
  };

  const handleGoogleSignUp = () => {
    // Google Sign-In will automatically handle registration
    // Pass referral code if provided and valid
  };

  return (
    <div className="space-y-6">
      {/* Google Sign-In Option */}
      {showGoogleFlow && (
        <>
          <div>
            <GoogleSignInButton 
              action="register"
              additionalData={{
                referredBy: referredById || undefined
              }}
              onError={onGoogleSignInError}
              className="w-full"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                <T context="message.auth.or-create-email">or create account with email</T>
              </span>
            </div>
          </div>
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <T context="label.auth.referral-code">Referral Code (optional)</T>
        </label>
        <div className="relative">
          <input
            type="text"
            value={referralCode}
            onChange={e => {
              setSkipped(false);
              handleReferralCodeChange(e.target.value);
            }}
            className={`w-full px-4 py-3 pl-11 bg-background text-foreground border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground ${
              referralCodeValid ? 'border-green-500' : 'border-border'
            }`}
            placeholder="Enter your referral code (optional)"
          />
          <Key className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
        {checkReferralCode === undefined && referralCode && (
          <div className="text-sm text-muted-foreground mt-1">
            <T context="message.auth.validating-code">Validating code...</T>
          </div>
        )}
        {referralCodeValid && checkReferralCode?.valid && (
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            <T context="message.auth.valid-referral">✓ Valid referral code</T> {checkReferralCode.referrerName && `from ${checkReferralCode.referrerName}`}
          </div>
        )}
        {!referralCodeValid && referralCode && checkReferralCode !== undefined && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
            <T context="error.auth.invalid-referral">✗ Invalid referral code</T>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={!!referralCode && (!referralCodeValid || !referredById)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <T context="button.auth.continue">Continue</T>
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl hover:bg-secondary/80 transition-colors font-medium"
        >
          <T context="button.auth.skip">Skip</T>
        </button>
      </div>
    </div>
  );
};

export default ReferralStep;
