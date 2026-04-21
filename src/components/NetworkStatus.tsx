import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
      <span className="dot" />
      {isOnline ? (
        <>
          <Wifi size={14} />
          <span>Sync Active</span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span>Offline Mode</span>
        </>
      )}
    </div>
  );
};
