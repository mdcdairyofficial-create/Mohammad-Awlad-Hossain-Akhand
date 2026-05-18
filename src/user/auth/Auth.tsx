import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, MapPin, Phone, ArrowRight, Gavel, Briefcase, Users, ChevronDown, Globe, Eye, EyeOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BANGLADESH_DISTRICTS, INDIA_DISTRICTS, PAKISTAN_DISTRICTS, COUNTRY_CODES, getPoliceStations } from '../../constants';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { UserRole } from '../../types';
import { Logo } from '../../components/Logo';
import { fetchWithAuth } from '../../lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



interface AuthProps {
  onAuthSuccess: (profile: { 
    id?: number; 
    firebaseUid?: string;
    fullName: string; 
    userType: UserRole; 
    mobile: string; 
    district: string; 
    country: string; 
    referralCode?: string 
  }) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [resetMode, setResetMode] = useState(false);
  const [userType, setUserType] = useState<UserRole>('lawyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref') || '';

  const [formData, setFormData] = useState({
    fullName: '',
    country: 'Bangladesh',
    district: '',
    thana: '',
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
      ...(name === 'country' ? { district: '' } : {})
    }));
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const response = await fetchWithAuth('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          fullName: user.displayName,
          email: user.email,
          profilePicture: user.photoURL,
          userType: userType,
          country: 'Bangladesh'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Store in Firestore for complete backup
      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...data.user,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }

      setLoading(false);
      onAuthSuccess(data.user);
    } catch (err: any) {
      setLoading(false);
      // Ignore if user intentionally closed the popup
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      setError(err.message || 'গুগল লগইন ব্যর্থ হয়েছে');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let inputVal = formData.mobile.trim();
      const isEmail = inputVal.includes('@');
      
      let cleanMobile = inputVal;
      if (!isEmail) {
        // Remove all non-numeric characters except +
        cleanMobile = inputVal.replace(/[^\d+]/g, '');
        // If it starts with +880, 880, +91, 91, etc., strip the country code for the firebase email
        // We'll normalize to the 10-digit number for the virtual email key
        if (cleanMobile.startsWith('+880')) cleanMobile = cleanMobile.substring(4);
        else if (cleanMobile.startsWith('880')) cleanMobile = cleanMobile.substring(3);
        else if (cleanMobile.startsWith('+91')) cleanMobile = cleanMobile.substring(3);
        else if (cleanMobile.startsWith('91')) cleanMobile = cleanMobile.substring(2);
        else if (cleanMobile.startsWith('+92')) cleanMobile = cleanMobile.substring(3);
        else if (cleanMobile.startsWith('92')) cleanMobile = cleanMobile.substring(2);
        
        // Remove leading 0 if any
        cleanMobile = cleanMobile.replace(/^0+/, '');
      }
      
      const countryCode = COUNTRY_CODES[formData.country] || '+880';
      const fullMobile = isEmail ? cleanMobile : `${countryCode}${cleanMobile}`;
      
      // Virtual email for Firebase Auth - always use the cleaned 10-digit number to be consistent
      const firebaseEmail = isEmail ? cleanMobile : `${cleanMobile}@auth.local`;
      console.log(`[Auth] Normalizing: Input=${inputVal}, IsEmail=${isEmail}, CleanMobile=${cleanMobile}, FirebaseEmail=${firebaseEmail}`);

      if (resetMode) {
        try {
          console.log(`[Auth] Sending password reset to: ${firebaseEmail}`);
          await sendPasswordResetEmail(auth, firebaseEmail);
          setSuccess("পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে (অথবা ভার্চুয়াল সিস্টেমে লগইন করুন)।");
        } catch (e: any) {
          console.error("[Auth] Reset error:", e);
          throw new Error("এই নম্বর বা ইমেইলটি আমাদের সিস্টেমে পাওয়া যায়নি।");
        }
        setLoading(false);
        return;
      }

      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('পাসওয়ার্ড দুটি মিলছে না');
        }
        
        // 1. Firebase Auth Registration
        console.log(`[Auth] Registering with: ${firebaseEmail}`);
        const userCred = await createUserWithEmailAndPassword(auth, firebaseEmail, formData.password);
        const fbUser = userCred.user;

        // 2. Server Profile Registration (SQLite)
        console.log(`[Auth] Syncing registration to server for UID: ${fbUser.uid}`);
        const response = await fetchWithAuth('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: fbUser.uid,
            fullName: formData.fullName,
            mobile: fullMobile,
            email: formData.email || null,
            password: formData.password,
            userType: userType,
            district: formData.district,
            thana: formData.thana,
            country: formData.country,
            referredBy: formData.referredBy
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 3. Firestore Backup
        const userToSaveFirestore = {
          firebase_uid: data.user.firebase_uid,
          name: data.user.fullName,
          email: data.user.email,
          mobile: data.user.mobile,
          user_type: data.user.userType,
          district: data.user.district,
          thana: data.user.thana,
          country: data.user.country,
          referral_code: data.user.referralCode || '',
          referred_by: data.user.referredBy || '',
          is_approved: false,
          wallet_balance: 0,
          points: 0,
          ai_questions_count: 0,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, 'users', fbUser.uid), userToSaveFirestore);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${fbUser.uid}`);
        }

        setLoading(false);
        onAuthSuccess(data.user);
      } else {
        // 1. Firebase Auth Login
        let userCred;
        try {
          console.log(`[Auth] Logging in with: ${firebaseEmail}`);
          userCred = await signInWithEmailAndPassword(auth, firebaseEmail, formData.password);
        } catch (err: any) {
          console.warn("[Auth] Primary login failed:", err.code, err.message);
          // Fallback: try with a slightly different normalization if it was not an email
          if (!isEmail) {
            // Try removing country code but keeping the zero or vice-versa, depending on how they registered
            const firebaseEmailWithZero = `${inputVal.replace(/[^\d+]/g, '').replace(/^\+880/, '0')}@auth.local`;
            console.log(`[Auth] Trying fallback normalization: ${firebaseEmailWithZero}`);
            try {
              userCred = await signInWithEmailAndPassword(auth, firebaseEmailWithZero, formData.password);
            } catch (fallbackErr: any) {
              console.error("[Auth] Fallback login also failed:", fallbackErr.code);
              throw fallbackErr;
            }
          } else {
            throw err;
          }
        }
        const fbUser = userCred.user;

        // 2. Server Sync
        console.log(`[Auth] Syncing login session for UID: ${fbUser.uid}`);
        const response = await fetchWithAuth('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: fbUser.uid,
            email: fbUser.email,
            mobile: fullMobile,
            userType: userType,
            fullName: fbUser.displayName,
            profilePicture: fbUser.photoURL
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        setLoading(false);
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      
      // Update form state: clear password fields on error
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

      const errorCode = err.code || '';
      
      if (errorCode === 'auth/email-already-in-use') {
        setError('এই ইমেইল বা নম্বরটি দিয়ে আগে থেকেই অ্যাকাউন্ট আছে। লগইন করুন।');
        setTimeout(() => setIsLogin(true), 3000);
      } else if (errorCode === 'auth/invalid-email') {
        setError('সঠিক ইমেইল বা মোবাইল নম্বর দিন।');
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        if (formData.mobile.includes('gmail.com') || formData.mobile.includes('yahoo.com')) {
           setError('পাসওয়ার্ড ভুল হতে পারে অথবা আপনি গুগল দিয়ে অ্যাকাউন্ট খুলেছেন। দয়া করে "গুগল দিয়ে লগইন" বাটনটি চেষ্টা করুন।');
        } else {
           setError('মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়। দয়া করে আবার যাচাই করুন।');
        }
      } else if (errorCode === 'auth/too-many-requests') {
        setError('অতিরিক্ত বার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      } else {
        setError(err.message || 'লগইন করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।');
      }
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
          <div className="flex justify-center mb-10">
            <Logo size="xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
            {resetMode ? 'পাসওয়ার্ড রিসেট' : (isLogin ? 'স্বাগতম!' : 'নতুন অ্যাকাউন্ট তৈরি করুন')}
          </h2>
          <p className="text-center text-slate-500 mb-8 font-medium">
            {resetMode ? 'আপনার মোবাইল নম্বর বা ইমেইল দিন' : (isLogin ? 'আপনার তথ্য দিয়ে লগইন করুন' : 'নিচে আপনার সঠিক তথ্য প্রদান করুন')}
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

            {!resetMode && (
              <>
                <div className="bg-slate-50 p-2 rounded-2xl flex flex-wrap gap-2 mb-2 border border-slate-200">
                  {([ 'lawyer', 'clerk', 'client', 'bar_association', 'advertiser'] as UserRole[]).map((type) => (
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
                        <div className="flex items-center gap-2 text-center">
                          <span className="font-bold text-[10px]">
                            {type === 'lawyer' ? 'আইনজীবী' : 
                             type === 'clerk' ? 'মুহুরী' : 
                             type === 'client' ? 'পক্ষ' :
                             type === 'bar_association' ? 'বার অ্যাসোসিয়েশন' : 'বিজ্ঞাপনদাতা'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!resetMode && !isLogin && (
              <>

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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ইমেইল আইডি"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
                    <option value="" disabled>জেলা নির্বাচন করুন</option>
                    {BANGLADESH_DISTRICTS.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>

                {formData.district && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                    <select
                      name="thana"
                      value={formData.thana}
                      onChange={handleChange}
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700"
                      required={formData.country === 'Bangladesh'}
                    >
                      <option value="">থানা নির্বাচন করুন</option>
                      {getPoliceStations(formData.district, formData.country).map((thana) => (
                        <option key={thana} value={thana}>{thana}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                )}
              </>
            )}

            {!resetMode && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="পাসওয়ার্ড"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {!resetMode && !isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="পাসওয়ার্ড নিশ্চিত করুন"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 font-bold tracking-wide"
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

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-medium">অথবা</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              গুগল দিয়ে লগইন করুন
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setResetMode(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-indigo-600 font-bold hover:underline mb-4 block w-full"
            >
              {resetMode ? 'লগইন পেজে ফিরে যান' : (isLogin ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন')}
            </button>
            <div className="text-xs text-slate-400 space-x-2">
              <a href="/TermsOfService_BN.md" target="_blank" className="hover:text-indigo-600 font-medium">শর্তাবলী</a>
              <span>•</span>
              <a href="/PrivacyPolicy_BN.md" target="_blank" className="hover:text-indigo-600 font-medium">গোপনীয়তা নীতি</a>
              <span>•</span>
              <a href="/RefundPolicy_BN.md" target="_blank" className="hover:text-indigo-600 font-medium">রিফান্ড নীতি</a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
