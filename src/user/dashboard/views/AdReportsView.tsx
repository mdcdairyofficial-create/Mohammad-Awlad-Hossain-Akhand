import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer2, 
  Eye,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface AdReportsViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
}

export const AdReportsView = ({ language }: AdReportsViewProps) => {
  const [ads, setAds] = useState<any[]>([]);
  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'campaigns'),
      where('ownerId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.reach || 0), 0);
  const activeAds = ads.filter(ad => ad.status === 'active').length;

  // Mock data for charts - in real app would come from analytics subcollections
  const performanceData = [
    { name: 'Sat', views: 400, clicks: 24 },
    { name: 'Sun', views: 300, clicks: 13 },
    { name: 'Mon', views: 200, clicks: 98 },
    { name: 'Tue', views: 278, clicks: 39 },
    { name: 'Wed', views: 189, clicks: 48 },
    { name: 'Thu', views: 239, clicks: 38 },
    { name: 'Fri', views: 349, clicks: 43 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 dark:text-white uppercase tracking-tight leading-none mb-2">
            {t('বিজ্ঞাপন পারফরম্যান্স ও রিপোর্ট', 'AD PERFORMANCE & REPORTS')}
          </h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">
            {t('আপনার ক্যাম্পেইনের ফলাফল বিশ্লেষণ করুন', 'ANALYZE THE RESULTS OF YOUR CAMPAIGNS')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={14} /> {t('রিপোর্ট ডাউনলোড', 'EXPORT PDF')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Eye size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">TOTAL REACH</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">{totalImpressions.toLocaleString()}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <MousePointer2 size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">CLICKS</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">0</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">AVG. CTR</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">0.0%</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">ACTIVE DAYS</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">{activeAds * 15}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px]">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">{t('সাপ্তাহিক ইমপ্রেশন', 'WEEKLY IMPRESSIONS')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px'}}
              />
              <Area type="monotone" dataKey="views" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[400px]">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">{t('সাপ্তাহিক ক্লিক', 'WEEKLY CLICKS')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px'}}
              />
              <Bar dataKey="clicks" fill="#10b981" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
