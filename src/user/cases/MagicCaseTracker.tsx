import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Bell, 
  BellRing, 
  CheckCircle2, 
  Share2, 
  Copy, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Download, 
  Check, 
  AlertCircle, 
  BookmarkCheck,
  ChevronRight,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Case } from '../../types';
import { 
  checkNotificationSupport, 
  getNotificationPermission, 
  subscribeCasePushNotification, 
  sendLocalNotification, 
  isCaseSubscribed 
} from '../../lib/pushNotifications';

interface MagicCaseTrackerProps {
  trackQuery?: string;
  onGoToAuth?: () => void;
  onGoToDashboard?: () => void;
  isLoggedIn?: boolean;
}

export default function MagicCaseTracker({
  trackQuery,
  onGoToAuth,
  onGoToDashboard,
  isLoggedIn = false
}: MagicCaseTrackerProps) {
  const [targetId, setTargetId] = useState<string>(() => {
    if (trackQuery) return trackQuery;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('track') || params.get('caseId') || params.get('case') || '';
    }
    return '';
  });

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isPushActive, setIsPushActive] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Fetch case details
  useEffect(() => {
    if (!targetId) {
      setIsLoading(false);
      setError('কোনো মামলার ট্র্যাকিং আইডি পাওয়া যায়নি।');
      return;
    }

    let isMounted = true;
    const fetchCase = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Check local storage cache first
        const cached = localStorage.getItem(`track_cache_${targetId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (isMounted) setCaseData(parsed);
          } catch {}
        }

        // 2. Fetch directly from Firestore by Doc ID
        const docRef = doc(db, 'cases', targetId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && isMounted) {
          const data = { id: docSnap.id, ...docSnap.data() } as Case;
          setCaseData(data);
          localStorage.setItem(`track_cache_${targetId}`, JSON.stringify(data));
          setIsLoading(false);
          return;
        }

        // 3. Fallback: Search by caseNumber if targetId wasn't the doc id
        const q = query(collection(db, 'cases'), where('caseNumber', '==', targetId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty && isMounted) {
          const first = qSnap.docs[0];
          const data = { id: first.id, ...first.data() } as Case;
          setCaseData(data);
          localStorage.setItem(`track_cache_${targetId}`, JSON.stringify(data));
          setIsLoading(false);
          return;
        }

        // 4. Fallback: Check local appCases in case user is in offline mode
        const localCasesStr = localStorage.getItem('appCases');
        if (localCasesStr) {
          const list: Case[] = JSON.parse(localCasesStr);
          const found = list.find(c => String(c.id) === targetId || c.caseNumber === targetId);
          if (found && isMounted) {
            setCaseData(found);
            setIsLoading(false);
            return;
          }
        }

        if (isMounted) {
          setError('মামলাটি পাওয়া যায়নি অথবা লিঙ্কটি সঠিক নয়। আপনার আইনজীবীর সাথে যোগাযোগ করুন।');
        }
      } catch (err: any) {
        console.error('Error fetching case:', err);
        if (isMounted) {
          // If Firestore quota or offline, fallback to cached
          const cached = localStorage.getItem(`track_cache_${targetId}`);
          if (cached) {
            setCaseData(JSON.parse(cached));
          } else {
            setError('মামলার তথ্য লোড করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCase();

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  // Check push subscription status
  useEffect(() => {
    if (caseData?.id) {
      const subscribed = isCaseSubscribed(caseData.id);
      setIsPushActive(subscribed);
    }
  }, [caseData]);

  // Handle push subscription
  const handleEnablePush = async () => {
    if (!caseData) return;
    setIsPushLoading(true);
    setPushFeedback(null);

    const res = await subscribeCasePushNotification({
      caseId: String(caseData.id),
      caseNumber: caseData.caseNumber,
      courtName: caseData.courtName || caseData.court,
      clientMobile: caseData.petitionerMobile || caseData.respondentMobile
    });

    setIsPushLoading(false);
    setPushFeedback(res.message);

    if (res.success) {
      setIsPushActive(true);
    }
  };

  // Test push notification
  const handleTestNotification = () => {
    if (!caseData) return;
    sendLocalNotification('MDC Casebook টেস্ট এলার্ট 🔔', {
      body: `মামলা নং ${caseData.caseNumber}: আপনার নোটিফিকেশন ১০০% সক্রিয় রয়েছে। পরবর্তী তারিখ: ${caseData.nextDate || 'শীঘ্রই'}`
    });
    setPushFeedback('✅ আপনার ফোনে সফলভাবে টেস্ট নোটিফিকেশন পাঠানো হয়েছে!');
    setTimeout(() => setPushFeedback(null), 4000);
  };

  // Handle PWA Install
  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('আপনার ব্রাউজার মেনু থেকে "Add to Home Screen" বা "অ্যাপ ইনস্টল করুন" সিলেক্ট করুন।');
    }
  };

  // Copy tracking link
  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!caseData || typeof window === 'undefined') return;
    const msg = `📋 মামলা নং: ${caseData.caseNumber}
🏛️ আদালত: ${caseData.courtName || caseData.court || 'বিজ্ঞ আদালত'}
📅 পরবর্তী ধার্য তারিখ: ${caseData.nextDate || 'নির্ধারিত নয়'}
📝 আদেশ / পদক্ষেপ: ${caseData.order || 'আদেশ'}

🔔 সরাসরি মামলার অবস্থা দেখতে ও নোটিফিকেশন পেতে লিংকে ক্লিক করুন:
${window.location.href}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Claim or Save case to user account
  const handleClaimCase = () => {
    if (!caseData) return;
    localStorage.setItem('pending_claim_case', String(caseData.id));
    localStorage.setItem('registration_target_role', 'client');
    setClaimedSuccess(true);

    if (isLoggedIn && onGoToDashboard) {
      onGoToDashboard();
    } else if (onGoToAuth) {
      onGoToAuth();
    } else {
      window.location.href = '/?role=client';
    }
  };

  // Calculate days remaining
  const calculateDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'আজকে ধার্য তারিখ';
    if (diffDays === 1) return 'আগামীকাল শুনানির দিন';
    if (diffDays > 1) return `আর ${diffDays} দিন বাকি`;
    return `${Math.abs(diffDays)} দিন পূর্বে অতিক্রান্ত`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-5 select-none font-sans">
      
      {/* Top Branding Header */}
      <header className="w-full max-w-xl flex items-center justify-between py-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Scale size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              MDC Casebook
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                ভেরিফায়েড
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">স্মার্ট ডিজিটাল কেস ট্র্যাকার ও এলার্ট</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button
              onClick={onGoToDashboard || (() => window.location.href = '/')}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              ড্যাশবোর্ড
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.setItem('registration_target_role', 'client');
                if (caseData?.id) {
                  localStorage.setItem('pending_claim_case', String(caseData.id));
                }
                if (onGoToAuth) onGoToAuth();
                else window.location.href = '/?role=client';
              }}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              লগইন / সাইন-আপ
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl flex flex-col gap-4 pb-12">
        {isLoading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-300">মামলার তথ্য যাচাই করা হচ্ছে...</p>
            <p className="text-xs text-slate-500">বিজ্ঞ আদালতের ডাটাবেস থেকে হালনাগাদ তথ্য আসছে</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-6 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle size={26} />
            </div>
            <h3 className="text-base font-bold text-rose-300">মামলার তথ্য পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-300 max-w-md">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              হোম পেজে ফিরে যান
            </button>
          </div>
        ) : caseData ? (
          <>
            {/* 1. Case Number & Status Hero Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-750 rounded-3xl p-5 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {caseData.caseType || 'ফৌজদারী / দেওয়ানী'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1.5 tracking-tight">
                    {caseData.caseNumber}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">আদালত</span>
                  <p className="text-xs font-bold text-slate-200 line-clamp-1 max-w-[180px]">
                    {caseData.courtName || caseData.court || 'বিজ্ঞ আদালত'}
                  </p>
                </div>
              </div>

              {/* Next Date Highlight Box */}
              <div className="mt-4 bg-gradient-to-r from-emerald-950/70 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex flex-col items-center justify-center shrink-0">
                    <Calendar size={18} />
                    <span className="text-[9px] font-black uppercase mt-0.5">তারিখ</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">পরবর্তী ধার্য তারিখ</p>
                      {caseData.nextDate && (
                        <span className="text-[9.5px] font-extrabold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                          {calculateDaysRemaining(caseData.nextDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-black text-white mt-0.5">
                      {caseData.nextDate || 'তারিখ নির্ধারিত নয়'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block">কার্যক্রম / পদক্ষেপ</span>
                  <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block mt-0.5">
                    {caseData.order || 'শুনানি / আদেশ'}
                  </span>
                </div>
              </div>

              {/* Parties summary */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-emerald-400">বাদী / আবেদনকারী:</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                    {caseData.petitioner || 'বাদী পক্ষ'}
                  </p>
                  {caseData.petitionerMobile && (
                    <p className="text-[10px] text-slate-400 mt-0.5">📱 {caseData.petitionerMobile}</p>
                  )}
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] font-bold text-rose-400">বিবাদী / আসামী:</p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                    {caseData.respondent || 'বিবাদী পক্ষ'}
                  </p>
                  {caseData.respondentMobile && (
                    <p className="text-[10px] text-slate-400 mt-0.5">📱 {caseData.respondentMobile}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. SMART WEB PUSH NOTIFICATION ENABLER CARD (THE GAME CHANGER) */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-slate-900 border border-blue-500/30 rounded-3xl p-5 shadow-lg">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                  {isPushActive ? <BellRing size={22} className="animate-pulse" /> : <Bell size={22} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      স্বয়ংক্রিয় মোবাইল পুশ নোটিফিকেশন
                    </h3>
                    {isPushActive && (
                      <span className="text-[9.5px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={11} className="stroke-[3]" /> সক্রিয়
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    আদালতের যেকোনো পরবর্তী তারিখ, আদেশ পরিবর্তন বা নতুন আপডেট আসার সাথে সাথে আপনার মোবাইলে স্বয়ংক্রিয় এলার্ট পৌঁছে যাবে।
                  </p>

                  {/* Feedback message */}
                  {pushFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                      <span>{pushFeedback}</span>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    {isPushActive ? (
                      <button
                        onClick={handleTestNotification}
                        className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <BellRing size={14} />
                        টেস্ট নোটিফিকেশন পাঠান
                      </button>
                    ) : (
                      <button
                        onClick={handleEnablePush}
                        disabled={isPushLoading}
                        className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer font-sans"
                      >
                        {isPushLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                            সক্রিয় হচ্ছে...
                          </>
                        ) : (
                          <>
                            <Bell size={15} className="stroke-[2.5]" />
                            ১-ট্যাপে নোটিফিকেশন চালু করুন (বিনামূল্যে)
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleCopyLink}
                      className="text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copiedLink ? 'লিংক কপি হয়েছে!' : 'লিংক কপি করুন'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. LAWYER / CHAMBER DIRECT CONTACT CARD */}
            {(caseData.petitionerLawyer || caseData.respondentLawyer) && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-indigo-400" />
                    <h4 className="text-xs sm:text-sm font-black text-white">বিজ্ঞ আইনজীবী ও চেম্বার তথ্য</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">অফিসিয়াল প্রতিনিধি</span>
                </div>

                <div className="bg-slate-850 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-black text-white">
                      {caseData.petitionerLawyer || caseData.respondentLawyer}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      বিজ্ঞ আইনজীবী, {caseData.courtName || caseData.court || 'জজ কোর্ট'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Call button */}
                    {(caseData.petitionerLawyerMobile || caseData.respondentLawyerMobile) && (
                      <a
                        href={`tel:${Array.isArray(caseData.petitionerLawyerMobile) ? caseData.petitionerLawyerMobile[0] : caseData.petitionerLawyerMobile || caseData.respondentLawyerMobile}`}
                        className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center hover:bg-blue-600/30 transition-all"
                        title="আইনজীবীকে কল করুন"
                      >
                        <Phone size={16} />
                      </a>
                    )}

                    {/* WhatsApp button */}
                    <button
                      onClick={() => {
                        const rawMobile = Array.isArray(caseData.petitionerLawyerMobile) 
                          ? caseData.petitionerLawyerMobile[0] 
                          : (caseData.petitionerLawyerMobile || caseData.respondentLawyerMobile || '');
                        const cleanDigits = String(rawMobile).replace(/[^0-9]/g, '');
                        const waNumber = cleanDigits.startsWith('88') ? cleanDigits : (cleanDigits ? `88${cleanDigits}` : '');
                        const text = `শ্রদ্ধেয় আইনজীবী, আমি মামলা নং ${caseData.caseNumber} এর বিষয়ে যোগাযোগ করছি।`;
                        if (waNumber) {
                          window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
                        } else {
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }
                      }}
                      className="h-9 px-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 hover:bg-emerald-600/30 text-xs font-bold transition-all cursor-pointer"
                      title="হোয়াটসঅ্যাপে চ্যাট করুন"
                    >
                      <MessageSquare size={15} />
                      <span>হোয়াটসঅ্যাপ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PAST DATES & HISTORY TIMELINE */}
            {caseData.history && caseData.history.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" />
                    <h4 className="text-xs sm:text-sm font-black text-white">পূর্ববর্তী শুনানির ইতিহাস ও আদেশ</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">{caseData.history.length}টি তারিখ</span>
                </div>

                <div className="space-y-2.5 mt-1 max-h-60 overflow-y-auto pr-1">
                  {caseData.history.slice().reverse().map((entry, idx) => (
                    <div key={entry.id || idx} className="p-3 bg-slate-850/80 rounded-2xl border border-slate-800 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-emerald-400 block">{entry.date}</span>
                        <p className="text-slate-200 font-bold mt-0.5">{entry.description || entry.order || 'আদালতের আদেশ'}</p>
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                        {entry.actionBy || 'আদালত'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ADD TO CLIENT ACCOUNT & HOME SCREEN PROMPT */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BookmarkCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">আপনার স্থায়ী মক্কেল অ্যাকাউন্টে সেভ করুন</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    অ্যাপে সাইন-আপ বা লগইন করলে এই মামলাটি স্থায়ীভাবে আপনার অ্যাকাউন্টে জমা থাকবে এবং সকল আদেশ সহজেই দেখতে পাবেন।
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={handleClaimCase}
                  className="flex-1 min-w-[200px] text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer font-sans"
                >
                  <Sparkles size={15} />
                  <span>অ্যাকাউন্টে সেভ করুন / ড্যাশবোর্ডে যোগ করুন</span>
                </button>

                {!isInstalled && (
                  <button
                    onClick={handleInstallPwa}
                    className="text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Smartphone size={15} />
                    <span>হোম স্ক্রিনে ইনস্টল</span>
                  </button>
                )}

                <button
                  onClick={handleShareWhatsApp}
                  className="text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 size={15} />
                  <span>পরিবার বা পক্ষকে শেয়ার</span>
                </button>
              </div>
            </div>

            {/* Bottom info trust footer */}
            <div className="text-center text-[11px] text-slate-500 flex flex-col items-center gap-1 pt-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>MDC Casebook বাংলাদেশ আইন মন্ত্রণালয়ের ডিজিটাল মানদণ্ড অনুযায়ী সুরক্ষিত</span>
              </div>
              <p>© {new Date().getFullYear()} MDC Casebook. সকল অধিকার সংরক্ষিত।</p>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
