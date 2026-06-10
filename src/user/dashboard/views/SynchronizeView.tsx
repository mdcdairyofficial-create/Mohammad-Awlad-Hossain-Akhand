import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  HelpCircle,
  Clock,
  PhoneCall,
  User,
  History
} from 'lucide-react';
import { fetchWithAuth } from '../../../lib/api';

interface SynchronizeViewProps {
  language: string;
  userMobile: string;
  userId?: string | number;
}

export default function SynchronizeView({ language, userMobile, userId }: SynchronizeViewProps) {
  const [secondaryMobile, setSecondaryMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkedMobiles, setLinkedMobiles] = useState<string[]>([]);
  const [isFetchingLinked, setIsFetchingLinked] = useState(false);

  // Fetch the current user profile to get linked/synchronized mobile numbers
  const fetchLinkedMobiles = async () => {
    if (!userId) return;
    setIsFetchingLinked(true);
    try {
      const response = await fetchWithAuth(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const user = data.user || data;
        if (user && Array.isArray(user.linked_mobiles)) {
          setLinkedMobiles(user.linked_mobiles);
        } else if (user && Array.isArray(user.linkedMobiles)) {
          setLinkedMobiles(user.linkedMobiles);
        }
      }
    } catch (err) {
      console.error("[SynchronizeView] Error fetching user profile for linked mobiles:", err);
    } finally {
      setIsFetchingLinked(false);
    }
  };

  useEffect(() => {
    fetchLinkedMobiles();
  }, [userId]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secondaryMobile.trim()) {
      setErrorMsg(language === 'bn' ? 'দয়া করে দ্বিতীয় মোবাইল নম্বরটি লিখুন।' : 'Please enter the secondary mobile number.');
      return;
    }
    if (!password) {
      setErrorMsg(language === 'bn' ? 'দয়া করে দ্বিতীয় অ্যাকাউন্টের পাসওয়ার্ডটি লিখুন।' : 'Please enter the secondary account password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchWithAuth('/api/auth/sync-mobiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secondaryMobile: secondaryMobile.trim(),
          password: password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'bn' ? 'সিঙ্ক্রোনাইজ করতে সমস্যা হয়েছে।' : 'Failed to synchronize mobile numbers.'));
      }

      setSuccessMsg(data.message || (language === 'bn' ? 'সফলভাবে সিঙ্ক্রোনাইজ করা হয়েছে!' : 'Synchronized successfully!'));
      setSecondaryMobile('');
      setPassword('');
      fetchLinkedMobiles(); // Reload list
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[32px] text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase tracking-widest mb-6">
            <RefreshCw size={14} className="animate-spin duration-3000" />
            {language === 'bn' ? 'মোবাইল নম্বর সিঙ্ক্রোনাইজেশন' : 'MOBILE SYNCHRONIZATION'}
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            {language === 'bn' 
              ? 'আপনার একাধিক মোবাইল নম্বর এক আইডিতে যুক্ত করুন' 
              : 'Link Multiple Mobile Numbers to One Main Account'}
          </h2>
          <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed mb-6">
            {language === 'bn'
              ? 'আপনার যদি এই প্ল্যাটফর্মে একাধিক সচল বা পূর্ববর্তী মোবাইল নম্বর অ্যাকাউন্ট থেকে থাকে, তবে আপনি এখানে খুব সহজেই সেই অ্যাকাউন্টগুলোকে আপনার বর্তমান মূল আইডির সাথে সিঙ্ক/মার্জ করে নিতে পারবেন। সিঙ্ক করার ফলে পূর্বের সব মামলা, পয়েন্ট এবং ওয়ালেট ব্যালেন্স আপনার এই মূল আইডিতে চলে আসবে।'
              : 'If you have multiple accounts registered with different mobile numbers, you can merge them into this primary account. All previous cases, commission points, and wallet balances will be consolidated successfully.'}
          </p>

          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Shield size={14} className="text-emerald-400" />
              {language === 'bn' ? 'নিরাপদ মার্জিং সিস্টেম' : 'Secure Consolidation'}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/50">
              <CheckCircle2 size={14} className="text-indigo-400" />
              {language === 'bn' ? 'ইনস্ট্যান্ট পয়েন্ট স্থানান্তর' : 'Instant Point Merging'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <RefreshCw size={20} className="text-indigo-500" />
              {language === 'bn' ? 'নতুন মোবাইল নম্বর সিঙ্ক করুন' : 'Consolidate Another Mobile'}
            </h3>

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800"
              >
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm font-semibold">{successMsg}</div>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm font-semibold">{errorMsg}</div>
              </motion.div>
            )}

            <form onSubmit={handleSync} className="space-y-5">
              {/* Active Primary Mobile info */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {language === 'bn' ? 'বর্তমান মূল আইডি নম্বর (Primary)' : 'CURRENT PRIMARY PHONE'}
                </p>
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-indigo-500" />
                  <span className="font-mono text-lg font-bold text-slate-800">{userMobile}</span>
                  <span className="ml-auto bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                    {language === 'bn' ? 'প্রধান আইডি' : 'Main ID'}
                  </span>
                </div>
              </div>

              {/* Secondary Mobile input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  {language === 'bn' ? 'দ্বিতীয় মোবাইল নম্বর (যা যুক্ত করতে চান)' : 'Secondary Mobile Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="tel"
                    value={secondaryMobile}
                    onChange={(e) => setSecondaryMobile(e.target.value)}
                    placeholder={language === 'bn' ? 'উদাঃ 017XXXXXXXX' : 'e.g. 017XXXXXXXX'}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-medium text-slate-800"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password of secondary account input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  {language === 'bn' ? 'দ্বিতীয় অ্যাকাউন্টের পাসওয়ার্ড' : 'Secondary Account Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {language === 'bn' 
                    ? '* অপব্যবহার রোধে দ্বিতীয় অ্যাকাউন্টটির মালিকানা প্রমাণে পাসওয়ার্ড দেওয়া বাধ্যতামূলক।' 
                    : '* To prevent misuse, entering the secondary account password is required.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{language === 'bn' ? 'প্রসেস করা হচ্ছে...' : 'Processing Sync...'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    <span>{language === 'bn' ? 'সিঙ্ক্রোনাইজ করুন' : 'Synchronize Now'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Synchronized list */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm h-full flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History size={18} className="text-indigo-500" />
                {language === 'bn' ? 'সিঙ্ক্রোনাইজড নম্বরসমূহ' : 'Linked Phone Numbers'}
              </h3>

              <div className="space-y-3">
                {/* Always show primary */}
                <div className="relative overflow-hidden p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-slate-800 font-mono font-bold">{userMobile}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">
                      {language === 'bn' ? 'প্রাথমিক মোবাইল নম্বর' : 'Primary Mobile'}
                    </p>
                  </div>
                </div>

                {/* Show any other synchronized/linked mobiles */}
                {isFetchingLinked ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    <RefreshCw size={14} className="animate-spin inline mr-1" />
                    {language === 'bn' ? 'লোড করা হচ্ছে...' : 'Loading linked phones...'}
                  </div>
                ) : linkedMobiles.length > 0 ? (
                  linkedMobiles.map((mob, idx) => (
                    <motion.div 
                      key={mob + idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 flex items-center gap-3"
                    >
                      <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <p className="text-slate-800 font-mono font-bold">{mob}</p>
                        <p className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">
                          {language === 'bn' ? 'সফলভাবে মার্জ করা সচল নম্বর' : 'Successfully Merged'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Smartphone size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-semibold">
                      {language === 'bn' ? 'এখনো কোনো অতিরিক্ত নম্বর যুক্ত করা হয়নি।' : 'No additional phone numbers linked yet.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex gap-2.5 items-start">
                <HelpCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs font-medium text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">
                    {language === 'bn' ? 'কি কি স্থানান্তরিত হয়?' : 'What gets consolidated?'}
                  </span>
                  <p className="mt-1">
                    {language === 'bn'
                      ? 'দ্বি-মুখী সিঙ্কে পূর্বের অ্যাকাউন্টের কমিশন পয়েন্ট, ক্যাশ ব্যালেন্স এবং তৈরি করা সকল মামলার মালিকানা এই আইডির সাথে যুক্ত হয়।'
                      : 'All points, existing wallet cash balances, and associated court cases will transfer automatically.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
