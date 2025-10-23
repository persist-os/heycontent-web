import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { Button } from './button';
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
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{finalTitle}</AlertDialogTitle>
          <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isLoading}>
              {finalCancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isLoading}
              className={variant === 'destructive' ? 'bg-destructive text-white hover:bg-destructive/90 dark:text-white' : ''}
            >
              {isLoading ? confirmingText : finalConfirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
