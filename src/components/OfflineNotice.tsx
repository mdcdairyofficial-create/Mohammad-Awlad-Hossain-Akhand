import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, X } from 'lucide-react';

export const OfflineNotice = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
      setHasNotified(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowNotification(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 20, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
        >
          <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 flex items-center justify-between gap-4 ${
            isOnline ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-none">
                  {isOnline ? 'ইন্টারনেট ফিরে এসেছে' : 'আপনি অফলাইনে আছেন'}
                </h4>
                <p className="text-[10px] font-bold opacity-80 mt-1">
                  {isOnline 
                    ? 'এখন আপনি সব তথ্য আপডেট করতে পারবেন।' 
                    : 'আগের সেভ করা তথ্যগুলো দেখতে পারবেন।'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
