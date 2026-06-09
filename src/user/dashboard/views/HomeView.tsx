import React from 'react';
import { motion } from 'motion/react';
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
  ShieldAlert
} from 'lucide-react';
import { AdBanner } from '../AdBanner';
import { Case, Task } from '../../../types';
import { AnimatePresence } from 'motion/react';
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
}

export const HomeView = ({
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
  redBallsCount = 0
}: HomeViewProps) => {
  const [selectedYear, setSelectedYear] = React.useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [totalDue, setTotalDue] = React.useState(0);
  const [showScoreModal, setShowScoreModal] = React.useState(initialShowScoreModal);

  React.useEffect(() => {
    if (initialShowScoreModal) {
      setShowScoreModal(true);
    }
  }, [initialShowScoreModal]);

  React.useEffect(() => {
    // Calculate total due from invoices
    const saved = localStorage.getItem('mdc_invoices');
    if (saved) {
      const invoices = JSON.parse(saved);
      const due = invoices.reduce((acc: number, curr: any) => acc + (curr.amount - curr.paidAmount), 0);
      setTotalDue(due);
    }
  }, []);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={isPremiumForAds} />

      {/* Dynamic Warning Alert Banner */}
      {warningsCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 shadow-xl shadow-rose-500/5 animate-in slide-in-from-top-4 duration-500">
          <div className="p-4 bg-rose-500 text-white rounded-2xl shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">সতর্ক বার্তা! পেনাল্টি নোটিশ</h3>
              <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                সতর্কতা {warningsCount}/৩
              </span>
              {redBallsCount > 0 && (
                <span className="bg-rose-900 text-rose-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                  ● {redBallsCount} লাল বল
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm font-semibold leading-relaxed">
              আপনার অ্যাকাউন্টে নীতি লঙ্ঘনজনিত কারণে অথবা মামলার ভুল তথ্য রিপোর্টের ফলস্বরূপ সতর্ক সংকেত রয়েছে। ৩টি স্তর পূর্ণ হলে আপনার আইনজীবী/মুহুরি লাইসেন্স সাময়িকভাবে স্থগিত হতে পারে।
            </p>
            <div className="flex gap-2.5 pt-1.5">
              {[1, 2, 3].map((strike) => (
                <div 
                  key={strike} 
                  className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                    strike <= warningsCount 
                      ? 'bg-rose-600 border-rose-700 shadow-md shadow-rose-300 scale-110' 
                      : 'bg-slate-200 border-slate-300'
                  }`}
                  title={`সংকেত ${strike}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 rounded-3xl p-6 sm:p-8 lg:p-12 text-white shadow-xl shadow-indigo-500/10">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 break-words">
                {language === 'bn' ? `স্বাগতম, ${userName}!` : `Welcome, ${userName}!`}
              </h2>
              <p className="text-indigo-100 text-lg sm:text-xl font-medium max-w-xl leading-relaxed">
                {language === 'bn' 
                  ? 'আপনার আইনি কার্যক্রমকে আরও সহজ ও সাশ্রয়ী করতে আমরা সবসময় আপনার পাশে আছি।' 
                  : 'We are always with you to make your legal activities easier and more cost-effective.'}
              </p>
            </motion.div>

            {/* Efficiency Dashboard for User */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2rem] flex flex-col min-w-[280px] shadow-inner"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-400 rounded-lg text-amber-900">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">সিস্টেম এফিসিয়েন্সি</span>
                </div>
                <div className="text-[10px] font-black bg-emerald-500 px-2 py-0.5 rounded-full text-white">LIVE</div>
              </div>

              <div className="space-y-4">
                {isPremium && (
                  <div className="bg-white/20 backdrop-blur-md border border-white/30 p-3 rounded-2xl flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-400 rounded-xl text-amber-900 shrink-0">
                      <Award size={20} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-100 leading-none mb-1">লটারি স্ট্যাটাস</p>
                      <p className="text-sm font-bold text-white">সাপ্তাহিক প্রতিটি লটারির জন্য এলিজিবেল</p>
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{language === 'bn' ? 'ডেটা সাশ্রয়' : 'Data Saving'}</span>
                    <span className="text-amber-300">৯৫%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 w-[95%] rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-indigo-200 uppercase mb-1">{language === 'bn' ? 'ডেটা রিড' : 'DATA READ'}</p>
                    <p className="text-lg font-black">{showAllCases ? 'HIGH' : 'LOW'}</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black text-indigo-200 uppercase mb-1">{language === 'bn' ? 'সেশন কস্ট' : 'SESSION COST'}</p>
                    <p className="text-lg font-black">৳{estimatedBillTaka.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={onToggleShowAll}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    showAllCases 
                      ? 'bg-white text-indigo-600 hover:bg-slate-100' 
                      : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-900/40'
                  }`}
                >
                  {showAllCases 
                    ? (language === 'bn' ? 'অপ্টিমাইজ মুড অন করুন' : 'Turn On Optimized Mode')
                    : (language === 'bn' ? 'সব মামলা লোড করুন' : 'Load All Cases')
                  }
                </button>
              </div>
            </motion.div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-8 justify-center sm:justify-start">
            <button 
              onClick={() => setActiveTab('cases')}
              className="px-8 py-3.5 bg-white text-indigo-600 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-indigo-900/20 flex items-center gap-2"
            >
              {language === 'bn' ? 'মামলা দেখুন' : t('view_cases')} <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className="px-8 py-3.5 bg-indigo-500/30 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-indigo-500/40 transition-all"
            >
              <span>{language === 'bn' ? 'ক্যালেন্ডার' : t('menu_calendar')}</span>
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/2 blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: language === 'bn' ? 'আপনার পয়েন্ট' : 'Your Points', value: points, icon: Award, color: 'bg-gradient-to-tr from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/5', action: () => setActiveTab('recharge') },
          { label: t('total_cases'), value: cases.length, icon: FileText, color: 'bg-gradient-to-tr from-blue-600 to-indigo-600', shadow: 'shadow-indigo-500/5' },
          { label: language === 'bn' ? 'ডেটা ব্যবহার' : 'Data Usage', value: `${displayDataMb} MB`, icon: Briefcase, color: 'bg-gradient-to-tr from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/5' },
          { label: language === 'bn' ? 'বিল (টাকা)' : 'Bill (BDT)', value: `${estimatedBillTaka} ৳`, icon: DollarSign, color: 'bg-gradient-to-tr from-amber-500 to-orange-600', shadow: 'shadow-amber-500/5' },
          { label: t('upcoming_dates'), value: cases.filter(c => {
              if (!c.nextDate) return false;
              const d = new Date(c.nextDate);
              const today = new Date();
              today.setHours(0,0,0,0);
              return d >= today;
            }).length, icon: Calendar, color: 'bg-gradient-to-tr from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/5' },
          { label: t('today_cases'), value: cases.filter(c => {
              if (!c.nextDate) return false;
              const d = new Date(c.nextDate);
              const today = new Date();
              return d.toDateString() === today.toDateString();
            }).length, icon: Zap, color: 'bg-gradient-to-tr from-amber-500 to-yellow-600', shadow: 'shadow-amber-500/5' },
          { label: t('pending_tasks'), value: tasks.filter(t => t.status !== 'completed').length, icon: CheckCircle2, color: 'bg-gradient-to-tr from-rose-500 to-red-650', shadow: 'shadow-rose-500/5' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * idx }}
            className={`bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-100/80 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-100/50 dark:hover:border-slate-700 transition-all group cursor-pointer`}
            onClick={stat.action}
          >
            <div className={`w-12 h-12 ${stat.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10 group-hover:rotate-6 transition-transform duration-300`}>
              <stat.icon size={22} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1.5">{stat.label}</p>
            <h4 className="text-2.5xl font-black text-slate-800 dark:text-white tracking-tight">{stat.value}</h4>
          </motion.div>
        ))}
      </div>

      {/* Quick Update Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{t('today_cases')}</h3>
            <p className="text-sm text-slate-500 font-medium">{language === 'bn' ? 'দ্রুত তারিখ আপডেট করুন' : t('update_dates_quickly' as any) || 'Update dates quickly'}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'মামলা নম্বর' : 'Case No'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পরবর্তী তারিখ' : 'Next Date'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cases.filter(c => {
                  if (!c.nextDate) return false;
                  const today = new Date().toISOString().split('T')[0];
                  return c.nextDate <= today;
                }).length > 0 ? (
                cases.filter(c => {
                  if (!c.nextDate) return false;
                  const today = new Date().toISOString().split('T')[0];
                  return c.nextDate <= today;
                })
                .sort((a, b) => (a.nextDate || '').localeCompare(b.nextDate || ''))
                .map((c) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOutdated = c.nextDate! < today;
                  
                  return (
                    <tr key={c.id} className={`group hover:bg-slate-50/50 transition-colors ${isOutdated ? 'animate-blink' : ''}`}>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {isOutdated && <span className="w-2 h-2 bg-rose-500 rounded-full"></span>}
                          <p className="font-bold text-slate-800 text-sm">{c.caseNumber}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-xs font-medium text-slate-600">{c.petitioner} vs {c.respondent}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="date"
                            defaultValue={c.nextDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              // Actual update logic is handled via cases view usually
                            }}
                            className={`bg-transparent border-none outline-none text-xs font-bold cursor-pointer ${isOutdated ? 'text-rose-600 font-black' : 'text-indigo-600'}`}
                          />
                          {isOutdated && <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">{language === 'bn' ? 'তারিখ পার' : 'Outdated'}</span>}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setActiveTab('cases')}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-slate-400 font-bold text-sm">
                      {language === 'bn' ? 'আজ কোন মামলার তারিখ নেই।' : 'No cases scheduled for today.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{t('case_stats')}</h3>
              <p className="text-slate-500 text-sm font-medium">
                {selectedMonth === 'all' 
                  ? t('yearly_case_activity') 
                  : t('monthly_case_activity')}
              </p>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{t('all_months')}</option>
                {monthsEn.map((m, i) => (
                  <option key={i} value={i.toString()}>{language === 'bn' ? monthsBn[i] : m}</option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year.toString()}>{language === 'bn' ? year.toString().replace(/\d/g, (d: any) => '০১২৩৪৫৬৭৮৯'[d]) : year}</option>
                })}
              </select>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="added" 
                  name={t('added')}
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedMonth === 'all' ? 12 : 30}
                />
                <Bar 
                  dataKey="resolved" 
                  name={t('resolved')}
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedMonth === 'all' ? 12 : 30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Cases List */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">{t('recent_cases')}</h3>
            <button onClick={() => setActiveTab('cases')} className="text-indigo-600 text-sm font-bold hover:underline">{t('view_all')}</button>
          </div>
          <div className="space-y-4 flex-1">
            {cases.slice(0, 4).map((c) => (
              <div key={c.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${c.caseType === 'Civil' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    {c.caseNumber.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{c.caseNumber}</h5>
                    <p className="text-xs text-slate-400 font-medium">{c.courtName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">{c.nextDate}</p>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{t('pro_tip')}</p>
            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
              {t('pro_tip_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Score Details Modal */}
      <AnimatePresence>
        {showScoreModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg p-8 rounded-[3rem] shadow-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <button 
                onClick={() => setShowScoreModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>

                  <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {t('score_details_title')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">LIVE SCORE: 100</span>
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
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={item.color} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{item.score}/{item.max}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mb-3 ml-7">{item.desc}</p>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ delay: 0.5 + (idx * 0.1), duration: 1 }}
                        className={`h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowScoreModal(false)}
                className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-sm"
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
