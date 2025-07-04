import React, { useEffect, useState } from 'react';
import { Button } from './button';

interface RefreshAllYouTubeButtonProps {
  userId: string;
  refreshing: boolean;
  onRefresh: (userId: string) => void;
  className?: string;
  cooldownHours?: number; // default 4
}

const COOLDOWN_KEY = 'youtubeRefreshAllLastTime';

function getCooldownRemaining(cooldownHours: number): number {
  const last = localStorage.getItem(COOLDOWN_KEY);
  if (!last) return 0;
  const lastTime = parseInt(last, 10);
  const now = Date.now();
  const msCooldown = cooldownHours * 60 * 60 * 1000;
  const msRemaining = lastTime + msCooldown - now;
  return msRemaining > 0 ? msRemaining : 0;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export const RefreshAllYouTubeButton: React.FC<RefreshAllYouTubeButtonProps> = ({
  userId,
  refreshing,
  onRefresh,
  className = '',
  cooldownHours = 4,
}) => {
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    // On mount, check cooldown
    setCooldownMs(getCooldownRemaining(cooldownHours));
    // Poll every 30s if on cooldown
    let interval: NodeJS.Timeout | undefined;
    if (getCooldownRemaining(cooldownHours) > 0) {
      interval = setInterval(() => {
        setCooldownMs(getCooldownRemaining(cooldownHours));
      }, 30000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [cooldownHours]);

  // When refresh starts, set cooldown
  useEffect(() => {
    if (refreshing) {
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setCooldownMs(getCooldownRemaining(cooldownHours));
    }
  }, [refreshing, cooldownHours]);

  const handleClick = () => {
    onRefresh(userId);
    // localStorage and cooldown will be set by effect above
  };

  const isDisabled = refreshing || cooldownMs > 0;
  const nextAvailable = cooldownMs > 0 ? `Available in ${formatTime(cooldownMs)}` : undefined;

  return (
    <div className="relative flex flex-col items-start">
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={`bg-gradient-to-r from-red-500 to-yellow-500 text-white font-semibold px-4 py-2 rounded-lg shadow hover:from-red-600 hover:to-yellow-600 transition ${className}`}
      >
        {refreshing ? 'Refreshing...' : 'Refresh All YouTube'}
      </Button>
      {isDisabled && !refreshing && (
        <span className="text-xs text-gray-500 mt-1">{nextAvailable}</span>
      )}
    </div>
  );
}; 