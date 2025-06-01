import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const useReferralValidation = () => {
  const [referralCode, setReferralCode] = useState("");
  const [referredByName, setReferredByName] = useState("");
  const [referredById, setReferredById] = useState("");
  const [referralCodeValid, setReferralCodeValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the Convex query to check referral code
  const checkReferralCode = useQuery(
    api.userQueries.checkReferralCode, 
    referralCode ? { referralCode: referralCode } : "skip"
  );

  useEffect(() => {
    if (!referralCode) {
      setReferralCodeValid(false);
      setReferredById("");
      setReferredByName("");
      setError(null);
      return;
    }
    if (checkReferralCode === undefined) {
      // Still loading
      return;
    }
    if (checkReferralCode === null) {
      // Query skipped
      setReferralCodeValid(false);
      setReferredById("");
      setReferredByName("");
      setError(null);
      return;
    }
    if (checkReferralCode.valid) {
      setReferralCodeValid(true);
      setReferredById(checkReferralCode.userId || "");
      setReferredByName(checkReferralCode.referrerName || checkReferralCode.referrerUsername || checkReferralCode.referrerEmail);
      setError(null);
    } else {
      setReferralCodeValid(false);
      setReferredById("");
      setReferredByName("");
      setError("Invalid referral code");
    }
    // For debugging: log when the query returns
    // console.log('Convex checkReferralCode result:', checkReferralCode);
  }, [referralCode, checkReferralCode]);

  const handleReferralCodeChange = (code: string) => {
    setReferralCode(code);
    setReferralCodeValid(false); // Reset validation when code changes
    setError(null);
  };

  return {
    referralCode,
    referredByName,
    referredById,
    referralCodeValid,
    error,
    checkReferralCode,
    handleReferralCodeChange,
  };
}; 