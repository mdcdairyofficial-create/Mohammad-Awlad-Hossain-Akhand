import React from 'react';
import { motion } from 'motion/react';
import { Facebook, Youtube, Send, MessageCircle, ExternalLink, Users, Award, Shield, ArrowRight } from 'lucide-react';

interface SocialViewProps {
  language: string;
}

export default function SocialView({ language }: SocialViewProps) {
  const socialChannels = [
    {
      id: 'facebook',
      name: language === 'bn' ? 'ফেসবুক গ্রুপ' : 'Facebook Page/Group',
      description: language === 'bn' 
        ? 'আমাদের সমৃদ্ধ আইন ও আইনি পেশাজীবীদের কমিউনিটিতে যুক্ত হোন এবং সবার সাথে মতবিনিময় করুন।' 
        : 'Join our thriving legal community to connect, share insights, and network with professionals.',
      url: 'https://www.facebook.com',
      color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25',
      iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      icon: <Facebook size={32} className="shrink-0" />,
      tag: language === 'bn' ? 'অফিশিয়াল গ্রুপ' : 'Official Group'
    },
    {
      id: 'youtube',
      name: language === 'bn' ? 'ইউটিউব চ্যানেল' : 'YouTube Channel',
      description: language === 'bn' 
        ? 'আইনি খসড়া লিখন, মামলা ট্র্যাকিং পদ্ধতি ও টিউটোরিয়াল ভিডিওগুলো দেখে সহজে কাজ শিখুন।' 
        : 'Watch premium tutorials on legal drafting, case tracking systems, and product guides.',
      url: 'https://www.youtube.com',
      color: 'bg-red-600 hover:bg-red-700 shadow-red-500/25',
      iconClass: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
      icon: <Youtube size={32} className="shrink-0" />,
      tag: language === 'bn' ? 'টিউটোরিয়াল ও আপডেট' : 'Tutorials & Updates'
    },
    {
      id: 'telegram',
      name: language === 'bn' ? 'টেলিগ্রাম চ্যানেল' : 'Telegram Channel',
      description: language === 'bn' 
        ? 'লাইভ নোটিফিকেশন, সাপ্তাহিক লটারি এবং রিচার্জ সম্পর্কিত সকল জরুরী নোটিশ সবার আগে পান।' 
        : 'Get instant live announcements, lottery updates, and platform notices directly to your phone.',
      url: 'https://t.me',
      color: 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/25',
      iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
      icon: <Send size={32} className="shrink-0 -rotate-12" />,
      tag: language === 'bn' ? 'লাইভ ঘোষণা' : 'Instant Broadcast'
    },
    {
      id: 'messenger',
      name: language === 'bn' ? 'মেসেঞ্জার গ্রুপ' : 'Messenger Group',
      description: language === 'bn' 
        ? 'সহকর্মী আইনজীবীদের সাথে গুরুত্বপূর্ণ মামলার খবরাখবর এবং সার্বক্ষণিক আলোচনা করুন।' 
        : 'Participate in active circles, consult on complicated legal drafts, and discuss in real-time.',
      url: 'https://m.me',
      color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25',
      iconClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
      icon: <MessageCircle size={32} className="shrink-0" />,
      tag: language === 'bn' ? '২৪/৭ সাপোর্ট ও চ্যাট' : '24/7 Community Chat'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[32px] text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase tracking-widest mb-6">
            <Users size={14} />
            {language === 'bn' ? 'সোশ্যাল মিডিয়া হাবে আপনাকে স্বাগতম' : 'WELCOME TO SOCIAL HUB'}
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            {language === 'bn' 
              ? 'আমাদের সামাজিক যোগাযোগ হ্যান্ডেল ও অফিশিয়াল কমিউনিটি' 
              : 'Our Social Media Handles & Official Community'}
          </h2>
          <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed mb-6">
            {language === 'bn'
              ? 'এমডিসি কেসবুক পরিবারে যুক্ত থাকুন। আমাদের সকল আপডেট, আইনি সংবাদ, বিশেষ অফার এবং সহায়তা পেতে এখনই নিচের সামাজিক প্ল্যাটফর্মগুলোতে যোগ দিন।'
              : 'Stay connected with the MDC Casebook family. Join our community channels to receive updates, legal draft guides, exclusive offers, and dedicated peer support.'}
          </p>

          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Shield size={14} className="text-indigo-400" />
              {language === 'bn' ? '১০০% ভেরিফাইড লিংক' : '100% Verified Link'}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Award size={14} className="text-emerald-400" />
              {language === 'bn' ? 'এক্টিভ মেম্বার এক্সেস' : 'Active Member Access'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialChannels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all h-full"
          >
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className={`p-4 rounded-2xl ${channel.iconClass} transition-transform group-hover:scale-105 duration-300`}>
                  {channel.icon}
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-100 dark:border-slate-700/50">
                  {channel.tag}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                {channel.name}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {channel.description}
              </p>
            </div>

            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 ${channel.color} text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]`}
            >
              <span>{language === 'bn' ? 'চ্যানেলে প্রবেশ করুন' : 'Visit Channel'}</span>
              <ExternalLink size={18} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        ))}
      </div>

      {/* Community Invite Footer */}
      <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/40 text-center max-w-xl mx-auto mt-10">
        <h4 className="font-extrabold text-slate-900 dark:text-white mb-1.5">
          {language === 'bn' ? 'কোনো সহায়তার প্রয়োজন?' : 'Need any instant assistance?'}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {language === 'bn' 
            ? 'আমাদের সোশ্যাল পেজে মেসেজ করেও আপনি যেকোনো সমস্যার তাৎক্ষণিক সমাধান লাভ করতে পারেন।' 
            : 'You can also reach us directly via Messenger inbox on our social page for swift help.'}
        </p>
        <a 
          href="https://m.me" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm hover:underline"
        >
          {language === 'bn' ? 'ইনবক্স করুন' : 'Open Inbox'}
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
