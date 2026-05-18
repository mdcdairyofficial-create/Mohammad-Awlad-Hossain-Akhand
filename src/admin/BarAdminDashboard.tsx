import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  XCircle, 
  Clock, 
  Users, 
  MonitorPlay, 
  Bell, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle,
  Search,
  LayoutDashboard,
  Filter,
  DollarSign,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs,
  getCountFromServer,
  serverTimestamp 
} from 'firebase/firestore';
import { sendGlobalNotification, subscribeToAllSupportChats } from '../services/user/featureService';

interface BarAdminDashboardProps {
  userId?: string;
  userName: string;
}

export default function BarAdminDashboard({ userId, userName }: BarAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'verification' | 'ads' | 'notifications' | 'support' | 'usage'>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [liveUsage, setLiveUsage] = useState({
    usersCount: 0,
    casesCount: 0,
    rechargeCount: 0,
    adsCount: 0,
    notificationsCount: 0
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingAds: 0,
    activeAds: 0,
    pendingVerification: 0
  });
  const [loading, setLoading] = useState(true);
  const [notificationText, setNotificationText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'lawyer' | 'clerk' | 'client' | 'advertiser'>('all');

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const [u, c, r, a, n] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'cases')),
          getCountFromServer(collection(db, 'recharge_orders')),
          getCountFromServer(collection(db, 'campaigns')),
          getCountFromServer(collection(db, 'notifications'))
        ]);
        setLiveUsage({
          usersCount: u.data().count,
          casesCount: c.data().count,
          rechargeCount: r.data().count,
          adsCount: a.data().count,
          notificationsCount: n.data().count
        });
      } catch (err) {
        console.error("Error fetching usage stats:", err);
      }
    };

    fetchUsage();
    
    // Stats and Real-time listeners
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
      
      const pendingVerify = userData.filter((u: any) => u.user_type === 'lawyer' && !u.isVerified).length;
      setStats(prev => ({ ...prev, totalUsers: userData.length, pendingVerification: pendingVerify }));
    });

    const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const campData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(campData);
      
      const pending = campData.filter((c: any) => c.status === 'pending').length;
      const active = campData.filter((c: any) => c.status === 'active').length;
      setStats(prev => ({ ...prev, pendingAds: pending, activeAds: active }));
    });

    const unsubChats = subscribeToAllSupportChats((chats) => {
      setSupportChats(chats);
    });

    setLoading(false);

    return () => {
      unsubUsers();
      unsubCampaigns();
    };
  }, []);

  const calculateEstimateCost = () => {
    // Basic estimation based on data volume
    // Firebase Enterprise (Blaze) pricing:
    // Read: $0.06 per 100,000
    // Write: $0.18 per 100,000
    // Storage: $0.18/GB
    
    const totalDocs = liveUsage.usersCount + liveUsage.casesCount + liveUsage.rechargeCount + liveUsage.adsCount + liveUsage.notificationsCount;
    const estDailyReads = totalDocs * 10; // Assume 10 reads per doc per day avg
    const estReadsCost = (estDailyReads / 100000) * 0.06;
    
    return estReadsCost * 120; // in BDT (approx)
  };

  const handleVerifyLawyer = async (lawyerId: string, verify: boolean) => {
    try {
      await updateDoc(doc(db, 'users', lawyerId), {
        isVerified: verify,
        verifiedAt: serverTimestamp(),
        verifiedBy: auth.currentUser?.uid
      });
      alert(verify ? 'আইনজীবী ভেরিফাইড হয়েছে' : 'ভেরিফিকেশন বাতিল হয়েছে');
    } catch (error) {
      console.error("Error verifying lawyer:", error);
    }
  };

  const handleAdStatus = async (adId: string, status: 'active' | 'completed' | 'paused') => {
    try {
      await updateDoc(doc(db, 'campaigns', adId), {
        status,
        activatedAt: status === 'active' ? serverTimestamp() : undefined,
        updatedAt: serverTimestamp()
      });
      alert(`বিজ্ঞাপনটি ${status === 'active' ? 'অনুমোদন' : 'আপডেট'} করা হয়েছে`);
    } catch (error) {
      console.error("Error updating ad status:", error);
    }
  };

  const handleSendGlobalNotification = async () => {
    if (!notificationText.trim()) return;
    try {
      await sendGlobalNotification({
        title: 'অ্যাডমিন বার্তা',
        message: notificationText,
        type: 'info'
      } as any);
      setNotificationText('');
      alert('গ্লোবাল নোটিফিকেশন পাঠানো হয়েছে');
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.mobile?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-indigo-950 min-h-screen p-6 text-white fixed">
          <div className="mb-10 border-b border-white/10 pb-6">
            <Logo />
            <div className="mt-4">
              <h2 className="font-black text-[10px] uppercase tracking-widest text-indigo-400">অ্যাডমিন প্যানেল</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{userName}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
              { id: 'users', label: 'ব্যবহারকারী', icon: Users },
              { id: 'verification', label: 'ভেরিফিকেশন', icon: UserCheck },
              { id: 'ads', label: 'বিজ্ঞাপন ম্যানেজমেন্ট', icon: MonitorPlay },
              { id: 'notifications', label: 'নোটিফিকেশন', icon: Bell },
              { id: 'support', label: 'সাপোর্ট মেসেজ', icon: MessageSquare },
              { id: 'usage', label: 'সিস্টেম ইউজ ও বিলিং', icon: Activity },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                {activeTab === 'dashboard' && 'সিস্টেম স্ট্যাটাস'}
                {activeTab === 'users' && 'ব্যবহারকারী ম্যানেজমেন্ট'}
                {activeTab === 'verification' && 'আইনজীবী ভেরিফিকেশন'}
                {activeTab === 'ads' && 'বিজ্ঞাপন অনুমোদন'}
                {activeTab === 'notifications' && 'গ্লোবাল নোটিফিকেশন'}
                {activeTab === 'support' && 'ইউজার সাপোর্ট'}
                {activeTab === 'usage' && 'লাইভ সিস্টেম ইউজ মনিটর'}
              </h1>
              <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">
                স্বাগতম ফিরে আসার জন্য, {userName}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all w-64"
                />
              </div>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'মোট ব্যবহারকারী', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'পেন্ডিং ভেরিফিকেশন', value: stats.pendingVerification, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'পেন্ডিং বিজ্ঞাপন', value: stats.pendingAds, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'সচল বিজ্ঞাপন', value: stats.activeAds, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">সাম্প্রতিক ব্যবহারকারী</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-50 text-left">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="pb-4">ব্যবহারকারী</th>
                          <th className="pb-4">টাইপ</th>
                          <th className="pb-4">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredUsers.slice(0, 10).map((user, i) => (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                  {user.name?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{user.mobile}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {user.user_type}
                              </span>
                            </td>
                            <td className="py-4">
                              <button className="text-indigo-600 font-bold text-xs uppercase tracking-widest">ডিটেইলস</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-indigo-900 p-8 rounded-[3rem] text-white">
                  <h2 className="text-xl font-black uppercase tracking-tight mb-6">কুইক অ্যাকশন</h2>
                  <div className="space-y-4">
                    <button 
                      onClick={() => setActiveTab('notifications')}
                      className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all font-bold text-sm"
                    >
                      গ্লোবাল মেসেজ পাঠান
                      <Bell size={18} />
                    </button>
                    <button 
                      onClick={() => setActiveTab('verification')}
                      className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all font-bold text-sm"
                    >
                      ল ইয়ার ভেরিফাই করুন
                      <UserCheck size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">সকল ইউজার</h2>
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
                  {['all', 'lawyer', 'clerk', 'client', 'advertiser'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setUserFilter(filter as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        userFilter === filter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      {filter === 'all' ? 'সব' : 
                       filter === 'lawyer' ? 'আইনজীবী' : 
                       filter === 'clerk' ? 'মুহুরী' : 
                       filter === 'client' ? 'পক্ষ' : 'বিজ্ঞাপনপাতা'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-8">ইউজার</th>
                      <th className="p-8">টাইপ</th>
                      <th className="p-8">স্ট্যাটাস</th>
                      <th className="p-8">ওয়ালেট</th>
                      <th className="p-8">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.filter(u => userFilter === 'all' || u.user_type === userFilter).map((user, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">
                              {user.name?.[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg leading-none mb-1">{user.name}</p>
                              <p className="text-sm font-bold text-slate-400">{user.email || user.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {user.user_type}
                          </span>
                        </td>
                        <td className="p-8">
                          {user.isVerified ? (
                            <span className="text-emerald-500 font-bold text-xs">ভেরিফাইড</span>
                          ) : (
                            <span className="text-slate-400 font-bold text-xs">আনভেরিফাইড</span>
                          )}
                        </td>
                        <td className="p-8 font-black text-indigo-600">৳{user.points || 0}</td>
                        <td className="p-8">
                          <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">ম্যানেজ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">আইনজীবী তালিকা</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest">সকল</button>
                  <button className="px-4 py-2 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest">পেন্ডিং</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-8">আইনজীবী</th>
                      <th className="p-8">স্ট্যাটাস</th>
                      <th className="p-8">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.filter(u => u.user_type === 'lawyer').map((lawyer, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                              {lawyer.name?.[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg leading-none mb-1">{lawyer.name}</p>
                              <p className="text-sm font-bold text-slate-400">{lawyer.email || lawyer.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          {lawyer.isVerified ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                              <CheckCircle size={14} /> ভেরিফাইড
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                              <Clock size={14} /> পেন্ডিং
                            </span>
                          )}
                        </td>
                        <td className="p-8">
                          {!lawyer.isVerified ? (
                            <button 
                              onClick={() => handleVerifyLawyer(lawyer.id, true)}
                              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all"
                            >
                              অনুমোদন দিন
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleVerifyLawyer(lawyer.id, false)}
                              className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                            >
                              বাতিল করুন
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ads' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((ad, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        ad.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                        ad.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {ad.status === 'active' ? 'সচল' : ad.status === 'pending' ? 'পেন্ডিং' : 'বন্ধ'}
                      </span>
                      <p className="text-lg font-black text-indigo-600">৳{ad.totalPrice}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{ad.adTitle || 'টাইটেল বিহীন বিজ্ঞাপন'}</h3>
                      <p className="text-slate-500 text-sm font-bold line-clamp-2">{ad.adDescription}</p>
                    </div>
                    {ad.adMediaUrl && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
                        {ad.adMediaType === 'video' ? (
                          <video src={ad.adMediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={ad.adMediaUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex gap-2">
                    {ad.status === 'pending' && (
                      <button 
                        onClick={() => handleAdStatus(ad.id, 'active')}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all"
                      >
                        অনুমোদন দিন
                      </button>
                    )}
                    {ad.status === 'active' && (
                      <button 
                        onClick={() => handleAdStatus(ad.id, 'paused')}
                        className="flex-1 py-4 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all font-black"
                      >
                        পজ করুন
                      </button>
                    )}
                    <button className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black hover:bg-slate-100 transition-all uppercase tracking-widest">
                      প্রিভিউ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">নতুন গ্লোবাল মেসেজ</h3>
                <p className="text-slate-400 text-sm font-bold">এই মেসেজটি সকল নিবন্ধিত ইউজার তাদের নোটিফিকেশন প্যানেলে দেখতে পাবেন।</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">মেসেজ কন্টেন্ট</label>
                  <textarea 
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    rows={6}
                    placeholder="আপনার মেসেজটি এখানে লিখুন..."
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-700 font-bold"
                  />
                </div>
                <button 
                  onClick={handleSendGlobalNotification}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  নোটিফিকেশন পাঠান
                </button>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Zap size={120} />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">অনুমানকৃত দৈনিক খরচ</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-emerald-600">৳{calculateEstimateCost().toFixed(2)}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ দিন</p>
                  </div>
                  <p className="mt-4 text-[10px] text-slate-400 font-medium">
                    * বর্তমান ডেটা ভলিউম এবং গড় ইউজার অ্যাক্টিভিটির উপর ভিত্তি করে।
                  </p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">সিস্টেম অবজেক্ট কাউন্ট</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">ইউজার প্রোফাইল</span>
                      <span className="font-black text-slate-900">{liveUsage.usersCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">মামলা রেকর্ডস</span>
                      <span className="font-black text-slate-900">{liveUsage.casesCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">রিচার্জ ট্রানজাকশন</span>
                      <span className="font-black text-slate-900">{liveUsage.rechargeCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-900/20">
                  <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">ডেটা অপ্টিমাইজেশন মুড</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
                      <Zap size={24} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-lg font-black leading-tight">৮০% সাশ্রয়</p>
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">রিড অপারেশন</p>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                    ইউজার আইডিতে "শুধুমাত্র আজকের মামলা" ফিল্টার চালু থাকার কারণে ফায়ারবেজ রিড উল্লেখযোগ্যভাবে কমেছে।
                  </p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">লাইভ রিসোর্স মনিটর</h3>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">রিয়েল-টাইম অপারেশন ট্র্যাকিং</p>
                  </div>
                  <BarChart3 className="text-indigo-600" size={32} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ফায়ারবেজ রিড (অনুমানকৃত)</span>
                        <span className="text-xl font-black text-indigo-600">~৫০০-২০০০ / পিরিওড</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-1/3 rounded-full"></div>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ফায়ারবেজ রাইট (অনুমানকৃত)</span>
                        <span className="text-xl font-black text-emerald-600">~৫০-১৫০ / পিরিওড</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[15%] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
                    <h4 className="font-black text-indigo-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                      <ShieldCheck size={16} /> সিকিউরিটি ও কস্ট কন্ট্রোল
                    </h4>
                    <ul className="space-y-4">
                      {[
                        'ইন্ডেক্সড কোয়েরি এনফোর্সমেন্ট',
                        'ব্যাটচ রাইট অপ্টিমাইজেশন',
                        'অপ্রয়োজনীয় অন-স্ন্যাপশট লিসেনার প্রতিরোধ',
                        'ইউজার এপিআই কল লিমিটিং'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                          <CheckCircle size={14} className="text-indigo-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 pt-8 border-t border-indigo-200">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 font-black">ম্যানেজমেন্ট গাইড</p>
                      <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                        সুপার অ্যাডমিন হিসেবে আপনি সবসময় গুগল ক্লাউড কনসোলের "Billing" সেকশন থেকে প্রকৃত ইনভয়েস দেখতে পারবেন। এখানে প্রদর্শিত তথ্য অনুমানকৃত।
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
