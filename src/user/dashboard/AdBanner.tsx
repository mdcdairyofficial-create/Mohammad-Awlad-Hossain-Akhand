import React, { useEffect, useState } from 'react';

export const AdBanner = ({ className = "", theme = "light", containerClassName = "", innerClassName = "", isPremium = false, adSlot = "general" }: { className?: string, theme?: string, containerClassName?: string, innerClassName?: string, isPremium?: boolean, adSlot?: string }) => {
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Premium members don't see ads
    if (isPremium && adSlot !== 'election') {
      setLoading(false);
      return;
    }

    const fetchAds = async () => {
      try {
        const response = await fetch(`/api/ads?slot=${encodeURIComponent(adSlot)}`);
        if (response.ok) {
          const data = await response.json();
          // Logic: Max 2 ads per space per visit
          setActiveAds(data.ads?.slice(0, 2) || []);
        }
      } catch (err) {
        console.error("Ad fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAds();
  }, [adSlot, isPremium]);

  const hasElectionAd = activeAds.some(ad => ad.type === 'Election');

  // Logic: Premium members don't see ads EXCEPT Bar Election ads
  if (isPremium && !hasElectionAd) return null;

  if (loading) {
    return <div className={`w-full ${containerClassName} min-h-[96px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center`}><span className="text-slate-400 text-xs">Loading Ad Space...</span></div>;
  }

  // Google AdSense Fallback
  if (!activeAds || activeAds.length === 0) {
     return (
        <div className={`w-full ${containerClassName || (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')} border rounded-2xl flex flex-col items-center justify-center p-4 text-slate-400 text-sm font-medium ${className}`}>
           <span className="text-[10px] uppercase tracking-widest mb-2 opacity-60 font-black text-slate-400">
             Advertisement
           </span>
           <div className={`w-full max-w-3xl min-h-[96px] py-4 rounded-xl flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 dark:bg-slate-800/50`}>
             {/* Google AdSense / AdMob Fallback Component Here */}
             <div className="text-center px-4">
                <p className="text-slate-600 dark:text-slate-300 font-black text-sm tracking-tight opacity-50">Google AdSense Space</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Fallback ad network serving</p>
             </div>
           </div>
        </div>
     );
  }

  return (
    <div className={`w-full ${containerClassName || (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')} border rounded-2xl flex flex-col items-center justify-center p-4 text-slate-400 text-sm font-medium overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase tracking-widest mb-2 opacity-60 font-black text-indigo-600">
        {hasElectionAd ? 'নির্বাচনী বিশেষ প্রচার' : 'Sponsored Content'}
      </span>
      <div className={`w-full max-w-3xl min-h-[96px] py-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-center border border-dashed border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10`}>
        {activeAds.map((ad, index) => (
          <div key={index} className="text-center px-4 py-2 flex-1 w-full relative">
             {ad.imageUrl && (
                 <div className="absolute inset-0 opacity-20 pointer-events-none rounded-lg" style={{ backgroundImage: `url(${ad.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
             )}
            <p className="text-indigo-950 dark:text-white font-black text-lg tracking-tight relative z-10">{ad.title || 'Active Ad Campaign'}</p>
            <p className="text-slate-500 text-xs font-bold uppercase relative z-10">{ad.type} - {ad.location}</p>
          </div>
        ))}
      </div>
      {hasElectionAd && (
        <span className="mt-2 text-[9px] text-amber-600 font-black uppercase tracking-tighter">Visible to All Members (Paid/Free)</span>
      )}
    </div>
  );
};
