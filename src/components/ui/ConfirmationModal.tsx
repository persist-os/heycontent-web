import * as React from 'react';
import { BaseModal } from './base-modal';
import { useLanguagePreference, useTranslation } from '@/hooks/useTranslation';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
  className?: string;
  // Translation context props
  titleContext?: string;
  descriptionContext?: string;
  confirmContext?: string;
  cancelContext?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  className,
  titleContext,
  descriptionContext,
  confirmContext,
  cancelContext,
}: ConfirmationModalProps) {
  const { language } = useLanguagePreference();
  
  // Use translation if context is provided, otherwise use the provided text
  const { text: translatedTitle } = useTranslation(title, {
    context: titleContext,
    targetLang: language,
    enabled: !!titleContext,
  });
  
  const { text: translatedDescription } = useTranslation(description, {
    context: descriptionContext,
    targetLang: language,
    enabled: !!descriptionContext,
  });
  
  const { text: translatedConfirmText } = useTranslation(confirmText, {
    context: confirmContext,
    targetLang: language,
    enabled: !!confirmContext,
  });
  
  const { text: translatedCancelText } = useTranslation(cancelText, {
    context: cancelContext,
    targetLang: language,
    enabled: !!cancelContext,
  });
  
  const { text: confirmingText } = useTranslation('Confirming...', {
    context: 'status.confirming',
    targetLang: language,
    enabled: true,
  });

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const finalTitle = titleContext ? translatedTitle : title;
  const finalDescription = descriptionContext ? translatedDescription : description;
  const finalConfirmText = confirmContext ? translatedConfirmText : confirmText;
  const finalCancelText = cancelContext ? translatedCancelText : cancelText;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      onCancel={onClose}
      title={finalTitle}
      titleContext={titleContext}
      description={finalDescription}
      descriptionContext={descriptionContext}
      confirmText={finalConfirmText}
      confirmContext={confirmContext}
      cancelText={finalCancelText}
      cancelContext={cancelContext}
      variant={variant === 'destructive' ? 'destructive' : 'confirmation'}
      isLoading={isLoading}
      loadingText={confirmingText}
      className={className}
    >
      {/* BaseModal handles all content */}
    </BaseModal>
  );
}
