import React from 'react';
import { Mail } from 'lucide-react';

interface GmailProgressScreenProps {
  progress: {
    step: string;
    message: string;
    data?: any;
  };
}

export const GmailProgressScreen: React.FC<GmailProgressScreenProps> = ({ progress }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Setting up your Partnership Hub
          </h2>
          <p className="text-muted-foreground">
            We're working to uncover collaboration opportunities just for you
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Progress Steps */}
          <ProgressStep
            step="fetching"
            currentStep={progress.step}
            title="Diving into your inbox"
            description="Scanning your latest emails for opportunities..."
          />

          <ProgressStep
            step="analyzing"
            currentStep={progress.step}
            title="Our AI is analyzing your creative style"
            description="Matching opportunities with your unique creator persona..."
          />

          <ProgressStep
            step="storing"
            currentStep={progress.step}
            title={
              progress.step === 'storing' && progress.data?.categories 
                ? `Found ${Object.values(progress.data.categories).reduce((a: number, b: number) => a + b, 0)} opportunities!`
                : progress.step === 'storing' && progress.data?.significant_count 
                ? `Discovered ${progress.data.significant_count} potential partnerships!`
                : 'Organizing your partnerships'
            }
                          description={
                progress.step === 'storing' && progress.data?.categories ? (
                  <div className="text-xs text-success font-medium space-y-1">
                    {progress.data.categories.partnership > 0 && (
                      <div>{progress.data.categories.partnership} partnership opportunities</div>
                    )}
                    {progress.data.categories.media > 0 && (
                      <div>{progress.data.categories.media} media inquiries</div>
                    )}
                    {progress.data.categories.business > 0 && (
                      <div>{progress.data.categories.business} business opportunities</div>
                    )}
                    {progress.data.categories.community > 0 && (
                      <div>{progress.data.categories.community} community connections</div>
                    )}
                  </div>
                ) : progress.step === 'storing' && progress.data?.significant_count && !progress.data?.categories ? (
                  <p className="text-xs text-success font-medium">Your collaboration empire is about to begin</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Organizing everything beautifully for you...</p>
                )
              }
          />

          <ProgressStep
            step="finalizing"
            currentStep={progress.step}
            title="Adding the finishing touches"
            description={
              progress.step === 'finalizing' 
                ? "Almost ready to unveil your partnership hub..." 
                : progress.step === 'complete' 
                ? "Your Partnership Hub is ready!" 
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
};

interface ProgressStepProps {
  step: string;
  currentStep: string;
  title: string;
  description?: string | React.ReactNode;
}

const ProgressStep: React.FC<ProgressStepProps> = ({ step, currentStep, title, description }) => {
  const isActive = currentStep === step;
  const isCompleted = ['analyzing', 'storing', 'finalizing', 'complete'].includes(currentStep) && 
                     ['fetching'].includes(step) ||
                     ['storing', 'finalizing', 'complete'].includes(currentStep) && 
                     ['fetching', 'analyzing'].includes(step) ||
                     ['finalizing', 'complete'].includes(currentStep) && 
                     ['fetching', 'analyzing', 'storing'].includes(step) ||
                     currentStep === 'complete' && 
                     ['fetching', 'analyzing', 'storing', 'finalizing'].includes(step);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isActive ? 'bg-primary/10 border border-primary/20' : 
      isCompleted ? 'bg-success/10 border border-success/20' : 
      'bg-muted border border-border'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        isActive ? 'bg-primary text-primary-foreground' :
        isCompleted ? 'bg-success text-success-foreground' :
        'bg-muted text-muted-foreground'
      }`}>
        {isActive ? (
          <div className="w-3 h-3 animate-spin rounded-full border-b-2 border-white"></div>
        ) : isCompleted ? (
          <span className="text-xs">✓</span>
        ) : (
          <span className="text-xs">{getStepNumber(step)}</span>
        )}
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">{title}</p>
        {description && typeof description === 'string' && isActive && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {description && typeof description !== 'string' && isActive && description}
        {description && typeof description === 'string' && isCompleted && step === 'finalizing' && (
          <p className="text-xs text-success font-medium">{description}</p>
        )}
      </div>
    </div>
  );
};

const getStepNumber = (step: string): string => {
  switch (step) {
    case 'fetching': return '1';
    case 'analyzing': return '2';
    case 'storing': return '3';
    case 'finalizing': return '4';
    default: return '1';
  }
}; 