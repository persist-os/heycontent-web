import React from 'react';

type RegistrationStep = 'referral' | 'basic' | 'password';

interface StepIndicatorProps {
  currentStep: RegistrationStep;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {(['referral', 'basic', 'password'] as RegistrationStep[]).map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : currentStep === 'basic' && step === 'password'
                  ? 'bg-gray-200 text-gray-600'
                  : currentStep === 'password' && (step === 'basic' || step === 'referral')
                  ? 'bg-blue-600 text-white'
                  : currentStep === 'basic' && step === 'referral'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            {index < 2 && (
              <div
                className={`w-12 h-0.5 ${
                  (currentStep === 'password' && index === 0) ||
                  (currentStep === 'password' && index === 1) ||
                  (currentStep === 'basic' && index === 0)
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
