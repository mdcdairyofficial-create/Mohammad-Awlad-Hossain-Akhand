import React from 'react';
import { motion } from 'motion/react';
import { 
  Newspaper, 
  TrendingUp, 
  Clock, 
  Share2, 
  Bookmark, 
  ChevronRight, 
  ExternalLink,
  Search
} from 'lucide-react';
import { AdBanner } from '../AdBanner';

interface NewsViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: string) => string;
}

export const NewsView = ({
  language,
  t
}: NewsViewProps) => {
  const newsItems = [
    {
      id: 1,
      title: "সুপ্রিম কোর্টের নতুন নির্দেশনা: ভার্চুয়াল শুনানি আরও সহজ হচ্ছে",
      category: "আইন ও আদালত",
      time: "২ ঘণ্টা আগে",
      image: "https://picsum.photos/seed/court/800/400",
      summary: "বিচারপ্রার্থীদের ভোগান্তি কমাতে এবং বিচার প্রক্রিয়া দ্রুততর করতে সুপ্রিম কোর্ট নতুন কিছু নির্দেশনা জারি করেছে। এর ফলে এখন থেকে জেলা আদালতগুলোতেও ভার্চুয়াল শুনানি আরও কার্যকরভাবে পরিচালিত হবে।"
    },
    {
      id: 2,
      title: "ডিজিটাল নিরাপত্তা আইনের পরিবর্তে আসছে সাইবার নিরাপত্তা আইন",
      category: "জাতীয়",
      time: "৫ ঘণ্টা আগে",
      image: "https://picsum.photos/seed/cyber/800/400",
      summary: "সরকার ডিজিটাল নিরাপত্তা আইন রহিত করে সাইবার নিরাপত্তা আইন ২০২৩ প্রবর্তনের সিদ্ধান্ত নিয়েছে। নতুন আইনে বেশ কিছু ধারায় পরিবর্তন আনা হয়েছে যা নিয়ে আইনজীবীদের মধ্যে মিশ্র প্রতিক্রিয়া দেখা দিয়েছে।"
    },
    {
      id: 3,
      title: "পারিবারিক আদালত অধ্যাদেশ সংশোধন: বাড়ছে মামলার পরিধি",
      category: "আইন",
      time: "১ দিন আগে",
      image: "https://picsum.photos/seed/family/800/400",
      summary: "পারিবারিক আদালত অধ্যাদেশ সংশোধনের মাধ্যমে এখন থেকে পারিবারিক বিরোধ নিষ্পত্তিতে আদালতের ক্ষমতা আরও বাড়ানো হয়েছে। বিশেষ করে দেনমোহর ও ভরণপোষণ সংক্রান্ত মামলায় দ্রুত রায় দেওয়ার বিধান রাখা হয়েছে।"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('legal_news')} <span className="text-indigo-600 ml-2">{t('today_update')}</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">{t('news_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder={t('search_news')}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 w-40"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main News Feed */}
        <div className="lg:col-span-2 space-y-8">
          {newsItems.map((news, idx) => (
            <motion.article
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 relative overflow-hidden">
                  <img 
                    src={news.image} 
                    alt={news.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      {news.category}
                    </span>
                  </div>
                </div>
                <div className="md:w-3/5 p-8 space-y-4">
                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12} /> {news.time}</span>
                    <span className="flex items-center gap-1"><TrendingUp size={12} /> {t('trending')}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                    {news.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed line-clamp-3">
                    {news.summary}
                  </p>
                  <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                    <button className="text-indigo-600 font-bold text-sm flex items-center gap-2 group/btn">
                      {t('read_details')} <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Bookmark size={18} />
                      </button>
                      <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Sidebar News */}
        <div className="space-y-8">
          {/* Trending Topics */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <TrendingUp className="text-indigo-600" size={24} /> {t('popular_topics')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {["#সুপ্রিমকোর্ট", "#নতুনআইন", "#ডিজিটালনিরাপত্তা", "#মানবাধিকার", "#আইনজীবী", "#বিচারবিভাগ"].map((tag) => (
                <button key={tag} className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-slate-100">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Legal Resources Card */}
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Newspaper size={24} />
              </div>
              <h3 className="text-xl font-bold">{t('legal_knowledge_base')}</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                {t('library_desc')}
              </p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg">
                {t('view_library')}
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          </div>

          {/* Newsletter Signup */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
            <h3 className="text-xl font-bold">নিউজলেটার</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              সপ্তাহের সেরা আইনি খবরগুলো সরাসরি আপনার ইমেইলে পেতে সাবস্ক্রাইব করুন।
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="আপনার ইমেইল..."
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
              <button className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                সাবস্ক্রাইব
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
