import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  FileText,
  CreditCard,
  History,
  Book,
  X,
  ArrowLeft,
  ArrowRight,
  Video,
  Phone,
  Camera,
  Upload,
  CheckCircle,
  RefreshCw,
  Edit2,
  Sparkles,
  Scale,
  User,
  Gavel,
  Users,
  Save
} from 'lucide-react';
import { Case, CaseHistoryEntry, isCaseOnDate } from '../../../types';
import { updateCase } from '../../../services/user/featureService';
import { uploadFile, getPublicUrl } from '../../../lib/storage';

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  cases: Case[];
  onViewCard: (c: Case) => void;
  onViewHistory: (c: Case) => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
  userType?: string;
  govtHolidays?: string[] | Record<string, string>;
  getBanglaDate?: (date: Date) => string;
  t: (key: any) => string;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  onOpenAiForCase?: (c: Case) => void;
}

const MiniCasebook = ({
  c,
  language,
  t,
  buttonLabels,
  onUpdateCaseLocal,
  onViewCard
}: {
  c: Case;
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: any) => string;
  buttonLabels: any;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  onViewCard: (c: Case) => void;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [prevDate, setPrevDate] = useState(c.lastDate || '');
  const [caseNumber, setCaseNumber] = useState(c.caseNumber || '');
  const [petitioner, setPetitioner] = useState(c.petitioner || '');
  const [respondent, setRespondent] = useState(c.respondent || '');
  const [nextDate, setNextDate] = useState(c.nextDate || '');
  const [order, setOrder] = useState(c.order || 'আদেশ');
  const [clientNotes1, setClientNotes1] = useState(c.petitionerDetails?.[0]?.name || '');
  const [clientNotes2, setClientNotes2] = useState(c.additionalOrder || '');
  const [oppositeNotes, setOppositeNotes] = useState(c.respondentDetails?.[0]?.name || '');

  // Synchronize state when c changes
  useEffect(() => {
    setPrevDate(c.lastDate || '');
    setCaseNumber(c.caseNumber || '');
    setPetitioner(c.petitioner || '');
    setRespondent(c.respondent || '');
    setNextDate(c.nextDate || '');
    setOrder(c.order || 'আদেশ');
    setClientNotes1(c.petitionerDetails?.[0]?.name || '');
    setClientNotes2(c.additionalOrder || '');
    setOppositeNotes(c.respondentDetails?.[0]?.name || '');
  }, [c]);

  const handleSave = () => {
    if (onUpdateCaseLocal) {
      const updatedPetDetails = [...(c.petitionerDetails || [])];
      if (updatedPetDetails[0]) {
        updatedPetDetails[0] = { ...updatedPetDetails[0], name: clientNotes1 };
      } else if (clientNotes1) {
        updatedPetDetails.push({ name: clientNotes1, phone: '', serial: 1 });
      }

      const updatedResDetails = [...(c.respondentDetails || [])];
      if (updatedResDetails[0]) {
        updatedResDetails[0] = { ...updatedResDetails[0], name: oppositeNotes };
      } else if (oppositeNotes) {
        updatedResDetails.push({ name: oppositeNotes, phone: '', serial: 1 });
      }

      onUpdateCaseLocal(c.id, {
        lastDate: prevDate,
        caseNumber,
        petitioner,
        respondent,
        nextDate,
        order,
        additionalOrder: clientNotes2,
        petitionerDetails: updatedPetDetails,
        respondentDetails: updatedResDetails
      });
    }
    setIsEditMode(false);
  };

  const isPastForCase = c.nextDate !== c.lastDate;

  return (
    <div className="w-full bg-white/95 dark:bg-slate-850 rounded-2xl border border-amber-200/50 dark:border-slate-800 p-3.5 shadow-xs hover:shadow-md transition-all">
      {/* Small top header with original action buttons */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-dashed border-amber-200/40 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            ID: {c.id}
          </span>
          {isPastForCase && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
              {language === 'bn' ? 'বিগত ধার্য তারিখ' : 'Past Date'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {c.petitionerMobile && (
            <a 
              href={`tel:${c.petitionerMobile}`} 
              className="w-5 h-5 rounded-full bg-emerald-600 hover:brightness-105 flex items-center justify-center border border-slate-200 shadow-3xs active:scale-95 transition-all shrink-0" 
              title={`কল করুন (বাদী): ${c.petitionerMobile}`}
            >
              <Phone size={10} className="text-white fill-white" />
            </a>
          )}
          {c.respondentMobile && (
            <a 
              href={`tel:${c.respondentMobile}`} 
              className="w-5 h-5 rounded-full bg-emerald-600 hover:brightness-105 flex items-center justify-center border border-slate-200 shadow-3xs active:scale-95 transition-all shrink-0" 
              title={`কল করুন (বিবাদী): ${c.respondentMobile}`}
            >
              <Phone size={10} className="text-white fill-white" />
            </a>
          )}
          <button 
            onClick={() => onViewCard(c)}
            className="p-1 bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-700 hover:text-white border border-amber-200 dark:border-slate-700 transition-all active:scale-95 shrink-0 shadow-3xs"
            title="ভিউ কার্ড"
          >
            <CreditCard size={11} />
          </button>
        </div>
      </div>

      {/* RESPONSIVE ULTRA-COMPACT PANEL */}
      <div className="w-full select-none mt-2">
        <div className="flex flex-nowrap items-stretch gap-1 w-full overflow-x-auto scrollbar-none pb-1.5">
          
          {/* 1. LEFT ARROW */}
          <button 
            type="button"
            className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-b from-blue-600 to-indigo-700 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all flex items-center justify-center shadow-3xs"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>

          {/* 2. পূর্ববর্তী তারিখ (PREVIOUS DATE) */}
          <div className="flex-1 min-w-[55px] sm:min-w-[75px] md:w-[90px] md:shrink-0 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-blue-150/40 dark:border-slate-750 p-1 shadow-3xs flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none mb-0.5">
                {language === 'bn' ? 'পূর্ববর্তী' : 'PREV'}
              </p>
              <p className="text-[7px] md:text-[9px] font-black text-slate-800 dark:text-white leading-none">
                {language === 'bn' ? 'তারিখ' : 'DATE'}
              </p>
            </div>
            <div className="pt-0.5">
              {isEditMode ? (
                <input
                  type="text"
                  value={prevDate}
                  onChange={(e) => setPrevDate(e.target.value)}
                  className="w-full px-1 py-0.5 bg-white dark:bg-slate-800 border border-blue-300 rounded text-[8px] font-bold text-slate-800 dark:text-white focus:outline-none"
                />
              ) : (
                <p className="text-[9px] md:text-xs font-black text-slate-800 dark:text-white leading-none">
                  {prevDate || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 3. মামলা নং (CASE NUMBER) - LARGE CENTRAL GRADIENT */}
          <div className="flex-2 min-w-[80px] sm:min-w-[100px] md:w-[120px] md:shrink-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 text-white rounded-xl p-1 shadow-2xs flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-indigo-200 uppercase tracking-widest leading-none">
                {language === 'bn' ? 'মামলা নং' : 'CASE NO'}
              </p>
            </div>
            <div className="pt-0.5">
              {isEditMode ? (
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full px-1 py-0.5 bg-indigo-900/60 border border-indigo-450 rounded text-[8px] font-bold text-white focus:outline-none"
                />
              ) : (
                <p className="text-[9px] md:text-xs font-black tracking-tight leading-none truncate">
                  {caseNumber || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 4. বাদীর নাম (PLAINTIFF) */}
          <div className="flex-1.5 min-w-[65px] sm:min-w-[80px] md:w-[100px] md:shrink-0 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-orange-150/40 dark:border-slate-750 p-1 shadow-3xs flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none mb-0.5">
                {language === 'bn' ? 'বাদীর' : 'PLAINTIFF'}
              </p>
              <p className="text-[7px] md:text-[9px] font-black text-slate-800 dark:text-white leading-none">
                {language === 'bn' ? 'নাম' : 'NAME'}
              </p>
            </div>
            <div className="pt-0.5">
              {isEditMode ? (
                <input
                  type="text"
                  value={petitioner}
                  onChange={(e) => setPetitioner(e.target.value)}
                  className="w-full px-1 py-0.5 bg-white dark:bg-slate-800 border border-orange-300 rounded text-[8px] font-bold text-slate-800 dark:text-white focus:outline-none"
                />
              ) : (
                <p className="text-[8px] md:text-[10px] font-black text-slate-800 dark:text-white leading-tight truncate">
                  {petitioner || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 5. V/S (VERSUS) */}
          <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-lg shadow-3xs flex items-center justify-center self-center">
            <p className="text-[9px] font-black tracking-tighter leading-none">
              V/S
            </p>
          </div>

          {/* 6. আসামীর নাম (DEFENDANT) */}
          <div className="flex-1.5 min-w-[65px] sm:min-w-[80px] md:w-[100px] md:shrink-0 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-emerald-150/40 dark:border-slate-750 p-1 shadow-3xs flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-0.5">
                {language === 'bn' ? 'আসামীর' : 'DEFENDANT'}
              </p>
              <p className="text-[7px] md:text-[9px] font-black text-slate-800 dark:text-white leading-none">
                {language === 'bn' ? 'নাম' : 'NAME'}
              </p>
            </div>
            <div className="pt-0.5">
              {isEditMode ? (
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  className="w-full px-1 py-0.5 bg-white dark:bg-slate-800 border border-emerald-300 rounded text-[8px] font-bold text-slate-800 dark:text-white focus:outline-none"
                />
              ) : (
                <p className="text-[8px] md:text-[10px] font-black text-slate-800 dark:text-white leading-tight truncate">
                  {respondent || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 7. পরবর্তী তারিখ (NEXT DATE) */}
          <div className="flex-1 min-w-[55px] sm:min-w-[75px] md:w-[90px] md:shrink-0 bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-sky-150/40 dark:border-slate-750 p-1 shadow-3xs flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-sky-500 uppercase tracking-widest leading-none mb-0.5">
                {language === 'bn' ? 'পরবর্তী' : 'NEXT'}
              </p>
              <p className="text-[7px] md:text-[9px] font-black text-slate-800 dark:text-white leading-none">
                {language === 'bn' ? 'তারিখ' : 'DATE'}
              </p>
            </div>
            <div className="pt-0.5">
              {isEditMode ? (
                <input
                  type="text"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-1 py-0.5 bg-white dark:bg-slate-800 border border-sky-300 rounded text-[8px] font-bold text-slate-800 dark:text-white focus:outline-none"
                />
              ) : (
                <p className="text-[9px] md:text-xs font-black text-slate-800 dark:text-white leading-none">
                  {nextDate || '---'}
                </p>
              )}
            </div>
          </div>

          {/* 8. ACTION SECTION - 2X2 MINI GRID */}
          <div className="flex-2 min-w-[90px] sm:min-w-[110px] md:w-[120px] md:shrink-0 p-0.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-750/50 flex flex-col justify-center min-h-[40px] md:min-h-[60px]">
            <div className="grid grid-cols-2 gap-0.5 h-full">
              
              <button
                type="button"
                onClick={() => setOrder('আদেশ')}
                className={`rounded-lg p-0.5 flex flex-col items-center justify-center transition-all ${
                  order === 'আদেশ' 
                    ? 'bg-emerald-600 text-white shadow-3xs' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[7px] font-bold border border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className="text-[6px] md:text-[8px] font-black leading-none">
                  {language === 'bn' ? 'আদেশ' : 'ORDER'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrder('পদক্ষেপ')}
                className={`rounded-lg p-0.5 flex flex-col items-center justify-center transition-all ${
                  order === 'পদক্ষেপ' 
                    ? 'bg-cyan-500 text-white shadow-3xs' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[7px] font-bold border border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className="text-[6px] md:text-[8px] font-black leading-none">
                  {language === 'bn' ? 'পদক্ষেপ' : 'STEP'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrder('হাজিরা')}
                className={`rounded-lg p-0.5 flex flex-col items-center justify-center transition-all ${
                  order === 'হাজিরা' 
                    ? 'bg-purple-600 text-white shadow-3xs' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[7px] font-bold border border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className="text-[6px] md:text-[8px] font-black leading-none">
                  {language === 'bn' ? 'হাজিরা' : 'ATTEND'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrder('জরি')}
                className={`rounded-lg p-0.5 flex flex-col items-center justify-center transition-all ${
                  order === 'জরি' 
                    ? 'bg-rose-500 text-white shadow-3xs' 
                    : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[7px] font-bold border border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className="text-[6px] md:text-[8px] font-black leading-none">
                  {language === 'bn' ? 'জরি' : 'FINE'}
                </span>
              </button>

            </div>
          </div>

          {/* 9. EDIT BUTTON */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-auto rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all self-center ${
              isEditMode 
                ? 'bg-amber-500 text-slate-900 scale-[1.02]' 
                : 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600 active:scale-95'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            <span className="text-[6px] md:text-[8px] font-black mt-0.5">EDIT</span>
          </button>

          {/* 10. PARTY BOXES - 3 separate cards */}
          
          {/* Column A: নিজ পক্ষ */}
          <div className="flex-1.5 min-w-[75px] sm:min-w-[90px] md:w-[110px] md:shrink-0 bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-purple-150/40 dark:border-slate-750 p-1 flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-purple-600 dark:text-purple-400 uppercase leading-none">
                {language === 'bn' ? 'নিজ পক্ষ' : 'OUR SIDE'}
              </p>
            </div>
            <div className="flex-1 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-0.5 mt-0.5 overflow-y-auto max-h-[30px] md:max-h-none">
              {isEditMode ? (
                <textarea
                  value={clientNotes1}
                  onChange={(e) => setClientNotes1(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-800 border border-purple-300 rounded p-0.5 text-[8px] font-bold text-slate-800 dark:text-white resize-none"
                />
              ) : (
                <p className="text-[8px] md:text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  {clientNotes1 || (language === 'bn' ? 'তথ্য নেই।' : 'No info.')}
                </p>
              )}
            </div>
          </div>

          {/* Column B: নিজ পক্ষ */}
          <div className="flex-1.5 min-w-[75px] sm:min-w-[90px] md:w-[110px] md:shrink-0 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-orange-150/40 dark:border-slate-750 p-1 flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase leading-none">
                {language === 'bn' ? 'নিজ পক্ষ' : 'OUR SIDE B'}
              </p>
            </div>
            <div className="flex-1 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg p-0.5 mt-0.5 overflow-y-auto max-h-[30px] md:max-h-none">
              {isEditMode ? (
                <textarea
                  value={clientNotes2}
                  onChange={(e) => setClientNotes2(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-800 border border-orange-300 rounded p-0.5 text-[8px] font-bold text-slate-800 dark:text-white resize-none"
                />
              ) : (
                <p className="text-[8px] md:text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  {clientNotes2 || (language === 'bn' ? 'তথ্য নেই।' : 'No info.')}
                </p>
              )}
            </div>
          </div>

          {/* 11. SAVE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isEditMode}
            className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-auto rounded-lg flex flex-col items-center justify-center transition-all self-center ${
              isEditMode 
                ? 'bg-gradient-to-b from-teal-500 to-emerald-600 text-white scale-[1.02]' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
            }`}
          >
            <Save className="w-3 h-3" />
            <span className="text-[6px] md:text-[8px] font-black mt-0.5">SAVE</span>
          </button>

          {/* Column C: উত্তর পক্ষ */}
          <div className="flex-1.5 min-w-[75px] sm:min-w-[90px] md:w-[110px] md:shrink-0 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded-xl border border-emerald-150/40 dark:border-slate-750 p-1 flex flex-col justify-between min-h-[40px] md:min-h-[60px]">
            <div>
              <p className="text-[6px] md:text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase leading-none">
                {language === 'bn' ? 'উত্তর পক্ষ' : 'OPPOSITE'}
              </p>
            </div>
            <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-0.5 mt-0.5 overflow-y-auto max-h-[30px] md:max-h-none">
              {isEditMode ? (
                <textarea
                  value={oppositeNotes}
                  onChange={(e) => setOppositeNotes(e.target.value)}
                  className="w-full h-full bg-white dark:bg-slate-800 border border-emerald-300 rounded p-0.5 text-[8px] font-bold text-slate-800 dark:text-white resize-none"
                />
              ) : (
                <p className="text-[8px] md:text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                  {oppositeNotes || (language === 'bn' ? 'তথ্য নেই।' : 'No info.')}
                </p>
              )}
            </div>
          </div>

          {/* 12. RIGHT ARROW */}
          <button 
            type="button"
            className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-b from-blue-600 to-indigo-700 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all flex items-center justify-center shadow-3xs"
          >
            <ArrowRight className="w-3 h-3" />
          </button>

        </div>
      </div>
    </div>
  );
};

const BookView = ({ 
  date, 
  cases, 
  onClose, 
  onPrev, 
  onNext, 
  onViewCard, 
  t,
  buttonLabels,
  onUpdateCaseLocal,
  language
}: { 
  date: string; 
  cases: Case[]; 
  onClose: () => void; 
  onPrev: () => void; 
  onNext: () => void; 
  onViewCard: (c: Case) => void;
  t: (key: any) => string;
  buttonLabels: any;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
}) => {
  const groupedByCourt = cases.reduce((acc, c) => {
    if (!acc[c.courtName]) acc[c.courtName] = [];
    acc[c.courtName].push(c);
    return acc;
  }, {} as Record<string, Case[]>);

  const steps = [
    buttonLabels.stepSummons || "সমন",
    buttonLabels.stepWitness || "স্বাক্ষী",
    buttonLabels.stepCross || "জেরা",
    buttonLabels.stepArgument || "যক্তিতর্ক",
    buttonLabels.stepJudgment || "রায়"
  ];
  
  const getGroupedByStep = (courtCases: Case[]) => {
    return courtCases.reduce((acc, c) => {
      const histForDate = c.history?.find(h => h.date === date);
      const stepText = histForDate?.order || c.order || c.status;
      const step = steps.find(s => stepText?.includes(s)) || "অন্যান্য";
      if (!acc[step]) acc[step] = [];
      acc[step].push(c);
      return acc;
    }, {} as Record<string, Case[]>);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6"
    >
      <motion.div 
        initial={{ rotateY: -90, originX: 0 }}
        animate={{ rotateY: 0 }}
        exit={{ rotateY: -90 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-[#fdfaf3] w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden border-[12px] sm:border-[16px] border-[#4a2e1b] ring-4 ring-[#8c5a3c]/30"
      >
        {/* Book Header */}
        <div className="p-4 sm:p-5 border-b border-amber-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#fbf8ee] gap-4 z-10 shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-800 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 border border-amber-950/20">
              <Book size={20} className="sm:w-5 sm:h-5 text-amber-100" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate flex items-center gap-2">
                📖 {t('date_diary')}
              </h3>
              <p className="text-amber-800 font-extrabold text-xs sm:text-sm mt-0.5">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button onClick={onPrev} className="p-2 sm:p-2.5 hover:bg-white rounded-xl transition-all border border-amber-200/60 text-amber-900 bg-amber-50/55 shadow-3xs active:scale-95">
              <ArrowLeft size={16} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={onNext} className="p-2 sm:p-2.5 hover:bg-white rounded-xl transition-all border border-amber-200/60 text-amber-900 bg-amber-50/55 shadow-3xs active:scale-95">
              <ArrowRight size={16} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={onClose} className="p-2 sm:p-2.5 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all border border-rose-200 text-rose-500 bg-rose-50/55 shadow-3xs ml-2 sm:ml-4 active:scale-95">
              <X size={16} className="sm:w-4 sm:h-4 font-black" />
            </button>
          </div>
        </div>

        {/* Book Content */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#fdfaf3] relative"
          style={{
            backgroundImage: `
              linear-gradient(to right, transparent 50px, #ff8a8a 50px, #ff8a8a 52px, transparent 52px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 94%, rgba(99, 102, 241, 0.12) 100%)
            `,
            backgroundSize: '100% 100%, 100% 2.4rem',
          }}
        >
          {/* Shaded Book Spine Effect in the middle (only on desktop md+) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 bg-gradient-to-r from-black/8 via-black/15 to-transparent -ml-6 pointer-events-none z-10" />
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 bg-gradient-to-l from-black/8 via-black/15 to-transparent -ml-6 pointer-events-none z-10" />
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[4px] bg-gradient-to-r from-amber-900/30 via-amber-950/60 to-amber-900/30 -ml-[2px] pointer-events-none z-15 shadow-inner" />

          {/* Lined Notebook Pages Layout */}
          <div className="relative z-10 pl-12 pr-2">
            {cases.length > 0 ? (
              <div className="space-y-10">
                {Object.entries(groupedByCourt).map(([court, courtCases]) => (
                  <div key={court} className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-amber-200 pb-1.5">
                      <div className="w-2 h-6 bg-amber-700 rounded-full"></div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">🏛️ {court}</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      {Object.entries(getGroupedByStep(courtCases)).map(([step, stepCases]) => (
                        <div key={step} className="space-y-3">
                          <h5 className="text-xs font-black text-amber-800 bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-lg inline-block tracking-wider uppercase">
                            {step === 'সমন' || step === buttonLabels.stepSummons ? buttonLabels.stepSummons || t('action_summons') : 
                             step === 'স্বাক্ষী' || step === buttonLabels.stepWitness ? buttonLabels.stepWitness || t('action_witness') : 
                             step === 'জেরা' || step === buttonLabels.stepCross ? buttonLabels.stepCross || t('action_cross_exam') : 
                             step === 'যক্তিতর্ক' || step === buttonLabels.stepArgument ? buttonLabels.stepArgument || t('action_argument') : 
                             step === 'রায়' || step === buttonLabels.stepJudgment ? buttonLabels.stepJudgment || t('action_judgment') : 
                             t('other_label')}
                          </h5>
                          <div className="space-y-4">
                            {stepCases.map(c => (
                              <MiniCasebook
                                key={c.id}
                                c={c}
                                language={language}
                                t={t}
                                buttonLabels={buttonLabels}
                                onUpdateCaseLocal={onUpdateCaseLocal}
                                onViewCard={onViewCard}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full py-16 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <CalendarIcon size={56} className="text-slate-400" />
                <p className="text-lg font-black text-slate-600">{t('no_case_on_date')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Book Footer */}
        <div className="p-3 bg-[#fbf8ee] border-t border-amber-200/50 text-center z-10">
          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest">© {t('digital_diary')} - {date}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const CalendarView = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  cases,
  onViewCard,
  onViewHistory,
  language,
  userType,
  govtHolidays = [],
  getBanglaDate,
  t,
  onUpdateCaseLocal,
  onOpenAiForCase
}: CalendarViewProps) => {
  const [showBookView, setShowBookView] = useState(false);
  const [hoveredHolidayReason, setHoveredHolidayReason] = useState<string | null>(null);
  const [focusedCaseId, setFocusedCaseId] = useState<string | number | null>(null);

  // Dynamic Button Customizer States
  const [buttonLabels, setButtonLabels] = useState(() => {
    const saved = localStorage.getItem('custom_button_labels');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      btnDocuments: language === 'bn' ? 'ডকুমেন্টস' : 'Documents',
      btnFaceToFace: language === 'bn' ? 'সামনাসামনি হতে চাই' : 'Face to Face',
      btnAskAi: language === 'bn' ? 'এআই সহায়ক' : 'Ask AI',
      btnEditInfo: language === 'bn' ? 'তথ্য সংশোধন' : 'Edit Info',
      btnViewCard: language === 'bn' ? 'কার্ড দেখুন' : 'View Card',
      btnViewHistory: language === 'bn' ? 'ইতিহাস দেখুন' : 'View History',
      btnConfirmFinalize: language === 'bn' ? 'চুড়ান্ত আদেশ ও পরবর্তী তারিখ আপডেট করুন' : 'Confirm Finalize & Update',
      btnDraftNotes: language === 'bn' ? 'কোর্ট সেশন খসড়া নোট' : 'Court Session Draft Notes',
      sectionAttendance: language === 'bn' ? '📂 হাজিরা বা সময়' : '📂 Attendance / Time',
      sectionCharge: language === 'bn' ? '⚡ চার্জ / শুনানি / জবাব' : '⚡ Charge / Argument / WS',
      sectionWitness: language === 'bn' ? '📝 সাক্ষী / জেরা / PH' : '📝 Witness / Cross / PH',
      sectionWarrant: language === 'bn' ? '🚨 W/A (ওয়ারেন্ট)' : '🚨 W/A (Warrant)',
      stepSummons: language === 'bn' ? 'সমন' : 'Summons',
      stepWitness: language === 'bn' ? 'স্বাক্ষী' : 'Witness',
      stepCross: language === 'bn' ? 'জেরা' : 'Cross Exam',
      stepArgument: language === 'bn' ? 'যক্তিতর্ক' : 'Argument',
      stepJudgment: language === 'bn' ? 'রায়' : 'Judgment'
    };
  });
  const [showButtonCustomizer, setShowButtonCustomizer] = useState(false);

  // Court Session Draft and Finalize States
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [finalizeDate, setFinalizeDate] = useState<string>('');
  const [finalizeOrder, setFinalizeOrder] = useState<string>('');
  const [finalizeFile, setFinalizeFile] = useState<File | null>(null);
  const [finalizeFilePreview, setFinalizeFilePreview] = useState<string | null>(null);
  const [isSavingFinal, setIsSavingFinal] = useState<boolean>(false);
  const [saveSuccessAnim, setSaveSuccessAnim] = useState<boolean>(false);

  // Multiple Parties Popup State
  const [activePartyModal, setActivePartyModal] = useState<{
    caseId: string | number;
    side: 'petitioner' | 'respondent';
    parties: { name: string; phone: string; serial: string | number }[];
  } | null>(null);

  // Case Editing Form State
  const [editingCaseData, setEditingCaseData] = useState<Case | null>(null);
  const [editCaseNumber, setEditCaseNumber] = useState('');
  const [editCourtName, setEditCourtName] = useState('');
  const [editCaseType, setEditCaseType] = useState('Civil');
  const [editPetitioner, setEditPetitioner] = useState('');
  const [editPetitionerMobile, setEditPetitionerMobile] = useState('');
  const [editRespondent, setEditRespondent] = useState('');
  const [editRespondentMobile, setEditRespondentMobile] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);

  // Sync edit form fields when editingCaseData changes
  useEffect(() => {
    if (editingCaseData) {
      setEditCaseNumber(editingCaseData.caseNumber || '');
      setEditCourtName(editingCaseData.courtName || '');
      setEditCaseType(editingCaseData.caseType || 'Civil');
      setEditPetitioner(editingCaseData.petitioner || '');
      setEditPetitionerMobile(editingCaseData.petitionerMobile || '');
      setEditRespondent(editingCaseData.respondent || '');
      setEditRespondentMobile(editingCaseData.respondentMobile || '');
      setEditStatus(editingCaseData.status || '');
    }
  }, [editingCaseData]);

  const handleEditCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaseData) return;
    setIsUpdatingCase(true);
    try {
      const newPetitionerNames = editPetitioner.split(',').map(n => n.trim()).filter(Boolean);
      const newPetitionerMobiles = editPetitionerMobile.split(',').map(m => m.trim()).filter(Boolean);
      const newPetitionerDetails = newPetitionerNames.map((name, idx) => ({
        name,
        phone: newPetitionerMobiles[idx] || newPetitionerMobiles[0] || editPetitionerMobile || '',
        serial: idx + 1
      }));

      const newRespondentNames = editRespondent.split(',').map(n => n.trim()).filter(Boolean);
      const newRespondentMobiles = editRespondentMobile.split(',').map(m => m.trim()).filter(Boolean);
      const newRespondentDetails = newRespondentNames.map((name, idx) => ({
        name,
        phone: newRespondentMobiles[idx] || newRespondentMobiles[0] || editRespondentMobile || '',
        serial: idx + 1
      }));

      const updatedFields: Partial<Case> = {
        caseNumber: editCaseNumber,
        courtName: editCourtName,
        caseType: editCaseType,
        petitioner: editPetitioner,
        petitionerMobile: editPetitionerMobile,
        petitionerDetails: newPetitionerDetails,
        respondent: editRespondent,
        respondentMobile: editRespondentMobile,
        respondentDetails: newRespondentDetails,
        status: editStatus
      };

      await updateCase(editingCaseData.id.toString(), updatedFields);
      onUpdateCaseLocal?.(editingCaseData.id, updatedFields);
      setEditingCaseData(null);
      
      setSaveSuccessAnim(true);
      setTimeout(() => setSaveSuccessAnim(false), 2500);
    } catch (err) {
      console.error("Failed to update case details:", err);
      alert(language === 'bn' ? 'তথ্য আপডেট করতে সমস্যা হয়েছে।' : 'Failed to update case details.');
    } finally {
      setIsUpdatingCase(false);
    }
  };

  const getPetitionersList = (c: Case) => {
    if (c.petitionerDetails && c.petitionerDetails.length > 0) {
      return c.petitionerDetails;
    }
    if (!c.petitioner) return [];
    const names = c.petitioner.split(',').map(n => n.trim()).filter(Boolean);
    const mobiles = c.petitionerMobile ? c.petitionerMobile.split(',').map(m => m.trim()).filter(Boolean) : [];
    return names.map((name, idx) => ({
      name,
      phone: mobiles[idx] || mobiles[0] || c.petitionerMobile || '',
      serial: idx + 1
    }));
  };

  const getRespondentsList = (c: Case) => {
    if (c.respondentDetails && c.respondentDetails.length > 0) {
      return c.respondentDetails;
    }
    if (!c.respondent) return [];
    const names = c.respondent.split(',').map(n => n.trim()).filter(Boolean);
    const mobiles = c.respondentMobile ? c.respondentMobile.split(',').map(m => m.trim()).filter(Boolean) : [];
    return names.map((name, idx) => ({
      name,
      phone: mobiles[idx] || mobiles[0] || c.respondentMobile || '',
      serial: idx + 1
    }));
  };

  useEffect(() => {
    if (focusedCaseId) {
      const saved = localStorage.getItem(`draft_notes_${focusedCaseId}`);
      setDraftNotes(saved || '');
      setFinalizeOrder(saved || '');
      // Find case
      const c = cases.find(item => item.id === focusedCaseId);
      if (c) {
        setFinalizeDate(c.nextDate || '');
      }
    } else {
      setDraftNotes('');
      setFinalizeDate('');
      setFinalizeOrder('');
      setFinalizeFile(null);
      setFinalizeFilePreview(null);
    }
  }, [focusedCaseId, cases]);

  const handleDraftNotesChange = (val: string) => {
    setDraftNotes(val);
    setFinalizeOrder(val); // Sync to finalize box automatically for convenience!
    if (focusedCaseId) {
      localStorage.setItem(`draft_notes_${focusedCaseId}`, val);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFinalizeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFinalizeFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalizeSave = async (c: Case) => {
    if (!finalizeDate) {
      alert(language === 'bn' ? 'অনুগ্রহ করে পরবর্তী শুনানির তারিখ সিলেক্ট করুন।' : 'Please select the next hearing date.');
      return;
    }

    setIsSavingFinal(true);
    try {
      let uploadedUrl = '';
      if (finalizeFile) {
        const fileExt = finalizeFile.name.split('.').pop() || 'jpg';
        const fileName = `order_${c.id}_${Date.now()}.${fileExt}`;
        const uploadResult = await uploadFile('documents', fileName, finalizeFile);
        if (uploadResult && (uploadResult as any).metadata?.downloadUrl) {
          uploadedUrl = (uploadResult as any).metadata.downloadUrl;
        } else {
          uploadedUrl = await getPublicUrl('documents', fileName);
        }
      }

      // Add to case history
      const currentFormattedDate = selectedDate || new Date().toISOString().split('T')[0];
      const newHistoryEntry: CaseHistoryEntry = {
        id: Date.now().toString(),
        date: currentFormattedDate,
        actionBy: 'court',
        description: finalizeOrder || draftNotes || (language === 'bn' ? 'হাজিরা / শুনানির আদেশ' : 'Attendance / Hearing Order'),
        order: finalizeOrder || draftNotes || (language === 'bn' ? 'হাজিরা / শুনানির আদেশ' : 'Attendance / Hearing Order'),
        documents: uploadedUrl ? [{ name: 'Order Sheet', type: 'image', url: uploadedUrl }] : []
      };

      const updatedHistory = [...(c.history || []), newHistoryEntry];
      const updatedFields: Partial<Case> = {
        nextDate: finalizeDate,
        order: finalizeOrder || draftNotes || (language === 'bn' ? 'হাজিরা / শুনানির আদেশ' : 'Attendance / Hearing Order'),
        history: updatedHistory
      };

      await updateCase(c.id.toString(), updatedFields);
      onUpdateCaseLocal?.(c.id, updatedFields);

      // Clear local storage draft
      if (focusedCaseId) {
        localStorage.removeItem(`draft_notes_${focusedCaseId}`);
      }

      setDraftNotes('');
      setFinalizeOrder('');
      setFinalizeFile(null);
      setFinalizeFilePreview(null);
      
      setSaveSuccessAnim(true);
      setTimeout(() => {
        setSaveSuccessAnim(false);
      }, 3000);

    } catch (err) {
      console.error("Failed to finalize case:", err);
      alert(language === 'bn' ? 'আপডেট করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to finalize. Please try again.');
    } finally {
      setIsSavingFinal(false);
    }
  };

  const getHolidayReason = (dateStr: string, dayOfWeek: number) => {
    if (govtHolidays) {
      if (Array.isArray(govtHolidays)) {
        if (govtHolidays.includes(dateStr)) return language === 'bn' ? 'সরকারি ছুটি' : 'Govt Holiday';
      } else {
        if (govtHolidays[dateStr]) return govtHolidays[dateStr];
      }
    }
    if (dayOfWeek === 5) return language === 'bn' ? 'সাপ্তাহিক ছুটি (শুক্রবার)' : 'Weekly Holiday (Friday)';
    if (dayOfWeek === 6) return language === 'bn' ? 'সাপ্তাহিক ছুটি (শনিবার)' : 'Weekly Holiday (Saturday)';
    return '';
  };
  const [bookDate, setBookDate] = useState<string | null>(null);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  const monthNames = language === 'bn' 
    ? ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const weekDays = language === 'bn'
    ? ["রবি", "সোম", "মংগল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCasesForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return cases.filter(c => isCaseOnDate(c, dateStr));
  };

  const selectedDateCases = selectedDate ? cases.filter(c => isCaseOnDate(c, selectedDate)) : [];

  const groupedAndCategorizedCases = (() => {
    const groups: {
      [courtName: string]: {
        attendance: Case[];
        charge: Case[];
        witness: Case[];
        wa: Case[];
      }
    } = {};

    selectedDateCases.forEach(c => {
      const court = c.courtName || (language === 'bn' ? 'অন্যান্য আদালত' : 'Other Court');
      if (!groups[court]) {
        groups[court] = { attendance: [], charge: [], witness: [], wa: [] };
      }

      const histEntry = selectedDate ? c.history?.find(h => h.date === selectedDate) : null;
      const orderStr = (histEntry?.order || c.order || '').toLowerCase();
      const detailsStr = (c.details || '').toLowerCase();
      const combinedStr = `${orderStr} ${detailsStr}`;

      const isWa = combinedStr.includes('w/a') || 
                   combinedStr.includes('w.a.') || 
                   combinedStr.includes('wa') || 
                   combinedStr.includes('warrant') || 
                   combinedStr.includes('গ্রেপ্তারি') || 
                   combinedStr.includes('ওয়ারেন্ট') || 
                   combinedStr.includes('ওয়ারেন্ট');

      const isWitness = combinedStr.includes('সাক্ষী') || 
                        combinedStr.includes('সাক্ষ্য') || 
                        combinedStr.includes('witness') || 
                        combinedStr.includes('pw') || 
                        combinedStr.includes('p.w.') || 
                        combinedStr.includes('ph') || 
                        combinedStr.includes('evidence') ||
                        combinedStr.includes('জেরা');

      const isCharge = combinedStr.includes('চার্জ') || 
                       combinedStr.includes('গঠন') || 
                       combinedStr.includes('শুনানি') || 
                       combinedStr.includes('charge') || 
                       combinedStr.includes('frame') || 
                       combinedStr.includes('argument') || 
                       combinedStr.includes('তর্ক') ||
                       combinedStr.includes('জবাব') ||
                       combinedStr.includes('ws') ||
                       combinedStr.includes('w.s.') ||
                       combinedStr.includes('statement');

      if (isWa) {
        groups[court].wa.push(c);
      } else if (isWitness) {
        groups[court].witness.push(c);
      } else if (isCharge) {
        groups[court].charge.push(c);
      } else {
        groups[court].attendance.push(c);
      }
    });

    return groups;
  })();

  const renderSubgroupSection = (title: string, casesList: Case[], badgeColorClass: string) => {
    return (
      <div className="space-y-1">
        <div className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1 border ${badgeColorClass}`}>
          {title} ({language === 'bn' ? casesList.length.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('') : casesList.length})
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse bg-white/40 rounded-xl overflow-hidden border border-[#e3dcc4]/30">
            <thead>
              <tr className="border-b border-[#e3dcc4]/40 text-[8px] font-black text-[#6e6347] uppercase tracking-wider bg-[#f3efe0]/30">
                <th className="py-1 px-1.5 w-8 text-center">{language === 'bn' ? 'ক্র. নং' : 'SL'}</th>
                <th className="py-1 px-1.5">{language === 'bn' ? 'মামলা নম্বর' : 'Case No'}</th>
                <th className="py-1 px-1.5">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</th>
                <th className="py-1 px-1.5">{language === 'bn' ? 'পদক্ষেপ' : 'Step'}</th>
                <th className="py-1 px-1 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dcc4]/20">
              {casesList.map((c, sIdx) => {
                const slNo = language === 'bn' 
                  ? (sIdx + 1).toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                  : (sIdx + 1);
                const histEntry = selectedDate ? c.history?.find(h => h.date === selectedDate) : null;
                const displayOrder = histEntry?.order || c.order;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setFocusedCaseId(c.id)}
                    className={`group transition-colors cursor-pointer text-[10px] ${
                      c.selectedParty === 'petitioner'
                        ? 'bg-[#f0faf2]/90 hover:bg-[#def5e4]'
                        : c.selectedParty === 'respondent' || c.selectedParty === 'accused'
                          ? 'bg-[#fff5f6]/90 hover:bg-[#ffe6e8]'
                          : 'hover:bg-[#f3efe0]/40'
                    }`}
                  >
                    <td className="py-1.5 px-1.5 text-center font-bold text-[#756a4e] border-r border-[#e3dcc4]/10">{slNo}</td>
                    <td className="py-1.5 px-1.5 font-extrabold text-slate-950 border-r border-[#e3dcc4]/10">
                      <div>
                        <span>{c.caseNumber}</span>
                        <div className="flex gap-0.5 mt-0.5">
                          <span className={`text-[6px] font-extrabold px-1 py-0.2 rounded ${c.caseType === 'Civil' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                            {c.caseType}
                          </span>
                          {c.selectedParty === 'petitioner' ? (
                            <span className="text-[6px] font-black px-1 py-0.2 bg-emerald-600 text-white rounded">
                              {language === 'bn' ? 'বাদী' : 'Pet'}
                            </span>
                          ) : c.selectedParty === 'respondent' || c.selectedParty === 'accused' ? (
                            <span className="text-[6px] font-black px-1 py-0.2 bg-rose-600 text-white rounded">
                              {language === 'bn' ? 'আসামী' : 'Acc'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-1.5 border-r border-[#e3dcc4]/10 max-w-[100px] truncate">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 leading-tight">{c.petitioner}</span>
                        <span className="text-[7px] text-[#b3a886] font-bold leading-none my-0.5">VS</span>
                        <span className="font-semibold text-slate-800 leading-tight">
                          {c.respondentDetails && c.respondentDetails.length > 0 ? c.respondentDetails[0].name : c.respondent}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-1.5 border-r border-[#e3dcc4]/10">
                      <p className="text-[9px] text-slate-700 line-clamp-1" title={displayOrder}>
                        {displayOrder || <span className="text-slate-400 italic">{language === 'bn' ? 'পদক্ষেপ নেই' : 'No steps'}</span>}
                      </p>
                    </td>
                     <td className="py-1.5 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-0.5">
                        {onOpenAiForCase && (
                          <button 
                            onClick={() => onOpenAiForCase(c)}
                            className="p-0.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-all"
                            title={language === 'bn' ? 'এআই সহায়ক' : 'Ask AI'}
                          >
                            <Sparkles size={9} className="animate-pulse" />
                          </button>
                        )}
                        {userType !== 'client' && (
                          <button 
                            onClick={() => setEditingCaseData(c)}
                            className="p-0.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-600 hover:text-white transition-all"
                            title={language === 'bn' ? 'তথ্য সংশোধন করুন' : 'Edit Info'}
                          >
                            <Edit2 size={9} />
                          </button>
                        )}
                        <button 
                          onClick={() => onViewCard(c)}
                          className="p-0.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-all"
                          title={language === 'bn' ? 'কার্ড দেখুন' : 'View Card'}
                        >
                          <CreditCard size={9} />
                        </button>
                        <button 
                          onClick={() => onViewHistory(c)}
                          className="p-0.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-600 hover:text-white transition-all"
                          title={language === 'bn' ? 'ইতিহাস দেখুন' : 'View History'}
                        >
                          <History size={9} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setBookDate(dateStr);
    setFocusedCaseId(null);
    setShowBookView(true); // Always auto-open the skeuomorphic open book Daily Hearing Diary!
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!bookDate) return;
    const current = new Date(bookDate);
    const next = new Date(current);
    next.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    const nextStr = next.toISOString().split('T')[0];
    setBookDate(nextStr);
    setSelectedDate(nextStr);
    
    // Update current month if needed
    if (next.getMonth() !== currentMonth.getMonth() || next.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const getBanglaMonthYear = (date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    
    const firstMonthIdx = (month + 8) % 12;
    const secondMonthIdx = (month + 9) % 12;
    
    const firstMonthName = bnMonths[firstMonthIdx];
    const secondMonthName = bnMonths[secondMonthIdx];
    
    let bnYear1 = year - 593;
    if (month < 3) bnYear1 = year - 594;
    
    let bnYear2 = bnYear1;
    if (month === 3) {
      bnYear1 = year - 594;
      bnYear2 = year - 593;
    }
    
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBnNum = (n: number) => n.toString().split('').map(d => bnNums[parseInt(d)]).join('');
    
    if (bnYear1 === bnYear2) {
      return `${firstMonthName} - ${secondMonthName} ${toBnNum(bnYear1)}`;
    } else {
      return `${firstMonthName} ${toBnNum(bnYear1)} - ${secondMonthName} ${toBnNum(bnYear2)}`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-140px)] lg:min-h-[580px] max-w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AnimatePresence>
        {hoveredHolidayReason && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[200] px-6 py-3 bg-rose-600 text-white rounded-2xl shadow-2xl font-bold flex items-center gap-3 backdrop-blur-md border border-white/20"
          >
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <CalendarIcon size={18} />
            </div>
            <span className="whitespace-nowrap">{hoveredHolidayReason}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookView && bookDate && (
          <BookView 
            date={bookDate}
            cases={cases.filter(c => isCaseOnDate(c, bookDate))}
            onClose={() => setShowBookView(false)}
            onPrev={() => navigateDate('prev')}
            onNext={() => navigateDate('next')}
            onViewCard={onViewCard}
            t={t}
            buttonLabels={buttonLabels}
            onUpdateCaseLocal={onUpdateCaseLocal}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Calendar Section */}
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <p className="text-indigo-600 font-bold text-[10px] sm:text-xs mt-0.5">
                {getBanglaMonthYear(currentMonth)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-3xs"
            >
              {t('today')}
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day, idx) => {
              const isHoliday = idx === 5 || idx === 6; // Fri and Sat in Sun-Sat week
              return (
                <div key={day} className={`text-center text-xs font-black uppercase tracking-widest ${isHoliday ? 'text-rose-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {prevMonthDays.map(i => (
              <div key={`prev-${i}`} className="aspect-square rounded-2xl bg-slate-50/30 border border-transparent opacity-20" />
            ))}
            {days.map(day => {
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayCases = getCasesForDate(day);
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toDateString() === dateObj.toDateString();
              
              const dayOfWeek = dateObj.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
              const isGovtHoliday = Array.isArray(govtHolidays) ? govtHolidays.includes(dateStr) : !!govtHolidays?.[dateStr];
              const isHoliday = dayOfWeek === 5 || dayOfWeek === 6 || isGovtHoliday;
              const reason = getHolidayReason(dateStr, dayOfWeek);
              
              const bnDate = getBanglaDate ? getBanglaDate(dateObj) : '';
              
              const isLawyerOrClerk = userType === 'lawyer' || userType === 'clerk';
              const todayStr = new Date().toISOString().split('T')[0];
              const isPast = dateStr < todayStr;
              const hasPendingOverdue = dayCases.some(c => !c.isUpdated && c.nextDate === dateStr);
              const shouldBlink = isLawyerOrClerk && isPast && hasPendingOverdue;
              const isPastOrToday = dateStr <= todayStr;
              const shouldHighlightPending = isLawyerOrClerk && isPastOrToday && hasPendingOverdue;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  onMouseEnter={() => isHoliday && setHoveredHolidayReason(reason)}
                  onMouseLeave={() => setHoveredHolidayReason(null)}
                  onTouchStart={() => isHoliday && setHoveredHolidayReason(reason)}
                  onTouchEnd={() => setHoveredHolidayReason(null)}
                  className={`
                    aspect-square rounded-2xl border transition-all duration-300 relative group p-1.5 flex flex-col justify-between
                    ${isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 z-10' 
                      : isToday
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                        : isHoliday
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }
                    ${shouldBlink ? 'animate-blink border-rose-500 shadow-rose-200 shadow-md' : ''}
                  `}
                >
                  {shouldHighlightPending && (
                    <div className="absolute inset-2 rounded-full bg-rose-500/20 animate-ping" />
                  )}
                  {shouldHighlightPending && (
                    <div className="absolute inset-0 rounded-2xl bg-rose-500/10 animate-pulse border-2 border-rose-500/30" />
                  )}
                  <div className="flex justify-start w-full relative z-10">
                    <span className={`text-lg sm:text-xl leading-none font-black ${isSelected || isToday ? 'text-white' : isHoliday ? 'text-rose-600' : 'text-slate-700'}`}>
                      {day}
                    </span>
                  </div>
                  
                  {bnDate && (
                    <div className="flex justify-end w-full mt-auto relative z-10">
                      <span className={`text-[9px] sm:text-[10px] font-bold leading-none ${isSelected || isToday ? 'text-white/90' : 'text-indigo-600'}`}>
                        {bnDate}
                      </span>
                    </div>
                  )}

                  {isHoliday && !isSelected && !isToday && (
                    <span className="absolute top-1 right-2 text-[8px] font-black text-rose-400 uppercase tracking-tighter">
                      {language === 'bn' ? 'বন্ধ' : 'Closed'}
                    </span>
                  )}

                  {dayCases.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-0.5">
                      {dayCases.slice(0, 3).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 h-1 rounded-full ${isSelected || isToday ? 'bg-white' : 'bg-indigo-400'}`} 
                        />
                      ))}
                    </div>
                  )}
                  {dayCases.length > 0 && !isSelected && !isToday && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-0 group-hover:scale-100 transition-transform">
                      {dayCases.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-4 h-full flex flex-col">
        <div className="relative bg-[#fdfbf7] p-5 rounded-[2.5rem] border-2 border-[#e3dcc4] shadow-md h-full flex flex-col overflow-hidden">
          {/* Notebook Spiral Ring Binder Effect */}
          <div className="absolute left-2.5 top-0 bottom-0 w-5 flex flex-col justify-around items-center pointer-events-none z-20 opacity-80">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 -my-1">
                {/* Spiral binder hole */}
                <div className="w-2 h-2 rounded-full bg-slate-800/20 border border-slate-900/30 shadow-inner" />
                {/* Silver Metal Ring Hook */}
                <div className="w-4 h-1.5 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-sm -ml-2 border border-slate-300" />
              </div>
            ))}
          </div>

          {/* Red Notebook Margin Line */}
          <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-rose-400/45 z-10 pointer-events-none" />

          {/* Diary Header */}
          <div className="pl-7 flex items-center justify-between mb-4 border-b border-[#e3dcc4] pb-3 z-10">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#524933] flex items-center gap-1.5">
                📖 {language === 'bn' ? 'দৈনিক শুনানি ডায়েরী' : 'Daily Hearing Diary'}
              </h3>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5 bg-indigo-50/75 px-2 py-0.5 rounded-full inline-block border border-indigo-100/70">
                {selectedDate ? `${language === 'bn' ? 'তারিখ:' : 'Date:'} ${selectedDate}` : t('today_schedule')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowButtonCustomizer(true)}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer"
                title={language === 'bn' ? 'বাটন এডিট করুন' : 'Edit Buttons'}
              >
                📝 {language === 'bn' ? 'বাটন এডিট' : 'Edit Buttons'}
              </button>
              <span className="text-[9px] font-bold bg-[#e3dcc4]/50 text-[#524933] px-2.5 py-0.5 rounded-full border border-[#d2c9ab]">
                {language === 'bn' ? 'মোট: ' : 'Total: '}
                {language === 'bn' 
                  ? selectedDateCases.length.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                  : selectedDateCases.length
                }
              </span>
            </div>
          </div>

          {/* Lined Notebook Paper Case Table */}
          <div className="pl-7 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[220px] z-10 bg-[linear-gradient(rgba(0,0,0,0)_94%,rgba(99,102,241,0.06)_6%)] bg-[length:100%_2.4rem]">
            <AnimatePresence mode="wait">
              {focusedCaseId ? (
                (() => {
                  const c = selectedDateCases.find(caseItem => caseItem.id === focusedCaseId);
                  if (!c) {
                    setFocusedCaseId(null);
                    return null;
                  }
                  const histEntry = selectedDate ? c.history?.find(h => h.date === selectedDate) : null;
                  const displayOrder = histEntry?.order || c.order;
                  const petitionersList = getPetitionersList(c);
                  const respondentsList = getRespondentsList(c);

                  return (
                    <motion.div
                      key={`focused-${c.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 space-y-3"
                    >
                      {/* Back to list button */}
                      <button
                        onClick={() => setFocusedCaseId(null)}
                        className="mb-2 px-2.5 py-1 bg-[#f3efe0] border border-[#d2c9ab] hover:bg-[#e3dcc4] text-[#524933] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-3xs"
                      >
                        <ChevronLeft size={12} />
                        {language === 'bn' ? 'সকল মামলা' : 'All Cases'}
                      </button>

                      {/* Hand-written styled details layout for specific case */}
                      <div className={`space-y-3 text-slate-800 p-3 rounded-2xl border ${
                        c.selectedParty === 'petitioner'
                          ? 'bg-[#ecfbf3] border-[#b0e8c2]'
                          : c.selectedParty === 'respondent' || c.selectedParty === 'accused'
                            ? 'bg-[#fff5f6] border-[#ffd0d3]'
                            : 'bg-[#fbf9f2]/80 border-[#e3dcc4]/50'
                      }`}>
                         <div className="flex items-start justify-between gap-2 border-b border-[#e3dcc4]/30 pb-2 mb-2">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {language === 'bn' ? 'মামলা নম্বর' : 'Case Number'}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-base font-black text-slate-900 leading-none">
                                {c.caseNumber}
                              </p>
                              {c.selectedParty === 'petitioner' ? (
                                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 bg-emerald-600 text-white rounded-full">
                                  {language === 'bn' ? 'আমার মক্কেল: বাদী পক্ষ' : 'Client: Petitioner'}
                                </span>
                              ) : c.selectedParty === 'respondent' || c.selectedParty === 'accused' ? (
                                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 bg-rose-600 text-white rounded-full">
                                  {language === 'bn' ? 'আমার মক্কেল: আসামী পক্ষ' : 'Client: Defendant/Accused'}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {onOpenAiForCase && (
                              <button
                                type="button"
                                onClick={() => onOpenAiForCase(c)}
                                className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all select-none flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                                title={language === 'bn' ? 'এআই কে এই মামলা সম্পর্কে প্রশ্ন করুন' : 'Ask AI about this case'}
                              >
                                <Sparkles size={11} className="text-indigo-600 animate-pulse" />
                                <span>{language === 'bn' ? 'এআই সহায়ক' : 'Ask AI'}</span>
                              </button>
                            )}
                            {userType !== 'client' && (
                              <button
                                type="button"
                                onClick={() => setEditingCaseData(c)}
                                className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all select-none flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                                title={language === 'bn' ? 'মামলার তথ্য সংশোধন করুন' : 'Edit Case Details'}
                              >
                                <Edit2 size={11} />
                                <span>{language === 'bn' ? 'তথ্য সংশোধন' : 'Edit Info'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {language === 'bn' ? 'মামলার ধরন' : 'Case Type'}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-block ${c.caseType === 'Civil' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                              {c.caseType}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {language === 'bn' ? 'পরবর্তী শুনানির তারিখ' : 'Next Date'}
                            </span>
                            <p className="text-xs font-bold text-slate-900 leading-none mt-0.5">
                              {c.nextDate || (language === 'bn' ? 'নির্ধারিত নয়' : 'Not Scheduled')}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                            {language === 'bn' ? 'আদালতের নাম' : 'Court Name'}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            {c.courtName}
                          </p>
                        </div>

                        <div className="border-t border-[#e3dcc4]/50 my-1 pt-1.5" />

                        {/* Parties Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white/60 p-2 rounded-xl border border-[#e3dcc4]/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">
                                {language === 'bn' ? 'বাদী / প্রথম পক্ষ' : 'Petitioner'}
                              </span>
                              {petitionersList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActivePartyModal({
                                    caseId: c.id,
                                    side: 'petitioner',
                                    parties: petitionersList
                                  })}
                                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 px-1.5 py-0.2 rounded-md transition-all select-none flex items-center gap-0.5 cursor-pointer"
                                  title={language === 'bn' ? 'সকল বাদী দেখুন' : 'Show all petitioners'}
                                >
                                  ( {petitionersList.length} )
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-black text-slate-900 leading-none">
                                {petitionersList.length > 0 ? (
                                  `${petitionersList[0].name}${petitionersList.length > 1 ? ' গং' : ''}`
                                ) : (
                                  c.petitioner || ''
                                )}
                              </span>
                              {c.petitionerMobile && (
                                <a 
                                  href={`tel:${c.petitionerMobile}`} 
                                  className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] flex items-center justify-center border border-slate-300 shadow-3xs"
                                >
                                  <Phone size={5} className="text-white fill-white" />
                                </a>
                              )}
                            </div>
                            {c.petitionerMobile && (
                              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{c.petitionerMobile}</p>
                            )}
                          </div>

                          <div className="bg-white/60 p-2 rounded-xl border border-[#e3dcc4]/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-[#b3a886]">
                                {language === 'bn' ? 'বিবাদী / দ্বিতীয় পক্ষ' : 'Respondent'}
                              </span>
                              {respondentsList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActivePartyModal({
                                    caseId: c.id,
                                    side: 'respondent',
                                    parties: respondentsList
                                  })}
                                  className="text-[10px] font-black text-[#8c7e53] hover:text-[#736539] bg-amber-50 hover:bg-amber-100 border border-[#e3dcc4] px-1.5 py-0.2 rounded-md transition-all select-none flex items-center gap-0.5 cursor-pointer"
                                  title={language === 'bn' ? 'সকল বিবাদী দেখুন' : 'Show all respondents'}
                                >
                                  ( {respondentsList.length} )
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-black text-slate-900 leading-none">
                                {respondentsList.length > 0 ? (
                                  `${respondentsList[0].name}${respondentsList.length > 1 ? ' গং' : ''}`
                                ) : (
                                  c.respondent || ''
                                )}
                              </span>
                              {c.respondentMobile && (
                                <a 
                                  href={`tel:${c.respondentMobile}`} 
                                  className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] flex items-center justify-center border border-slate-300 shadow-3xs"
                                >
                                  <Phone size={5} className="text-white fill-white" />
                                </a>
                              )}
                            </div>
                            {c.respondentMobile && (
                              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{c.respondentMobile}</p>
                            )}
                          </div>
                        </div>

                        {/* Order & Steps */}
                        <div className="bg-amber-50/45 border border-[#e3dcc4]/55 p-2.5 rounded-xl">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                            {language === 'bn' ? 'আদেশ / শুনানির পদক্ষেপ' : 'Order / Hearing Steps'}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 leading-relaxed">
                            {displayOrder || (language === 'bn' ? 'কোনো পদক্ষেপের বিবরণ নেই' : 'No steps or orders recorded')}
                          </p>
                        </div>

                        {/* COURT SESSION DRAFT NOTES - TEMPORARY STORAGE */}
                        <div className="bg-yellow-50/60 border border-yellow-200/80 p-3 rounded-xl space-y-2 relative shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                              📝 {language === 'bn' ? 'কোর্ট সেশন খসড়া নোট' : 'Court Session Draft Notes'}
                            </span>
                            <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              {language === 'bn' ? 'সাময়িক সংরক্ষণ' : 'Temp Saved'}
                            </span>
                          </div>
                          
                          <p className="text-[8px] text-[#8c7a51] font-bold leading-tight">
                            {language === 'bn' 
                              ? '*কোর্ট চলাকালীন এখানে যা টাইপ করবেন তা সাময়িকভাবে ব্রাউজারে সুরক্ষিত থাকবে। পরবর্তী তারিখ ফাইনাল এন্ট্রি করা মাত্রই এটি সার্ভারে স্থায়ীভাবে সেট হয়ে যাবে।' 
                              : '*Any notes typed here during court sessions are safely stored locally. Finalizing the next date commits everything permanently.'
                            }
                          </p>

                          <textarea
                            className="w-full text-[11px] font-bold text-slate-800 bg-[#fefcf3] border border-yellow-300/60 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-slate-400/80"
                            rows={3}
                            value={draftNotes}
                            onChange={(e) => handleDraftNotesChange(e.target.value)}
                            placeholder={language === 'bn' ? 'শুনানির খসড়া আদেশ বা গুরুত্বপূর্ন তথ্য এখানে লিখুন...' : 'Write draft hearing notes or session highlights...'}
                          />
                        </div>

                        {/* FINALIZE UPDATE: ORDER, NEXT DATE, IMAGE */}
                        <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl space-y-3 shadow-2xs">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block">
                            🏛️ {language === 'bn' ? 'মূল আদেশ ও পরবর্তী শুনানির তারিখ সেট করুন' : 'Update Final Order & Next Date'}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black text-indigo-700 block mb-1">
                                {language === 'bn' ? 'পরবর্তী শুনানির তারিখ *' : 'Next Hearing Date *'}
                              </label>
                              <input
                                type="date"
                                className="w-full text-xs font-bold text-slate-800 bg-white border border-indigo-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={finalizeDate}
                                onChange={(e) => setFinalizeDate(e.target.value)}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-black text-indigo-700 block mb-1">
                                {language === 'bn' ? 'আদেশপত্রের ছবি (ঐচ্ছিক)' : 'Order Sheet Photo (Optional)'}
                              </label>
                              <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer bg-white border border-indigo-200 rounded-lg p-2 flex items-center justify-center gap-1 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition-all border-dashed">
                                  <Camera size={12} />
                                  <span>{finalizeFile ? (language === 'bn' ? 'ছবি নির্বাচন করা হয়েছে' : 'Selected') : (language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo')}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                  />
                                </label>
                                {finalizeFilePreview && (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-200 relative shrink-0">
                                    <img src={finalizeFilePreview} alt="preview" className="w-full h-full object-cover" />
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setFinalizeFile(null);
                                        setFinalizeFilePreview(null);
                                      }}
                                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-black text-indigo-700 block mb-1">
                              {language === 'bn' ? 'চুড়ান্ত আদেশ বা পদক্ষেপের সারসংক্ষেপ' : 'Final Order / Summary of Step'}
                            </label>
                            <textarea
                              className="w-full text-xs font-bold text-slate-800 bg-white border border-indigo-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                              rows={2}
                              value={finalizeOrder}
                              onChange={(e) => setFinalizeOrder(e.target.value)}
                              placeholder={language === 'bn' ? 'আদালতের দেওয়া চুড়ান্ত আদেশ বা পরবর্তী পদক্ষেপ...' : 'The final order given by the court or next legal step...'}
                            />
                          </div>

                          {saveSuccessAnim && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2 text-[10px] font-black flex items-center gap-1.5"
                            >
                              <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                              <span>{language === 'bn' ? 'সার্ভারে সফলভাবে ইতিহাস ও চুড়ান্ত তারিখ সংরক্ষিত হয়েছে!' : 'Successfully saved permanent history & next date to the server!'}</span>
                            </motion.div>
                          )}

                          <button
                            onClick={() => handleFinalizeSave(c)}
                            disabled={isSavingFinal}
                            className={`w-full py-2 rounded-xl text-white font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                              isSavingFinal 
                                ? 'bg-indigo-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-700 to-indigo-800 hover:brightness-105 active:scale-[0.99]'
                            }`}
                          >
                            {isSavingFinal ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                <span>{language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                              </>
                            ) : (
                              <>
                                <Upload size={12} />
                                <span>{language === 'bn' ? 'চুড়ান্ত আদেশ ও পরবর্তী তারিখ আপডেট করুন' : 'Confirm Finalize & Update'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button 
                            onClick={() => onViewCard(c)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-3xs"
                          >
                            <CreditCard size={11} />
                            {language === 'bn' ? 'কার্ড' : 'Card'}
                          </button>
                          <button 
                            onClick={() => onViewHistory(c)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-3xs"
                          >
                            <History size={11} />
                            {language === 'bn' ? 'ইতিহাস' : 'History'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()
              ) : selectedDateCases.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedAndCategorizedCases).map(([courtName, categories]) => {
                    const totalCourtCases = categories.attendance.length + categories.charge.length + categories.witness.length + categories.wa.length;
                    if (totalCourtCases === 0) return null;
                    return (
                      <div key={courtName} className="bg-white/40 border border-[#e3dcc4]/50 rounded-2xl p-2.5 space-y-3 shadow-3xs relative overflow-hidden">
                        {/* Court Title Bar */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#e3dcc4]/30">
                          <span className="text-[10px] sm:text-[11px] font-black text-[#524933] flex items-center gap-1.5">
                            🏛️ {courtName}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-bold bg-[#e3dcc4]/45 text-[#524933] px-2 py-0.5 rounded-full border border-[#d2c9ab]/40">
                            {language === 'bn' ? 'মোট: ' : 'Total: '}
                            {language === 'bn'
                              ? totalCourtCases.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                              : totalCourtCases
                            }
                          </span>
                        </div>

                        {/* Categorized sub-sections (Chronological order) */}
                        <div className="space-y-3 pl-1">
                          {categories.attendance.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionAttendance || (language === 'bn' ? '📂 হাজিরা বা সময়' : '📂 Attendance / Time'), 
                            categories.attendance, 
                            'bg-slate-50 text-slate-700 border-slate-200'
                          )}
                          {categories.charge.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionCharge || (language === 'bn' ? '⚡ চার্জ / শুনানি / জবাব' : '⚡ Charge / Argument / WS'), 
                            categories.charge, 
                            'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                          {categories.witness.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionWitness || (language === 'bn' ? '📝 সাক্ষী / জেরা / PH' : '📝 Witness / Cross / PH'), 
                            categories.witness, 
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                          {categories.wa.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionWarrant || (language === 'bn' ? '🚨 W/A (ওয়ারেন্ট)' : '🚨 W/A (Warrant)'), 
                            categories.wa, 
                            'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-16"
                >
                  <CalendarIcon size={44} className="text-[#c2baa0]/50 mb-2" />
                  <p className="text-xs font-black text-[#756a4e]">
                    {language === 'bn' ? 'এই তারিখে কোনো মামলা তালিকাভুক্ত নেই' : 'No cases listed for this date'}
                  </p>
                  <p className="text-[10px] text-[#9c9172] mt-0.5">
                    {language === 'bn' ? 'ক্যালেন্ডার থেকে যেকোনো তারিখ সিলেক্ট করুন' : 'Select any date from the calendar to view its diary entry'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedDateCases.length > 0 && (
            <div className="mt-4 p-3 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-100/50 z-10 flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-wider opacity-80">{t('total_cases')}</p>
                <h4 className="text-sm font-black mt-0.5 leading-none">
                  {language === 'bn' 
                    ? selectedDateCases.length.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('') + ' টি মামলা'
                    : `${selectedDateCases.length} Cases`
                  }
                </h4>
              </div>
              <p className="text-[9px] font-bold text-indigo-100 bg-indigo-700/60 px-2.5 py-1 rounded-lg text-right">
                {t('finish_all_preparation')}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activePartyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePartyModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {activePartyModal.side === 'petitioner' ? '⚖️' : '👤'}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">
                    {activePartyModal.side === 'petitioner'
                      ? (language === 'bn' ? `বাদী / প্রথম পক্ষ (${activePartyModal.parties.length} জন)` : `Petitioners (${activePartyModal.parties.length})`)
                      : (language === 'bn' ? `বিবাদী / দ্বিতীয় পক্ষ (${activePartyModal.parties.length} জন)` : `Respondents (${activePartyModal.parties.length})`)
                    }
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePartyModal(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {activePartyModal.parties.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {language === 'bn' ? 'কোনো তথ্য পাওয়া যায়নি' : 'No details found'}
                  </p>
                ) : (
                  activePartyModal.parties.map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/50 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#e3dcc4] text-[#7a6f4d] flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-800">{p.name}</p>
                          {p.phone && (
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{p.phone}</p>
                          )}
                        </div>
                      </div>

                      {p.phone && (
                        <a 
                          href={`tel:${p.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-[10px] sm:text-[11px] shadow-sm shadow-emerald-100 hover:brightness-105 active:scale-[0.98] transition-all shrink-0"
                        >
                          <Phone size={10} className="fill-white text-white" />
                          <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setActivePartyModal(null)}
                className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-700 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCaseData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📝</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    {language === 'bn' ? 'মামলার তথ্য সংশোধন করুন' : 'Edit Case Details'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCaseData(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleEditCaseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'মামলা নম্বর *' : 'Case Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCaseNumber}
                      onChange={(e) => setEditCaseNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'আদালতের নাম *' : 'Court Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCourtName}
                      onChange={(e) => setEditCourtName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'মামলার ধরন' : 'Case Type'}
                    </label>
                    <select
                      value={editCaseType}
                      onChange={(e) => setEditCaseType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Civil">{language === 'bn' ? 'দেওয়ানি (Civil)' : 'Civil'}</option>
                      <option value="Criminal">{language === 'bn' ? 'ফৌজদারি (Criminal)' : 'Criminal'}</option>
                      <option value="Other">{language === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'মামলার বর্তমান অবস্থা' : 'Current Status'}
                    </label>
                    <input
                      type="text"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      placeholder="e.g. শুনানি / জবাব দাখিল"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2 border-t border-slate-100 my-1" />

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বাদী / প্রথম পক্ষ (একাধিক হলে কমা দিয়ে লিখুন)' : 'Petitioner Name(s)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editPetitioner}
                      onChange={(e) => setEditPetitioner(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বাদীর মোবাইল (একাধিক হলে কমা দিয়ে লিখুন)' : 'Petitioner Mobile(s)'}
                    </label>
                    <input
                      type="text"
                      value={editPetitionerMobile}
                      onChange={(e) => setEditPetitionerMobile(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বিবাদী / দ্বিতীয় পক্ষ (একাধিক হলে কমা দিয়ে লিখুন)' : 'Respondent Name(s)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editRespondent}
                      onChange={(e) => setEditRespondent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বিবাদীর মোবাইল (একাধিক হলে কমা দিয়ে লিখুন)' : 'Respondent Mobile(s)'}
                    </label>
                    <input
                      type="text"
                      value={editRespondentMobile}
                      onChange={(e) => setEditRespondentMobile(e.target.value)}
                      placeholder="e.g. 01800000000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCaseData(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCase}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingCase ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      '💾'
                    )}
                    <span>{language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Customizer Modal */}
      <AnimatePresence>
        {showButtonCustomizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowButtonCustomizer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fdfaf3] rounded-3xl w-full max-w-2xl overflow-hidden border-[6px] border-[#4a2e1b] shadow-2xl p-6 space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    {language === 'bn' ? 'বাটন এবং ক্যাটাগরি লেবেল কাস্টমাইজ করুন' : 'Customize Button & Category Labels'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowButtonCustomizer(false)}
                  className="p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-all cursor-pointer border border-amber-300"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {/* Documents button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'ডকুমেন্টস বাটন লেবেল' : 'Documents Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnDocuments}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnDocuments: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Face-to-face button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'সামনাসামনি বাটন লেবেল' : 'Face to Face Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnFaceToFace}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnFaceToFace: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Ask AI button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'এআই সহায়ক বাটন লেবেল' : 'Ask AI Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnAskAi}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnAskAi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Edit info button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'তথ্য সংশোধন বাটন লেবেল' : 'Edit Info Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnEditInfo}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnEditInfo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* View card button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'কার্ড দেখুন বাটন লেবেল' : 'View Card Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnViewCard}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnViewCard: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* View history button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'ইতিহাস দেখুন বাটন লেবেল' : 'View History Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnViewHistory}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnViewHistory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Confirm finalize button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'পরবর্তী তারিখ আপডেট বাটন লেবেল' : 'Confirm Update Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnConfirmFinalize}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnConfirmFinalize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Draft notes label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'কোর্ট সেশন খসড়া নোট লেবেল' : 'Draft Notes Title Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnDraftNotes}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnDraftNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-amber-200 my-1 pt-2">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                    📂 {language === 'bn' ? 'ডায়েরী ক্যাটাগরি লেবেল' : 'Diary Category Labels'}
                  </span>
                </div>

                {/* Section attendance */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'হাজিরা বা সময় ক্যাটাগরি' : 'Attendance Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionAttendance}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionAttendance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Section charge */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'চার্জ / শুনানি / জবাব ক্যাটাগরি' : 'Charge Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionCharge}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionCharge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Section witness */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'সাক্ষী / জেরা / PH ক্যাটাগরি' : 'Witness Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionWitness}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionWitness: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Section warrant */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'W/A (ওয়ারেন্ট) ক্যাটাগরি' : 'Warrant Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionWarrant}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionWarrant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-amber-200 my-1 pt-2">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                    ⚖️ {language === 'bn' ? 'ডায়েরী বুক স্টেপ সমূহ' : 'Diary Book Steps'}
                  </span>
                </div>

                {/* step Summons */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'সমন স্টেপ' : 'Summons Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepSummons}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepSummons: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Witness */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'স্বাক্ষী স্টেপ' : 'Witness Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepWitness}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepWitness: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Cross */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'জেরা স্টেপ' : 'Cross Exam Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepCross}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepCross: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Argument */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'যক্তিতর্ক স্টেপ' : 'Argument Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepArgument}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepArgument: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Judgment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'রায় স্টেপ' : 'Judgment Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepJudgment}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepJudgment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => {
                    const defaults = {
                      btnDocuments: language === 'bn' ? 'ডকুমেন্টস' : 'Documents',
                      btnFaceToFace: language === 'bn' ? 'সামনাসামনি হতে চাই' : 'Face to Face',
                      btnAskAi: language === 'bn' ? 'এআই সহায়ক' : 'Ask AI',
                      btnEditInfo: language === 'bn' ? 'তথ্য সংশোধন' : 'Edit Info',
                      btnViewCard: language === 'bn' ? 'কার্ড দেখুন' : 'View Card',
                      btnViewHistory: language === 'bn' ? 'ইতিহাস দেখুন' : 'View History',
                      btnConfirmFinalize: language === 'bn' ? 'চুড়ান্ত আদেশ ও পরবর্তী তারিখ আপডেট করুন' : 'Confirm Finalize & Update',
                      btnDraftNotes: language === 'bn' ? 'কোর্ট সেশন খসড়া নোট' : 'Court Session Draft Notes',
                      sectionAttendance: language === 'bn' ? '📂 হাজিরা বা সময়' : '📂 Attendance / Time',
                      sectionCharge: language === 'bn' ? '⚡ চার্জ / শুনানি / জবাব' : '⚡ Charge / Argument / WS',
                      sectionWitness: language === 'bn' ? '📝 সাক্ষী / জেরা / PH' : '📝 Witness / Cross / PH',
                      sectionWarrant: language === 'bn' ? '🚨 W/A (ওয়ারেন্ট)' : '🚨 W/A (Warrant)',
                      stepSummons: language === 'bn' ? 'সমন' : 'Summons',
                      stepWitness: language === 'bn' ? 'স্বাক্ষী' : 'Witness',
                      stepCross: language === 'bn' ? 'জেরা' : 'Cross Exam',
                      stepArgument: language === 'bn' ? 'যক্তিতর্ক' : 'Argument',
                      stepJudgment: language === 'bn' ? 'রায়' : 'Judgment'
                    };
                    setButtonLabels(defaults);
                    localStorage.setItem('custom_button_labels', JSON.stringify(defaults));
                  }}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'রিসেট' : 'Reset to Defaults'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('custom_button_labels', JSON.stringify(buttonLabels));
                    setShowButtonCustomizer(false);
                  }}
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm text-center"
                >
                  {language === 'bn' ? 'পরিবর্তনসমূহ সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckCircle2 = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
