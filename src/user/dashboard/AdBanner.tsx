import React, { useEffect, useState } from 'react';

export const AdBanner = ({ className = "", theme = "light", containerClassName = "", innerClassName = "", isPremium = false }: { className?: string, theme?: string, containerClassName?: string, innerClassName?: string, isPremium?: boolean }) => {
  const [activeAds, setActiveAds] = useState<any[]>([]);

  useEffect(() => {
    // Sync ads from localStorage (mock database)
    const ads = JSON.parse(localStorage.getItem('active_ads') || '[]');
    setActiveAds(ads);

    const handleStorageChange = () => {
      const ads = JSON.parse(localStorage.getItem('active_ads') || '[]');
      setActiveAds(ads);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if there's any active "Election" ad
  const hasElectionAd = activeAds.some(ad => ad.type === 'Election');
  const currentAd = hasElectionAd ? activeAds.find(ad => ad.type === 'Election') : activeAds[0];

  // Logic: Premium members don't see ads EXCEPT Bar Election ads
  if (isPremium && !hasElectionAd) return null;

  return (
    <div className={`w-full ${containerClassName || (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')} border rounded-2xl flex flex-col items-center justify-center p-4 text-slate-400 text-sm font-medium ${className}`}>
      <span className="text-[10px] uppercase tracking-widest mb-2 opacity-60 font-black text-indigo-600">
        {hasElectionAd ? 'নির্বাচনী বিশেষ প্রচার' : 'Advertisement'}
      </span>
      <div className={`w-full max-w-3xl min-h-[96px] py-4 rounded-xl flex items-center justify-center border border-dashed border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10`}>
        {currentAd ? (
          <div className="text-center px-4">
            <p className="text-indigo-950 dark:text-white font-black text-lg tracking-tight">Active Ad Campaign</p>
            <p className="text-slate-500 text-xs font-bold uppercase">{currentAd.type} - {currentAd.location}</p>
          </div>
        ) : (
          <span className="opacity-50">Ad Space (728x90)</span>
        )}
      </div>
      {hasElectionAd && (
        <span className="mt-2 text-[9px] text-amber-600 font-black uppercase tracking-tighter">Visible to All Members (Paid/Free)</span>
      )}
    </div>
  );
};
