import React from 'react';
import { Key } from 'lucide-react';

interface ReferralStepProps {
  referralCode: string;
  handleReferralCodeChange: (code: string) => void;
  referralCodeValid: boolean;
  checkReferralCode: any;
  referredById: string | null;
  onNext: () => void;
  onSkip: () => void;
}

export const ReferralStep: React.FC<ReferralStepProps> = ({
  referralCode,
  handleReferralCodeChange,
  referralCodeValid,
  checkReferralCode,
  referredById,
  onNext,
  onSkip
}) => {
  const [skipped, setSkipped] = React.useState(false);

  const handleSkip = () => {
    setSkipped(true);
    onSkip();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Referral Code (optional)</label>
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
          <div className="text-sm text-muted-foreground mt-1">Validating code...</div>
        )}
        {referralCodeValid && checkReferralCode?.valid && (
          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
            ✓ Valid referral code {checkReferralCode.referrerName && `from ${checkReferralCode.referrerName}`}
          </div>
        )}
        {!referralCodeValid && referralCode && checkReferralCode !== undefined && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">✗ Invalid referral code</div>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onNext}
          disabled={!!referralCode && (!referralCodeValid || !referredById)}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl hover:bg-secondary/80 transition-colors font-medium"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default ReferralStep;
