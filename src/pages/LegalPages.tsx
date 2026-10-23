import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, FileText, RefreshCw, ArrowLeft, Scale, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { GoogleAdSense } from '../components/GoogleAdSense';

interface LegalPagesProps {
  initialTab?: 'privacy' | 'terms' | 'refund';
}

export const LegalPages: React.FC<LegalPagesProps> = ({ initialTab }) => {
  const location = useLocation();

  // Determine active tab from URL path if not explicitly provided
  const activeTab: 'privacy' | 'terms' | 'refund' = initialTab || (
    location.pathname.includes('/terms') ? 'terms' :
    location.pathname.includes('/refund') ? 'refund' : 'privacy'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>হোমপেজে ফিরে যান</span>
          </Link>

          <div className="flex items-center gap-2">
            <Scale className="text-indigo-400" size={18} />
            <span className="text-xs font-bold text-slate-300">MDC Casebook Legal Center</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mb-8 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <Link
            to="/privacy"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield size={16} />
            <span>গোপনীয়তা নীতি (Privacy)</span>
          </Link>

          <Link
            to="/terms"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>শর্তাবলী (Terms)</span>
          </Link>

          <Link
            to="/refund"
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
              activeTab === 'refund'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RefreshCw size={16} />
            <span>রিফান্ড নীতি (Refund)</span>
          </Link>
        </div>

        {/* Content Container */}
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-xl space-y-8">
          
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  গোপনীয়তা নীতি (Privacy Policy)
                </h1>
                <p className="text-xs text-slate-500">
                  সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬ | কার্যকর তারিখ: মার্চ ২০২৬
                </p>
              </div>

              <p className="text-slate-300">
                এমডিসি কেসবুক (<strong>"MDC Casebook"</strong>, <strong>"আমরা"</strong>, বা <strong>"আমাদের"</strong>) এ আপনার ব্যক্তিগত ও পেশাগত তথ্যের গোপনীয়তা রক্ষা করতে আমরা দৃঢ়ভাবে প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতিতে বর্ণিত হয়েছে কীভাবে আমরা আপনার তথ্য সংগ্রহ, সংরক্ষণ, প্রক্রিয়াকরণ এবং সুরক্ষা করি।
              </p>

              {/* AdSense & Third-party cookies mandatory disclosure */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-2 text-xs">
                <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-indigo-400" />
                  গুগল অ্যাডসেন্স ও কুকি সংক্রান্ত বিশেষ ঘোষণা (Google AdSense & Cookies):
                </p>
                <p className="text-slate-300 leading-relaxed">
                  আমাদের ওয়েবসাইটে বিজ্ঞাপনী নেটওয়ার্ক হিসেবে Google AdSense ব্যবহৃত হতে পারে। গুগল সহ তৃতীয় পক্ষীয় ভেন্ডররা কুকিজ (Cookies) ব্যবহার করে থাকে। আপনি যখন আমাদের সাইট বা ইন্টারনেটের অন্যান্য ওয়েবসাইটে ব্রাউজ করেন, সেই পূর্ববর্তী পরিদর্শনের ওপর ভিত্তি করে গুগল উপযুক্ত বিজ্ঞাপন প্রদর্শন করতে কুকি ব্যবহার করে। ব্যবহারকারীরা চাইলে গুগল অ্যাড সেটিংস (Google Ads Settings) অথবা <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">www.aboutads.info</a>-এ গিয়ে পারসোনালাইজড বিজ্ঞাপনের কুকি নিষ্ক্রিয় করতে পারেন।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">১. আমরা কোন কোন তথ্য সংগ্রহ করি?</h2>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                  <li><strong>ব্যক্তিগত তথ্য:</strong> নাম, মোবাইল নম্বর, ইমেইল অ্যাড্রেস, জেলা, দেশ এবং পেশাগত বিবরণ (আইনজীবী/মুহুরীদের বার অ্যাসোসিয়েশন বা মেম্বারশিপ নম্বর)।</li>
                  <li><strong>মামলা সংক্রান্ত তথ্য:</strong> মামলার নম্বর, আদালত, ধারা, শুনানির তারিখ এবং সংশ্লিষ্ট নথি (যা কেবল ব্যবহারকারী ও অনুমোদিত পক্ষের মধ্যে সংরক্ষিত থাকে)।</li>
                  <li><strong>ব্যবহার সংক্রান্ত তথ্য:</strong> লগইন হিস্ট্রি, ব্রাউজারের ধরন, আইপি অ্যাড্রেস এবং সিকিউরিটি লগ।</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">২. তথ্যের ব্যবহার</h2>
                <p className="text-slate-400">
                  সংগৃহীত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহৃত হয়:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                  <li>মামলার তারিখ ও ডায়েরির হিসাব স্বয়ংক্রিয়ভাবে প্রদান করা।</li>
                  <li>শুনানির পরবর্তী তারিখ সম্পর্কে হোয়াটসঅ্যাপ ও এসএমএস নোটিফিকেশন পাঠানো।</li>
                  <li>পেমেন্ট ও সাবস্ক্রিপশন চার্জ প্রক্রিয়াকরণ।</li>
                  <li>প্ল্যাটফর্মের নিরাপত্তা বিধান ও অননুমোদিত প্রবেশ রোধ।</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">৩. তথ্য সুরক্ষা ও ক্লাউড এনক্রিপশন</h2>
                <p className="text-slate-400">
                  আমরা গুগল ফায়ারস্টোর (Google Firestore) ও গুগল ক্লাউড অবকাঠামোর মাধ্যমে ইন্ডাস্ট্রি-স্ট্যান্ডার্ড SSL/TLS এনক্রিপশন ব্যবহার করি। আপনার কোনো ব্যক্তিগত বা মামলার তথ্য তৃতীয় পক্ষের কাছে বিক্রয় বা ভাড়া দেওয়া হয় না।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">৪. যোগাযোগ ও অধিকার</h2>
                <p className="text-slate-400">
                  আপনার ব্যক্তিগত তথ্য সংশোধন বা অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে আমাদের সাথে যোগাযোগ করতে পারেন: <strong className="text-indigo-400">support@mdccasebook.com</strong>।
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  ব্যবহারের শর্তাবলী (Terms of Service)
                </h1>
                <p className="text-xs text-slate-500">
                  সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬
                </p>
              </div>

              <p className="text-slate-300">
                এমডিসি কেসবুক প্ল্যাটফর্ম ব্যবহার করার মাধ্যমে আপনি নিম্নলিখিত শর্তাবলী মেনে নিতে সম্মত হচ্ছেন। শর্তগুলো মনোযোগ সহকারে পড়ুন।
              </p>

              {/* Disclaimer of Legal Counsel */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-900/60 space-y-2 text-xs">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-amber-400" />
                  আইনি পরামর্শ সংক্রান্ত শর্ত ও অস্বীকৃতি (Legal Disclaimer):
                </p>
                <p className="text-slate-300 leading-relaxed">
                  এমডিসি কেসবুক একটি সফটওয়্যার প্রযুক্তি প্ল্যাটফর্ম ও ডিজিটাল কোর্ট ডায়েরি। এটি কোনো আইনজীবী প্রতিষ্ঠান বা ল’ ফার্ম নয় এবং এটি কোনো সরাসরি আইনি প্রতিনিধিত্ব বা পরামর্শ প্রদান করে না। কোনো মামলায় চূড়ান্ত আইনি সিদ্ধান্ত গ্রহণের জন্য বিজ্ঞ লাইসেন্সধারী আইনজীবীর সাথে পরামর্শ করা আবশ্যক।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">১. অ্যাকাউন্ট নিবন্ধন ও নিরাপত্তা</h2>
                <p className="text-slate-400">
                  ব্যবহারকারীকে সঠিক ও হালনাগাদ তথ্য প্রদান করে অ্যাকাউন্ট খুলতে হবে। পাসওয়ার্ডের গোপনীয়তা রক্ষা করা ব্যবহারকারীর দায়িত্ব। অ্যাকাউন্টের অপব্যবহার বা অননুমোদিত কোনো কার্যক্রমের দায় ব্যবহারকারীর ওপর বর্তাবে।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">২. অনুমোদিত ব্যবহার</h2>
                <p className="text-slate-400">
                  ব্যবহারকারী কোনো প্রকার বেআইনি, ক্ষতিকর, আদালতের নির্দেশ বিরোধী বা কপিরাইট লঙ্ঘনকারী তথ্য এই প্ল্যাটফর্মে আপলোড করতে পারবেন না। প্ল্যাটফর্মের কোনো ক্ষতিসাধন বা রিভার্স-ইঞ্জিনিয়ারিংয়ের চেষ্টা সম্পূর্ণ নিষিদ্ধ।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">৩. দায়বদ্ধতার সীমাবদ্ধতা (Limitation of Liability)</h2>
                <p className="text-slate-400">
                  আমরা প্ল্যাটফর্মটি সার্বক্ষণিক সচল ও নির্ভুল রাখার সর্বোচ্চ চেষ্টা করি। তবে ইন্টারনেট সংযোগের ত্রুটি, ডিভাইস সমস্যা বা অনাকাঙ্ক্ষিত সার্ভার বিভ্রাটের কারণে মামলার তারিখ বা তথ্য প্রবেশে বিঘ্ন ঘটলে কোম্পানি কোনো আর্থিক বা আইনি ক্ষতিপূরণের দায় বহন করবে না।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">৪. আইনের আওতা ও এখতিয়ার</h2>
                <p className="text-slate-400">
                  এই শর্তাবলী গণপ্রজাতন্ত্রী বাংলাদেশের প্রচলিত আইন ও আদালত অনুযায়ী পরিচালিত এবং ব্যাখ্যায়িত হবে।
                </p>
              </div>

              <div className="space-y-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-900/50">
                <h2 className="text-lg font-bold text-indigo-300">৫. বিজ্ঞাপনদাতার একক দায় ও প্ল্যাটফর্মের দায়মুক্তি (Intermediary Safe Harbor)</h2>
                <p className="text-slate-300 text-xs leading-relaxed">
                  এমডিসি কেসবুক প্ল্যাটফর্ম বা এর অ্যাডমিন/কর্তৃপক্ষ কোনো বিজ্ঞাপনদাতার পণ্য, সেবা, ছবি, রাজনৈতিক বক্তব্য বা প্রচারণার জন্য দায়বদ্ধ নয়। গণপ্রজাতন্ত্রী বাংলাদেশের তথ্য ও যোগাযোগ প্রযুক্তি আইন, সাইবার নিরাপত্তা আইন এবং ডিজিটাল কন্টেন্ট ইন্টারমিডিয়ারি গাইডলাইন্স অনুসারে, যেকোনো বিজ্ঞাপনদাতা তার প্রদত্ত বিজ্ঞাপনের শতভাগ সত্যতা, কপিরাইট ও আইনি বৈধতার জন্য ব্যক্তিগতভাবে সম্পূর্ণ দায়ী থাকবেন। কোনো বিজ্ঞাপনে বেআইনি, ক্ষতিকর, অনৈতিক বা মিথ্যা উপাদান থাকলে তার আইনি পরিণতি বিজ্ঞাপনদাতার ওপরই বর্তাবে। এমডিসি কেসবুক বা অ্যাডমিন কোনোভাবেই কোনো তৃতীয় পক্ষের বিজ্ঞাপনের জন্য দায়ী বা যৌথভাবে দায়বদ্ধ থাকবে না।
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  রিফান্ড ও বাতিলকরণ নীতি (Refund & Cancellation Policy)
                </h1>
                <p className="text-xs text-slate-500">
                  সর্বশেষ হালনাগাদ: অক্টোবর ২০২৬
                </p>
              </div>

              <p className="text-slate-300">
                এমডিসি কেসবুক প্ল্যাটফর্মের প্রিমিয়াম সাবস্ক্রিপশন ও বিজ্ঞাপন ক্যাম্পেইন সংক্রান্ত পেমেন্টের ক্ষেত্রে আমাদের রিফান্ড নীতি নিচে সুস্পষ্টভাবে তুলে ধরা হলো।
              </p>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">১. সাবস্ক্রিপশন ও রিচার্জ ফি</h2>
                <p className="text-slate-400">
                  আমাদের ডিজিটাল সেবা তাৎক্ষণিকভাবে সক্রিয় হয়। একবার সফলভাবে সাবস্ক্রিপশন বা ওয়ালেট রিচার্জ সম্পন্ন হলে তা সাধারণত অফেরতযোগ্য (Non-refundable)। তবে কারিগরি কোনো ত্রুটির কারণে যদি টাকা কেটে নেওয়ার পরেও সেবা চালু না হয়, তবে আমাদের সাপোর্ট টিমের সাথে ৭ কার্যদিবসের মধ্যে যোগাযোগ করলে যাচাই সাপেক্ষে সম্পূর্ণ অর্থ ফেরত দেওয়া হবে।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">২. বিজ্ঞাপন ক্যাম্পেইন রিফান্ড</h2>
                <p className="text-slate-400">
                  বিজ্ঞাপনদাতা ড্যাশবোর্ডে ক্যাম্পেইন অনুমোদিত হয়ে রান হওয়ার পূর্বে যেকোনো সময় ক্যাম্পেইন বাতিল করে অব্যবহৃত বাজেট রিফান্ডের আবেদন করা যাবে। লাইভ রান হওয়া ইমপ্রেশন বা ক্লিকের জন্য ফি কর্তনযোগ্য।
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">৩. রিফান্ড পাওয়ার সময়সীমা</h2>
                <p className="text-slate-400">
                  অনুমোদিত রিফান্ডের অর্থ যে পেমেন্ট মেথড (যেমন বিকাশ, নগদ বা ব্যাংক কার্ড) দিয়ে প্রদান করা হয়েছিল, সেই একই মাধ্যমে ৫ থেকে ৭ কার্যদিবসের মধ্যে স্বয়ংক্রিয়ভাবে পৌঁছে যাবে।
                </p>
              </div>
            </div>
          )}

        </div>

        {/* AdSense Bottom Ad Banner */}
        <div className="mt-10">
          <GoogleAdSense />
        </div>

      </div>
    </div>
  );
};

export default LegalPages;
