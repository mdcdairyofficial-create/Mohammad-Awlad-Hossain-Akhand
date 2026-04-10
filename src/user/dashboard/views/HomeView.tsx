import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  ChevronRight,
  User,
  Briefcase
} from 'lucide-react';
import { AdBanner } from '../AdBanner';
import { Case, Task } from '../../../types';
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
  isPremium = false
}: HomeViewProps) => {
  const [selectedYear, setSelectedYear] = React.useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');

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
      <AdBanner isPremium={isPremium} />
      
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-indigo-600 rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl shadow-indigo-200">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl lg:text-4xl font-black mb-3">
              {language === 'bn' ? `স্বাগতম, ${userName}!` : `Welcome, ${userName}!`}
            </h2>
            <p className="text-indigo-100 text-lg font-medium max-w-xl leading-relaxed">
              আপনার আইনি কার্যক্রম আরও সহজ এবং স্মার্ট করতে আমরা সবসময় আপনার পাশে আছি। আজকের আপডেটগুলো দেখে নিন।
            </p>
          </motion.div>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('cases')}
              className="px-8 py-3.5 bg-white text-indigo-600 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-indigo-900/20 flex items-center gap-2"
            >
              মামলা দেখুন <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className="px-8 py-3.5 bg-indigo-500/30 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-indigo-500/40 transition-all"
            >
              ক্যালেন্ডার
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/2 blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('total_cases'), value: cases.length, icon: FileText, color: 'bg-blue-500', shadow: 'shadow-blue-100' },
          { label: t('upcoming_dates'), value: cases.filter(c => new Date(c.nextDate) >= new Date()).length, icon: Calendar, color: 'bg-indigo-500', shadow: 'shadow-indigo-100' },
          { label: t('pending_tasks'), value: tasks.filter(t => t.status !== 'completed').length, icon: CheckCircle2, color: 'bg-amber-500', shadow: 'shadow-amber-100' },
          { label: t('success_rate'), value: '85%', icon: TrendingUp, color: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            className={`bg-white p-6 rounded-3xl border border-slate-100 ${stat.shadow} shadow-lg hover:scale-105 transition-transform group cursor-pointer`}
          >
            <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:rotate-12 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{stat.label}</p>
            <h4 className="text-3xl font-black text-slate-900">{stat.value}</h4>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{language === 'bn' ? 'মামলার পরিসংখ্যান' : 'Case Statistics'}</h3>
              <p className="text-slate-500 text-sm font-medium">
                {selectedMonth === 'all' 
                  ? (language === 'bn' ? 'সারা বছরের মামলার গতিবিধি' : 'Yearly Case Activity') 
                  : (language === 'bn' ? 'সারা মাসের মামলার গতিবিধি' : 'Monthly Case Activity')}
              </p>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">{language === 'bn' ? 'সব মাস' : 'All Months'}</option>
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
                  name={language === 'bn' ? 'যুক্ত' : 'Added'}
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  barSize={selectedMonth === 'all' ? 12 : 30}
                />
                <Bar 
                  dataKey="resolved" 
                  name={language === 'bn' ? 'নিষ্পত্তি' : 'Resolved'}
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
            <h3 className="text-xl font-bold text-slate-900">সাম্প্রতিক মামলা</h3>
            <button onClick={() => setActiveTab('cases')} className="text-indigo-600 text-sm font-bold hover:underline">সব দেখুন</button>
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
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">প্রো টিপ</p>
            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
              আপনার মামলার পরবর্তী তারিখগুলো ক্যালেন্ডারে অটো-সেভ হয়ে যায়। নিয়মিত চেক করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
