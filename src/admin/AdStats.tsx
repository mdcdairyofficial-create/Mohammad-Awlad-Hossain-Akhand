import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Calendar, 
  TrendingUp, 
  Search, 
  Users, 
  DollarSign, 
  Sliders, 
  User, 
  Phone, 
  ChevronRight, 
  X, 
  Info,
  RefreshCw,
  Activity,
  Award
} from 'lucide-react';
import { fetchWithAuth } from '../lib/api';

interface AdStat {
  id: string;
  userId: string;
  date: string;
  week: string;
  month: string;
  totalViews: number;
  networks: Record<string, number>;
  lastViewedAt: any;
}

interface UserProfile {
  id: string;
  firebase_uid: string | null;
  name?: string;
  mobile?: string;
  user_type?: string;
}

// Normalize ad networks to known categories
const normalizeNetwork = (net: string): 'admob' | 'adsense' | 'national' | 'other' => {
  const n = (net || '').toLowerCase();
  if (n.includes('admob') || n.includes('mob')) return 'admob';
  if (n.includes('adsense') || n.includes('google') || n.includes('g_adsense')) return 'adsense';
  if (n.includes('national') || n.includes('জাতীয়') || n.includes('জাতীয়')) return 'national';
  return 'other';
};

const getNetworkLabel = (net: string): string => {
  const norm = normalizeNetwork(net);
  if (norm === 'admob') return 'এডমোব (AdMob)';
  if (norm === 'adsense') return 'গুগল এডসেন্স (AdSense)';
  if (norm === 'national') return 'জাতীয় এডস (National Ads)';
  return 'অন্যান্য (Other)';
};

export default function AdStats() {
  const [stats, setStats] = useState<AdStat[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rate Settings (BDT per 1000 views)
  const [rates, setRates] = useState({
    admob: 150,     // 0.15 BDT per view
    adsense: 100,   // 0.10 BDT per view
    national: 200,  // 0.20 BDT per view
    other: 50       // 0.05 BDT per view
  });

  // Load custom rates from localStorage on mount
  useEffect(() => {
    try {
      const savedRates = localStorage.getItem('ad_ecpm_rates');
      if (savedRates) {
        setRates(JSON.parse(savedRates));
      }
    } catch (e) {
      console.warn('Could not read saved eCPM rates from localStorage', e);
    }
  }, []);

  // Save rates to localStorage helper
  const handleRateChange = (network: keyof typeof rates, value: number) => {
    const updatedRates = { ...rates, [network]: value >= 0 ? value : 0 };
    setRates(updatedRates);
    try {
      localStorage.setItem('ad_ecpm_rates', JSON.stringify(updatedRates));
    } catch (e) {
      console.warn('Could not save eCPM rates to localStorage', e);
    }
  };

  // State for user search and details
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserStats, setSelectedUserStats] = useState<AdStat[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch ad stats
      const statsResponse = await fetchWithAuth('/api/ads/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch ad stats');
      const statsData = await statsResponse.json();
      setStats(statsData.data || []);

      // Fetch user profiles to map names and mobile numbers
      const usersResponse = await fetchWithAuth('/api/admin/users');
      if (!usersResponse.ok) throw new Error('Failed to fetch user list');
      const usersData = await usersResponse.json();
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helpers for calculations
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const todayKey = `${year}-${month}-${day}`;
  const thisMonthKey = `${year}-${month}`;

  // Calculate earnings for a specific view count on a network
  const calculateEarnings = (views: number, network: string) => {
    const norm = normalizeNetwork(network);
    const rate = rates[norm];
    return (views / 1000) * rate;
  };

  // --- Aggregate Today's stats ---
  const todayStats = stats.filter(s => s.date === todayKey);
  const todayCounts = { admob: 0, adsense: 0, national: 0, other: 0, total: 0 };
  todayStats.forEach(s => {
    Object.entries(s.networks || {}).forEach(([net, val]) => {
      const norm = normalizeNetwork(net);
      todayCounts[norm] += val || 0;
      todayCounts.total += val || 0;
    });
  });

  const todayEarnings = {
    admob: (todayCounts.admob / 1000) * rates.admob,
    adsense: (todayCounts.adsense / 1000) * rates.adsense,
    national: (todayCounts.national / 1000) * rates.national,
    other: (todayCounts.other / 1000) * rates.other,
    total: 0
  };
  todayEarnings.total = todayEarnings.admob + todayEarnings.adsense + todayEarnings.national + todayEarnings.other;

  // --- Aggregate This Month's stats ---
  const monthStats = stats.filter(s => s.month === thisMonthKey);
  const monthCounts = { admob: 0, adsense: 0, national: 0, other: 0, total: 0 };
  monthStats.forEach(s => {
    Object.entries(s.networks || {}).forEach(([net, val]) => {
      const norm = normalizeNetwork(net);
      monthCounts[norm] += val || 0;
      monthCounts.total += val || 0;
    });
  });

  const monthEarnings = {
    admob: (monthCounts.admob / 1000) * rates.admob,
    adsense: (monthCounts.adsense / 1000) * rates.adsense,
    national: (monthCounts.national / 1000) * rates.national,
    other: (monthCounts.other / 1000) * rates.other,
    total: 0
  };
  monthEarnings.total = monthEarnings.admob + monthEarnings.adsense + monthEarnings.national + monthEarnings.other;

  // --- User-wise Aggregation ---
  const userStatsMap = new Map<string, {
    uid: string;
    totalViews: number;
    todayViews: number;
    monthViews: number;
    networks: Record<string, number>;
  }>();

  stats.forEach(s => {
    const uid = s.userId;
    if (!userStatsMap.has(uid)) {
      userStatsMap.set(uid, {
        uid,
        totalViews: 0,
        todayViews: 0,
        monthViews: 0,
        networks: {}
      });
    }

    const uData = userStatsMap.get(uid)!;
    const viewsVal = s.totalViews || 0;
    uData.totalViews += viewsVal;
    
    if (s.date === todayKey) {
      uData.todayViews += viewsVal;
    }
    if (s.month === thisMonthKey) {
      uData.monthViews += viewsVal;
    }

    Object.entries(s.networks || {}).forEach(([net, val]) => {
      const norm = normalizeNetwork(net);
      uData.networks[norm] = (uData.networks[norm] || 0) + val;
    });
  });

  // Map to list with user profile information
  const userDisplayList = Array.from(userStatsMap.values()).map(us => {
    // Try to find profile by firebase_uid or id
    const profile = users.find(u => u.firebase_uid === us.uid || u.id === us.uid);
    
    // Compute total earnings generated by this user
    let userEarnings = 0;
    Object.entries(us.networks).forEach(([net, views]) => {
      const norm = normalizeNetwork(net);
      userEarnings += (views / 1000) * rates[norm];
    });

    return {
      ...us,
      profile,
      earnings: userEarnings
    };
  });

  // Filter display users by search term
  const filteredUsers = userDisplayList.filter(u => {
    const name = (u.profile?.name || '').toLowerCase();
    const mobile = (u.profile?.mobile || '').toLowerCase();
    const id = u.uid.toLowerCase();
    const q = searchTerm.toLowerCase();
    return name.includes(q) || mobile.includes(q) || id.includes(q);
  });

  const handleOpenUserDetail = (uid: string, profile: UserProfile | undefined) => {
    const userLogs = stats.filter(s => s.userId === uid).sort((a, b) => b.date.localeCompare(a.date));
    setSelectedUser(profile || { id: uid, firebase_uid: uid, name: 'নামহীন ব্যবহারকারী', mobile: 'নেই' });
    setSelectedUserStats(userLogs);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-indigo-600" size={36} />
        <p className="text-slate-500 font-bold text-sm">বিজ্ঞাপন তথ্য এবং ব্যবহারকারী ট্র্যাকিং লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-700">
        <h3 className="font-bold text-lg mb-2">সার্ভার এরর</h3>
        <p className="text-sm mb-4">{error}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <Eye className="text-indigo-600" size={26} />
            বিজ্ঞাপন ভিউ ও আয় ট্র্যাকার (Ad Views & Revenue)
          </h2>
          <p className="text-slate-500 text-xs font-bold mt-1">
            এডমব, গুগল এডসেন্স ও জাতীয় বিজ্ঞাপনের প্রতিদিন ও মাসিক ভিউ ও উপার্জনের বিস্তারিত ওভারভিউ
          </p>
        </div>
        
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 flex items-center gap-2 transition-all self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={14} /> ডেটা রিফ্রেশ
        </button>
      </div>

      {/* 1. Main Stats Box (প্রতিদিন ও মাসিক ভিউ এবং আয়ের বক্স) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Stats Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] border border-indigo-100/60 p-6 relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 text-indigo-100/50 pointer-events-none">
            <Activity size={120} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
              আজকের পরিসংখ্যান (Today)
            </div>
            <span className="text-slate-400 text-xs font-semibold">{todayKey}</span>
          </div>

          <p className="text-xs text-slate-500 font-bold">আজকের মোট বিজ্ঞাপন ভিউ</p>
          <div className="text-4xl font-black text-indigo-950 mb-1 flex items-baseline gap-2">
            {todayCounts.total} <span className="text-sm font-bold text-slate-400">বার ভিউ</span>
          </div>
          <p className="text-xs text-slate-500 font-bold mb-6">
            আনুমানিক মোট আয়: <span className="text-emerald-600 font-extrabold text-base">৳ {todayEarnings.total.toFixed(2)}</span>
          </p>

          <div className="space-y-3 pt-3 border-t border-indigo-100">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">নেটওয়ার্ক ভিত্তিক ভিউ ও উপার্জন:</h4>
            
            {/* Admob */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> এডমোব (AdMob)
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{todayCounts.admob} ভিউ</span>
                <span className="text-emerald-600 font-black ml-2">৳ {todayEarnings.admob.toFixed(2)}</span>
              </div>
            </div>

            {/* Google Adsense */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> গুগল এডসেন্স
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{todayCounts.adsense} ভিউ</span>
                <span className="text-emerald-600 font-black ml-2">৳ {todayEarnings.adsense.toFixed(2)}</span>
              </div>
            </div>

            {/* National Ads */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> জাতীয় এডস
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{todayCounts.national} ভিউ</span>
                <span className="text-emerald-600 font-black ml-2">৳ {todayEarnings.national.toFixed(2)}</span>
              </div>
            </div>

            {/* Others */}
            {todayCounts.other > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> অন্যান্য
                </span>
                <div className="text-right">
                  <span className="font-extrabold text-slate-800">{todayCounts.other} ভিউ</span>
                  <span className="text-emerald-600 font-black ml-2">৳ {todayEarnings.other.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Stats Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[2rem] border border-emerald-100/60 p-6 relative overflow-hidden shadow-sm">
          <div className="absolute -right-6 -bottom-6 text-emerald-100/50 pointer-events-none">
            <TrendingUp size={120} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
              মাসিক পরিসংখ্যান (Monthly)
            </div>
            <span className="text-slate-400 text-xs font-semibold">{thisMonthKey}</span>
          </div>

          <p className="text-xs text-slate-500 font-bold">এই মাসের মোট বিজ্ঞাপন ভিউ</p>
          <div className="text-4xl font-black text-emerald-950 mb-1 flex items-baseline gap-2">
            {monthCounts.total} <span className="text-sm font-bold text-slate-400">বার ভিউ</span>
          </div>
          <p className="text-xs text-slate-500 font-bold mb-6">
            আনুমানিক মোট আয়: <span className="text-indigo-600 font-extrabold text-base">৳ {monthEarnings.total.toFixed(2)}</span>
          </p>

          <div className="space-y-3 pt-3 border-t border-emerald-100">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">নেটওয়ার্ক ভিত্তিক ভিউ ও উপার্জন:</h4>
            
            {/* Admob */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> এডমোব (AdMob)
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{monthCounts.admob} ভিউ</span>
                <span className="text-emerald-600 font-black ml-2">৳ {monthEarnings.admob.toFixed(2)}</span>
              </div>
            </div>

            {/* Google Adsense */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> গুগল এডসেন্স
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{monthCounts.adsense} ভিউ</span>
                <span className="text-emerald-600 font-black ml-2">৳ {monthEarnings.adsense.toFixed(2)}</span>
              </div>
            </div>

            {/* National Ads */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> জাতীয় এডস
              </span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{monthCounts.national} ভিউ</span>
                <span className="text-emerald-600 font-black ml-2">৳ {monthEarnings.national.toFixed(2)}</span>
              </div>
            </div>

            {/* Others */}
            {monthCounts.other > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> অন্যান্য
                </span>
                <div className="text-right">
                  <span className="font-extrabold text-slate-800">{monthCounts.other} ভিউ</span>
                  <span className="text-emerald-600 font-black ml-2">৳ {monthEarnings.other.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. eCPM Rate Settings Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1.5">
          <Sliders className="text-indigo-600" size={18} />
          বিজ্ঞাপন রাজস্ব সেটিংস (eCPM Rate Settings in BDT)
        </h3>
        <p className="text-slate-500 text-xs font-semibold mb-4">
          প্রতি ১,০০০ বিজ্ঞাপন ভিউতে টাকার হার পরিবর্তন করুন (এটি পরিবর্তন করলে সাথে সাথে আয়ের হিসাব আপডেট হবে)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Admob */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1">এডমোব eCPM (AdMob)</span>
              <span className="text-[10px] text-slate-400 font-medium block mb-2">প্রতি ১০০০ ভিউতে টাকা</span>
            </div>
            <div className="relative">
              <input 
                type="number" 
                value={rates.admob}
                onChange={(e) => handleRateChange('admob', Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-12 text-sm font-extrabold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
            </div>
          </div>

          {/* Google Adsense */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1">গুগল এডসেন্স eCPM (AdSense)</span>
              <span className="text-[10px] text-slate-400 font-medium block mb-2">প্রতি ১০০০ ভিউতে টাকা</span>
            </div>
            <div className="relative">
              <input 
                type="number" 
                value={rates.adsense}
                onChange={(e) => handleRateChange('adsense', Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-12 text-sm font-extrabold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
            </div>
          </div>

          {/* National Ads */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1">জাতীয় এডস eCPM (National Ads)</span>
              <span className="text-[10px] text-slate-400 font-medium block mb-2">প্রতি ১০০০ ভিউতে টাকা</span>
            </div>
            <div className="relative">
              <input 
                type="number" 
                value={rates.national}
                onChange={(e) => handleRateChange('national', Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-12 text-sm font-extrabold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. User Ad Tracking System (একজন ইউজার কত এডস ভিউ করেছে তা জানার ব্যবস্থা) */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              ব্যবহারকারী ভিত্তিক বিজ্ঞাপন ট্র্যাকিং (User Ad Views Tracking)
            </h3>
            <p className="text-slate-500 text-xs font-bold mt-0.5">
              নির্দিষ্ট একজন ইউজার কতটি বিজ্ঞাপন ভিউ করেছেন ও কত টাকা উপার্জন জেনারেট করেছেন তা খুঁজুন
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="নাম, মোবাইল বা ইউজার আইডি দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* User Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">ব্যবহারকারী (User Details)</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">আজকের ভিউ (Today)</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">চলতি মাসের ভিউ (Month)</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">সর্বমোট ভিউ (Total Views)</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">আয় জেনারেট (Earnings BDT)</th>
                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">অ্যাকশন (Action)</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-bold text-xs">
                    কোনো ব্যবহারকারীর বিজ্ঞাপন দেখার ডেটা পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleLabel = user.profile?.user_type === 'super_admin' ? 'সুপার এডমিন' : user.profile?.user_type === 'admin' ? 'এডমিন' : 'আইনজীবী (User)';
                  return (
                    <tr key={user.uid} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-black">
                            {user.profile?.name ? user.profile.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 block text-xs">{user.profile?.name || 'নামহীন ব্যবহারকারী'}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                                <Phone size={10} /> {user.profile?.mobile || 'নেই'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-500 border border-slate-200 rounded font-medium">
                                {roleLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold ${user.todayViews > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {user.todayViews}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold ${user.monthViews > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                          {user.monthViews}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-black text-slate-900">{user.totalViews}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-black text-emerald-600">৳ {user.earnings.toFixed(2)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenUserDetail(user.uid, user.profile)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-lg border border-indigo-100 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          বিশদ বিবরণ <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">ব্যবহারকারী তথ্য বিশ্লেষণ</span>
                <h3 className="text-base font-black text-slate-800 mt-0.5">{selectedUser.name || 'নামহীন ব্যবহারকারী'}</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">মোবাইল: {selectedUser.mobile || 'নেই'} | UID: {selectedUser.firebase_uid || selectedUser.id}</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* User Networks Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                <span className="text-xs font-black text-slate-700 block mb-3">নেটওয়ার্ক অনুযায়ী বিজ্ঞাপন দেখার অনুপাত:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['admob', 'adsense', 'national'].map((net) => {
                    // Sum views for this network
                    let totalViews = 0;
                    selectedUserStats.forEach(s => {
                      totalViews += s.networks?.[net] || 0;
                    });
                    const rate = rates[net as keyof typeof rates] || 0;
                    const earnings = (totalViews / 1000) * rate;

                    return (
                      <div key={net} className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          {getNetworkLabel(net)}
                        </span>
                        <span className="text-lg font-black text-slate-800 block mt-1">
                          {totalViews} <span className="text-xs font-semibold text-slate-400">টি</span>
                        </span>
                        <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                          ৳ {earnings.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day-by-Day view list */}
              <div>
                <span className="text-xs font-black text-slate-700 block mb-3 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" /> দৈনিক ভিউ লগসমূহ (Daily View Logs)
                </span>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3">তারিখ (Date)</th>
                        <th className="p-3 text-center">মোট ভিউ</th>
                        <th className="p-3 text-right">আয় জেনারেট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-semibold text-slate-600">
                      {selectedUserStats.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-6 text-center text-slate-400 font-bold">
                            কোনো বিস্তারিত লগ পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        selectedUserStats.map((log) => {
                          let logEarnings = 0;
                          Object.entries(log.networks || {}).forEach(([net, views]) => {
                            const norm = normalizeNetwork(net);
                            logEarnings += (views / 1000) * rates[norm];
                          });

                          return (
                            <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                              <td className="p-3 font-bold text-slate-700">{log.date}</td>
                              <td className="p-3 text-center text-slate-800 font-extrabold">{log.totalViews}</td>
                              <td className="p-3 text-right text-emerald-600 font-bold">৳ {logEarnings.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
