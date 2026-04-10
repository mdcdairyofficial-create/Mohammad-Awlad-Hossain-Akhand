import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, MapPin, Phone, ArrowRight, Gavel, Briefcase, Users, ChevronDown, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BANGLADESH_DISTRICTS, INDIA_DISTRICTS, PAKISTAN_DISTRICTS, COUNTRY_CODES } from '../../constants';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type UserType = 'lawyer' | 'clerk' | 'client' | 'admin';

interface AuthProps {
  onAuthSuccess: (profile: { id?: number; fullName: string; userType: 'lawyer' | 'clerk' | 'client' | 'admin'; mobile: string; district: string; country: string; referralCode?: string }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [userType, setUserType] = useState<'lawyer' | 'clerk' | 'client' | 'admin'>('lawyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get referral code from URL if exists
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref') || '';

  const [formData, setFormData] = useState({
    fullName: '',
    country: 'Bangladesh',
    district: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    referredBy: refCode,
    newPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'country' ? { district: '' } : {}) // Reset district when country changes
    }));
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user.displayName,
          email: user.email,
          profilePicture: user.photoURL,
          userType: userType,
          district: formData.district || 'ঢাকা',
          country: formData.country || 'Bangladesh',
          referredBy: formData.referredBy
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'গুগল লগইন ব্যর্থ হয়েছে');
      }

      setLoading(false);
      onAuthSuccess(data.user);
    } catch (err: any) {
      setLoading(false);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error or log it
        return;
      }
      
      console.error(err);
      
      if (err.code === 'auth/unauthorized-domain') {
        setError('এই ডোমেইনটি ফায়ারবেস এ অনুমোদিত নয়।');
      } else if (err.message && err.message.includes('deleted_client')) {
        setError('গুগল লগইন কনফিগারেশনে সমস্যা আছে (OAuth client deleted)। দয়া করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
      } else {
        setError(err.message || 'গুগল লগইন করার সময় সমস্যা হয়েছে');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (resetMode) {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile: formData.mobile,
            newPassword: formData.newPassword
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে');
        }

        setSuccess(data.message);
        setResetMode(false);
        setLoading(false);
        return;
      }

      let cleanMobile = formData.mobile.trim();
      const isEmail = cleanMobile.includes('@');
      
      if (!isEmail) {
        cleanMobile = cleanMobile.replace(/[\s-]/g, '');
      }
      
      // Remove any leading + or country code if user accidentally typed it
      const countryCode = COUNTRY_CODES[formData.country] || '+880';
      if (!isEmail && cleanMobile.startsWith(countryCode)) {
        cleanMobile = cleanMobile.substring(countryCode.length);
      } else if (!isEmail && cleanMobile.startsWith(countryCode.substring(1))) {
        cleanMobile = cleanMobile.substring(countryCode.length - 1);
      }
      
      const fullMobile = isEmail ? cleanMobile : `${countryCode}${cleanMobile.replace(/^0+/, '')}`;

      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('পাসওয়ার্ড দুটি মিলছে না');
        }
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            mobile: fullMobile,
            email: formData.email,
            password: formData.password,
            userType: userType,
            district: formData.district,
            country: formData.country,
            referredBy: formData.referredBy
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
        }

        setLoading(false);
        onAuthSuccess(data.user);
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile: fullMobile,
            rawMobile: formData.mobile.trim(),
            password: formData.password
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে');
        }

        setLoading(false);
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'কিছু একটা ভুল হয়েছে');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl">
              <Gavel className="text-white" size={32} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
            {resetMode ? 'পাসওয়ার্ড রিসেট' : (isLogin ? 'স্বাগতম!' : 'নতুন অ্যাকাউন্ট তৈরি করুন')}
          </h2>
          <p className="text-center text-slate-500 mb-8">
            {resetMode ? 'আপনার মোবাইল নম্বর বা ইমেইল এবং নতুন পাসওয়ার্ড দিন' : (isLogin ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'জয়েন করুন কিংবা সাইন আপ করুন আর ফ্রি সাবস্ক্রিপশন নিন।')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm font-medium border border-green-100">
                {success}
              </div>
            )}
            
            {!resetMode && (
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700"
                  required
                >
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="India">India</option>
                  <option value="Pakistan">Pakistan</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            )}

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              {!resetMode && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-500 font-medium border-r border-slate-200 pr-2">
                  {COUNTRY_CODES[formData.country] || '+880'}
                </div>
              )}
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder={resetMode ? "মোবাইল নম্বর বা ইমেইল" : (isLogin ? "মোবাইল নম্বর বা ইমেইল" : "মোবাইল নম্বর")}
                className={cn("w-full pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all", !resetMode ? "pl-24" : "pl-11")}
                required
              />
            </div>

            {!resetMode && !isLogin && (
              <>
                {/* User Type Toggle */}
                <div className="bg-slate-50 p-2 rounded-2xl flex flex-wrap gap-2 mb-6 border border-slate-200">
                  {(['lawyer', 'clerk', 'client'] as UserType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className={cn(
                        "flex-1 min-w-[80px] py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 border-2",
                        userType === type 
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md" 
                          : "bg-white/50 border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-300"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          {type === 'lawyer' && <Briefcase size={16} />}
                          {type === 'clerk' && <User size={16} />}
                          {type === 'client' && <Users size={16} />}
                          <span className="font-bold">
                            {type === 'lawyer' ? 'উকিল' : type === 'clerk' ? 'মুহুরী' : 'পক্ষ'}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-70 font-normal">
                          {type === 'lawyer' ? 'আইনজীবী' : type === 'clerk' ? 'সহকারী' : 'সেবা গ্রহীতা'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="পুরো নাম"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700"
                    required
                  >
                    <option value="" disabled>{formData.country === 'Bangladesh' ? 'জেলা নির্বাচন করুন' : 'Select State/Province'}</option>
                    {(formData.country === 'India' ? INDIA_DISTRICTS : formData.country === 'Pakistan' ? PAKISTAN_DISTRICTS : BANGLADESH_DISTRICTS).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </>
            )}

            {!resetMode && !isLogin && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ইমেইল (ঐচ্ছিক)"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            {!resetMode && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="পাসওয়ার্ড"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            {resetMode && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="নতুন পাসওয়ার্ড"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            {isLogin && !resetMode && (
              <div className="text-right">
                <button 
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
            )}

            {!resetMode && !isLogin && (
              <>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    name="referredBy"
                    value={formData.referredBy}
                    onChange={handleChange}
                    placeholder="রেফারেল কোড (ঐচ্ছিক)"
                    className={cn(
                      "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all",
                      formData.referredBy === 'SUPERADMIN2026' && "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                    )}
                  />
                  {formData.referredBy === 'SUPERADMIN2026' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 text-[10px] font-bold">
                      ADMIN ACCESS
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {resetMode ? 'পাসওয়ার্ড রিসেট করুন' : (isLogin ? 'লগইন করুন' : 'সাইন আপ করুন')}
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            {!resetMode && (
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500 font-medium">অথবা</span>
                </div>
              </div>
            )}

            {!resetMode && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                গুগল দিয়ে লগইন করুন
              </button>
            )}
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setResetMode(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-indigo-600 font-medium hover:underline mb-4 block w-full"
            >
              {resetMode ? 'লগইন পেজে ফিরে যান' : (isLogin ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন')}
            </button>
            
            <div className="text-xs text-slate-400 space-x-2">
              <a href="/TermsOfService_BN.md" target="_blank" className="hover:text-indigo-600">শর্তাবলী</a>
              <span>•</span>
              <a href="/PrivacyPolicy_BN.md" target="_blank" className="hover:text-indigo-600">গোপনীয়তা নীতি</a>
              <span>•</span>
              <a href="/RefundPolicy_BN.md" target="_blank" className="hover:text-indigo-600">রিফান্ড নীতি</a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
