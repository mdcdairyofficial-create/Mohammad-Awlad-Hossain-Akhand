import React from 'react';
import { motion } from 'motion/react';
import { 
  Newspaper, 
  ExternalLink,
  Search,
  Globe,
  Star,
  TrendingUp,
  Clock,
  ChevronRight,
  Bookmark,
  Share2
} from 'lucide-react';
import { AdBanner } from '../AdBanner';

interface NewspaperItem {
  id: number;
  name: string;
  nameEn: string;
  url: string;
  logo: string;
  category: 'Bangla' | 'English';
  isPopular?: boolean;
}

interface NewspapersViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: string) => string;
}

export const NewspapersView = ({
  language,
  t
}: NewspapersViewProps) => {
  const newspapers: NewspaperItem[] = [
    {
      id: 1,
      name: "প্রথম আলো",
      nameEn: "Prothom Alo",
      url: "https://www.prothomalo.com",
      logo: "https://images.prothomalo.com/prothomalo-bangla%2F2022-10%2F4e1e8b2a-8b1e-4b1e-9b1e-9b1e9b1e9b1e%2FProthom_Alo_Logo.png?auto=format%2Ccompress&w=400",
      category: 'Bangla',
      isPopular: true
    },
    {
      id: 2,
      name: "দ্য ডেইলি স্টার",
      nameEn: "The Daily Star",
      url: "https://www.thedailystar.net",
      logo: "https://www.thedailystar.net/sites/all/themes/dailystar/logo.png",
      category: 'English',
      isPopular: true
    },
    {
      id: 3,
      name: "ইত্তেফাক",
      nameEn: "Ittefaq",
      url: "https://www.ittefaq.com.bd",
      logo: "https://www.ittefaq.com.bd/assets/images/logo.png",
      category: 'Bangla',
      isPopular: true
    },
    {
      id: 4,
      name: "কালের কণ্ঠ",
      nameEn: "Kaler Kantho",
      url: "https://www.kalerkantho.com",
      logo: "https://www.kalerkantho.com/assets/images/logo.png",
      category: 'Bangla',
      isPopular: true
    },
    {
      id: 5,
      name: "যুগান্তর",
      nameEn: "Jugantor",
      url: "https://www.jugantor.com",
      logo: "https://www.jugantor.com/assets/images/logo.png",
      category: 'Bangla',
      isPopular: true
    },
    {
      id: 6,
      name: "সমকাল",
      nameEn: "Samakal",
      url: "https://samakal.com",
      logo: "https://samakal.com/assets/images/logo.png",
      category: 'Bangla'
    },
    {
      id: 7,
      name: "আমাদের সময়",
      nameEn: "Amader Shomoy",
      url: "https://www.dainikamadershomoy.com",
      logo: "https://www.dainikamadershomoy.com/assets/images/logo.png",
      category: 'Bangla'
    },
    {
      id: 8,
      name: "জনকণ্ঠ",
      nameEn: "Janakantha",
      url: "https://www.dailyjanakantha.com",
      logo: "https://www.dailyjanakantha.com/assets/images/logo.png",
      category: 'Bangla'
    },
    {
      id: 9,
      name: "ইনকিলাব",
      nameEn: "Inqilab",
      url: "https://dailyinqilab.com",
      logo: "https://dailyinqilab.com/assets/images/logo.png",
      category: 'Bangla'
    },
    {
      id: 10,
      name: "ফিন্যান্সিয়াল এক্সপ্রেস",
      nameEn: "Financial Express",
      url: "https://thefinancialexpress.com.bd",
      logo: "https://thefinancialexpress.com.bd/assets/images/logo.png",
      category: 'English'
    },
    {
      id: 11,
      name: "ঢাকা ট্রিবিউন",
      nameEn: "Dhaka Tribune",
      url: "https://www.dhakatribune.com",
      logo: "https://www.dhakatribune.com/assets/images/logo.png",
      category: 'English'
    },
    {
      id: 12,
      name: "বিডিনিউজ২৪",
      nameEn: "bdnews24.com",
      url: "https://bangla.bdnews24.com",
      logo: "https://bangla.bdnews24.com/assets/images/logo.png",
      category: 'Bangla'
    },
    {
      id: 13,
      name: "জাগো নিউজ",
      nameEn: "Jago News",
      url: "https://www.jagonews24.com",
      logo: "https://www.jagonews24.com/templates/desktop/assets/images/logo.png",
      category: 'Bangla'
    },
    {
      id: 14,
      name: "বাংলাদেশ প্রতিদিন",
      nameEn: "Bangladesh Pratidin",
      url: "https://www.bd-pratidin.com",
      logo: "https://www.bd-pratidin.com/assets/images/logo.png",
      category: 'Bangla',
      isPopular: true
    },
    {
      id: 15,
      name: "ডেইলি সান",
      nameEn: "Daily Sun",
      url: "https://www.daily-sun.com",
      logo: "https://www.daily-sun.com/assets/images/logo.png",
      category: 'English'
    }
  ];

  const newsItems = [
    {
      id: 1,
      title: language === 'bn' ? "সুপ্রিম কোর্টের নতুন নির্দেশনা: ভার্চুয়াল শুনানি আরও সহজ হচ্ছে" : "Supreme Court's New Guidelines: Virtual Hearing Becoming Easier",
      category: language === 'bn' ? "আইন ও আদালত" : "Law & Court",
      time: language === 'bn' ? "২ ঘণ্টা আগে" : "2 hours ago",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop",
      summary: language === 'bn' ? "বিচারপ্রার্থীদের ভোগান্তি কমাতে এবং বিচার প্রক্রিয়া দ্রুততর করতে সুপ্রিম কোর্ট নতুন কিছু নির্দেশনা জারি করেছে।" : "The Supreme Court has issued new directives to reduce the suffering of litigants and speed up the trial process."
    },
    {
      id: 2,
      title: language === 'bn' ? "সাইবার নিরাপত্তা আইন ২০২৪: আইনজীবীদের প্রতিক্রিয়া" : "Cyber Security Act 2024: Lawyers' Reactions",
      category: language === 'bn' ? "জাতীয়" : "National",
      time: language === 'bn' ? "৫ ঘণ্টা আগে" : "5 hours ago",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop",
      summary: language === 'bn' ? "নতুন আইনে বেশ কিছু ধারায় পরিবর্তন আনা হয়েছে যা নিয়ে আইনজীবীদের মধ্যে মিশ্র প্রতিক্রিয়া দেখা দিয়েছে।" : "Changes have been made in several sections of the new law, leading to mixed reactions among lawyers."
    }
  ];

  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<'All' | 'Bangla' | 'English'>('All');

  const filteredNewspapers = newspapers.filter(paper => {
    const matchesSearch = paper.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         paper.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || paper.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
              <Newspaper size={18} />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{language === 'bn' ? 'সংবাদ কেন্দ্র' : 'News Hub'}</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none group">
            {language === 'bn' ? 'সকল পত্রিকা' : 'All Newspapers'} 
            <span className="inline-block transition-transform group-hover:translate-x-2 duration-500 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 ml-2">
              {language === 'bn' ? 'একপলকে' : 'Portal'}
            </span>
          </h2>
          <p className="text-slate-500 font-medium mt-3 max-w-lg">
            {language === 'bn' ? 'বাংলাদেশের সকল জনপ্রিয় বাংলা ও ইংরেজি সংবাদপত্রের লাইভ আপডেট এক জায়গায়' : 'Live updates and direct access to all popular newspapers of Bangladesh in one place'}
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md">
            {(['All', 'Bangla', 'English'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 shadow-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                {cat === 'All' ? (language === 'bn' ? 'সব' : 'All') : 
                 cat === 'Bangla' ? (language === 'bn' ? 'বাংলা' : 'Bangla') : 
                 (language === 'bn' ? 'ENGLISH' : 'English')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400/50 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-300 shadow-sm w-full lg:w-72 group">
            <Search size={18} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder={language === 'bn' ? 'পত্রিকার নাম খুঁজুন...' : 'Find by name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 sm:gap-8">
        {filteredNewspapers.map((paper, idx) => (
          <motion.a
            key={paper.id}
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: idx * 0.03,
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="group relative flex flex-col h-full"
          >
            <div className="flex flex-col h-full bg-white rounded-[2.5rem] p-2 border border-slate-200 hover:border-indigo-500/50 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.15)] transition-all duration-700 overflow-hidden group/card capitalize">
              <div className="p-6 flex flex-col h-full bg-slate-50/50 rounded-[2rem] transition-all duration-700 group-hover/card:bg-white group-hover/card:scale-[0.98]">
                
                {/* Logo Area - Target Box */}
                <div className="relative aspect-[16/9] w-full flex items-center justify-center mb-6 bg-gradient-to-br from-white to-slate-50/50 rounded-[1.5rem] p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.05)] border border-slate-100 group-hover/card:shadow-xl group-hover/card:-translate-y-1.5 transition-all duration-700 overflow-hidden ring-1 ring-slate-900/[0.02]">
                  {paper.isPopular && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-indigo-600 text-[9px] font-black text-white rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 z-20 uppercase tracking-wider scale-90 group-hover/card:scale-100 transition-transform">
                      <Star size={10} fill="currentColor" /> POPULAR
                    </div>
                  )}

                  {/* Backdrop Brand Letter with Gradient */}
                  <span className="absolute -bottom-4 -left-4 text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-200/20 opacity-60 group-hover/card:opacity-30 transition-opacity duration-700 pointer-events-none select-none italic">
                    {paper.nameEn.charAt(0)}
                  </span>
                  
                  <div className="relative w-full h-full flex items-center justify-center p-1">
                    <img 
                      src={paper.logo} 
                      alt={paper.name} 
                      className="max-w-[85%] max-h-[85%] object-contain relative z-10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover/card:scale-110 transition-all duration-700 ease-out"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(paper.nameEn)}&background=f8fafc&color=6366f1&bold=true&size=512&font-size=0.3`;
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Interactive Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-white/40 to-indigo-500/0 opacity-0 group-hover/card:opacity-100 -translate-x-full group-hover/card:translate-x-full transition-all duration-1000 ease-in-out"></div>

                  {/* Live Pulse Indicator */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-white/80 backdrop-blur-md rounded-lg border border-slate-100/50 shadow-sm">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Live News</span>
                  </div>
                </div>

                {/* Text Info */}
                <div className="space-y-4 flex flex-col items-center flex-grow text-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-1 transition-all duration-300 group-hover/card:text-indigo-600">
                      {language === 'bn' ? paper.name : paper.nameEn}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                      {paper.nameEn}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                      paper.category === 'Bangla' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50 group-hover/card:bg-emerald-600 group-hover/card:text-white' 
                        : 'bg-blue-50 text-blue-600 border-blue-100/50 group-hover/card:bg-blue-600 group-hover/card:text-white'
                    }`}>
                      {paper.category === 'Bangla' ? (language === 'bn' ? 'বাংলা' : 'Bangla') : (language === 'bn' ? 'ENGLISH' : 'English')}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-8 pt-6 border-t border-slate-100/80">
                  <div className="flex items-center justify-center gap-3 text-indigo-600 font-extrabold text-xs transition-all duration-500">
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-slate-200/50 group-hover/card:scale-110 transition-transform duration-500 shadow-sm">
                       <img 
                         src={paper.logo} 
                         alt="" 
                         className="w-full h-full object-contain p-1" 
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(paper.nameEn)}&background=f1f5f9&color=6366f1&size=64`;
                         }}
                         referrerPolicy="no-referrer"
                       />
                    </div>
                    <span className="group-hover/card:tracking-[0.15em] transition-all duration-500 uppercase">
                      {language === 'bn' ? 'লাইভ পড়ুন' : 'Read Live'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all duration-500 group-hover/card:rotate-[360deg] shadow-sm">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Animated Underline Effect */}
            <div className="absolute -bottom-1 left-12 right-12 h-1 bg-indigo-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center blur-[1px]"></div>
          </motion.a>
        ))}

        {filteredNewspapers.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-6">
            <div className="relative inline-flex">
              <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300">
                <Newspaper size={48} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-xl">!</div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">{language === 'bn' ? 'দুঃখিত, কোনো পত্রিকা পাওয়া যায়নি' : 'No Newspapers Found'}</h3>
              <p className="text-slate-500 font-medium">{language === 'bn' ? 'অনুগ্রহ করে অন্য কোনো নাম দিয়ে পুনরায় চেষ্টা করুন' : 'Try searching with a different keyword or filter'}</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-6 text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline"
              >
                {language === 'bn' ? 'সব পত্রিকা দেখুন' : 'Show all newspapers'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legal News Section Integration */}
      <div className="pt-8 border-t border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {language === 'bn' ? 'আইনি সংবাদ' : 'Legal News'} <span className="text-indigo-600 ml-2">{language === 'bn' ? 'আজকের আপডেট' : 'Today\'s Update'}</span>
            </h3>
            <p className="text-slate-500 font-medium">{language === 'bn' ? 'আইন ও আদালত অঙ্গনের সর্বশেষ সংবাদ' : 'Latest news from law and courts'}</p>
          </div>
          <button className="text-indigo-600 font-bold text-sm hover:underline">{language === 'bn' ? 'সব দেখুন' : 'View All'}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {newsItems.map((news, idx) => (
             <motion.article
               key={news.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 + idx * 0.1 }}
               className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500"
             >
               <div className="flex flex-col sm:flex-row h-full">
                 <div className="sm:w-1/3 relative overflow-hidden h-48 sm:h-auto">
                   <img 
                     src={news.image} 
                     alt={news.title} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                     referrerPolicy="no-referrer"
                   />
                 </div>
                 <div className="sm:w-2/3 p-6 space-y-3 flex flex-col justify-between">
                   <div className="space-y-2">
                     <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1 text-indigo-600"><TrendingUp size={12} /> {news.category}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1"><Clock size={12} /> {news.time}</span>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                       {news.title}
                     </h4>
                     <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                       {news.summary}
                     </p>
                   </div>
                   <div className="pt-3 flex items-center justify-between">
                     <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 group/btn">
                       {language === 'bn' ? 'আরও পড়ুন' : 'Read More'} <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                     <div className="flex items-center gap-2">
                       <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                         <Bookmark size={14} />
                       </button>
                       <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all">
                         <Share2 size={14} />
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.article>
           ))}
        </div>
      </div>

      {/* Recommended Section */}
      <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white overflow-hidden relative shadow-2xl shadow-indigo-900/10">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 max-w-xl text-center md:text-left">
            <div className="inline-flex px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Suggestions
            </div>
            <h3 className="text-3xl font-black leading-tight">
              {language === 'bn' ? 'আপনার পছন্দের পত্রিকা যুক্ত করতে চান?' : 'Want to add your favorite newspaper?'}
            </h3>
            <p className="text-slate-400 font-medium leading-relaxed">
              {language === 'bn' ? 'যদি তালিকার বাইরে অন্য কোনো পত্রিকা এই ড্যাশবোর্ডে দেখতে চান, তবে আমাদের সাথে যোগাযোগ করুন। আমরা তা যুক্ত করার চেষ্টা করবো।' : 'If you want to see any other newspaper in this list, please contact us. We will try our best to add it for you.'}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
               <button className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl transition-all shadow-xl hover:bg-slate-100 hover:scale-105 active:scale-95 group">
                 {language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
               </button>
               <button className="px-8 py-4 bg-slate-800 text-white font-black rounded-2xl transition-all hover:bg-slate-700 border border-slate-700">
                 {language === 'bn' ? 'আরও জানুন' : 'Learn More'}
               </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center w-64 h-64 relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <Newspaper size={180} className="text-slate-800 rotate-12 relative z-10" />
            <Globe size={60} className="absolute -top-4 -right-4 text-indigo-500 animate-bounce" />
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-900/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
      </div>
    </div>
  );
};
