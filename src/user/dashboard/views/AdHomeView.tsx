import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  CreditCard, 
  PlusCircle,
  MonitorPlay,
  ArrowUpRight,
  Eye,
  Target,
  Zap,
  Layers
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { AdBanner } from '../AdBanner';

interface AdHomeViewProps {
  userName: string;
  language: 'bn' | 'en' | 'hi' | 'ur';
  setActiveTab: (tab: any) => void;
  t: (key: string) => string;
}

const performanceData = [
  { name: 'Sat', impressions: 4000, clicks: 240 },
  { name: 'Sun', impressions: 3000, clicks: 198 },
  { name: 'Mon', impressions: 2000, clicks: 150 },
  { name: 'Tue', impressions: 2780, clicks: 210 },
  { name: 'Wed', impressions: 1890, clicks: 140 },
  { name: 'Thu', impressions: 2390, clicks: 180 },
  { name: 'Fri', impressions: 3490, clicks: 280 },
];

const reachData = [
  { name: 'Dhaka', value: 45 },
  { name: 'Ctg', value: 25 },
  { name: 'Rajshahi', value: 15 },
  { name: 'Sylhet', value: 10 },
  { name: 'Others', value: 5 },
];

export const AdHomeView = ({ userName, language, setActiveTab, t: translate }: AdHomeViewProps) => {
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      
      const q = query(
        collection(db, 'campaigns'),
        where('ownerId', '==', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let activeCount = 0;
      let spent = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'active') {
          activeCount++;
        }
        spent += data.totalPrice || 0;
      });
      
      setActiveAdsCount(activeCount);
      setTotalSpent(spent);
    };

    fetchStats();
  }, []);

  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  const stats = [
    { label: t('মোট ইমপ্রেশন', 'TOTAL IMPRESSIONS'), value: '0', icon: Eye, color: 'bg-indigo-600', trend: '0%' },
    { label: t('ক্লিক রেট (CTR)', 'CTR'), value: '0.0%', icon: MousePointer2, color: 'bg-emerald-600', trend: '0%' },
    { label: t('সক্রিয় ক্যাম্পেইন', 'ACTIVE ADS'), value: activeAdsCount.toString(), icon: Layers, color: 'bg-amber-500', trend: '0%' },
    { label: t('ব্যালেন্স', 'TOTAL SPENT'), value: `৳${totalSpent.toLocaleString()}`, icon: CreditCard, color: 'bg-rose-500', trend: `৳${totalSpent.toLocaleString()}` },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={true} />
      
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 to-blue-900 rounded-[2rem] md:rounded-[2.5rem] p-6 lg:p-12 text-white shadow-2xl shadow-indigo-100">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tight leading-tight">
              {t(`শুভেচ্ছা, ${userName}!`, `Greetings, ${userName}!`)}
            </h2>
            <p className="text-indigo-100 text-base md:text-xl font-bold max-w-xl leading-relaxed opacity-90">
              {t('আপনার বিজ্ঞাপনের কার্যকারিতা বাড়িয়ে তুলুন এবং সঠিক অডিয়েন্সের কাছে পৌঁছান আমাদের স্মার্ট অ্যাড টুলের মাধ্যমে।', 
                 'Boost your ad performance and reach the right audience with our smart advertising tools.')}
            </p>
            <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
              <button 
                onClick={() => setActiveTab('ad_campaigns')}
                className="px-6 md:px-8 py-3 md:py-4 bg-white text-indigo-950 rounded-2xl font-black hover:scale-105 transition-transform shadow-xl flex items-center gap-2 md:gap-3 uppercase tracking-wider text-sm md:text-base"
              >
                <PlusCircle size={24} />
                {t('নতুন ক্যাম্পেইন', 'New Campaign')}
              </button>
              <button 
                onClick={() => setActiveTab('manage_ads')}
                className="px-6 md:px-8 py-3 md:py-4 bg-indigo-500/30 backdrop-blur-md text-white border-2 border-white/20 rounded-2xl font-black hover:bg-indigo-500/40 transition-all uppercase tracking-wider text-sm md:text-base"
              >
                {t('ম্যানেজ অ্যাডস', 'Manage Ads')}
              </button>
            </div>
          </div>
          
          <div className="hidden lg:flex w-56 h-56 bg-white/10 rounded-full items-center justify-center backdrop-blur-xl border-4 border-white/20 relative shadow-inner">
            <TrendingUp size={90} className="text-indigo-200 animate-pulse" />
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-4 rounded-3xl shadow-xl rotate-12">
              <Zap size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Ad Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 md:w-16 md:h-16 ${stat.color} text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} className="md:w-8 md:h-8" />
            </div>
            <p className="text-black dark:text-slate-100 font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-50">{stat.label}</p>
            <div className="flex items-center justify-between">
              <h4 className="text-2xl md:text-3xl font-black text-indigo-950 dark:text-white tracking-tighter">{stat.value}</h4>
              <span className="text-emerald-600 flex items-center text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={12} className="mr-0.5" />
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Reach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-indigo-950 dark:text-white uppercase tracking-tight">{t('বিজ্ঞাপনের কার্যকারিতা', 'Ad Performance')}</h3>
              <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mt-1">{t('গত ৭ দিনের রিপোর্ট', 'Last 7 days report')}</p>
            </div>
            <div className="hidden sm:flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
              <button className="px-4 py-2 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black shadow-sm uppercase">{t('সপ্তাহ', 'Week')}</button>
              <button className="px-4 py-2 text-slate-400 text-[10px] font-black uppercase">{t('মাস', 'Month')}</button>
            </div>
          </div>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="impressions" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorImpressions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-indigo-950 dark:text-white uppercase tracking-tight mb-8">{t('লোকেশন রিচ', 'Reach by Location')}</h3>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reachData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#475569'}} width={60} />
                <Tooltip contentStyle={{ borderRadius: '1rem', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 10, 10, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            {reachData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">{d.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 md:w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${d.value}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white">{d.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
