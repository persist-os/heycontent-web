import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const useReferralValidation = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referredByName, setReferredByName] = useState("");
  const [referralCodeValid, setReferralCodeValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the Convex query to check referral code
  const checkReferralCode = useQuery(
    api.userQueries.checkReferralCode, 
    referralCode ? { referralCode: referralCode } : "skip"
  );

  // Function to validate referral code
  const validateReferralCode = (code: string) => {
    if (!code) {
      setError("Referral code is required");
      setReferralCodeValid(false);
      setReferredByName("");
      return false;
    }
    
    if (checkReferralCode === undefined) {
      // Still loading
      return false;
    }
    
    if (checkReferralCode === null) {
      // Query skipped
      return false;
    }
    
    if (checkReferralCode.valid) {
      setError(null);
      setReferralCodeValid(true);
      // Set the referrer's name for the referredBy field
      setReferredByName(checkReferralCode.referrerName || checkReferralCode.referrerUsername || checkReferralCode.referrerEmail);
      return true;
    } else {
      setError("Invalid referral code");
      setReferralCodeValid(false);
      setReferredByName("");
      return false;
    }
  };

  const handleReferralCodeChange = (code: string) => {
    setReferralCode(code);
    setReferralCodeValid(false); // Reset validation when code changes
    setError(null);
  };

  return {
    referralCode,
    referredByName,
    referralCodeValid,
    error,
    checkReferralCode,
    validateReferralCode,
    handleReferralCodeChange,
  };
}; 