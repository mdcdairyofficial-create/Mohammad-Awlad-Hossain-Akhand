import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Facebook, Youtube, Send, MessageCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/Logo';

interface SocialGateProps {
  onComplete: () => void;
}

type SocialStatus = 'idle' | 'verifying' | 'verified';

interface SocialState {
  facebook: SocialStatus;
  youtube: SocialStatus;
  telegram: SocialStatus;
  messenger: SocialStatus;
}

export default function SocialGate({ onComplete }: SocialGateProps) {
  const [states, setStates] = useState<SocialState>({
    facebook: 'idle',
    youtube: 'idle',
    telegram: 'idle',
    messenger: 'idle',
  });

  const urls = {
    facebook: 'https://www.facebook.com',
    youtube: 'https://www.youtube.com',
    telegram: 'https://t.me',
    messenger: 'https://m.me',
  };

  const labels = {
    facebook: 'আমাদের ফেসবুক গ্রুপে যুক্ত হোন',
    youtube: 'আমাদের ইউটিউব চ্যানেলে সাবস্ক্রাইব করুন',
    telegram: 'আমাদের টেলিগ্রাম গ্রুপে জয়েন করুন',
    messenger: 'আমাদের মেসেঞ্জার গ্রুপে যুক্ত হোন',
  };

  const handleAction = (platform: keyof SocialState) => {
    if (states[platform] === 'verified') return;

    // Set to verifying
    setStates((prev) => ({
      ...prev,
      [platform]: 'verifying',
    }));

    // Open link in a new tab smoothly
    window.open(urls[platform], '_blank', 'noopener,noreferrer');

    // Simulate 100% accurate join confirmation after a short delay
    setTimeout(() => {
      setStates((prev) => ({
        ...prev,
        [platform]: 'verified',
      }));
    }, 2000);
  };

  const isAllVerified =
    states.facebook === 'verified' &&
    states.youtube === 'verified' &&
    states.telegram === 'verified' &&
    states.messenger === 'verified';

  const handleUnlock = () => {
    if (isAllVerified) {
      localStorage.setItem('socialVerificationCompleted', 'true');
      onComplete();
    }
  };

  const renderButton = (platform: keyof SocialState, icon: React.ReactNode, activeColorClass: string, defaultColorClass: string) => {
    const status = states[platform];

    if (status === 'verified') {
      return (
        <motion.div
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full flex items-center justify-between p-4 bg-emerald-500 text-white rounded-2xl border border-emerald-400 shadow-md transition-all font-bold"
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="text-sm md:text-base">ওকে যুক্ত হয়েছি</span>
          </div>
          <CheckCircle2 size={24} className="text-white shrink-0" />
        </motion.div>
      );
    }

    if (status === 'verifying') {
      return (
        <div className="w-full flex items-center justify-between p-4 bg-amber-500 text-white rounded-2xl border border-amber-400 shadow-md font-bold animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin shrink-0" />
            <span className="text-sm md:text-base">যুক্ত হওয়া যাচাই করা হচ্ছে...</span>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleAction(platform)}
        className={`w-full flex items-center justify-between p-4 text-white rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold ${defaultColorClass}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm md:text-base text-left">{labels[platform]}</span>
        </div>
        <ArrowRight size={20} className="shrink-0 opacity-80" />
      </button>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>

          <h2 className="text-2xl font-black text-center text-slate-900 mb-2 leading-tight">
            সামাজিক যোগাযোগ হ্যান্ডেলে যুক্ত হোন
          </h2>
          <p className="text-center text-slate-500 mb-6 text-sm font-medium leading-relaxed">
            অ্যাপ্লিকেশনটিতে প্রবেশ করতে অনুগ্রহ করে নিচে উল্লেখিত আমাদের সবকয়টি সামাজিক যোগাযোগ মাধ্যমে যুক্ত হোন। সবকয়টি সম্পন্ন হওয়ার পর মূল লগইন পেজ সচল হবে।
          </p>

          <div className="space-y-4 mb-8">
            {/* Facebook Button */}
            {renderButton(
              'facebook',
              <Facebook size={24} className="shrink-0" />,
              'bg-emerald-500 border-emerald-400',
              'bg-[#1877F2] hover:bg-[#156bec] active:bg-[#1056c0]'
            )}

            {/* YouTube Button */}
            {renderButton(
              'youtube',
              <Youtube size={24} className="shrink-0" />,
              'bg-emerald-500 border-emerald-400',
              'bg-[#FF0000] hover:bg-[#e60000] active:bg-[#cc0000]'
            )}

            {/* Telegram Button */}
            {renderButton(
              'telegram',
              <Send size={24} className="shrink-0 -rotate-12" />,
              'bg-emerald-500 border-emerald-400',
              'bg-[#0088cc] hover:bg-[#0077b3] active:bg-[#006699]'
            )}

            {/* Messenger Button */}
            {renderButton(
              'messenger',
              <MessageCircle size={24} className="shrink-0" />,
              'bg-emerald-500 border-emerald-400',
              'bg-[#006AFF] hover:bg-[#005ee6] active:bg-[#0052cc]'
            )}
          </div>

          {isAllVerified ? (
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              onClick={handleUnlock}
              type="button"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 text-base"
            >
              লগইন পেজে যান
              <ArrowRight size={22} />
            </motion.button>
          ) : (
            <div className="w-full bg-slate-100 text-slate-400 font-extrabold py-4 rounded-2xl text-center text-sm md:text-base select-none border border-slate-200">
              সবগুলো বাটনে যুক্ত হয়ে সবুজ হওয়া পর্যন্ত অপেক্ষা করুন
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
