'use client';

import React, { useState } from 'react';
import { FolderType, FolderData } from './types';
import { ChatFolderModal } from './ChatFolderModal';
import { SmartNotesFolderModal } from './SmartNotesFolderModal';
import { ContentFolderModal } from './ContentFolderModal';
import { AnalyticsFolderModal } from './AnalyticsFolderModal';
import { useRouter } from 'next/navigation';

interface FolderModalManagerProps {
  children: (openModal: (folderData: FolderData) => void) => React.ReactNode;
}

export const FolderModalManager: React.FC<FolderModalManagerProps> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<{
    type: FolderType | null;
    data: FolderData | null;
  }>({ type: null, data: null });

  const router = useRouter();

  const openModal = (folderData: FolderData) => {
    setCurrentModal({ type: folderData.color, data: folderData });
  };

  const closeModal = () => {
    setCurrentModal({ type: null, data: null });
  };

  const isOpen = currentModal.type !== null && currentModal.data !== null;

  // Handler for note navigation from SmartNotesFolderModal
  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/notes?noteId=${noteId}`);
    closeModal();
  };

  // Handler for chat navigation from ChatFolderModal
  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/chat?id=${chatId}`);
    closeModal();
  };

  // Handler for content navigation from ContentFolderModal
  const handleContentClick = (contentId: string, item?: any) => {
    router.push(`/dashboard/chat?contentId=${contentId}`);
    closeModal();
  };

  // Handler for analytics navigation from AnalyticsFolderModal
  const handleAnalyticsClick = (analyticsId: string, item?: any) => {
    // Navigate to chat with analytics context
    router.push(`/dashboard/chat?analyticsId=${analyticsId}`);
    closeModal();
  };

  return (
    <>
      {children(openModal)}
      
      {currentModal.data && (
        <>
          <ChatFolderModal
            isOpen={isOpen && currentModal.type === 'blue'}
            onClose={closeModal}
            folderData={currentModal.data}
            onChatClick={handleChatClick}
          />
          
          <SmartNotesFolderModal
            isOpen={isOpen && currentModal.type === 'purple'}
            onClose={closeModal}
            folderData={currentModal.data}
            onNoteClick={handleNoteClick}
          />
          
          <ContentFolderModal
            isOpen={isOpen && currentModal.type === 'orange'}
            onClose={closeModal}
            folderData={currentModal.data}
            onContentClick={handleContentClick}
          />
          
          <AnalyticsFolderModal
            isOpen={isOpen && currentModal.type === 'yellow'}
            onClose={closeModal}
            folderData={currentModal.data}
            onAnalyticsClick={handleAnalyticsClick}
          />
        </>
      )}
    </>
  );
}; 