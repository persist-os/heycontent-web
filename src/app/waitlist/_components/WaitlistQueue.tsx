import React, { useState } from 'react';

interface WaitlistQueueProps {
  position: number;
  queueId: string;
  onQueueComplete: (userName?: string) => void;
}

export const WaitlistQueue: React.FC<WaitlistQueueProps> = ({ position, queueId, onQueueComplete }) => {
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setTimeout(() => {
      onQueueComplete(name || 'Creator');
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">You're #{position} in line</h2>
      <p className="mb-6 text-gray-600">Queue ID: <span className="font-mono text-gray-800">{queueId}</span></p>
      <form onSubmit={handleJoin} className="space-y-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
          required
        />
        <button
          type="submit"
          disabled={joining}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        >
          {joining ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  );
}; 