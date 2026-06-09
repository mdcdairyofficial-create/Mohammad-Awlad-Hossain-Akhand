import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Facebook, Youtube, Send, MessageCircle, ExternalLink, Shield, Award, Users, Globe, ArrowRight } from 'lucide-react';
import { Logo } from '../../components/Logo';

interface SocialGateProps {
  onComplete: () => void;
}

export default function SocialGate({ onComplete }: SocialGateProps) {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  const socialChannels = [
    {
      id: 'facebook',
      name: lang === 'bn' ? 'ফেসবুক গ্রুপ' : 'Facebook Page/Group',
      description: lang === 'bn' 
        ? 'আমাদের সমৃদ্ধ আইন ও আইনি পেশাজীবীদের কমিউনিটিতে যুক্ত হোন এবং সবার সাথে মতবিনিময় করুন।' 
        : 'Join our thriving legal community to connect, share insights, and network with professionals.',
      url: 'https://www.facebook.com',
      color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25',
      iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      icon: <Facebook size={28} className="shrink-0" />,
      tag: lang === 'bn' ? 'অফিশিয়াল গ্রুপ' : 'Official Group'
    },
    {
      id: 'youtube',
      name: lang === 'bn' ? 'ইউটিউব চ্যানেল' : 'YouTube Channel',
      description: lang === 'bn' 
        ? 'আইনি খসড়া লিখন, মামলা ট্র্যাকিং পদ্ধতি ও টিউটোরিয়াল ভিডিওগুলো দেখে সহজে কাজ শিখুন।' 
        : 'Watch premium tutorials on legal drafting, case tracking systems, and product guides.',
      url: 'https://www.youtube.com',
      color: 'bg-red-600 hover:bg-red-700 shadow-red-500/25',
      iconClass: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
      icon: <Youtube size={28} className="shrink-0" />,
      tag: lang === 'bn' ? 'টিউটোরিয়াল ও আপডেট' : 'Tutorials & Updates'
    },
    {
      id: 'telegram',
      name: lang === 'bn' ? 'টেলিগ্রাম চ্যানেল' : 'Telegram Channel',
      description: lang === 'bn' 
        ? 'লাইভ নোটিফিকেশন, সাপ্তাহিক লটারি এবং রিচার্জ সম্পর্কিত সকল জরুরী নোটিশ সবার আগে পান।' 
        : 'Get instant live announcements, lottery updates, and platform notices directly to your phone.',
      url: 'https://t.me',
      color: 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/25',
      iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
      icon: <Send size={28} className="shrink-0 -rotate-12" />,
      tag: lang === 'bn' ? 'লাইভ ঘোষণা' : 'Instant Broadcast'
    },
    {
      id: 'messenger',
      name: lang === 'bn' ? 'মেসেঞ্জার গ্রুপ' : 'Messenger Group',
      description: lang === 'bn' 
        ? 'সহকর্মী আইনজীবীদের সাথে গুরুত্বপূর্ণ মামলার খবরাখবর এবং সার্বক্ষণিক আলোচনা করুন।' 
        : 'Participate in active circles, consult on complicated legal drafts, and discuss in real-time.',
      url: 'https://m.me',
      color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25',
      iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
      icon: <MessageCircle size={28} className="shrink-0" />,
      tag: lang === 'bn' ? '২৪/৭ সাপোর্ট ও চ্যাট' : '24/7 Community Chat'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8 flex flex-col justify-between">
      {/* Top Navbar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <span className="font-black text-slate-800 dark:text-white tracking-tight hidden sm:inline-block">
            MDC DIARY
          </span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <Globe size={14} className="text-indigo-500" />
          <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl w-full mx-auto space-y-8 flex-grow flex flex-col justify-center">
        {/* Header Hero Card */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[32px] text-white p-6 md:p-10 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase tracking-widest mb-4">
              <Users size={12} />
              {lang === 'bn' ? 'সোশ্যাল মিডিয়া হাবে আপনাকে স্বাগতম' : 'WELCOME TO OUR SOCIAL HUB'}
            </div>

            <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mb-3 leading-tight">
              {lang === 'bn' 
                ? 'আমাদের সামাজিক যোগাযোগ হ্যান্ডেল ও অফিশিয়াল কমিউনিটি' 
                : 'Our Social Media Handles & Official Community'}
            </h2>
            <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed mb-5">
              {lang === 'bn'
                ? 'অনলাইন সিস্টেমে প্রবেশের পূর্বে আমাদের আপডেট, মামলা ট্র্যাকিং সহায়তা এবং লটারি সংক্রান্ত তথ্য জানতে নিচের সামাজিক যোগাযোগ প্ল্যাটফর্মগুলোতে যুক্ত হোন।'
                : 'Before accessing the system, please join our official social communities to stay updated on case tracking, announcements, and weekly lotteries.'}
            </p>

            <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.25 rounded-full border border-slate-700/50">
                <Shield size={12} className="text-indigo-400" />
                {lang === 'bn' ? '১০০% ভেরিফাইড লিংক' : '100% Verified'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.25 rounded-full border border-slate-700/50">
                <Award size={12} className="text-emerald-400" />
                {lang === 'bn' ? 'লাইভ মেম্বার এক্সেস' : 'Instant Peer Access'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Grid of Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {socialChannels.map((channel, idx) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              className="group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-2.5xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all h-full"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${channel.iconClass} transition-transform group-hover:scale-105 duration-300`}>
                    {channel.icon}
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full border border-slate-100 dark:border-slate-750">
                    {channel.tag}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5 group-hover:text-indigo-600 transition-colors">
                  {channel.name}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {channel.description}
                </p>
              </div>

              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 ${channel.color} text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95`}
              >
                <span>{lang === 'bn' ? 'প্রবেশ করুন' : 'Visit Channel'}</span>
                <ExternalLink size={14} />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Proceed Action Banner */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between p-6 bg-indigo-50/65 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30 gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-extrabold text-slate-900 dark:text-white leading-snug">
              {lang === 'bn' ? 'ইতিমধ্যেই চেক করেছেন?' : 'All set with our social pages?'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn' 
                ? 'সামাজিক হ্যান্ডেলগুলো ঘুরে দেখা সম্পন্ন হলে নিচে বাটনে ক্লিক করে লগইন করুন।' 
                : 'Click below to move to the login page and access your active diary account.'}
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-400/20 hover:scale-[1.02] active:scale-98 transition-all text-sm md:text-base cursor-pointer"
          >
            <span>{lang === 'bn' ? 'লগইন পেজে যান' : 'Go to Login Page'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Modern Footer Credits */}
      <div className="max-w-6xl w-full mx-auto text-center mt-8 text-[11px] font-bold text-slate-400 dark:text-slate-600">
        MDC DIARY &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}
