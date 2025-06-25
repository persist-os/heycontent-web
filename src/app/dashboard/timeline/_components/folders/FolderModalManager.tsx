'use client';

import React, { useState } from 'react';
import { FolderType, FolderData } from './types';
import { ChatFolderModal } from './ChatFolderModal';
import { SmartNotesFolderModal } from './SmartNotesFolderModal';
import { ContentFolderModal } from './ContentFolderModal';
import { AnalyticsFolderModal } from './AnalyticsFolderModal';

interface FolderModalManagerProps {
  children: (openModal: (folderData: FolderData) => void) => React.ReactNode;
}

export const FolderModalManager: React.FC<FolderModalManagerProps> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<{
    type: FolderType | null;
    data: FolderData | null;
  }>({ type: null, data: null });

  const openModal = (folderData: FolderData) => {
    setCurrentModal({ type: folderData.color, data: folderData });
  };

  const closeModal = () => {
    setCurrentModal({ type: null, data: null });
  };

  const isOpen = currentModal.type !== null && currentModal.data !== null;

  return (
    <>
      {children(openModal)}
      
      {currentModal.data && (
        <>
          <ChatFolderModal
            isOpen={isOpen && currentModal.type === 'blue'}
            onClose={closeModal}
            folderData={currentModal.data}
          />
          
          <SmartNotesFolderModal
            isOpen={isOpen && currentModal.type === 'purple'}
            onClose={closeModal}
            folderData={currentModal.data}
          />
          
          <ContentFolderModal
            isOpen={isOpen && currentModal.type === 'orange'}
            onClose={closeModal}
            folderData={currentModal.data}
          />
          
          <AnalyticsFolderModal
            isOpen={isOpen && currentModal.type === 'yellow'}
            onClose={closeModal}
            folderData={currentModal.data}
          />
        </>
      )}
    </>
  );
}; 