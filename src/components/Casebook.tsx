import React, { useState, useEffect } from 'react';
import '../styles/casebook.css';
import { 
  ArrowLeft, 
  ArrowRight, 
  Scale, 
  FileText, 
  User, 
  Gavel, 
  Users, 
  Edit, 
  Save, 
  Trash2, 
  Plus, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

// Sample Dataset representing different professional legal cases
const INITIAL_CASES = [
  {
    id: 1,
    prevDate: '১২/০৯/২০২৬',
    caseNo: 'সি.আর ১২৩/২০২৬',
    plaintiff: 'মোঃ আব্দুল করিম',
    defendant: 'মোঃ রহিম উদ্দিন',
    nextDate: '২৫/০৯/২০২৬',
    actionActive: 'আদেশ', // আদেশ, পদক্ষেপ, হাজিরা, জরি
    parties: {
      clientSide1: 'বাদী জবানবন্দী দাখিল সমাপ্ত হয়েছে। জেরা মুলতবি।',
      clientSide2: 'ওকালতনামা ও প্রসেস ফি পরিশোধ করা হয়েছে।',
      oppositeSide: 'বিবাদী পক্ষে সময় প্রার্থনার দরখাস্ত দাখিল।'
    }
  },
  {
    id: 2,
    prevDate: '০৫/০৮/২০২৬',
    caseNo: 'জি.আর ৪৫৬/২০২৬',
    plaintiff: 'রাষ্ট্র বনাম',
    defendant: 'মোঃ শফিকুল ইসলাম',
    nextDate: '৩০/০৯/২০২৬',
    actionActive: 'পদক্ষেপ',
    parties: {
      clientSide1: 'জামিন শুনানির জন্য কজলিস্টে অন্তর্ভুক্ত করা হয়েছে।',
      clientSide2: 'মুহুরি হাজিরা নিশ্চিত করেছেন।',
      oppositeSide: 'তদন্তকারী কর্মকর্তার রিপোর্ট এখনও দাখিল হয়নি।'
    }
  },
  {
    id: 3,
    prevDate: '১০/০৯/২০২৬',
    caseNo: 'দেওয়ানী ৭৮৯/২০২৬',
    plaintiff: 'মোসাঃ রহিমা খাতুন',
    defendant: 'আবুল হাসেম',
    nextDate: '০৫/১০/২০২৬',
    actionActive: 'হাজিরা',
    parties: {
      clientSide1: 'স্থায়ী নিষেধাজ্ঞার দরখাস্তের শুনানি চলমান।',
      clientSide2: 'আদালতের কোর্ট ফি দাখিল সম্পন্ন।',
      oppositeSide: 'বিবাদী তরফ থেকে আপত্তি দাখিল করা হয়েছে।'
    }
  },
  {
    id: 4,
    prevDate: '১৫/০৯/২০২৬',
    caseNo: 'পারিবারিক ৪৩২/২০২৬',
    plaintiff: 'মোসাঃ ফাতেমা বেগম',
    defendant: 'মোঃ জহিরুল ইসলাম',
    nextDate: '১২/১০/২০২৬',
    actionActive: 'জরি',
    parties: {
      clientSide1: 'দেনমোহর ও ভরণপোষণের দাবি সংক্রান্ত আরজি দাখিল।',
      clientSide2: 'নথি তলব করার আবেদন মঞ্জুর।',
      oppositeSide: 'বিবাদী আপোষ মীমাংসার জন্য সময় প্রার্থনা করেছে।'
    }
  },
  {
    id: 5,
    prevDate: '১৮/০৯/২০২৬',
    caseNo: 'অর্থঋণ ৮৭৬/২০২৬',
    plaintiff: 'সোনালী ব্যাংক পিএলসি',
    defendant: 'মেসার্স রূপালী ট্রেডার্স',
    nextDate: '১৫/১০/২০২৬',
    actionActive: 'আদেশ',
    parties: {
      clientSide1: 'ঋণ খেলাপীর দায়ে বন্ধকী সম্পত্তি নিলামের আদেশ জারি।',
      clientSide2: 'নিলাম বিজ্ঞপ্তি জাতীয় পত্রিকায় প্রকাশের প্রস্তুতি সম্পন্ন।',
      oppositeSide: 'বিবাদী স্থগিতাদেশ চেয়ে উচ্চ আদালতে রিট দায়ের করেছে।'
    }
  }
];

export default function Casebook({ language = 'bn' }: { language?: 'bn' | 'en' | 'hi' | 'ur' }) {
  const [cases, setCases] = useState<typeof INITIAL_CASES>(() => {
    const saved = localStorage.getItem('mdc_casebook_panel_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved casebook data:', e);
      }
    }
    return INITIAL_CASES;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states matching current active case
  const [formPrevDate, setFormPrevDate] = useState('');
  const [formCaseNo, setFormCaseNo] = useState('');
  const [formPlaintiff, setFormPlaintiff] = useState('');
  const [formDefendant, setFormDefendant] = useState('');
  const [formNextDate, setFormNextDate] = useState('');
  const [formActionActive, setFormActionActive] = useState('আদেশ');
  const [formClientSide1, setFormClientSide1] = useState('');
  const [formClientSide2, setFormClientSide2] = useState('');
  const [formOppositeSide, setFormOppositeSide] = useState('');

  // Notifications / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const activeCase = cases[currentIndex] || cases[0] || INITIAL_CASES[0];

  // Sync form state when current case or edit mode changes
  useEffect(() => {
    if (activeCase) {
      setFormPrevDate(activeCase.prevDate);
      setFormCaseNo(activeCase.caseNo);
      setFormPlaintiff(activeCase.plaintiff);
      setFormDefendant(activeCase.defendant);
      setFormNextDate(activeCase.nextDate);
      setFormActionActive(activeCase.actionActive || 'আদেশ');
      setFormClientSide1(activeCase.parties?.clientSide1 || '');
      setFormClientSide2(activeCase.parties?.clientSide2 || '');
      setFormOppositeSide(activeCase.parties?.oppositeSide || '');
    }
  }, [currentIndex, activeCase]);

  // Show Toast helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Navigations
  const handlePrev = () => {
    if (isEditMode) {
      showToast(language === 'bn' ? 'দয়া করে পরিবর্তনগুলো সংরক্ষণ করুন অথবা এডিট মোড বন্ধ করুন।' : 'Please save changes or exit edit mode first.', 'info');
      return;
    }
    setCurrentIndex((prev) => (prev === 0 ? cases.length - 1 : prev - 1));
    showToast(language === 'bn' ? 'পূর্ববর্তী মামলা লোড করা হয়েছে' : 'Previous case loaded', 'success');
  };

  const handleNext = () => {
    if (isEditMode) {
      showToast(language === 'bn' ? 'দয়া করে পরিবর্তনগুলো সংরক্ষণ করুন অথবা এডিট মোড বন্ধ করুন।' : 'Please save changes or exit edit mode first.', 'info');
      return;
    }
    setCurrentIndex((prev) => (prev === cases.length - 1 ? 0 : prev + 1));
    showToast(language === 'bn' ? 'পরবর্তী মামলা লোড করা হয়েছে' : 'Next case loaded', 'success');
  };

  // Save changes
  const handleSave = () => {
    const updatedCases = [...cases];
    updatedCases[currentIndex] = {
      ...updatedCases[currentIndex],
      prevDate: formPrevDate,
      caseNo: formCaseNo,
      plaintiff: formPlaintiff,
      defendant: formDefendant,
      nextDate: formNextDate,
      actionActive: formActionActive,
      parties: {
        clientSide1: formClientSide1,
        clientSide2: formClientSide2,
        oppositeSide: formOppositeSide
      }
    };

    setCases(updatedCases);
    localStorage.setItem('mdc_casebook_panel_data', JSON.stringify(updatedCases));
    setIsEditMode(false);
    showToast(language === 'bn' ? 'তথ্য সফলভাবে সংরক্ষণ করা হয়েছে' : 'Information saved successfully', 'success');
  };

  // Reset to default sample data
  const handleReset = () => {
    if (window.confirm(language === 'bn' ? 'আপনি কি সমস্ত তথ্য ডিফল্ট ডেমো ডেটাতে রিসেট করতে চান?' : 'Are you sure you want to reset all data to default demo data?')) {
      setCases(INITIAL_CASES);
      localStorage.removeItem('mdc_casebook_panel_data');
      setCurrentIndex(0);
      setIsEditMode(false);
      showToast(language === 'bn' ? 'সফলভাবে রিসেট করা হয়েছে' : 'Successfully reset to default', 'success');
    }
  };

  // Text strings based on language
  const textTitle = language === 'bn' ? 'এমডিসি ডিজিটাল কেসবুক কন্ট্রোল প্যানেল' : 'MDC Digital Casebook Control Panel';
  const textSubtitle = language === 'bn' 
    ? 'আইনজীবী, মুহুরি এবং সহকারীদের জন্য অত্যন্ত শক্তিশালী রিয়েল-টাইম মামলা ব্যবস্থাপনা ড্যাশবোর্ড।' 
    : 'A powerful real-time legal case management system designed for Advocates, Lawyers, and Clerks.';

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-slate-900 border border-indigo-500/30 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
          <div className="p-2 bg-emerald-500 text-white rounded-xl">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-sm font-black tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-[2rem] border border-indigo-500/20 p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                <Sparkles size={11} fill="currentColor" /> PREMIUM SaaS ACTIVE
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                {language === 'bn' ? 'ডিজিটাল চেম্বার' : 'Digital Chamber'}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              {textTitle}
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
              {textSubtitle}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all border border-slate-700 flex items-center gap-2"
            >
              🔄 {language === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset to Default'}
            </button>
            <div className="px-5 py-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-300 text-xs font-black flex items-center gap-2">
              📂 {language === 'bn' ? `মামলা ${currentIndex + 1}/${cases.length}` : `Case ${currentIndex + 1}/${cases.length}`}
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CASEBOOK PANEL WRAPPER */}
      {/* Scrollable Container preserving card sizes */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-2xl overflow-x-auto select-none scrollbar-thin">
        
        {/* Horizontal flex arrangement of EXACT requirements */}
        <div className="flex items-stretch gap-4 min-w-[1300px] h-[190px]">
          
          {/* 1. LEFT ARROW */}
          <button 
            type="button"
            onClick={handlePrev}
            className="shrink-0 w-14 rounded-3xl bg-gradient-to-b from-blue-600 to-indigo-700 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center gap-1 group"
            title="পূর্ববর্তী মামলা"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">PREV</span>
          </button>

          {/* 2. পূর্ববর্তী তারিখ (PREVIOUS DATE) */}
          <div className="shrink-0 w-[150px] bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-blue-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-2 right-2 p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Scale size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">
                {language === 'bn' ? 'পূর্ববর্তী' : 'PREVIOUS'}
              </p>
              <p className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'bn' ? 'তারিখ' : 'DATE'}
              </p>
            </div>
            <div className="pt-2">
              {isEditMode ? (
                <input
                  type="text"
                  value={formPrevDate}
                  onChange={(e) => setFormPrevDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-none">
                  {formPrevDate || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 3. মামলা নং (CASE NUMBER) - LARGE CENTRAL DOMINANT HEADER */}
          <div className="shrink-0 w-[210px] bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 text-white rounded-3xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-3 right-3 p-2 bg-white/10 rounded-xl text-indigo-100">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">
                {language === 'bn' ? 'মামলা নং' : 'CASE NUMBER'}
              </p>
              <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-indigo-100 border border-white/5">
                ⚖️ {language === 'bn' ? 'প্যানেল রেকর্ড' : 'Panel Record'}
              </span>
            </div>
            <div className="pt-2">
              {isEditMode ? (
                <input
                  type="text"
                  value={formCaseNo}
                  onChange={(e) => setFormCaseNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-indigo-900/60 border border-indigo-400 rounded-xl text-xs font-bold text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white"
                />
              ) : (
                <p className="text-lg font-black tracking-tight leading-none truncate">
                  {formCaseNo || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 4. বাদীর নাম (PLAINTIFF) */}
          <div className="shrink-0 w-[170px] bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-orange-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-2 right-2 p-1.5 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <User size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">
                {language === 'bn' ? 'বাদীর' : 'PLAINTIFF'}
              </p>
              <p className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'bn' ? 'নাম' : 'NAME'}
              </p>
            </div>
            <div className="pt-2">
              {isEditMode ? (
                <input
                  type="text"
                  value={formPlaintiff}
                  onChange={(e) => setFormPlaintiff(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-orange-300 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              ) : (
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-tight truncate">
                  {formPlaintiff || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 5. V/S (VERSUS) */}
          <div className="shrink-0 w-[80px] bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <Gavel size={18} className="text-purple-200 mb-1" />
            <p className="text-xl font-black tracking-tighter leading-none">
              V/S
            </p>
            <span className="text-[8px] font-black text-purple-200 uppercase tracking-wider mt-1">VERSUS</span>
          </div>

          {/* 6. আসামীর নাম (DEFENDANT) */}
          <div className="shrink-0 w-[170px] bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-emerald-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-2 right-2 p-1.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <User size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">
                {language === 'bn' ? 'আসামীর' : 'DEFENDANT'}
              </p>
              <p className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'bn' ? 'নাম' : 'NAME'}
              </p>
            </div>
            <div className="pt-2">
              {isEditMode ? (
                <input
                  type="text"
                  value={formDefendant}
                  onChange={(e) => setFormDefendant(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-tight truncate">
                  {formDefendant || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 7. পরবর্তী তারিখ (NEXT DATE) */}
          <div className="shrink-0 w-[150px] bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-sky-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-2 right-2 p-1.5 bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-lg">
              <CalendarIcon size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest leading-none mb-1">
                {language === 'bn' ? 'পরবর্তী' : 'NEXT'}
              </p>
              <p className="text-xs font-black text-slate-800 dark:text-white">
                {language === 'bn' ? 'তারিখ' : 'DATE'}
              </p>
            </div>
            <div className="pt-2">
              {isEditMode ? (
                <input
                  type="text"
                  value={formNextDate}
                  onChange={(e) => setFormNextDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-sky-300 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              ) : (
                <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-none">
                  {formNextDate || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 8. ACTION SECTION (আদেশ / পদক্ষেপ / হাজিরা / জরি) - 2X2 GRID */}
          <div className="shrink-0 w-[200px] p-2 bg-slate-55/40 dark:bg-slate-800/40 rounded-3xl border border-slate-200/50 dark:border-slate-750/50 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-2 h-full">
              
              {/* আদেশ */}
              <button
                type="button"
                onClick={() => setFormActionActive('আদেশ')}
                className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all ${
                  formActionActive === 'আদেশ' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 scale-[1.03]' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 border border-slate-100 dark:border-slate-800'
                }`}
              >
                <FileText size={16} className={formActionActive === 'আদেশ' ? 'text-white' : 'text-emerald-500'} />
                <span className="text-[10px] font-black tracking-tight mt-1">
                  {language === 'bn' ? 'আদেশ' : 'ORDER'}
                </span>
              </button>

              {/* পদক্ষেপ */}
              <button
                type="button"
                onClick={() => setFormActionActive('পদক্ষেপ')}
                className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all ${
                  formActionActive === 'পদক্ষেপ' 
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-200 scale-[1.03]' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 border border-slate-100 dark:border-slate-800'
                }`}
              >
                <Gavel size={16} className={formActionActive === 'পদক্ষেপ' ? 'text-white' : 'text-cyan-500'} />
                <span className="text-[10px] font-black tracking-tight mt-1">
                  {language === 'bn' ? 'পদক্ষেপ' : 'STEP'}
                </span>
              </button>

              {/* হাজিরা */}
              <button
                type="button"
                onClick={() => setFormActionActive('হাজিরা')}
                className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all ${
                  formActionActive === 'হাজিরা' 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200 scale-[1.03]' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-purple-50 border border-slate-100 dark:border-slate-800'
                }`}
              >
                <Users size={16} className={formActionActive === 'হাজিরা' ? 'text-white' : 'text-purple-500'} />
                <span className="text-[10px] font-black tracking-tight mt-1">
                  {language === 'bn' ? 'হাজিরা' : 'ATTENDANCE'}
                </span>
              </button>

              {/* জরি */}
              <button
                type="button"
                onClick={() => setFormActionActive('জরি')}
                className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all ${
                  formActionActive === 'জরি' 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200 scale-[1.03]' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-rose-50 border border-slate-100 dark:border-slate-800'
                }`}
              >
                <FileText size={16} className={formActionActive === 'জরি' ? 'text-white' : 'text-rose-500'} />
                <span className="text-[10px] font-black tracking-tight mt-1">
                  {language === 'bn' ? 'জরি' : 'FINE/INFO'}
                </span>
              </button>

            </div>
          </div>

          {/* 9. EDIT BUTTON */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`shrink-0 w-14 rounded-3xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-lg ${
              isEditMode 
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 scale-[1.02]' 
                : 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600 active:scale-95'
            }`}
          >
            <Edit className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">EDIT</span>
          </button>

          {/* 10. PARTY BOXES - 3 separate independent columns */}
          
          {/* Column A: নিজ পক্ষ (Purple) */}
          <div className="shrink-0 w-[180px] bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-purple-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {language === 'bn' ? 'নিজ পক্ষ' : 'OUR SIDE A'}
                </span>
              </div>
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2">
                {language === 'bn' ? 'বাদী/আবেদনকারী' : 'Petitioner Info'}
              </p>
            </div>
            
            <div className="flex-1 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl p-2 overflow-y-auto">
              {isEditMode ? (
                <textarea
                  value={formClientSide1}
                  onChange={(e) => setFormClientSide1(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-800 border border-purple-300 rounded-xl p-1.5 text-[10px] font-bold text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-normal">
                  {formClientSide1 || (language === 'bn' ? 'কোনো তথ্য নেই।' : 'No entries yet.')}
                </p>
              )}
            </div>
          </div>

          {/* Column B: নিজ পক্ষ (Orange) */}
          <div className="shrink-0 w-[180px] bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-orange-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-1">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {language === 'bn' ? 'নিজ পক্ষ' : 'OUR SIDE B'}
                </span>
              </div>
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2">
                {language === 'bn' ? 'মুহুরি/সহকারী' : 'Clerk Action'}
              </p>
            </div>
            
            <div className="flex-1 bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl p-2 overflow-y-auto">
              {isEditMode ? (
                <textarea
                  value={formClientSide2}
                  onChange={(e) => setFormClientSide2(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-800 border border-orange-300 rounded-xl p-1.5 text-[10px] font-bold text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              ) : (
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-normal">
                  {formClientSide2 || (language === 'bn' ? 'কোনো তথ্য নেই।' : 'No entries yet.')}
                </p>
              )}
            </div>
          </div>

          {/* 11. SAVE BUTTON - SEPARATED, TEAL GRADIENT */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isEditMode}
            className={`shrink-0 w-14 rounded-3xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-lg ${
              isEditMode 
                ? 'bg-gradient-to-b from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white scale-[1.02]' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
            }`}
          >
            <Save className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">SAVE</span>
          </button>

          {/* Column C: উত্তর পক্ষ (Green) */}
          <div className="shrink-0 w-[180px] bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-3xl border border-emerald-150/60 dark:border-slate-750 p-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {language === 'bn' ? 'উত্তর পক্ষ' : 'OPPOSITE PARTY'}
                </span>
              </div>
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2">
                {language === 'bn' ? 'বিবাদী/আপত্তিকারী' : 'Opposite Info'}
              </p>
            </div>
            
            <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-2 overflow-y-auto">
              {isEditMode ? (
                <textarea
                  value={formOppositeSide}
                  onChange={(e) => setFormOppositeSide(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-800 border border-emerald-300 rounded-xl p-1.5 text-[10px] font-bold text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-normal">
                  {formOppositeSide || (language === 'bn' ? 'কোনো তথ্য নেই।' : 'No entries yet.')}
                </p>
              )}
            </div>
          </div>

          {/* 12. RIGHT ARROW */}
          <button 
            type="button"
            onClick={handleNext}
            className="shrink-0 w-14 rounded-3xl bg-gradient-to-b from-blue-600 to-indigo-700 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all shadow-lg flex flex-col items-center justify-center gap-1 group"
            title="পরবর্তী মামলা"
          >
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">NEXT</span>
          </button>

        </div>
      </div>

      {/* QUICK STATS & INSTRUCTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Instruction Card 1 */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/30 dark:from-slate-850 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-widest mb-2">
            💡 {language === 'bn' ? 'কন্ট্রোল প্যানেল গাইড' : 'Control Panel Guide'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {language === 'bn' 
              ? 'দুই পাশে থাকা তীর (← এবং →) বাটনে ক্লিক করে চেম্বারের বিভিন্ন মামলা সুইচ করতে পারেন। এটি আপনার চেম্বারের মামলাসমূহ এক পলকে পর্যালোচনা করার জন্য আদর্শ।' 
              : 'Use the left and right arrow buttons (← and →) at the extreme ends to slide between your active cases. Great for quick summaries.'}
          </p>
        </div>

        {/* Instruction Card 2 */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50/30 dark:from-slate-850 dark:to-slate-900 border border-orange-100 dark:border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-orange-950 dark:text-orange-200 uppercase tracking-widest mb-2">
            ✏️ {language === 'bn' ? 'সম্পাদনা ও পরিবর্তন' : 'Edit & Customize'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {language === 'bn' 
              ? 'যেকোনো মামলার তথ্য এডিট করতে "EDIT" বাটনে ক্লিক করুন। ইনপুট বক্স সচল হলে আপনি মামলা নং, বাদী, বিবাদী, তারিখ ও পক্ষসমূহের বিবরণ পরিবর্তন করে "SAVE" ক্লিক করলেই তা ব্রাউজারে সংরক্ষিত হয়ে যাবে।' 
              : 'Click the vertical "EDIT" button to enable editing. You can adjust dates, case number, plaintiffs, defendants, and party descriptions instantly.'}
          </p>
        </div>

        {/* Instruction Card 3 */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-slate-850 dark:to-slate-900 border border-emerald-100 dark:border-slate-800 p-6 rounded-3xl">
          <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-widest mb-2">
            🚀 {language === 'bn' ? 'সরাসরি সিঙ্ক্রোনাইজড' : 'Direct Synchronized'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {language === 'bn' 
              ? 'আপনার সেভ করা ডেটা ব্রাউজারের লোকাল স্টোরেজে জমা থাকে, তাই পৃষ্ঠা রিলোড দিলেও ডেটা হারিয়ে যাবে না। চেম্বার প্রধান এবং সহকারীদের রিয়েল-টাইম সমন্বয় ঘটে।' 
              : 'Saved information is persistent across browser reloads via local storage. Perfect for seamless integration in any law firm.'}
          </p>
        </div>

      </div>

    </div>
  );
}
