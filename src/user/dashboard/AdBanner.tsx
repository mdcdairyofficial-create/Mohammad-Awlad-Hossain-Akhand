import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { GoogleAdSense } from '../../components/GoogleAdSense';
import { ExternalLink, Sparkles, Megaphone, ShieldCheck } from 'lucide-react';

interface AdBannerProps {
  className?: string;
  theme?: string;
  containerClassName?: string;
  innerClassName?: string;
  isPremium?: boolean;
  adSlot?: string;
  showGoogleAdSenseFallback?: boolean;
}

export const AdBanner = ({ 
  className = "", 
  theme = "light", 
  containerClassName = "", 
  innerClassName = "", 
  isPremium = false, 
  adSlot = "general",
  showGoogleAdSenseFallback = true 
}: AdBannerProps) => {
  const [localAds, setLocalAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Premium members don't see general ads unless it's a Bar Election ad
    if (isPremium && adSlot !== 'election') {
      setLoading(false);
      return;
    }

    const fetchLocalCampaigns = async () => {
      try {
        const q = query(
          collection(db, 'campaigns'),
          where('status', '==', 'active'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const loaded: any[] = [];
        snapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setLocalAds(loaded);
      } catch (err) {
        console.warn("Local campaign fetch error, defaulting to Google AdSense:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocalCampaigns();
  }, [adSlot, isPremium]);

  useEffect(() => {
    if (localAds.length <= 1) return;

    // Rotate local ads every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % localAds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [localAds]);

  const activeLocalAd = localAds.length > 0 ? localAds[currentIndex] : null;
  const isElectionAd = activeLocalAd?.type === 'Election';

  // If user is premium and there's no election ad, don't show
  if (isPremium && !isElectionAd) return null;

  if (loading) {
    return (
      <div className={`w-full ${containerClassName} min-h-[90px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center`}>
        <span className="text-slate-400 text-xs font-bold">বিজ্ঞাপন লোড হচ্ছে...</span>
      </div>
    );
  }

  // 1. If NO local ad is active, render Google AdSense directly
  if (!activeLocalAd) {
    if (!showGoogleAdSenseFallback) return null;
    return (
      <div className={`w-full ${containerClassName || (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')} border rounded-2xl p-3 shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 ${className}`}>
        <div className="flex items-center justify-between mb-1.5 px-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-500" />
            গুগল অ্যাডসেন্স পার্টনার নেটওয়ার্ক (Google AdSense)
          </span>
          <span className="text-[9px] font-bold text-slate-400">লোকাল বিজ্ঞাপন খালি থাকায় গুগল অ্যাড চালু</span>
        </div>
        <GoogleAdSense className="border-0 shadow-none p-0 bg-transparent" />
      </div>
    );
  }

  // 2. If a local ad IS active, display it prominently with link & details
  const adLink = activeLocalAd.fbLink || activeLocalAd.ytLink || activeLocalAd.otherLink || '#';

  return (
    <div className={`w-full ${containerClassName || (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')} border-2 border-indigo-500/20 rounded-2xl p-3 shadow-md sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600 flex items-center gap-1.5">
          {isElectionAd ? (
            <>
              <Megaphone size={14} className="text-amber-500 animate-bounce" />
              <span className="text-amber-600">বার নির্বাচন বিশেষ প্রচার (Bar Election)</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>লোকাল স্পনসর বিজ্ঞাপন (Local Sponsor Ad)</span>
            </>
          )}
        </span>
        <span className="text-[9px] font-bold text-slate-400">
          MDC Casebook Ad Network + Google AdSense
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeLocalAd.adMediaUrl ? (
            <img 
              src={activeLocalAd.adMediaUrl} 
              alt={activeLocalAd.adTitle} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 shadow-sm border border-white"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-xs text-center p-1 shadow-sm">
              {activeLocalAd.type || 'AD'}
            </div>
          )}

          <div className="text-left flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-black text-indigo-950 dark:text-white truncate">
              {activeLocalAd.adTitle || 'সক্রিয় লোকাল বিজ্ঞাপন'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
              {activeLocalAd.adDescription || `${activeLocalAd.location || 'বাংলাদেশ'} ভিত্তিক আইনি সেবা`}
            </p>
            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 inline-block">
              {activeLocalAd.location} {activeLocalAd.subLocation ? `• ${activeLocalAd.subLocation}` : ''}
            </span>
          </div>
        </div>

        {adLink !== '#' && (
          <a
            href={adLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>বিস্তারিত দেখুন</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {localAds.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {localAds.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-300'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default AdBanner;

