import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare, Check, Apple, Sparkles } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
  language?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  language = 'bn'
}) => {
  const { isInstallable, isInstalled, isIOS, install, markAsInstalled } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('mdc_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setActiveGuideTab(isIOS ? 'ios' : 'android');
        setShowModal(true);
      }
    } else {
      // Show guided instructions for iOS or browsers where prompt event hasn't fired
      setActiveGuideTab(isIOS ? 'ios' : 'android');
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem('mdc_pwa_banner_dismissed', 'true');
    } catch { /* ignore */ }
  };

  const handleConfirmInstalled = () => {
    markAsInstalled();
    setShowModal(false);
  };

  return (
    <div className="relative inline-block">
      {/* Variant: Header Button */}
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 ${isInstalled ? 'bg-gradient-to-r from-teal-700 to-emerald-700' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'} text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0`}
          title={isInstalled ? (language === 'bn' ? 'অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে' : 'App is already installed') : (language === 'bn' ? 'ফোনে সরাসরি অ্যাপ হিসেবে ইনস্টল করুন' : 'Install as Native App')}
        >
          {isInstalled ? <Check size={14} className="text-emerald-300" /> : <Download size={14} className="animate-bounce" />}
          <span>{isInstalled ? (language === 'bn' ? 'ইনস্টলড' : 'Installed') : (language === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App')}</span>
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
              onClick={handleDismissBanner}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Instruction Modal rendered via Portal to body to prevent clipping/overflow by card containers */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center p-1.5 border border-indigo-100 dark:border-indigo-900 shadow-xs">
                  <img src="/logo.png" alt="MDCCASEBOOK Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {language === 'bn' ? 'অ্যাপ ইনস্টল নির্দেশিকা' : 'How to Install App'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    {language === 'bn' ? 'সহজে ফোন বা কম্পিউটারে অ্যাপটি যুক্ত করুন' : 'Add app to your phone or PC easily'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Device Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveGuideTab('android')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeGuideTab === 'android'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone size={14} />
                <span>{language === 'bn' ? 'অ্যান্ড্রয়েড / ক্রোম' : 'Android / Chrome'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('ios')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeGuideTab === 'ios'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Apple size={14} />
                <span>{language === 'bn' ? 'আইফোন / আইপ্যাড' : 'iPhone / Safari'}</span>
              </button>
            </div>

            {/* Guide Step Details */}
            {activeGuideTab === 'ios' ? (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl space-y-2.5 border border-indigo-100 dark:border-indigo-900">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                    {language === 'bn' 
                      ? 'সাফারি (Safari) ব্রাউজারে ৩টি সহজ ধাপে ইনস্টল করুন:' 
                      : 'Follow these 3 easy steps in Safari:'}
                  </p>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">১</span>
                    <span>সাফারি ব্রাউজারের নিচের <strong>শেয়ার (Share)</strong> বাটনে ট্যাপ করুন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">২</span>
                    <span>অপশনগুলো থেকে <strong>'Add to Home Screen'</strong> (হোম স্ক্রিনে যোগ করুন) বেছে নিন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">৩</span>
                    <span>উপরে ডানে <strong>'Add'</strong> চাপুন। ব্যাস, আপনার ফোনে সরাসরি অ্যাপ হিসেবে ইনস্টল হয়ে যাবে!</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl space-y-2.5 border border-emerald-100 dark:border-emerald-900">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                    {language === 'bn' 
                      ? 'গুগল ক্রোম (Chrome) বা অ্যান্ড্রয়েড ফোনে ইনস্টল করার নিয়ম:' 
                      : 'Follow these 3 steps in Google Chrome / Android:'}
                  </p>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">১</span>
                    <span>ব্রাউজারের ওপরের ডানপাশের <strong>তিনটি ডট (⋮)</strong> মেনুতে ট্যাপ করুন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">২</span>
                    <span>মেনু থেকে <strong>'Install app'</strong> বা <strong>'Add to Home screen'</strong> চাপুন।</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">৩</span>
                    <span>পপআপে <strong>'Install'</strong> কনফার্ম করলেই এটি মোবাইলের আসল অ্যাপের মতো হোমস্ক্রিনে যুক্ত হবে!</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Benefits Note */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <span>{language === 'bn' ? 'ইনস্টল করার পর ইন্টারনেট ছাড়াই অ্যাপটি দ্রুত খুলবে।' : 'Works offline and loads faster once installed.'}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmInstalled}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98]"
              >
                <Check size={16} />
                <span>{language === 'bn' ? 'ইনস্টল সম্পন্ন করেছি (বাটনটি মুছুন)' : 'Already Installed (Hide button)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98]"
              >
                {language === 'bn' ? 'পরে করব / বন্ধ করুন' : 'Later / Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

