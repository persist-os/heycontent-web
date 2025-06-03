import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key } from 'lucide-react';

interface PlaygroundPasswordModalProps {
  open: boolean;
  onUnlock: () => void;
  onClose?: () => void;
}

const PASSWORD = 'heycontentletsplay';
const STORAGE_KEY = 'playgroundUnlocked';

export function isPlaygroundUnlocked() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setPlaygroundUnlocked() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, 'true');
}

export const PlaygroundPasswordModal: React.FC<PlaygroundPasswordModalProps> = ({ open, onUnlock, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      setPlaygroundUnlocked();
      setPassword('');
      setError('');
      onUnlock();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" /> Playground Access
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2">
          <input
            type="password"
            className="w-full border rounded px-3 py-2 mb-2 text-sm"
            placeholder="Enter password..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className="text-xs text-red-500 mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full bg-purple-600 text-white rounded py-2 text-sm hover:bg-purple-700 transition"
          >
            Unlock
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 