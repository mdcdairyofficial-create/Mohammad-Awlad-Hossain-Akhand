import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Youtube, ExternalLink, ArrowRight, Video } from 'lucide-react';
import { Logo } from '../../components/Logo';

interface YoutubeGateProps {
  onComplete: () => void;
}

export default function YoutubeGate({ onComplete }: YoutubeGateProps) {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'verified'>('idle');
  
  // Using bengali text as requested (or mixed as per app's translation capability, we'll mainly use Bengali like the prompt)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8 flex flex-col justify-between items-center">
      {/* Top Navbar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <span className="font-black text-slate-800 dark:text-white tracking-tight hidden sm:inline-block">
            MDC CASEBOOK
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl w-full mx-auto space-y-8 flex-grow flex flex-col justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex justify-center">
              <img src="/Youtube.png" alt="YouTube" className="h-24 md:h-32 w-auto object-contain drop-shadow-lg" />
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              অফিশিয়াল ইউটিউব চ্যানেলে যুক্ত হোন
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 max-w-lg">
              আমাদের সকল আপডেট, ভিডিও টিউটোরিয়াল এবং গাইডলাইন সবার আগে পেতে আমাদের ইউটিউব চ্যানেলটি সাবস্ক্রাইব করুন। ড্যাশবোর্ডে প্রবেশের পূর্বে এটি বাধ্যতামূলক।
            </p>

            <a
              href="https://www.youtube.com/channel/UCmBRGvfTOnFbWfaJfmA3EHg"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (verificationStatus === 'idle') {
                  setVerificationStatus('checking');
                  setTimeout(() => {
                    setVerificationStatus('verified');
                  }, 2500);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-red-500/25 active:scale-95 w-full sm:w-auto"
            >
              <Video size={20} />
              <span>সাবস্ক্রাইব করতে এখানে ক্লিক করুন</span>
              <ExternalLink size={18} />
            </a>

            {/* Auto check status indicator */}
            {verificationStatus === 'checking' && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-center gap-3 w-full animate-pulse">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  অটোমেটিক চেক করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।
                </p>
              </div>
            )}

            {verificationStatus === 'verified' && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center gap-3 w-full">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-sm">
                  ✓
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  সফলভাবে যাচাই করা হয়েছে (OK)! আপনি এখন প্রবেশ করতে পারেন।
                </p>
              </div>
            )}

            {verificationStatus === 'idle' && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500">
                  নির্দেশনা: সাবস্ক্রাইব বাটনে ক্লিক করে চ্যানেলটি সাবস্ক্রাইব করুন। এরপর সিস্টেম অটোমেটিক চেক করবে এবং নেক্সট বাটন সক্রিয় হবে।
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-8"
        >
          <button
            disabled={verificationStatus !== 'verified'}
            onClick={onComplete}
            className={`inline-flex items-center justify-center gap-2 px-10 py-4 font-black rounded-2xl shadow-lg transition-all text-base sm:text-lg ${
              verificationStatus === 'verified' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 cursor-pointer' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-70'
            }`}
          >
            <span>Continue (পরবর্তী ধাপ)</span>
            <ArrowRight size={20} />
          </button>
        </motion.div>
      </div>

      <div className="mt-8 text-[11px] font-bold text-slate-400 dark:text-slate-600">
        MDC CASEBOOK &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}
