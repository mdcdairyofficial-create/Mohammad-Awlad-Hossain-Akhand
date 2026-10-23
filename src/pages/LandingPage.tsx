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
    <div className="min-h-screen bg-[#070b19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-28 sm:pb-36 bg-[#070b19] border-b border-slate-800/80">
        {/* Subtle background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-bold shadow-lg">
                <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                <span>বাংলাদেশের ডিজিটাল কোর্ট ও মামলার ডায়েরির সবচেয়ে আধুনিক প্ল্যাটফর্ম</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.15]">
                MDC Casebook <br />
                <span className="bg-gradient-to-r from-[#818cf8] via-[#2dd4bf] to-[#34d399] bg-clip-text text-transparent">
                  ডিজিটাল কেস ও লিগ্যাল ডায়েরি প্ল্যাটফর্ম
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
                বিচার প্রক্রিয়াকে আরও সহজ, স্বচ্ছ এবং ডিজিটাল করার লক্ষ্যে MDC Casebook — যেখানে উকিল, মুহুরী ও ক্লায়েন্ট এক প্ল্যাটফর্ম পান সম্পূর্ণ কেস ম্যানেজমেন্ট এবং ডায়েরি সুবিধা।
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {isLoggedIn ? (
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#3b82f6] hover:opacity-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-pink-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>আমার ড্যাশবোর্ডে প্রবেশ করুন</span>
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-gradient-to-r from-[#9333ea] via-[#c084fc] to-[#3b82f6] hover:opacity-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>আমার ড্যাশবোর্ডে প্রবেশ করুন</span>
                    <ArrowRight size={18} />
                  </Link>
                )}

                <Link
                  to="/track"
                  className="px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm sm:text-base rounded-2xl border border-slate-700/80 shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <Search size={18} className="text-sky-400" />
                  <span>মামলা খুঁজুন</span>
                </Link>

                <Link
                  to="/blog"
                  className="px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm sm:text-base rounded-2xl border border-slate-700/80 shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <BookOpen size={18} className="text-emerald-400" />
                  <span>আইনি ব্লগ ও টিপস</span>
                </Link>
              </div>

            </div>

            {/* Right Column: 3D Visual Mockup */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Glowing backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-teal-500/25 rounded-3xl blur-2xl -z-10" />

              <div className="relative p-4 rounded-3xl bg-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-xl w-full max-w-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">mdccasebook.com/dashboard</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">মামলার তালিকা (Active Cases)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">লাইভ সিঙ্ক</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-indigo-400" />
                        <span className="text-slate-200 font-semibold">সি.আর. মামলা - ১০০/২০২৬ (ফৌজদারী)</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">তারিখ: কাল</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-blue-400" />
                        <span className="text-slate-200 font-semibold">সাধারন মামলা - ৬৮/২০২৬ (দিল্লী)</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">শুনানি প্রস্তুত</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-emerald-400" />
                        <span className="text-slate-200 font-semibold">দেওয়ানী মামলা - ১২/২০২৬ (ঢাকা)</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">রায় প্রাপ্ত</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                    <div className="text-lg font-black text-indigo-400">৬৪ জেলা</div>
                    <div className="text-[11px] text-slate-400">কোর্ট অন্তর্ভুক্ত</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                    <div className="text-lg font-black text-emerald-400">২৪/৭</div>
                    <div className="text-[11px] text-slate-400">ক্লাউড সিকিউরিটি</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Trust Badges Bar */}
          <div className="mt-16 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-200 font-bold">নিরাপদ ও নির্ভরযোগ্য ক্লাউড সিস্টেম</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Zap size={20} className="text-indigo-400 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-200 font-bold">দ্রুত ও সহজ ব্যবহার (মোবাইল-ফ্রেন্ডলি)</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Users size={20} className="text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-200 font-bold">উকিল, মুহুরী ও ক্লায়েন্ট এক প্ল্যাটফর্মে</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <FileText size={20} className="text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-200 font-bold">ডিজিটাল ডকুমেন্ট ও ক্লাউড সংরক্ষণ</span>
            </div>
          </div>

        </div>
      </section>

      {/* AdSense Top Ad Slot */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <GoogleAdSense className="my-2" />
      </div>

      {/* 2. MDC CASEBOOK BANNER & 4-FEATURE GRID (User Custom Request Integration) */}
      <section id="features" className="py-20 sm:py-32 relative overflow-hidden bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="mdc-banner-container bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 sm:p-10 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Banner Header */}
            <div className="text-center mb-10 relative z-10 space-y-3">
              <span className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-md">
                ডিজিটাল কোর্ট ও মামলা ডায়েরি
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                এমডিসি কেসবুক: <span className="text-blue-400">আপনার স্মার্ট আইনি সহকারী</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base">
                আইনজীবী, মুহুরি এবং সহকারীদের জন্য অত্যন্ত শক্তিশালী রিয়েল-টাইম সফটওয়্যার
              </p>
            </div>

            {/* 4 Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 mb-10">
              
              {/* Card 1: Lawyer Search / Directory */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all duration-300 group flex flex-col justify-between shadow-xl">
                <div>
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center relative z-20 group-hover:scale-110 transition-transform">
                      <Search size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>🔍</span> আইনজীবী খুঁজুন
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    জেলা ও দক্ষতা অনুযায়ী সহজে আইনি পরামর্শক বেছে নিন
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Link to="/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span>বিস্তারিত দেখুন</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Card 2: Smart Calendar */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all duration-300 group flex flex-col justify-between shadow-xl">
                <div>
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center relative z-20 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>📅</span> স্মার্ট ক্যালেন্ডার
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    দৈনিক শুনানির ডায়েরি ও মামলার তারিখ মনে রাখুন
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Link to="/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span>বিস্তারিত দেখুন</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Card 3: Legal Library */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all duration-300 group flex flex-col justify-between shadow-xl">
                <div>
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center relative z-20 group-hover:scale-110 transition-transform">
                      <BookOpen size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>📚</span> আইনি লাইব্রেরি
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ফোজদারি, দেওয়ানি সহ সমস্ত আইনি ধারা হাতের মুঠোয়
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Link to="/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span>বিস্তারিত দেখুন</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Card 4: Control Panel */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all duration-300 group flex flex-col justify-between shadow-xl">
                <div>
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                    <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center relative z-20 group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>⚙️</span> কন্ট্রোল প্যানেল
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    সহজেই মামলার তথ্য, আদেশ ও পদক্ষেপ ম্যানেজ করুন
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Link to="/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span>বিস্তারিত দেখুন</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

            </div>

            {/* Banner CTA Button */}
            <div className="text-center relative z-10">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base rounded-full shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all"
              >
                <span>এখনই শুরু করুন ➔</span>
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
                <li><Link to="/refund" className="hover:text-indigo-400 transition-colors">রিفান্ড নীতি (Refund Policy)</Link></li>
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
