import React, { useState } from 'react';
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
  Video
} from 'lucide-react';
import { Case } from '../../../types';

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
}

const BookView = ({ 
  date, 
  cases, 
  onClose, 
  onPrev, 
  onNext, 
  onViewCard, 
  t 
}: { 
  date: string; 
  cases: Case[]; 
  onClose: () => void; 
  onPrev: () => void; 
  onNext: () => void; 
  onViewCard: (c: Case) => void;
  t: (key: any) => string;
}) => {
  const groupedByCourt = cases.reduce((acc, c) => {
    if (!acc[c.courtName]) acc[c.courtName] = [];
    acc[c.courtName].push(c);
    return acc;
  }, {} as Record<string, Case[]>);

  const steps = ["সমন", "স্বাক্ষী", "জেরা", "যক্তিতর্ক", "রায়"];
  
  const getGroupedByStep = (courtCases: Case[]) => {
    return courtCases.reduce((acc, c) => {
      const step = steps.find(s => c.order?.includes(s)) || "অন্যান্য";
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8"
    >
      <motion.div 
        initial={{ rotateY: -90, originX: 0 }}
        animate={{ rotateY: 0 }}
        exit={{ rotateY: -90 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-r-3xl shadow-2xl flex flex-col relative overflow-hidden border-l-[12px] border-indigo-900"
      >
        {/* Book Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 gap-4">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Book size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {t('date_diary')}
              </h3>
              <p className="text-indigo-600 font-bold text-sm sm:text-base">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button onClick={onPrev} className="p-2 sm:p-3 hover:bg-white rounded-xl transition-all border border-slate-200 text-slate-600 shadow-sm">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button onClick={onNext} className="p-2 sm:p-3 hover:bg-white rounded-xl transition-all border border-slate-200 text-slate-600 shadow-sm">
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button onClick={onClose} className="p-2 sm:p-3 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all border border-slate-200 text-slate-400 shadow-sm ml-2 sm:ml-4">
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Book Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
          {cases.length > 0 ? (
            <div className="space-y-12">
              {Object.entries(groupedByCourt).map(([court, courtCases]) => (
                <div key={court} className="space-y-6">
                  <div className="flex items-center gap-4 border-b-2 border-indigo-100 pb-2">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                    <h4 className="text-xl font-black text-slate-800">{court}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.entries(getGroupedByStep(courtCases)).map(([step, stepCases]) => (
                      <div key={step} className="space-y-4">
                        <h5 className="text-sm font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg inline-block">
                          {step === 'সমন' ? t('action_summons') : 
                           step === 'স্বাক্ষী' ? t('action_witness') : 
                           step === 'জেরা' ? t('action_cross_exam') : 
                           step === 'যক্তিতর্ক' ? t('action_argument') : 
                           step === 'রায়' ? t('action_judgment') : 
                           t('other_label')}
                        </h5>
                        <div className="space-y-4">
                          {stepCases.map(c => (
                            <div key={c.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h6 className="font-bold text-slate-900 text-lg">{c.caseNumber}</h6>
                                  <p className="text-xs text-slate-500 font-medium">{c.petitioner} {t('vs')} {c.respondent}</p>
                                </div>
                                <button 
                                  onClick={() => onViewCard(c)}
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                >
                                  <CreditCard size={18} />
                                </button>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-all">
                                  <FileText size={14} /> {t('documents')}
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-600 hover:text-white transition-all">
                                  <Video size={14} /> {t('face_to_face')}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <CalendarIcon size={64} className="text-slate-300" />
              <p className="text-xl font-bold text-slate-500">{t('no_case_on_date')}</p>
            </div>
          )}
        </div>

        {/* Book Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© {t('digital_diary')} - {date}</p>
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
  t
}: CalendarViewProps) => {
  const [showBookView, setShowBookView] = useState(false);
  const [hoveredHolidayReason, setHoveredHolidayReason] = useState<string | null>(null);

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
    return cases.filter(c => c.nextDate === dateStr);
  };

  const selectedDateCases = selectedDate ? cases.filter(c => c.nextDate === selectedDate) : [];

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setBookDate(dateStr);
    setShowBookView(true);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
            cases={cases.filter(c => c.nextDate === bookDate)}
            onClose={() => setShowBookView(false)}
            onPrev={() => navigateDate('prev')}
            onNext={() => navigateDate('next')}
            onViewCard={onViewCard}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Calendar Section */}
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <p className="text-indigo-600 font-bold text-xs -mt-1">
                {getBanglaMonthYear(currentMonth)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              {t('today')}
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 flex-1">
          <div className="grid grid-cols-7 gap-4 mb-6">
            {weekDays.map((day, idx) => {
              const isHoliday = idx === 5 || idx === 6; // Fri and Sat in Sun-Sat week
              return (
                <div key={day} className={`text-center text-xs font-black uppercase tracking-widest ${isHoliday ? 'text-rose-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-4">
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
              const shouldBlink = isLawyerOrClerk && isPast && dayCases.length > 0;
              const isPastOrToday = dateStr <= todayStr;
              const shouldHighlightPending = isLawyerOrClerk && isPastOrToday && dayCases.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  onMouseEnter={() => isHoliday && setHoveredHolidayReason(reason)}
                  onMouseLeave={() => setHoveredHolidayReason(null)}
                  onTouchStart={() => isHoliday && setHoveredHolidayReason(reason)}
                  onTouchEnd={() => setHoveredHolidayReason(null)}
                  className={`
                    aspect-square rounded-2xl border transition-all duration-300 relative group p-2 flex flex-col justify-between
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
                    <span className={`text-xl sm:text-2xl font-black ${isSelected || isToday ? 'text-white' : isHoliday ? 'text-rose-600' : 'text-slate-700'}`}>
                      {day}
                    </span>
                  </div>
                  
                  {bnDate && (
                    <div className="flex justify-end w-full mt-auto relative z-10">
                      <span className={`text-sm sm:text-base font-bold ${isSelected || isToday ? 'text-white/90' : 'text-indigo-600'}`}>
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
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">
              {selectedDate ? `${language === 'bn' ? 'তারিখ:' : 'Date:'} ${selectedDate}` : t('today_schedule')}
            </h3>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Clock size={20} />
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              {selectedDateCases.length > 0 ? (
                selectedDateCases.map((c, idx) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleDateClick(selectedDate!)}
                    className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${c.caseType === 'Civil' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                          {c.caseNumber.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.caseNumber}</h5>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.caseType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewCard(c); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                        >
                          <CreditCard size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewHistory(c); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                        >
                          <History size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate">{c.courtName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <FileText size={14} className="text-slate-400" />
                        <span className="truncate">{c.petitioner} vs {c.respondent}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20"
                >
                  <CalendarIcon size={48} className="text-slate-300" />
                  <p className="text-sm font-bold text-slate-500">{t('no_case_on_date')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedDateCases.length > 0 && (
            <div className="mt-8 p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('total_cases')}</p>
                <CheckCircle2 size={16} />
              </div>
              <h4 className="text-2xl font-black">{selectedDateCases.length}</h4>
              <p className="text-xs font-medium text-indigo-100 mt-1">{t('finish_all_preparation')}</p>
            </div>
          )}
        </div>
      </div>
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
