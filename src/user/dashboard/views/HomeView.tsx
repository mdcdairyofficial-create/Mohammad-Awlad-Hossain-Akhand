import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  ChevronRight,
  User,
  Briefcase,
  Share2,
  Copy,
  MessageCircle,
  DollarSign,
  Star,
  Award,
  Zap,
  X,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  Gift,
  Bell,
  BellRing,
  Gavel,
  FolderOpen,
  Users,
  Settings,
  Search,
  BookOpen,
  Scale,
  Eye,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { AdBanner } from '../AdBanner';
import { Case, Task } from '../../../types';
import { 
  checkNotificationSupport, 
  requestNotificationPermission, 
  sendLocalNotification 
} from '../../../lib/pushNotifications';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar 
} from 'recharts';
import { getReferralUrl } from '../../../utils/urlHelper';
import { safeGetJson, safeSetJson } from '../../../utils/safeStorage';

interface HomeViewProps {
  userName: string;
  userType: string;
  cases: Case[];
  tasks: Task[];
  language: 'bn' | 'en' | 'hi' | 'ur';
  theme: 'light' | 'dark';
  setActiveTab: (tab: any) => void;
  t: (key: string) => string;
  isPremium?: boolean;
  isPremiumForAds?: boolean;
  referralCode?: string;
  onCopyLink?: () => void;
  onWhatsAppShare?: () => void;
  referralCount?: number;
  initialShowScoreModal?: boolean;
  points?: number;
  displayDataMb?: string;
  estimatedBillTaka?: number;
  showAllCases?: boolean;
  onToggleShowAll?: () => void;
  warningsCount?: number;
  redBallsCount?: number;
  allCasesCount?: number;
  ownCasesCount?: number;
  assignedCasesCount?: number;
  signedUpRoles?: string[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  userName,
  userType,
  cases,
  tasks,
  language,
  theme,
  setActiveTab,
  t,
  isPremium = false,
  isPremiumForAds = false,
  referralCode = '',
  onCopyLink,
  onWhatsAppShare,
  referralCount = 0,
  initialShowScoreModal = false,
  points = 0,
  displayDataMb = '0.00',
  estimatedBillTaka = 0,
  showAllCases = false,
  onToggleShowAll,
  warningsCount = 0,
  redBallsCount = 0,
  allCasesCount = 0,
  ownCasesCount = 0,
  assignedCasesCount = 0,
  signedUpRoles
}) => {
  const [selectedYear, setSelectedYear] = React.useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [totalDue, setTotalDue] = React.useState(0);
  const [showScoreModal, setShowScoreModal] = React.useState(initialShowScoreModal);

  const [clientPushGranted, setClientPushGranted] = React.useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const handleEnableClientNotification = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setClientPushGranted(true);
      sendLocalNotification('MDC Casebook এলার্ট 🔔', {
        body: 'আপনার মক্কেল অ্যাকাউন্টে অটো পুশ নোটিফিকেশন সফলভাবে সক্রিয় হয়েছে!'
      });
    }
  };

  const handleTestClientNotification = () => {
    sendLocalNotification('MDC Casebook টেস্ট এলার্ট 🔔', {
      body: 'আপনার ফোনের নোটিফিকেশন সফলভাবে কাজ করছে। পরবর্তী ধার্য তারিখের আপডেট সরাসরি এখানে আসবে।'
    });
  };

  React.useEffect(() => {
    if (initialShowScoreModal) {
      setShowScoreModal(true);
    }
  }, [initialShowScoreModal]);

  React.useEffect(() => {
    const saved = localStorage.getItem('mdc_invoices');
    if (saved) {
      try {
        const invoices = JSON.parse(saved);
        const due = invoices.reduce((acc: number, curr: any) => acc + (curr.amount - (curr.paidAmount || 0)), 0);
        setTotalDue(due);
      } catch (e) {
        console.error('Error parsing invoices', e);
      }
    }
  }, []);

  const [copiedLink, setCopiedLink] = React.useState(false);
  const effectiveReferralCode = referralCode || '';
  const fullReferralLink = getReferralUrl(effectiveReferralCode);

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      navigator.clipboard.writeText(fullReferralLink).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handleWhatsApp = () => {
    if (onWhatsAppShare) {
      onWhatsAppShare();
    } else {
      const text = `Join MDC Casebook and manage cases easily: ${fullReferralLink}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleTestOpen = () => {
    window.open(fullReferralLink, '_blank');
  };

  const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getChartData = () => {
    if (selectedMonth === 'all') {
      return monthsEn.map((month, index) => {
        const monthCases = cases.filter(c => {
          const dateStr = c.filingDate || c.nextDate || c.created_at;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          return d.getFullYear().toString() === selectedYear && d.getMonth() === index;
        });

        return {
          name: language === 'bn' ? monthsBn[index] : month,
          added: monthCases.length,
          resolved: monthCases.filter(c => c.status === 'completed' || c.status === 'resolved').length
        };
      });
    } else {
      const monthIndex = parseInt(selectedMonth);
      const weeksBn = ['সপ্তাহ ১', 'সপ্তাহ ২', 'সপ্তাহ ৩', 'সপ্তাহ ৪'];
      const weeksEn = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      
      return [0, 1, 2, 3].map(weekIndex => {
        const weekCases = cases.filter(c => {
          const dateStr = c.filingDate || c.nextDate || c.created_at;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          
          if (d.getFullYear().toString() !== selectedYear || d.getMonth() !== monthIndex) return false;
          
          const date = d.getDate();
          if (weekIndex === 0 && date <= 7) return true;
          if (weekIndex === 1 && date > 7 && date <= 14) return true;
          if (weekIndex === 2 && date > 14 && date <= 21) return true;
          if (weekIndex === 3 && date > 21) return true;
          return false;
        });

        return {
          name: language === 'bn' ? weeksBn[weekIndex] : weeksEn[weekIndex],
          added: weekCases.length,
          resolved: weekCases.filter(c => c.status === 'completed' || c.status === 'resolved').length
        };
      });
    }
  };

  const chartData = getChartData();

  // State for adding extra dashboard roles directly from the Home Page
  const [extraSignedUpRoles, setExtraSignedUpRoles] = React.useState<string[]>([]);
  const [showRoleSignupModal, setShowRoleSignupModal] = React.useState(false);

  // Compute all effective signed-up / registered dashboard roles for the user
  const effectiveSignedUpRoles = React.useMemo(() => {
    const rolesSet = new Set<string>();

    // 1. Roles explicitly passed via props (e.g. from availableRoles in Dashboard)
    if (signedUpRoles && Array.isArray(signedUpRoles)) {
      signedUpRoles.forEach(r => {
        if (r) rolesSet.add(r.toLowerCase());
      });
    }

    // 2. User's primary active userType
    if (userType) {
      rolesSet.add(userType.toLowerCase());
    }

    // 3. Extra signed up roles added via interactive button
    extraSignedUpRoles.forEach(r => rolesSet.add(r.toLowerCase()));

    // 4. Cached signed-up roles from appUser / localStorage
    try {
      const savedUser = localStorage.getItem('appUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.userType) rolesSet.add(parsed.userType.toLowerCase());
        if (parsed.mobile) {
          let cleanPhone = String(parsed.mobile).replace(/[^0-9]/g, '');
          if (cleanPhone.startsWith('880')) cleanPhone = '0' + cleanPhone.substring(3);
          else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = '0' + cleanPhone.substring(2);
          const cached = safeGetJson<string[]>('mdc_roles_' + cleanPhone, []);
          if (Array.isArray(cached)) {
            cached.forEach(r => rolesSet.add(r.toLowerCase()));
          }
        }
      }
    } catch (e) {}

    return Array.from(rolesSet);
  }, [signedUpRoles, userType, extraSignedUpRoles]);

  // 3D User Role Options for the Interactive Role Cards (matching reference design)
  const roleCards = [
    {
      id: 'lawyer',
      title: 'আইনজীবী',
      subtitle: 'নিজের মামলা, কোর্ট ডায়েরি, তারিখ ও পেশাগত কাজকর্ম পরিচালনা।',
      gradient: 'from-[#0b2878] via-[#081f5c] to-[#040e33]',
      glow: 'shadow-[0_15px_35px_rgba(11,40,120,0.45)]',
      border: 'border-blue-400/50 hover:border-cyan-400',
      iconImg: '/assets/aistudio/icon_3d_lawyer.png',
      buttonBg: 'bg-gradient-to-r from-[#0099ff] to-[#0052cc] hover:from-[#38bdf8] hover:to-[#0284c7] text-white shadow-md shadow-blue-500/30',
      action: () => setActiveTab('cases')
    },
    {
      id: 'muhuri',
      title: 'মুহুরী',
      subtitle: 'মামলা এন্ট্রি, পরবর্তী তারিখ, হাজিরা এবং অফিসের দৈনন্দিন কাজ পরিচালনা।',
      gradient: 'from-[#4e0766] via-[#370548] to-[#1c0226]',
      glow: 'shadow-[0_15px_35px_rgba(78,7,102,0.45)]',
      border: 'border-purple-400/50 hover:border-fuchsia-400',
      iconImg: '/assets/aistudio/icon_3d_muhuri.png',
      buttonBg: 'bg-gradient-to-r from-[#b026ff] to-[#7916e0] hover:from-[#c084fc] hover:to-[#9333ea] text-white shadow-md shadow-purple-500/30',
      action: () => setActiveTab('cases')
    },
    {
      id: 'client',
      title: 'ক্লায়েন্ট',
      subtitle: 'নিজের মামলার তথ্য, পরবর্তী তারিখ এবং অগ্রগতি আপডেট দেখা।',
      gradient: 'from-[#045242] via-[#033b30] to-[#02211b]',
      glow: 'shadow-[0_15px_35px_rgba(4,82,66,0.45)]',
      border: 'border-emerald-400/50 hover:border-teal-300',
      iconImg: '/assets/aistudio/icon_3d_client.png',
      buttonBg: 'bg-gradient-to-r from-[#00c9a7] to-[#008f7a] hover:from-[#34d399] hover:to-[#059669] text-white shadow-md shadow-teal-500/30',
      action: () => setActiveTab('cases')
    },
    {
      id: 'admin',
      title: 'প্রশাসক',
      subtitle: 'অনুমোদিত প্রশাসনিক কার্যক্রম, ব্যবহারকারী ও সিস্টেম ব্যবস্থাপনা।',
      gradient: 'from-[#7c280b] via-[#591c08] to-[#331004]',
      glow: 'shadow-[0_15px_35px_rgba(124,40,11,0.45)]',
      border: 'border-amber-400/50 hover:border-orange-400',
      iconImg: '/assets/aistudio/icon_3d_admin.png',
      buttonBg: 'bg-gradient-to-r from-[#ff9f1a] to-[#e65c00] hover:from-[#fcd34d] hover:to-[#ea580c] text-white shadow-md shadow-amber-500/30',
      action: () => setActiveTab('profile')
    }
  ];

  // STRICT FILTERING: Only show cards for dashboards where the current user has explicitly registered/signed up
  const visibleRoleCards = React.useMemo(() => {
    const filtered = roleCards.filter(card => {
      if (card.id === 'lawyer') {
        return effectiveSignedUpRoles.includes('lawyer');
      }
      if (card.id === 'muhuri') {
        return effectiveSignedUpRoles.includes('clerk') || effectiveSignedUpRoles.includes('muhuri');
      }
      if (card.id === 'client') {
        return effectiveSignedUpRoles.includes('client');
      }
      if (card.id === 'admin') {
        return effectiveSignedUpRoles.includes('admin') || 
               effectiveSignedUpRoles.includes('super_admin') || 
               effectiveSignedUpRoles.includes('country_manager') || 
               effectiveSignedUpRoles.includes('bar_admin');
      }
      return false;
    });

    // Fallback: If no card matched, ensure user's active primary role card is displayed
    if (filtered.length === 0) {
      const activeCard = roleCards.find(c => {
        if (userType === 'lawyer') return c.id === 'lawyer';
        if (userType === 'clerk' || userType === 'muhuri') return c.id === 'muhuri';
        if (userType === 'client') return c.id === 'client';
        if (['admin', 'super_admin', 'country_manager', 'bar_admin'].includes(userType)) return c.id === 'admin';
        return false;
      });
      return activeCard ? [activeCard] : [roleCards[0]];
    }

    return filtered;
  }, [roleCards, effectiveSignedUpRoles, userType]);

  // Cases to display in Recent/Today Table (Fallback matches user reference design exactly)
  const referenceCases = [
    { id: 'ref-1', caseNumber: 'জি. আর মামলা - ১০০/২০২৩', policeStation: 'কালকিনি', petitioner: 'কালু', respondent: 'লালু', courtName: 'চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত', caseStep: 'হাজিরা', nextDate: '2026-10-28', status: 'active', attendance: 'present' },
    { id: 'ref-2', caseNumber: 'নং মামলা - ১২৩/২০২৩', policeStation: 'রাজবাড়ী', petitioner: 'রহিম', respondent: 'করিম', courtName: 'জেলা জজ আদালত', caseStep: 'দরখাস্ত', nextDate: '2026-11-12', status: 'active', attendance: 'absent' },
    { id: 'ref-3', caseNumber: 'সিভিল মামলা - ৪৫/২০২৩', policeStation: 'ঢাকা', petitioner: 'আবুল', respondent: 'রহিম', courtName: 'ঢাকা মেট্রোপলিটন আদালত', caseStep: 'যুক্তিতর্ক', nextDate: '2026-11-06', status: 'active', attendance: 'present' },
    { id: 'ref-4', caseNumber: 'ফৌজদারি মামলা - ৩৮/২০২৩', policeStation: 'মোহাম্মদপুর', petitioner: 'সুমন', respondent: 'রফিক', courtName: 'মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত', caseStep: 'সাক্ষ্য গ্রহণ', nextDate: '2026-11-20', status: 'active', attendance: 'none' }
  ];
  const tableCases = cases.length > 0 ? cases.slice(0, 6) : referenceCases;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">
      <AdBanner isPremium={isPremiumForAds} />

      {/* Dynamic Warning Alert Banner */}
      {warningsCount > 0 && (
        <div className="bg-rose-950/80 border border-rose-500/40 backdrop-blur-xl rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-4 shadow-2xl shadow-rose-950/40 animate-in slide-in-from-top-4 duration-500 text-white">
          <div className="p-3.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl shrink-0 shadow-lg shadow-rose-500/30">
            <ShieldAlert size={26} />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-rose-100">সতর্ক বার্তা! পেনাল্টি নোটিশ</h3>
              <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                সতর্কতা {warningsCount}/৩
              </span>
              {redBallsCount > 0 && (
                <span className="bg-rose-900/90 border border-rose-700 text-rose-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                  ● {redBallsCount} লাল বল
                </span>
              )}
            </div>
            <p className="text-rose-200/90 text-sm font-medium leading-relaxed">
              আপনার অ্যাকাউন্টে নীতি লঙ্ঘনজনিত কারণে অথবা মামলার ভুল তথ্য রিপোর্টের ফলস্বরূপ সতর্ক সংকেত রয়েছে। ৩টি স্তর পূর্ণ হলে আপনার আইনজীবী/মুহুরি লাইসেন্স সাময়িকভাবে স্থগিত হতে পারে।
            </p>
            <div className="flex gap-2.5 pt-1.5">
              {[1, 2, 3].map((strike) => (
                <div 
                  key={strike} 
                  className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                    strike <= warningsCount 
                      ? 'bg-rose-500 border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.8)] scale-110' 
                      : 'bg-white/10 border-white/20'
                  }`}
                  title={`সংকেত ${strike}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner Section - Royal Blue 3D Atmosphere from Reference Design */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#003db3] via-[#0057e7] to-[#042878] border border-cyan-400/35 shadow-[0_25px_60px_rgba(0,35,110,0.5)] text-white group">
        {/* Integrated Background Backdrop Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="/assets/aistudio/hero_banner_cropped.png" 
            alt="3D Theme Backdrop" 
            className="w-full h-full object-cover object-right lg:object-center opacity-25 mix-blend-overlay filter blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002f8a]/95 via-[#0047cc]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#001f66]/80 via-transparent to-transparent" />
        </div>

        {/* Dynamic Glow Orbs for 3D Lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <motion.div 
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-5"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-cyan-200 text-xs sm:text-sm font-bold backdrop-blur-md shadow-sm">
                <Sparkles size={16} className="text-cyan-300 animate-pulse" />
                <span>স্মার্ট কোর্ট ম্যানেজমেন্ট • ডিজিটাল বাংলাদেশ</span>
              </div>

              {/* Title & Subtitle matching reference */}
              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                  MDC Casebook
                </h1>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-yellow-300 drop-shadow">
                  ডিজিটাল কেস ও লিগ্যাল ডায়েরি প্ল্যাটফর্ম
                </h2>
              </div>

              {/* Description */}
              <p className="text-blue-100/90 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl font-medium">
                আইনজীবী, মুহুরী ও ক্লায়েন্টদের জন্য একটি সমন্বিত স্মার্ট প্ল্যাটফর্ম। মামলা ব্যবস্থাপনা, পরবর্তী তারিখ, হাজিরা, আদালতের কার্যক্রম এবং গুরুত্বপূর্ণ নথি পরিচালনা করুন সহজেই।
              </p>

              {/* User greeting pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs sm:text-sm text-cyan-200 font-semibold shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{language === 'bn' ? `স্বাগতম, ${userName}!` : `Welcome, ${userName}!`}</span>
              </div>

              {/* Hero Action Buttons - Styled exactly as reference rounded pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('cases')}
                  className="px-6 sm:px-7 py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-full shadow-[0_10px_25px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <Zap size={18} className="text-yellow-300 fill-yellow-300 group-hover:rotate-12 transition-transform" />
                  <span>আমার ড্যাশবোর্ডে প্রবেশ করুন</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('cases')}
                  className="px-5 py-3.5 bg-blue-950/60 hover:bg-blue-900/80 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full border border-blue-400/40 backdrop-blur-md shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Search size={16} className="text-cyan-300" />
                  <span>মামলা খুঁজুন</span>
                </button>

                <button
                  onClick={() => setActiveTab('library')}
                  className="px-5 py-3.5 bg-blue-950/60 hover:bg-blue-900/80 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full border border-blue-400/40 backdrop-blur-md shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen size={16} className="text-cyan-300" />
                  <span>আইন ও টিপস</span>
                </button>
              </div>

              {/* Quick stats badges row for real-time awareness */}
              <div className="flex items-center gap-3 pt-3 flex-wrap">
                <div 
                  onClick={() => setActiveTab('cases')}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white font-bold cursor-pointer transition-all flex items-center gap-2"
                >
                  <span className="text-cyan-300">মোট মামলা:</span>
                  <span className="font-black text-amber-300">{cases.length} টি</span>
                </div>
                <div 
                  onClick={() => setActiveTab('calendar')}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white font-bold cursor-pointer transition-all flex items-center gap-2"
                >
                  <span className="text-cyan-300">আজকের শুনানী:</span>
                  <span className="font-black text-emerald-300">
                    {cases.filter(c => c.nextDate === new Date().toISOString().split('T')[0]).length} টি
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('newCase')}
                  className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-black cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <FolderOpen size={13} />
                  <span>+ নতুন মামলা</span>
                </button>
              </div>
            </motion.div>

            {/* Right 3D Visual Centerpiece Column */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-6 relative flex flex-col items-center justify-center"
            >
              <div className="relative w-full max-w-[560px] group/art cursor-pointer" onClick={() => setActiveTab('cases')}>
                <img 
                  src="/assets/aistudio/hero_3d_artwork.png" 
                  alt="MDC Casebook 3D Justice & Platform Showcase" 
                  className="w-full h-auto object-contain rounded-2xl drop-shadow-[0_20px_45px_rgba(0,0,0,0.5)] transform hover:scale-[1.03] transition-transform duration-500"
                />
                {/* Floating Online Tag */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-emerald-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  MDC LIVE ONLINE
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 3D User Type Role Selection Section ("আপনার সাইন-আপকৃত ড্যাশবোর্ডসমূহ") */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                আপনার সাইন-আপকৃত ড্যাশবোর্ডসমূহ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                শুধুমাত্র আপনার নিবন্ধিত ড্যাশবোর্ড প্রদর্শিত হচ্ছে ({visibleRoleCards.length} টি)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRoleSignupModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles size={15} className="text-yellow-300 animate-pulse" />
              <span>+ নতুন ড্যাশবোর্ডে সাইন-আপ করুন</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 group"
            >
              <span>প্রোফাইল</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Dynamic 3D Role Cards for ONLY signed-up dashboards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${visibleRoleCards.length >= 4 ? 'lg:grid-cols-4' : visibleRoleCards.length === 3 ? 'lg:grid-cols-3' : visibleRoleCards.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-md'} gap-5`}>
          {visibleRoleCards.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * idx, duration: 0.4 }}
              onClick={role.action}
              className={`group relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-b ${role.gradient} border ${role.border} ${role.glow} text-white cursor-pointer hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between`}
            >
              {/* Glass reflection top highlight */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]" />
              
              <div className="relative z-10 space-y-4">
                {/* 3D Icon Container from Reference */}
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <img 
                      src={role.iconImg} 
                      alt={role.title} 
                      className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 shadow-sm">
                    ✓ সাইন-আপকৃত
                  </span>
                </div>

                <div>
                  <h4 className="text-2xl font-black tracking-tight text-white mb-2 drop-shadow">
                    {role.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                    {role.subtitle}
                  </p>
                </div>
              </div>

              {/* Card Action Pill Button */}
              <div className="relative z-10 pt-5 mt-auto">
                <div className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 ${role.buttonBg} transition-all`}>
                  <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Role Sign-up Modal */}
      <AnimatePresence>
        {showRoleSignupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-lg font-black text-white">নতুন ড্যাশবোর্ডে সাইন-আপ করুন</h3>
                </div>
                <button 
                  onClick={() => setShowRoleSignupModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                আপনার বর্তমান মোবাইল নম্বরের অধীনে অতিরিক্ত ড্যাশবোর্ডে সাইন-আপ করতে নিচের সংশ্লিষ্ট ভূমিকা নির্বাচন করুন:
              </p>

              <div className="space-y-3">
                {roleCards.map(role => {
                  const isAlreadySignedUp = visibleRoleCards.some(c => c.id === role.id);
                  const roleKeyToSave = role.id === 'muhuri' ? 'clerk' : role.id;

                  return (
                    <div 
                      key={role.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        isAlreadySignedUp 
                          ? 'bg-slate-800/40 border-slate-700/60 opacity-60' 
                          : 'bg-slate-800/80 border-blue-500/30 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={role.iconImg} alt={role.title} className="w-10 h-10 object-contain" />
                        <div>
                          <h4 className="font-bold text-sm text-white">{role.title} ড্যাশবোর্ড</h4>
                          <p className="text-[11px] text-slate-400">{role.subtitle}</p>
                        </div>
                      </div>

                      {isAlreadySignedUp ? (
                        <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shrink-0">
                          ✓ সাইন-আপকৃত
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setExtraSignedUpRoles(prev => [...prev, roleKeyToSave]);
                            try {
                              const savedUser = localStorage.getItem('appUser');
                              if (savedUser) {
                                const parsed = JSON.parse(savedUser);
                                if (parsed.mobile) {
                                  let cleanPhone = String(parsed.mobile).replace(/[^0-9]/g, '');
                                  if (cleanPhone.startsWith('880')) cleanPhone = '0' + cleanPhone.substring(3);
                                  else if (cleanPhone.startsWith('88') && cleanPhone.length === 13) cleanPhone = '0' + cleanPhone.substring(2);
                                  const existing = safeGetJson<string[]>('mdc_roles_' + cleanPhone, []);
                                  if (!existing.includes(roleKeyToSave)) {
                                    safeSetJson('mdc_roles_' + cleanPhone, [...existing, roleKeyToSave]);
                                  }
                                }
                              }
                            } catch (e) {}
                            alert(`সফলভাবে ${role.title} ড্যাশবোর্ডে সাইন-আপ সম্পন্ন হয়েছে!`);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-full shadow-sm transition-all shrink-0 cursor-pointer"
                        >
                          সাইন-আপ করুন
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowRoleSignupModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recent Cases Section ("সাম্প্রতিক মামলা সমূহ") - Clean High-Contrast White Card Style from Reference */}
      <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                সাম্প্রতিক মামলা সমূহ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আজকের ও সাম্প্রতিক ধার্য তারিখের মামলা তালিকা</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cases')}
            className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 group cursor-pointer"
          >
            <span>সবগুলো দেখুন</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Responsive Table matching reference */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                <th className="py-3.5 px-4">মামলা নং (থানা)</th>
                <th className="py-3.5 px-4">পক্ষগণ</th>
                <th className="py-3.5 px-4">আদালত</th>
                <th className="py-3.5 px-4">পদক্ষেপ</th>
                <th className="py-3.5 px-4">পরবর্তী তারিখ</th>
                <th className="py-3.5 px-4">হাজিরা</th>
                <th className="py-3.5 px-4">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableCases.length > 0 ? (
                tableCases.map((c, idx) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOutdated = c.nextDate ? c.nextDate < today : false;
                  const isToday = c.nextDate ? c.nextDate === today : false;
                  const attendance = (c as any).attendance || 'present';

                  return (
                    <tr 
                      key={`${c.id || 'case'}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Case Number & Station */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isOutdated && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />}
                          {isToday && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                          <div>
                            <p className="font-bold text-slate-800 dark:text-cyan-200 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                              {c.caseNumber || 'মামলা নং নেই'}
                            </p>
                            {c.policeStation && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">({c.policeStation})</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Parties */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium max-w-[200px] truncate">
                        {c.petitioner || 'বাদী'} বনাম {c.respondent || 'বিবাদী'}
                      </td>

                      {/* Court */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {c.courtName || 'আদালত নির্ধারিত নয়'}
                      </td>

                      {/* Step */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 whitespace-nowrap font-semibold">
                        {(c as any).caseStep || c.order || 'হাজিরা'}
                      </td>

                      {/* Next Date with Inline Display */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {c.nextDate || '২৮-১০-২০২৩'}
                          </span>
                          {isOutdated && (
                            <span className="text-[10px] text-rose-500 font-black uppercase">তারিখ পার</span>
                          )}
                        </div>
                      </td>

                      {/* Attendance Pill matching reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {attendance === 'present' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-sm">
                            <Check size={12} />
                            হাজিরা ✓
                          </span>
                        ) : attendance === 'absent' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            ✕ অনুপস্থিত
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            ✕ নেই
                          </span>
                        )}
                      </td>

                      {/* Status Pill matching reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                          c.status === 'completed' || c.status === 'resolved'
                            ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                            : 'bg-[#0080ff] text-white shadow-blue-500/25'
                        }`}>
                          {c.status === 'completed' || c.status === 'resolved' ? 'নিষ্পত্তি' : 'চালু আছে'}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveTab('cases')}
                          title="মামলা বিস্তারিত দেখুন"
                          className="w-8 h-8 rounded-full border border-sky-400 dark:border-sky-500 text-sky-500 dark:text-sky-400 hover:bg-sky-500 hover:text-white inline-flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-semibold">
                    কোন মামলা পাওয়া যায়নি। নতুন মামলা এন্ট্রি করতে &quot;মামলা দেখুন&quot; ট্যাবে যান।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3D Real Stats Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {([
          ...(userType !== 'client' ? [
            { 
              label: language === 'bn' ? 'আপনার পয়েন্ট' : 'Your Points', 
              value: points, 
              icon: Award, 
              gradient: 'from-teal-500 via-emerald-600 to-teal-800', 
              glow: 'shadow-[0_10px_25px_rgba(20,184,166,0.3)]',
              border: 'border-teal-400/40',
              action: () => setActiveTab('recharge') 
            }
          ] : []),
          { 
            label: language === 'bn' ? 'আমার নিজের মামলা' : 'My Own Cases', 
            value: `${ownCasesCount} টি`, 
            icon: FileText, 
            gradient: 'from-blue-600 via-indigo-600 to-blue-800', 
            glow: 'shadow-[0_10px_25px_rgba(37,99,235,0.3)]',
            border: 'border-blue-400/40',
            action: () => setActiveTab('cases') 
          },
          { 
            label: language === 'bn' ? 'আমার মোট মামলা সংখ্যা' : 'My Total Cases', 
            value: `${cases.length} টি`, 
            subtitle: language === 'bn' ? `(নিজের: ${ownCasesCount} | দায়িত্ব: ${assignedCasesCount})` : `(Own: ${ownCasesCount} | Assigned: ${assignedCasesCount})`, 
            icon: Briefcase, 
            gradient: 'from-indigo-600 via-purple-700 to-indigo-900', 
            glow: 'shadow-[0_10px_25px_rgba(99,102,241,0.3)]',
            border: 'border-indigo-400/40',
            action: () => setActiveTab('cases') 
          },
          ...(userType !== 'client' ? [
            { 
              label: language === 'bn' ? 'ডেটা ব্যবহার' : 'Data Usage', 
              value: `${displayDataMb} MB`, 
              icon: Briefcase, 
              gradient: 'from-purple-600 via-fuchsia-600 to-purple-900', 
              glow: 'shadow-[0_10px_25px_rgba(168,85,247,0.3)]',
              border: 'border-purple-400/40'
            },
            { 
              label: language === 'bn' ? 'বিল (টাকা)' : 'Bill (BDT)', 
              value: `${estimatedBillTaka} ৳`, 
              icon: DollarSign, 
              gradient: 'from-amber-500 via-orange-600 to-amber-800', 
              glow: 'shadow-[0_10px_25px_rgba(245,158,11,0.3)]',
              border: 'border-amber-400/40'
            },
            { 
              label: t('upcoming_dates'), 
              value: cases.filter(c => {
                if (!c.nextDate) return false;
                const d = new Date(c.nextDate);
                const td = new Date();
                td.setHours(0,0,0,0);
                return d >= td;
              }).length, 
              icon: Calendar, 
              gradient: 'from-emerald-500 via-teal-600 to-emerald-900', 
              glow: 'shadow-[0_10px_25px_rgba(16,185,129,0.3)]',
              border: 'border-emerald-400/40'
            }
          ] : []),
          { 
            label: t('today_cases'), 
            value: cases.filter(c => {
              if (!c.nextDate) return false;
              const d = new Date(c.nextDate);
              const td = new Date();
              return d.toDateString() === td.toDateString();
            }).length, 
            icon: Zap, 
            gradient: 'from-amber-400 via-yellow-500 to-orange-600', 
            glow: 'shadow-[0_10px_25px_rgba(234,179,8,0.3)]',
            border: 'border-yellow-300/50'
          },
          ...(userType !== 'client' ? [
            { 
              label: t('pending_tasks'), 
              value: tasks.filter(t => t.status !== 'completed').length, 
              icon: CheckCircle2, 
              gradient: 'from-rose-500 via-red-600 to-rose-900', 
              glow: 'shadow-[0_10px_25px_rgba(244,63,94,0.3)]',
              border: 'border-rose-400/40',
              action: () => setActiveTab('tasks')
            }
          ] : [])
        ] as any[]).map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * idx }}
            onClick={stat.action}
            className={`relative overflow-hidden p-5 sm:p-6 rounded-[1.8rem] bg-gradient-to-br ${stat.gradient} border ${stat.border} ${stat.glow} text-white cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 group`}
          >
            {/* Gloss reflection overlay */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner group-hover:rotate-6 transition-transform">
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/80 bg-black/20 px-2.5 py-0.5 rounded-full">
                MDC STAT
              </span>
            </div>

            <div className="relative z-10">
              <p className="text-white/80 font-bold text-xs uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow">
                {stat.value}
              </h4>
              {stat.subtitle && (
                <p className="text-[11px] text-white/80 font-semibold mt-1">
                  {stat.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Referral Section - Updated with exact requested copy and 3D Sapphire Styling */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#07133b] via-[#0b1d55] to-[#040a23] border border-cyan-400/30 shadow-[0_20px_50px_rgba(7,19,59,0.6)] text-white p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-400/30 text-slate-950 font-black shrink-0">
                <Share2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {language === 'bn' ? 'আপনার সক্রিয় রেফারেল লিংক' : 'Your Active Referral Link'}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}
                  </span>
                </div>
                {/* User Requested Bengali Referral Copy */}
                <p className="text-xs sm:text-sm text-cyan-100/90 mt-1.5 leading-relaxed max-w-3xl">
                  {language === 'bn' ? (
                    <>
                      <span className="font-bold text-amber-300">
                        রেফার করুন: প্রতি সফল রেফারে ১০০ পয়েন্ট ও ২ টি সাদা বল জিতুন!
                      </span>{' '}
                      <span className="text-white/90">
                        জয়েন করার ৭ দিনের মধ্যে মাত্র ৫জন আইনজীবী কিংবা মুহুরীকে রেফার করে জয়েন করালেই পাবেন ৩ মাসের ডায়মন্ড প্যাকেজ সাবস্ক্রিপশন ফ্রি। অন্য সময় করালে পাবেন ১ মাস।
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-amber-300">
                        Refer: Win 100 points & 2 white balls for every successful referral!
                      </span>{' '}
                      <span className="text-white/90">
                        Refer and onboard just 5 lawyers or clerks within 7 days of joining to get a 3-month Diamond package subscription free. At other times, get 1 month.
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs">
                <span className="text-cyan-200">{language === 'bn' ? 'মোট রেফারেল: ' : 'Referrals: '}</span>
                <strong className="text-white font-black text-sm">{referralCount} জন</strong>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs flex items-center gap-2">
                <span className="text-emerald-300 font-semibold">{language === 'bn' ? 'অর্জিত বোনাস: ' : 'Earned: '}</span>
                <strong className="text-emerald-200 font-black">{referralCount * 100} Pts</strong>
                <span className="text-white/40">•</span>
                <strong className="text-white font-black flex items-center gap-1">⚪ {referralCount * 2} বল</strong>
              </div>
            </div>
          </div>

          {/* Share Link Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={fullReferralLink}
                className="w-full px-4 py-3.5 bg-black/30 border border-cyan-400/30 rounded-xl text-cyan-200 font-mono text-xs sm:text-sm focus:outline-none select-all backdrop-blur-sm"
              />
              {effectiveReferralCode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/30 text-cyan-200 border border-blue-400/30">
                  {effectiveReferralCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95'
                }`}
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{language === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>{language === 'bn' ? 'কপি লিংক' : 'Copy Link'}</span>
                  </>
                )}
              </button>
              <button
                onClick={handleWhatsApp}
                className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>{language === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
              </button>
              <button
                onClick={handleTestOpen}
                title={language === 'bn' ? 'লিংকটি নতুন ট্যাবে টেস্ট করুন' : 'Test / Open Link'}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-white/15 shrink-0 cursor-pointer"
              >
                <ExternalLink size={16} />
                <span className="hidden md:inline">{language === 'bn' ? 'টেস্ট করুন' : 'Open'}</span>
              </button>
            </div>
          </div>

          {/* Special Diamond Pack Referral Goal (5 people) */}
          <div className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 text-cyan-200">
                <Gift size={16} className="text-amber-400" />
                <span className="font-bold text-white">
                  ৫ জন রেফারেল স্পেশাল অফার:
                </span>
                <span className="text-cyan-100">৭ দিনের মধ্যে ৫ জন রেফার করলেই ৩ মাস ডায়মন্ড প্যাকেজ সম্পূর্ণ ফ্রি!</span>
              </div>
              <span className="font-black text-amber-300">
                {referralCount} / ৫ জন
              </span>
            </div>
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                style={{ width: `${Math.min(100, (referralCount / 5) * 100)}%` }}
              />
            </div>
            {referralCount >= 5 && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold pt-1">
                <Sparkles size={15} />
                <span>অভিনন্দন! আপনি ৫ জন সফলভাবে রেফার করেছেন। ৩ মাসের ডায়মন্ড প্যাকেজ সাবস্ক্রিপশন সুবিধা সক্রিয় হয়েছে!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Chart & Pro Tip Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('case_stats')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                {selectedMonth === 'all' 
                  ? t('yearly_case_activity') 
                  : t('monthly_case_activity')}
              </p>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">{t('all_months')}</option>
                {monthsEn.map((m, i) => (
                  <option key={i} value={i.toString()}>{language === 'bn' ? monthsBn[i] : m}</option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year.toString()}>{language === 'bn' ? year.toString().replace(/\d/g, (d: any) => '০১২৩৪৫৬৭৮৯'[d]) : year}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -3px rgb(0 0 0 / 0.2)', 
                    padding: '12px',
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="added" 
                  name={t('added')}
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedMonth === 'all' ? 12 : 28}
                />
                <Bar 
                  dataKey="resolved" 
                  name={t('resolved')}
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedMonth === 'all' ? 12 : 28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pro Tip & Fast Shortcuts Card */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-blue-500/30 shadow-xl text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{t('pro_tip')}</span>
            </div>
            <h4 className="text-xl font-black text-white leading-snug">
              স্মার্ট কোর্ট ডায়রি দিয়ে সময় বাঁচান
            </h4>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
              {t('pro_tip_desc') || 'প্রতিটি মামলার পরবর্তী ধার্য তারিখ আসার সাথে সাথে এলার্ট পান এবং আপনার মক্কেলদের এক ক্লিকে হোয়াটসঅ্যাপে স্বয়ংক্রিয় আপডেট পাঠান।'}
            </p>
          </div>

          <div className="space-y-3 pt-6">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-cyan-300" />
                <span className="text-xs font-bold">কোর্ট ক্যালেন্ডার দেখুন</span>
              </div>
              <button 
                onClick={() => setActiveTab('calendar')}
                className="text-xs font-bold text-cyan-300 hover:text-white"
              >
                খুলুন ➔
              </button>
            </div>

            <button
              onClick={() => setActiveTab('cases')}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              সব মামলা ব্যবস্থাপনা করুন
            </button>
          </div>
        </div>
      </div>

      {/* Footer matching reference design */}
      <footer className="mt-10 pt-8 pb-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Scale size={20} />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800 dark:text-white">MDC Casebook</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">ডিজিটাল কোর্ট ও মামলা ডায়েরি</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold">
            <button onClick={() => setActiveTab('home')} className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors cursor-pointer">হোম</button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button onClick={() => setActiveTab('cases')} className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors cursor-pointer">ফিচারসমূহ</button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button onClick={() => setActiveTab('library')} className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors cursor-pointer">আইন ও টিপস</button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#privacy" className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">গোপনীয়তা নীতি</a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#terms" className="hover:text-blue-600 dark:hover:text-cyan-300 transition-colors">শর্তাবলী</a>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              ✉ support@mdccasebook.com
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              📞 +880 1234-567890
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} MDC Casebook. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-3 font-semibold text-slate-500 dark:text-slate-400">
            <span>স্মার্ট প্রযুক্তি</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>সহজ মামলা ব্যবস্থাপনা</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>ডিজিটাল বাংলাদেশ</span>
          </div>
        </div>
      </footer>

      {/* Score Details Modal */}
      <AnimatePresence>
        {showScoreModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg p-8 rounded-[3rem] shadow-2xl border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setShowScoreModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black leading-tight">
                    {t('score_details_title')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-lg">LIVE SCORE: 100</span>
                    <span className="text-slate-400 text-xs font-bold">{t('target')}: 100</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: t('score_criteria_profile'), desc: t('score_profile_desc'), score: 25, max: 25, icon: User, color: 'text-blue-500' },
                  { label: t('score_criteria_updates'), desc: t('score_update_desc'), score: 35, max: 35, icon: Calendar, color: 'text-indigo-500' },
                  { label: t('score_criteria_ratings'), desc: t('score_rating_desc'), score: 25, max: 25, icon: Star, color: 'text-amber-500' },
                  { label: t('score_criteria_accuracy'), desc: t('score_accuracy_desc'), score: 15, max: 15, icon: CheckCircle2, color: 'text-emerald-500' },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={item.color} />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                      <span className="text-sm font-black">{item.score}/{item.max}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mb-3 ml-7">{item.desc}</p>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ delay: 0.3 + (idx * 0.1), duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowScoreModal(false)}
                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/25 uppercase tracking-widest text-sm cursor-pointer"
              >
                {t('confirm')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
