import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
  language?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  language = 'bn'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // If already running standalone (installed PWA), don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      // Show guided instructions for iOS or desktop browsers where event didn't fire yet
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Variant: Header Button */}
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          title={language === 'bn' ? 'ফোনে সরাসরি অ্যাপ হিসেবে ইনস্টল করুন' : 'Install as Native App'}
        >
          <Download size={14} className="animate-bounce" />
          <span>{language === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App'}</span>
        </button>
      )}

      {/* Variant: Sidebar Item */}
      {variant === 'sidebar' && (
        <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-white space-y-2">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-emerald-400" />
            <span className="text-xs font-bold">
              {language === 'bn' ? 'মোবাইল অ্যাপ সংস্করণ' : 'Mobile App Edition'}
            </span>
          </div>
          <p className="text-[11px] text-indigo-100/80 leading-relaxed font-medium">
            {language === 'bn' 
              ? 'হোমস্ক্রিনে ইনস্টল করে নেট ছাড়াও সহজে কেসবুক ব্যবহার করুন।' 
              : 'Install on Home Screen for one-click access and fast loading.'}
          </p>
          <button
            type="button"
            onClick={handleClick}
            className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Download size={14} />
            {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
          </button>
        </div>
      )}

      {/* Variant: Floating Bottom Banner */}
      {variant === 'banner' && !isBannerDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <img src="/logo.png" alt="MDCCASEBOOK" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {language === 'bn' ? 'এমডিসি কেসবুক অ্যাপ' : 'MDCCASEBOOK App'}
              </p>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'সহজে ব্যবহারের জন্য ফোনে ইনস্টল করুন' : 'Install on phone for quick access'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              {language === 'bn' ? 'ইনস্টল' : 'Install'}
            </button>
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Instruction Modal for iOS / unsupported browsers */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'অ্যাপ ইনস্টল নির্দেশিকা' : 'How to Install App'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {language === 'bn' 
                    ? 'আইফোন বা আইপ্যাডে (Safari) খুব সহজেই অ্যাপ হিসেবে যুক্ত করুন:' 
                    : 'To install on iPhone or iPad (Safari):'}
                </p>
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl space-y-2 border border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-start gap-2">
                    <Share size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>১. সাফারি ব্রাউজারের নিচের <strong>শেয়ার (Share)</strong> বাটনে ট্যাপ করুন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <PlusSquare size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>২. অপশনগুলো থেকে <strong>'Add to Home Screen'</strong> (হোম স্ক্রিনে যোগ করুন) বেছে নিন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>৩. উপরে ডানে <strong>'Add'</strong> চাপুন। ব্যাস, আপনার ফোনে অ্যাপ যুক্ত হয়ে যাবে!</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {language === 'bn' 
                    ? 'ক্রোম (Chrome) বা অ্যান্ড্রয়েড ফোনে অ্যাপ হিসেবে ইনস্টল করার নিয়ম:' 
                    : 'To install on Chrome or Android:'}
                </p>
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl space-y-2 border border-emerald-100 dark:border-emerald-900">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">১.</span>
                    <span>ব্রাউজারের ওপরের ডানপাশের <strong>তিনটি ডট (⋮)</strong> মেনুতে ট্যাপ করুন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Download size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>২. <strong>'Install app'</strong> অথবা <strong>'Add to Home screen'</strong> বাটনে ক্লিক করুন।</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>৩. <strong>'Install'</strong> কনফার্ম করলেই এটি মোবাইলের আসল অ্যাপের মতো হোমস্ক্রিনে চলে আসবে!</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
            >
              {language === 'bn' ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
