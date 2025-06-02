import { useState, useEffect } from 'react';

interface PasswordValidation {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

export const usePasswordValidation = (password: string) => {
  const [passwordValid, setPasswordValid] = useState<PasswordValidation>({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const validatePassword = (pw: string): PasswordValidation => {
    return {
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    };
  };

  useEffect(() => {
    setPasswordValid(validatePassword(password));
  }, [password]);

  const isPasswordValid = Object.values(passwordValid).every(Boolean);

  return { passwordValid, isPasswordValid };
}; 