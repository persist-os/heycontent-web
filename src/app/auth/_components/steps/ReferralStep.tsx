import React from 'react';
import { Key } from 'lucide-react';

interface ReferralStepProps {
  referralCode: string;
  handleReferralCodeChange: (code: string) => void;
  referralCodeValid: boolean;
  checkReferralCode: any;
  referredById: string | null;
  onNext: () => void;
}

export const ReferralStep: React.FC<ReferralStepProps> = ({
  referralCode,
  handleReferralCodeChange,
  referralCodeValid,
  checkReferralCode,
  referredById,
  onNext
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
        <div className="relative">
          <input
            type="text"
            value={referralCode}
            onChange={e => handleReferralCodeChange(e.target.value)}
            className={`w-full px-4 py-3 pl-11 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              referralCodeValid ? 'border-green-500' : 'border-gray-200'
            }`}
            placeholder="Enter your referral code"
            required
          />
          <Key className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
        {checkReferralCode === undefined && referralCode && (
          <div className="text-sm text-gray-500 mt-1">Validating code...</div>
        )}
        {referralCodeValid && checkReferralCode?.valid && (
          <div className="text-sm text-green-600 mt-1">
            ✓ Valid referral code {checkReferralCode.referrerName && `from ${checkReferralCode.referrerName}`}
          </div>
        )}
        {!referralCodeValid && referralCode && checkReferralCode !== undefined && (
          <div className="text-sm text-red-600 mt-1">✗ Invalid referral code</div>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!referralCodeValid || !referredById}
        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Continue
      </button>
    </div>
  );
};

export default ReferralStep;
