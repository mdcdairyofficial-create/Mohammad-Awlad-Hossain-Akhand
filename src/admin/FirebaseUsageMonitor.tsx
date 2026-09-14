import React, { useState, useEffect, useCallback } from 'react';
import { 
  Flame, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Zap, 
  BarChart2,
  HardDrive,
  Info
} from 'lucide-react';
import { fetchWithAuth } from '../lib/api';
import { getClientDailyUsage, flushPendingSync } from '../utils/firebaseUsageTracker';

interface CategoryStats {
  reads: number;
  writes: number;
  deletes: number;
}

interface FirebaseUsageData {
  today: {
    date: string;
    reads: number;
    writes: number;
    deletes: number;
    limits: {
      reads: number;
      writes: number;
      deletes: number;
    };
    remaining: {
      reads: number;
      writes: number;
      deletes: number;
    };
    percentages: {
      reads: number;
      writes: number;
      deletes: number;
    };
    status: 'safe' | 'moderate' | 'warning' | 'critical';
    statusMessage: string;
    categories: {
      cases: CategoryStats;
      users: CategoryStats;
      notifications: CategoryStats;
      tasks: CategoryStats;
      auth: CategoryStats;
      other: CategoryStats;
    };
    hourly: { hour: number; reads: number; writes: number; deletes: number }[];
  };
  history: {
    date: string;
    reads: number;
    writes: number;
    deletes: number;
  }[];
  sparkPlan: {
    planName: string;
    readsLimit: number;
    writesLimit: number;
    deletesLimit: number;
    storageLimitMb: number;
    resetSchedule: string;
    nextResetIso: string;
    projectId: string;
    databaseId: string;
    consoleUsageUrl: string;
  };
}

export default function FirebaseUsageMonitor() {
  const [data, setData] = useState<FirebaseUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeftToReset, setTimeLeftToReset] = useState('');

  const fetchUsageStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // First sync pending client operations to server
      await flushPendingSync();
      
      const res = await fetchWithAuth('/api/admin/firebase-usage');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback to local client tracker if server error
        const local = getClientDailyUsage();
        setData({
          today: {
            date: local.date,
            reads: local.reads,
            writes: local.writes,
            deletes: local.deletes,
            limits: { reads: 50000, writes: 20000, deletes: 20000 },
            remaining: {
              reads: Math.max(0, 50000 - local.reads),
              writes: Math.max(0, 20000 - local.writes),
              deletes: Math.max(0, 20000 - local.deletes),
            },
            percentages: {
              reads: Number(((local.reads / 50000) * 100).toFixed(2)),
              writes: Number(((local.writes / 20000) * 100).toFixed(2)),
              deletes: Number(((local.deletes / 20000) * 100).toFixed(2)),
            },
            status: 'safe',
            statusMessage: 'লোকাল ক্লায়েন্ট মোডে ট্র্যাক করা হচ্ছে।',
            categories: {
              cases: { reads: local.reads, writes: local.writes, deletes: local.deletes },
              users: { reads: 0, writes: 0, deletes: 0 },
              notifications: { reads: 0, writes: 0, deletes: 0 },
              tasks: { reads: 0, writes: 0, deletes: 0 },
              auth: { reads: 0, writes: 0, deletes: 0 },
              other: { reads: 0, writes: 0, deletes: 0 },
            },
            hourly: [],
          },
          history: [],
          sparkPlan: {
            planName: 'Firebase Spark Plan (Free Tier)',
            readsLimit: 50000,
            writesLimit: 20000,
            deletesLimit: 20000,
            storageLimitMb: 1024,
            resetSchedule: 'প্রতিদিন রাত ১২:০০ UTC (বাংলাদেশ সময় সকাল ০৬:০০ টা)',
            nextResetIso: new Date(Date.now() + 86400000).toISOString(),
            projectId: 'gen-lang-client-0215506885',
            databaseId: 'ai-studio-b68ab48d-678f-40d2-8599-d689643a1dea',
            consoleUsageUrl: 'https://console.firebase.google.com/',
          },
        });
      }
    } catch (err) {
      console.warn('Could not fetch firebase usage:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsageStats();
    const interval = setInterval(() => {
      fetchUsageStats();
    }, 15000); // Live poll every 15s
    return () => clearInterval(interval);
  }, [fetchUsageStats]);

  // Countdown to next reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
      const diffMs = reset.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeftToReset('রিসেট হচ্ছে...');
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeftToReset(`${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold text-sm">ফায়ারবেস কোটা ও ব্যবহারের ডাটা লোড হচ্ছে...</p>
      </div>
    );
  }

  const today = data?.today || {
    date: new Date().toISOString().split('T')[0],
    reads: 0,
    writes: 0,
    deletes: 0,
    limits: { reads: 50000, writes: 20000, deletes: 20000 },
    remaining: { reads: 50000, writes: 20000, deletes: 20000 },
    percentages: { reads: 0, writes: 0, deletes: 0 },
    status: 'safe',
    statusMessage: 'কোটা নিরাপদ অবস্থায় আছে।',
    categories: {
      cases: { reads: 0, writes: 0, deletes: 0 },
      users: { reads: 0, writes: 0, deletes: 0 },
      notifications: { reads: 0, writes: 0, deletes: 0 },
      tasks: { reads: 0, writes: 0, deletes: 0 },
      auth: { reads: 0, writes: 0, deletes: 0 },
      other: { reads: 0, writes: 0, deletes: 0 },
    },
    hourly: [],
  };

  const spark = data?.sparkPlan || {
    planName: 'Firebase Spark Plan (Free Tier)',
    readsLimit: 50000,
    writesLimit: 20000,
    deletesLimit: 20000,
    storageLimitMb: 1024,
    resetSchedule: 'প্রতিদিন রাত ১২:০০ UTC (বাংলাদেশ সময় সকাল ০৬:০০ টা)',
    nextResetIso: '',
    projectId: 'gen-lang-client-0215506885',
    databaseId: 'ai-studio-b68ab48d-678f-40d2-8599-d689643a1dea',
    consoleUsageUrl: 'https://console.firebase.google.com/',
  };

  const history = data?.history || [];

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (pct >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (pct >= 40) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 70) return 'bg-amber-500';
    if (pct >= 40) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-8" id="firebase-usage-monitor-section">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame size={140} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Flame size={14} className="text-amber-400 fill-amber-400" />
                ফায়ারবেস স্পার্ক প্ল্যান (ফ্রি টিয়ার)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                লাইভ ট্র্যাকিং
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              ফায়ারবেস রিড ও রাইট ব্যবহার মনিটর
            </h2>
            <p className="text-slate-300 text-sm font-medium max-w-2xl leading-relaxed">
              আপনার ফায়ারবেস ডেটাবেসে প্রতিদিন কতটি রিড ও রাইট হচ্ছে তা সরাসরি ট্র্যাক করুন এবং স্পার্ক প্ল্যানের ফ্রি সীমার সাথে মিলিয়ে দেখুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchUsageStats(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'সিঙ্ক হচ্ছে...' : 'রিফ্রেশ করুন'}
            </button>
            <a
              href={spark.consoleUsageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95"
            >
              <span>ফায়ারবেস কনসোল</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Reset Countdown Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-400" />
            <span>দৈনিক কোটা রিসেটের বাকি: </span>
            <span className="font-mono font-bold text-amber-300">{timeLeftToReset || 'গণনা করা হচ্ছে...'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-indigo-400" />
            <span>আজকের তারিখ (UTC): </span>
            <span className="font-mono font-bold text-white">{today.date}</span>
          </div>
        </div>
      </div>

      {/* Safety Status Alert */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 ${getStatusColor(Math.max(today.percentages.reads, today.percentages.writes))}`}>
        <div className="shrink-0 p-2 rounded-xl bg-white shadow-sm">
          {today.status === 'safe' && <CheckCircle2 size={24} className="text-emerald-600" />}
          {today.status === 'moderate' && <CheckCircle2 size={24} className="text-blue-600" />}
          {today.status === 'warning' && <AlertTriangle size={24} className="text-amber-600" />}
          {today.status === 'critical' && <AlertTriangle size={24} className="text-rose-600" />}
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm uppercase tracking-wider">
            {today.status === 'safe' && 'সবুজ সংকেত: নিরাপদ কোটা লেভেল'}
            {today.status === 'moderate' && 'স্বাভাবিক কোটা লেভেল'}
            {today.status === 'warning' && 'সতর্কতা: কোটা সীমার কাছাকাছি'}
            {today.status === 'critical' && 'জরুরি সতর্কতা: কোটা শেষ হওয়ার ঝুঁকিতে'}
          </h4>
          <p className="text-xs font-semibold mt-0.5 opacity-90">{today.statusMessage}</p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">কোটা রিসেট নিয়ম</span>
          <span className="text-xs font-bold font-mono">প্রতিদিন ভোর ৬:০০ (BST)</span>
        </div>
      </div>

      {/* Main 3 Quota Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Daily Reads Card */}
        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowDownCircle size={26} />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ফ্রি দৈনিক লিমিট</span>
              <span className="text-sm font-black text-slate-700">৫০,০০০ টি</span>
            </div>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">আজকের মোট রিড (Reads)</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black text-slate-900">{today.reads.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400">/ ৫০,০০০</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">ব্যবহৃত: {today.percentages.reads}%</span>
              <span className="text-indigo-600 font-extrabold">{today.remaining.reads.toLocaleString()} বাকি</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(today.percentages.reads)}`}
                style={{ width: `${Math.min(100, Math.max(1, today.percentages.reads))}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>ক্যাশ সেভড: সক্রিয়</span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {Math.max(0, 100 - today.percentages.reads).toFixed(1)}% অবশিষ্ট
            </span>
          </div>
        </div>

        {/* 2. Daily Writes Card */}
        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpCircle size={26} />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ফ্রি দৈনিক লিমিট</span>
              <span className="text-sm font-black text-slate-700">২০,০০০ টি</span>
            </div>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">আজকের মোট রাইট (Writes)</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black text-slate-900">{today.writes.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400">/ ২০,০০০</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">ব্যবহৃত: {today.percentages.writes}%</span>
              <span className="text-emerald-600 font-extrabold">{today.remaining.writes.toLocaleString()} বাকি</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(today.percentages.writes)}`}
                style={{ width: `${Math.min(100, Math.max(1, today.percentages.writes))}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>ব্যাচিং: সক্রিয়</span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {Math.max(0, 100 - today.percentages.writes).toFixed(1)}% অবশিষ্ট
            </span>
          </div>
        </div>

        {/* 3. Daily Deletes Card */}
        <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={26} />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ফ্রি দৈনিক লিমিট</span>
              <span className="text-sm font-black text-slate-700">২০,০০০ টি</span>
            </div>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">আজকের মোট ডিলিট (Deletes)</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-black text-slate-900">{today.deletes.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400">/ ২০,০০০</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">ব্যবহৃত: {today.percentages.deletes}%</span>
              <span className="text-rose-600 font-extrabold">{today.remaining.deletes.toLocaleString()} বাকি</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(today.percentages.deletes)}`}
                style={{ width: `${Math.min(100, Math.max(1, today.percentages.deletes))}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>নিরাপদ ডিলিটেশন</span>
            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {Math.max(0, 100 - today.percentages.deletes).toFixed(1)}% অবশিষ্ট
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Optimization Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">অপারেশন ভিত্তিক বণ্টন</h3>
              <p className="text-slate-400 text-xs font-bold">কোন বিভাগে কতটি রিড ও রাইট ব্যবহৃত হচ্ছে</p>
            </div>
            <Layers size={22} className="text-indigo-600" />
          </div>

          <div className="space-y-4">
            {[
              { key: 'cases', label: 'মামলা ও ডায়েরি (Cases)', stats: today.categories.cases, color: 'bg-indigo-600' },
              { key: 'users', label: 'ব্যবহারকারী প্রোফাইল (Users)', stats: today.categories.users, color: 'bg-emerald-600' },
              { key: 'notifications', label: 'নোটিফিকেশন ও অ্যালার্ট (Notifications)', stats: today.categories.notifications, color: 'bg-amber-500' },
              { key: 'tasks', label: 'টাস্ক ও ক্যালেন্ডার (Tasks)', stats: today.categories.tasks, color: 'bg-cyan-600' },
              { key: 'auth', label: 'লগইন ও অথেনটিকেশন (Auth Sessions)', stats: today.categories.auth, color: 'bg-purple-600' },
              { key: 'other', label: 'অন্যান্য সিস্টেম এপিআই (Other)', stats: today.categories.other, color: 'bg-slate-500' },
            ].map(item => (
              <div key={item.key} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <div className="text-[11px] text-slate-400 font-bold flex gap-3">
                    <span>রিড: <strong className="text-slate-700">{item.stats.reads}</strong></span>
                    <span>•</span>
                    <span>রাইট: <strong className="text-slate-700">{item.stats.writes}</strong></span>
                    <span>•</span>
                    <span>ডিলিট: <strong className="text-slate-700">{item.stats.deletes}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    মোট: {item.stats.reads + item.stats.writes + item.stats.deletes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quota Safeguards & Spark Plan Rules */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">ফায়ারবেস স্পার্ক পলিসি ও সুরক্ষা</h3>
                <p className="text-slate-400 text-xs font-bold">কোটা শেষ হওয়া প্রতিরোধে স্বয়ংক্রিয় সেফগার্ডসমূহ</p>
              </div>
              <ShieldCheck size={24} className="text-emerald-600" />
            </div>

            <div className="space-y-3.5">
              {[
                {
                  title: 'স্মার্ট লোকাল ক্যাশিং (Smart Cache)',
                  desc: 'ইউজার প্রতিবার ড্যাশবোর্ডে আসলে সরাসরি ক্যাশ থেকে মামলা ও নোটিফিকেশন লোড হয়, ফলে অতিরিক্ত রিড খরচ হয় না।',
                },
                {
                  title: 'কোটা এক্সস্টেড ফলব্যাক (Quota Exhaustion Guard)',
                  desc: 'যদি কোনো কারণে ৫০,০০০ ফ্রি রিড শেষ হয়ে যায়, তবুও ব্যবহারকারীদের ড্যাশবোর্ড ক্র্যাশ করবে না—লোকাল স্টোরেজ থেকে ডেটা সরবরাহ করা হবে।',
                },
                {
                  title: 'রাইট অপ্টিমাইজেশন (Write Batching)',
                  desc: 'একাধিক আপডেটকে একসাথে মার্জ করে সার্ভারে পাঠানো হয়, যাতে ২০,০০০ রাইট সীমা সহজে অতিক্রম না করে।',
                },
                {
                  title: 'স্বয়ংক্রিয় দৈনিক রিসেট (Daily Quota Refresh)',
                  desc: 'গুগল ফায়ারবেস প্রতিদিন আন্তর্জাতিক সময় (UTC 00:00) অনুযায়ী সমস্ত রিড ও রাইটের হিসেব শূন্য করে দেয়।',
                },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-indigo-950 uppercase tracking-wide">{item.title}</h5>
                    <p className="text-xs text-indigo-800/80 font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600 font-bold">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-slate-400" />
              <span>ফায়ারবেস ডেটাবেস আইডি: <span className="font-mono text-slate-900">{spark.databaseId}</span></span>
            </div>
            <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">1 GiB Storage</span>
          </div>
        </div>
      </div>

      {/* Historical Trend Table (Past Days) */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">বিগত দিনসমূহের ব্যবহারের হিসেব</h3>
              <p className="text-slate-400 text-xs font-bold">আগের দিনগুলোর মোট রিড ও রাইটের আর্কাইভ</p>
            </div>
            <BarChart2 size={22} className="text-indigo-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">তারিখ (UTC)</th>
                  <th className="py-3 px-4">মোট রিড (Reads)</th>
                  <th className="py-3 px-4">রিড শতাংশ (% of 50K)</th>
                  <th className="py-3 px-4">মোট রাইট (Writes)</th>
                  <th className="py-3 px-4">রাইট শতাংশ (% of 20K)</th>
                  <th className="py-3 px-4">মোট ডিলিট</th>
                  <th className="py-3 px-4 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                {history.map((row, idx) => {
                  const rPct = ((row.reads / 50000) * 100).toFixed(1);
                  const wPct = ((row.writes / 20000) * 100).toFixed(1);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-900">{row.date}</td>
                      <td className="py-3.5 px-4 text-indigo-600 font-extrabold">{row.reads.toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[11px]">
                          {rPct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 font-extrabold">{row.writes.toLocaleString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[11px]">
                          {wPct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{row.deletes.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12} /> স্বাভাবিক
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
