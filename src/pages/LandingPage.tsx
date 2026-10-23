import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, 
  Briefcase, 
  Users, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Smartphone, 
  Bell, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  Megaphone, 
  Clock, 
  Search, 
  ChevronRight,
  BookOpen,
  Lock,
  Zap,
  Globe2
} from 'lucide-react';
import { GoogleAdSense } from '../components/GoogleAdSense';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface LandingPageProps {
  isLoggedIn?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ isLoggedIn = false }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800/80">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-bold shadow-sm">
              <Sparkles size={16} className="text-indigo-400" />
              <span>বাংলাদেশের নির্ভরযোগ্য ডিজিটাল কোর্ট ও মামলার ক্লাউড ডায়েরি</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              MDC Casebook <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                ডিজিটাল কেস ও লিগ্যাল ডায়েরি প্ল্যাটফর্ম
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-lg leading-relaxed font-normal">
              বিজ্ঞ আইনজীবী, সহকারী মুহুরী, বিচারপ্রার্থী মক্কেল এবং বিজ্ঞাপনদাতাদের জন্য একটি সমন্বিত স্মার্ট প্ল্যাটফর্ম। কাগজের ডায়েরি ছাড়াই শুনানির তারিখ, কজলিস্ট ও মামলার আদেশ পরিচালনা করুন নিরাপদে।
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>আমার ড্যাশবোর্ডে প্রবেশ করুন</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>ফ্রি শুরু করুন / লগইন</span>
                  <ArrowRight size={18} />
                </Link>
              )}

              <Link
                to="/track"
                className="px-6 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 font-bold text-sm sm:text-base rounded-2xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center gap-2"
              >
                <Search size={18} className="text-sky-400" />
                <span>মামলা ট্র্যাকিং</span>
              </Link>

              <Link
                to="/blog"
                className="px-5 py-3.5 bg-transparent hover:bg-slate-800/40 text-slate-300 font-bold text-sm rounded-2xl border border-slate-800 transition-all flex items-center gap-2"
              >
                <BookOpen size={17} className="text-emerald-400" />
                <span>আইনি ব্লগ ও টিপস</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-t border-slate-800/80 mt-10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-semibold">৬৪ জেলার আদালত অন্তর্ভুক্ত</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-300 font-semibold">ক্লাউড এনক্রিপ্টেড ডাটাবেজ</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Smartphone size={18} className="text-sky-400 shrink-0" />
                <span className="text-xs text-slate-300 font-semibold">মোবাইল অ্যাপ (PWA) সুবিধা</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Bell size={18} className="text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300 font-semibold">হোয়াটসঅ্যাপ ও এসএমএস নোটিফিকেশন</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* AdSense Top Ad Slot */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <GoogleAdSense className="my-2" />
      </div>

      {/* 2. FOUR DASHBOARDS FEATURE SECTION */}
      <section id="features" className="py-16 sm:py-24 border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
              SPECIALIZED WORKSPACES
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              ৪টি বিশেষায়িত ড্যাশবোর্ড — এক প্ল্যাটফর্মে
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              আইনজীবী থেকে শুরু করে বিচারপ্রার্থী মক্কেল — প্রত্যেকের প্রয়োজন অনুযায়ী সুনির্দিষ্ট ড্যাশবোর্ড ও টুলস।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* 1. LAWYER DASHBOARD */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-indigo-500/20 hover:border-indigo-500/40 transition-all shadow-xl hover:shadow-indigo-500/5 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <Scale size={24} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">১. আইনজীবী ড্যাশবোর্ড (Lawyer)</h3>
                  <span className="text-[11px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">পেশাদার</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                  ডিজিটাল মামলার ডায়েরি, অটোমেটিক কজলিস্ট তৈরি এবং চেম্বার টিম ব্যবস্থাপনার পূর্ণাঙ্গ সমাধান।
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-6">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>কেসবুক প্যানেল:</strong> দেওয়ানী ও ফৌজদারী মামলার দ্রুত এন্ট্রি ও ট্র্যাকিং</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>কজলিস্ট ও ক্যালেন্ডার:</strong> প্রতিদিনের শুনানির তারিখ ও আদালতের নোটিশ</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>ল’ চেম্বার ও অ্যাসোসিয়েট বণ্টন:</strong> জুনিয়রদের মধ্যে দায়িত্ব বিতরণ</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>আইনি খসড়া লাইব্রেরি:</strong> ওকালতনামা ও জামিন পিটিশনের রেডি ফরম্যাট</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors pt-2"
              >
                আইনজীবী ড্যাশবোর্ড দেখুন <ChevronRight size={14} />
              </Link>
            </div>

            {/* 2. MOHURI DASHBOARD */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-xl hover:shadow-blue-500/5 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-5 border border-blue-500/30 group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">২. মুহুরী ড্যাশবোর্ড (Legal Assistant)</h3>
                  <span className="text-[11px] font-black text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">কোর্ট অপারেশন</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                  কোর্টের ব্যস্ত সময়ে দ্রুত তারিখ ও পদক্ষেপ আপডেট এবং সহকারী মুহুরীদের কার্যক্রম তদারকি।
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-6">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>সহকারী মুহুরী বণ্টন:</strong> কোর্ট ও ফাইল ভিত্তিক সহকারী তদারকি</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>কুইক অর্ডার আপডেট:</strong> শুনানির শেষ আদেশ ও পরবর্তী তারিখ মুহূর্তেই এন্ট্রি</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>সমন ও নথিপত্র ট্র্যাকিং:</strong> পরোয়ানা, সমন ফেরত ও তদন্ত রিপোর্ট পর্যবেক্ষণ</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>মাসিক রিপোর্ট:</strong> নিষ্পত্তিকৃত ও চলমান মামলার স্বচ্ছ হিসাব</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors pt-2"
              >
                মুহুরী ড্যাশবোর্ড দেখুন <ChevronRight size={14} />
              </Link>
            </div>

            {/* 3. CLIENT DASHBOARD */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-xl hover:shadow-emerald-500/5 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">৩. ক্লায়েন্ট ড্যাশবোর্ড (Client)</h3>
                  <span className="text-[11px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">বিচারপ্রার্থী</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                  বিচারপ্রার্থী সাধারণ মানুষের জন্য কোনো জটিলতা ছাড়া সরাসরি নিজের মামলার সর্বশেষ অবস্থা জানার ব্যবস্থা।
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-6">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>লাইভ তারিখ ট্র্যাকিং:</strong> পরবর্তী শুনানির তারিখ যেকোনো সময় দেখা</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>আদেশের বিবরণ:</strong> শেষ শুনানিতে বিজ্ঞ আদালত কি আদেশ দিয়েছেন তা জানা</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>স্বয়ংক্রিয় নোটিফিকেশন:</strong> মামলার তারিখ পরিবর্তন হলে এসএমএস অ্যালার্ট</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>আইনজীবী ডিরেক্টরি:</strong> পেশাদার বিজ্ঞ আইনজীবীদের প্রোফাইল ও যোগাযোগ</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors pt-2"
              >
                ক্লায়েন্ট পোর্টাল দেখুন <ChevronRight size={14} />
              </Link>
            </div>

            {/* 4. ADVERTISER DASHBOARD */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-xl hover:shadow-amber-500/5 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/30 group-hover:scale-110 transition-transform">
                  <Megaphone size={24} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">৪. বিজ্ঞাপনদাতা ড্যাশবোর্ড (Advertiser)</h3>
                  <span className="text-[11px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">টার্গেটেড প্রমোশন</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                  আইনি কমিউনিটি, আইনজীবী ও বিচারপ্রার্থীদের কাছে লিগ্যাল বই, স্টেশনারি ও সেবার প্রচার।
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-6">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>ফ্লেক্সি-প্ল্যান ক্যাম্পেইন:</strong> বাজেট অনুযায়ী কাস্টম অ্যাড শিডিউল</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>রিয়েল-টাইম অ্যানালিটিক্স:</strong> লাইভ ইমপ্রেশন, ভিউ ও ক্লিক রিপোর্ট</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>সরাসরি অডিয়েন্স রিচ:</strong> বাংলাদেশের ৬৪ জেলার আইন পেশাজীবীদের কাছে পৌঁছানো</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>স্বচ্ছ বিলিং:</strong> প্রতিটি ক্যাম্পেইনের নিখুঁত পারফরম্যান্স হিসাব</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors pt-2"
              >
                বিজ্ঞাপনদাতা ড্যাশবোর্ড দেখুন <ChevronRight size={14} />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 3. ABOUT US & MISSION SECTION */}
      <section className="py-16 sm:py-24 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                ABOUT MDC CASEBOOK
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                সনাতন কাগজের ডায়েরি থেকে স্মার্ট ডিজিটাল বিচার ব্যবস্থাপনায় রূপান্তর
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                এমডিসি কেসবুক (MDC Casebook) হলো বাংলাদেশের বিচার বিভাগীয় ব্যবস্থার সাথে সামঞ্জস্য রেখে তৈরি একটি সর্বাধুনিক ক্লাউড প্ল্যাটফর্ম। আদালত প্রাঙ্গণের শত ব্যস্ততার মাঝে একটি মামলার তারিখ মিস হওয়া কিংবা ফাইল হারিয়ে যাওয়া রোধ করতেই আমাদের এই প্রযুক্তিনির্ভর উদ্যোগ।
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                আমাদের লক্ষ্য বাংলাদেশের প্রতিটি বিজ্ঞ আইনজীবী ও সহকারী মুহুরীকে একটি পেপারলেস, নির্ভুল ও স্বয়ংক্রিয় কোর্ট ডায়েরি প্রদান করা এবং সাধারণ বিচারপ্রার্থীদের তাদের মামলার সর্বশেষ তথ্য স্বচ্ছভাবে জানার অধিকার নিশ্চিত করা।
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-black text-indigo-400 mb-1">১০০%</div>
                  <div className="text-xs text-slate-400 font-semibold">নিরাপদ ক্লাউড ডেটাবেজ</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-black text-emerald-400 mb-1">২৪/৭</div>
                  <div className="text-xs text-slate-400 font-semibold">যেকোনো ডিভাইস থেকে এক্সেস</div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/30 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-2xl relative">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe2 size={20} className="text-sky-400" />
                <span>এমডিসি কেসবুকের মূল অঙ্গীকার</span>
              </h3>
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">১</div>
                  <p><strong>স্বচ্ছতা ও সময় সাশ্রয়:</strong> কাগজের ফাইল ঘেঁটে ঘণ্টার পর ঘণ্টা সময় অপচয় বন্ধ করা।</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">২</div>
                  <p><strong>ক্লায়েন্ট আস্থা বৃদ্ধি:</strong> মামলা সম্পর্কে সঠিক সময়ে ক্লায়েন্টকে আপডেট জানিয়ে পেশাদার সুনাম বৃদ্ধি।</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">৩</div>
                  <p><strong>মোবাইল অ্যাপ ফ্রেন্ডলি:</strong> প্লে-স্টোর ছাড়াও সরাসরি প্রগ্রেসিভ ওয়েব অ্যাপ (PWA) হিসেবে ফোনে ইনস্টলযোগ্য।</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">৪</div>
                  <p><strong>আইনি সচেতনতা:</strong> সাধারণ নাগরিকদের জন্য বিনামূল্যে আইনি ব্লগ ও নির্দেশিকা সরবরাহ।</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION (CTA) */}
      <section className="py-16 sm:py-20 relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-blue-900/30 to-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            আজই আপনার লিগ্যাল প্র্যাকটিসকে করুন সম্পূর্ণ ডিজিটাল
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            হাজারো আইনজীবী ও মুহুরী ইতিমধ্যেই যুক্ত হয়েছেন। আপনার মামলার তথ্য পরিচালনা করুন আধুনিক ক্লাউড ডায়েরিতে।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>রেজিস্ট্রেশন করুন / সাইন-ইন</span>
              <ArrowRight size={18} />
            </Link>
            <PWAInstallButton variant="header" language="bn" />
          </div>
        </div>
      </section>

      {/* 5. PUBLIC FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <Scale className="text-indigo-400" size={24} />
                <span className="text-lg font-black text-white">MDC Casebook</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                আদালত ভিত্তিক মামলার তথ্য আদান-প্রদান ও ডিজিটাল ডায়েরি প্ল্যাটফর্ম। বিজ্ঞ আইনজীবী, মুহুরী ও বিচারপ্রার্থীদের একমাত্র ডিজিটাল সমাধান।
              </p>
              <p className="text-[11px] text-slate-500">
                ওয়েবসাইট: www.mdccasebook.com
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider mb-3">ড্যাশবোর্ডসমূহ</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">আইনজীবী ড্যাশবোর্ড</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">মুহুরী ড্যাশবোর্ড</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">ক্লায়েন্ট ড্যাশবোর্ড</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">বিজ্ঞাপনদাতা ড্যাশবোর্ড</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider mb-3">গুরুত্বপূর্ণ লিংক</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/blog" className="hover:text-indigo-400 transition-colors">আইনি সচেতনতা ব্লগ</Link></li>
                <li><Link to="/track" className="hover:text-indigo-400 transition-colors">অনলাইন মামলা ট্র্যাকিং</Link></li>
                <li><Link to="/#features" className="hover:text-indigo-400 transition-colors">ফিচারসমূহ</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">লগইন পোর্টাল</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider mb-3">আইনি ও নীতিমালা</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">গোপনীয়তা নীতি (Privacy Policy)</Link></li>
                <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">ব্যবহারের শর্তাবলী (Terms of Service)</Link></li>
                <li><Link to="/refund" className="hover:text-indigo-400 transition-colors">রিফান্ড নীতি (Refund Policy)</Link></li>
                <li><span className="text-slate-500">হেল্পলাইন: support@mdccasebook.com</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} MDC Casebook (এমডিসি কেসবুক)। সর্বস্বত্ব সংরক্ষিত।</p>
            <p className="text-[11px] text-slate-600">
              Disclaimer: এটি একটি লিগ্যাল ম্যানেজমেন্ট সফটওয়্যার টুল, কোনো সরাসরি আইনি পরামর্শ প্রদান করে না।
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
