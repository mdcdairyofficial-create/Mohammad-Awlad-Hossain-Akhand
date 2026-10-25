import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, HardDriveUpload, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineSyncBannerProps {
  language?: 'bn' | 'en' | 'hi' | 'ur';
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ language = 'bn' }) => {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [prevPending, setPrevPending] = useState(pendingCount);

  useEffect(() => {
    if (prevPending > 0 && pendingCount === 0 && isOnline) {
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
    setPrevPending(pendingCount);
  }, [pendingCount, isOnline, prevPending]);

  if (isOnline && pendingCount === 0 && !showSyncSuccess && !isSyncing) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Offline Mode Alert */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold sticky top-0 z-[9990] border-b border-amber-500/40"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-800/60 rounded-lg shrink-0">
              <WifiOff size={16} className="text-amber-200 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold flex items-center gap-1.5 text-white">
                <span>{language === 'bn' ? '⚡ অফলাইন মোড চালু (ডিভাইস ক্যাশিং সক্রিয়)' : '⚡ Offline Mode Active (Device Cache Enabled)'}</span>
                {pendingCount > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-black border border-white/30">
                    {language === 'bn' ? `${pendingCount}টি পরিবর্তন সেভ করা হয়েছে` : `${pendingCount} changes saved locally`}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-amber-100 font-medium">
                {language === 'bn' 
                  ? 'ইন্টারনেট না থাকলেও মামলার তথ্য আপডেট করা যাবে। অনলাইনে এলেই স্বয়ংক্রিয়ভাবে আইনজীবী, মুহুরী ও ক্লায়েন্টের ড্যাশবোর্ডে সিংক হয়ে যাবে।' 
                  : 'You can update case details offline. Data will automatically sync to all dashboards when internet is connected.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-wider bg-black/20 px-2 py-1 rounded-md font-bold text-amber-200 border border-amber-400/30">
              {language === 'bn' ? '💾 ডিভাইসে সংরক্ষিত' : '💾 Saved on device'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Online & Syncing in Progress */}
      {isOnline && isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-indigo-600 text-white px-4 py-2 shadow-md flex items-center justify-between gap-3 text-xs font-semibold sticky top-0 z-[9990]"
        >
          <div className="flex items-center gap-2">
            <RefreshCw size={15} className="animate-spin text-indigo-200" />
            <span>
              {language === 'bn' 
                ? '🔄 অনলাইনে কানেক্ট করা হয়েছে — ডিভাইসে সেভ করা মামলা তথ্য ড্যাশবোর্ডে সিংক হচ্ছে...' 
                : '🔄 Online reconnected — Syncing device case data to server...'}
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="bg-indigo-800 text-indigo-100 text-[11px] px-2 py-0.5 rounded font-bold">
              {pendingCount} remaining
            </span>
          )}
        </motion.div>
      )}

      {/* Online & Pending Changes Ready to Sync */}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-700 text-white px-4 py-2 shadow-md flex items-center justify-between gap-3 text-xs font-semibold sticky top-0 z-[9990]"
        >
          <div className="flex items-center gap-2">
            <HardDriveUpload size={16} className="text-emerald-200" />
            <span>
              {language === 'bn'
                ? `অনলাইনে এসেন! অফলাইনে সেভ করা ${pendingCount}টি মামলার তথ্য সিংক করার জন্য প্রস্তুত।`
                : `You are online! ${pendingCount} offline case updates ready to sync.`}
            </span>
          </div>
          <button
            onClick={syncNow}
            className="px-3 py-1 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <RefreshCw size={13} />
            <span>{language === 'bn' ? 'এখনই সিংক করুন' : 'Sync Now'}</span>
          </button>
        </motion.div>
      )}

      {/* Sync Completed Toast Notice */}
      {showSyncSuccess && !isSyncing && pendingCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-teal-700 text-white px-4 py-2 shadow-md flex items-center justify-between gap-3 text-xs font-semibold sticky top-0 z-[9990]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-200" />
            <span>
              {language === 'bn'
                ? '✅ অফলাইনের সমস্ত মামলার তথ্য সফলভাবে ড্যাশবোর্ডে সিংক ও আপডেট করা হয়েছে!'
                : '✅ All offline case updates synced successfully to dashboard!'}
            </span>
          </div>
          <button
            onClick={() => setShowSyncSuccess(false)}
            className="text-teal-200 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
