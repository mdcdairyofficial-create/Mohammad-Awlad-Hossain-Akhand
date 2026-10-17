import React, { useEffect, useState } from 'react';
import { DollarSign, Settings, CheckCircle2 } from 'lucide-react';

interface GoogleAdSenseProps {
  adSlot?: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  adSlot = '1234567890',
  adFormat = 'auto',
  className = ''
}) => {
  const [publisherId, setPublisherId] = useState<string>('ca-pub-XXXXXXXXXXXXXXXX');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputPubId, setInputPubId] = useState<string>('');
  const [inputSlotId, setInputSlotId] = useState<string>('');
  const [currentSlot, setCurrentSlot] = useState<string>(adSlot);

  useEffect(() => {
    try {
      const savedPubId = localStorage.getItem('adsense_pub_id');
      const savedSlotId = localStorage.getItem('adsense_slot_id');
      if (savedPubId) {
        setPublisherId(savedPubId);
        setIsConfigured(true);
      }
      if (savedSlotId) {
        setCurrentSlot(savedSlotId);
      }
    } catch (e) {}
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPubId.trim()) {
      try {
        localStorage.setItem('adsense_pub_id', inputPubId.trim());
      } catch (e) {}
      setPublisherId(inputPubId.trim());
      setIsConfigured(true);
    }
    if (inputSlotId.trim()) {
      try {
        localStorage.setItem('adsense_slot_id', inputSlotId.trim());
      } catch (e) {}
      setCurrentSlot(inputSlotId.trim());
    }
    setShowConfigModal(false);
  };

  useEffect(() => {
    try {
      // @ts-ignore
      if (window.adsbygoogle && isConfigured) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [isConfigured, currentSlot]);

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            Ad
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Google AdSense {isConfigured ? `(${publisherId})` : ''}
          </span>
        </div>
        <button
          onClick={() => {
            setInputPubId(publisherId === 'ca-pub-XXXXXXXXXXXXXXXX' ? '' : publisherId);
            setInputSlotId(currentSlot);
            setShowConfigModal(true);
          }}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all"
        >
          <Settings size={12} />
          {isConfigured ? 'Configure Ad' : 'Setup AdSense ID'}
        </button>
      </div>

      {isConfigured ? (
        <div className="w-full min-h-[100px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous"></script>
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%' }}
               data-ad-client={publisherId}
               data-ad-slot={currentSlot}
               data-ad-format={adFormat}
               data-full-width-responsive="true"></ins>
          <div className="text-center mt-2">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Google AdSense Active</p>
            <p className="text-[10px] text-slate-400">Publisher: {publisherId} | Slot: {currentSlot}</p>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setShowConfigModal(true)}
          className="w-full min-h-[100px] flex flex-col items-center justify-center bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-blue-50/50 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 p-4 cursor-pointer transition-all group"
        >
          <DollarSign className="text-indigo-500 mb-1 group-hover:scale-110 transition-transform" size={24} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">এখানে গুগল এডসেন্স বিজ্ঞাপন যুক্ত করুন</p>
          <p className="text-xs text-slate-400 mt-0.5">আপনার `ca-pub-...` আইডি দিয়ে লাইভ বিজ্ঞাপন প্রদর্শন শুরু করুন</p>
        </div>
      )}

      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Google AdSense কনফিগারেশন</h3>
            <p className="text-xs text-slate-500 mb-6">আপনার গুগল এডসেন্স পাবলিশার আইডি এবং এড স্লট আইডি এখানে সেট করুন।</p>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Publisher ID (যেমন: ca-pub-1234567890123456)</label>
                <input
                  type="text"
                  required
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={inputPubId}
                  onChange={(e) => setInputPubId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Ad Slot ID (যেমন: 9876543210)</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  value={inputSlotId}
                  onChange={(e) => setInputSlotId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-sm"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-indigo-100"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
