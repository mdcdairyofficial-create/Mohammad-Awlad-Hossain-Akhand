import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, CheckCircle, XCircle, FileText, CreditCard, LayoutDashboard, MessageSquare, Bell, Send, Clock, User as UserIcon, Search, TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { sendGlobalNotification, subscribeToMessages, sendMessage } from '../services/user/featureService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth } from '../firebase';

import { BANGLADESH_DISTRICTS, getPoliceStations } from '../constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { onAuthStateChanged } from 'firebase/auth';
import { fetchWithAuth } from '../lib/api';

interface User {
  id: number;
  name: string;
  mobile: string;
  user_type: string;
  district?: string;
  thana?: string;
  created_at: string;
  subscription_package?: string;
  subscription_end_date?: string;
  wallet_balance?: number;
  is_approved?: number;
}

interface Case {
  id: number;
  case_number: string;
  court_name: string;
  petitioner: string;
  respondent: string;
  status: string;
  lawyer_name: string;
  created_at: string;
}

interface RechargeRequest {
  id: number;
  user_id: number;
  user_name: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

interface SubscriptionRequest {
  id: number;
  user_mobile: string;
  plan_name: string;
  amount: number;
  duration: string;
  payment_method: string;
  transaction_id: string;
  target_type: string;
  status: string;
  created_at: string;
}

interface AffiliateProof {
  id: number;
  user_id: number;
  user_name: string;
  user_mobile: string;
  link_id: string;
  screenshot_url: string;
  status: string;
  created_at: string;
}

interface SupportChat {
  id: string;
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_at: any;
  unread_count?: number;
}

interface AffiliateReferral {
  id: number;
  referrer_id: string;
  referrer_name: string;
  new_user_id: number;
  new_user_name: string;
  new_user_mobile: string;
  user_type: string;
  district: string;
  thana: string;
  status: string;
  created_at: string;
}

export default function AdminPanel({ userType, userId }: { userType: string, userId: number }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'cases' | 'recharge' | 'subscriptions' | 'sub_requests' | 'affiliate_proofs' | 'affiliate_referrals' | 'createUser' | 'recycleBin' | 'support_messages' | 'global_notifications'>('dashboard');
  const [userFilter, setUserFilter] = useState<'all' | 'lawyer' | 'clerk' | 'client' | 'admin' | 'super_admin' | 'bar_association' | 'advertiser'>('all');
  const [thanaFilter, setThanaFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [affiliateProofs, setAffiliateProofs] = useState<AffiliateProof[]>([]);
  const [affiliateReferrals, setAffiliateReferrals] = useState<AffiliateReferral[]>([]);
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(!!user);
    });
    return () => unsubscribe();
  }, []);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    return fetchWithAuth(url, options);
  };

  const appointDistrictAdmin = async (targetUserId: number, district: string) => {
    setProcessingId(targetUserId);
    try {
      const response = await adminFetch('/api/admin/appoint-district-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, district })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('অ্যাডমিন নিযুক্ত করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchData();
    
    let unsubChats: (() => void) | undefined;
    if (isAuthReady) {
      // Need alternative or removal
      console.warn("Support chats subscription disabled - dependency missing");
    }

    return () => {
      if (unsubChats) unsubChats();
    };
  }, [activeTab, isAuthReady]);

  useEffect(() => {
    if (selectedChat && isAuthReady) {
      const unsubMessages = subscribeToMessages(selectedChat.id, (data) => {
        setChatMessages(data);
      });
      return () => unsubMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendReply = async () => {
    if (!selectedChat || !replyMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(selectedChat.id, {
        chat_id: selectedChat.id,
        sender_id: userId.toString(),
        sender_name: 'Admin',
        message: replyMessage
      });
      setReplyMessage('');
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'dashboard') {
        const response = await adminFetch(`/api/admin/stats?role=${userType}&userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        setStats(await response.json());
      } else if (activeTab === 'users' || activeTab === 'subscriptions') {
        // Hierarchical Fetch: Get only relevant users based on the admin's role
        const currentUser = JSON.parse(localStorage.getItem('appUser') || '{}');
        const response = await adminFetch(`/api/admin/managed-users?role=${userType}&userId=${userId}&district=${currentUser.district}&country=${currentUser.country}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users || []);
      } else if (activeTab === 'cases') {
        const response = await adminFetch('/api/admin/cases');
        if (!response.ok) throw new Error('Failed to fetch cases');
        setCases(await response.json());
      } else if (activeTab === 'recharge') {
        const response = await adminFetch('/api/admin/recharge-requests');
        if (!response.ok) throw new Error('Failed to fetch recharge requests');
        setRechargeRequests(await response.json());
      } else if (activeTab === 'sub_requests') {
        const response = await adminFetch('/api/admin/subscription-requests');
        if (!response.ok) throw new Error('Failed to fetch subscription requests');
        setSubscriptionRequests(await response.json());
      } else if (activeTab === 'affiliate_proofs') {
        const response = await adminFetch('/api/admin/affiliate-proofs');
        if (!response.ok) throw new Error('Failed to fetch affiliate proofs');
        const data = await response.json();
        setAffiliateProofs(data.proofs || []);
      } else if (activeTab === 'affiliate_referrals') {
        const response = await adminFetch('/api/admin/affiliate-referrals');
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        setAffiliateReferrals(data.referrals || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (targetUserId: number, isApproved: boolean, subDays?: number) => {
    setProcessingId(targetUserId);
    try {
      const response = await adminFetch('/api/admin/update-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, isApproved, subscriptionDays: subDays })
      });
      if (!response.ok) throw new Error('Update failed');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const updateRole = async (targetUserId: number, role: string) => {
    setProcessingId(targetUserId);
    try {
      const response = await adminFetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!response.ok) throw new Error('Failed to update role');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const updateSubscription = async (targetUserId: number, pkg: string, days: number) => {
    setProcessingId(targetUserId);
    try {
      const response = await adminFetch(`/api/admin/users/${targetUserId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg, days })
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const approveSubscription = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const response = await adminFetch(`/api/admin/subscription-requests/${requestId}/approve`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to approve subscription');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectSubscription = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const response = await adminFetch(`/api/admin/subscription-requests/${requestId}/reject`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reject subscription');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const resetAllData = async () => {
    setProcessingId(-1);
    try {
      const response = await adminFetch('/api/admin/reset-all', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset data');
      
      // Clear local storage and reload to force re-authentication
      localStorage.removeItem('appUser');
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setProcessingId(null);
      setShowResetConfirm(false);
    }
  };

  const handleApproveRecharge = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await adminFetch('/api/admin/recharge-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: 'approved' })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve recharge');
      }
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRecharge = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await adminFetch('/api/admin/recharge-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: 'rejected' })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject recharge');
      }
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAffiliateProofAction = async (id: number, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const response = await adminFetch(`/api/admin/affiliate-proofs/${id}/${action}`, {
        method: 'POST'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} proof`);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesFilter = userFilter === 'all' || u.user_type === userFilter;
    const matchesThana = !thanaFilter || (u.thana && u.thana.toLowerCase().includes(thanaFilter.toLowerCase()));
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                         u.mobile.includes(userSearch);
    return matchesFilter && matchesThana && matchesSearch;
  });

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDistrict, setNewUserDistrict] = useState('');
  const [newUserThana, setNewUserThana] = useState('');
  const [newUserType, setNewUserType] = useState('client');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-800">অ্যাডমিন প্যানেল</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <LayoutDashboard size={18} /> ড্যাশবোর্ড
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Users size={18} /> ব্যবহারকারী
        </button>
        <button 
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <CheckCircle size={18} /> সাবস্ক্রিপশন
        </button>
        <button 
          onClick={() => setActiveTab('cases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'cases' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <FileText size={18} /> মামলাসমূহ
        </button>
        <button 
          onClick={() => setActiveTab('recharge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'recharge' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <CreditCard size={18} /> রিচার্জ রিকোয়েস্ট
        </button>
        <button 
          onClick={() => setActiveTab('sub_requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'sub_requests' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <CheckCircle size={18} /> সাবস্ক্রিপশন রিকোয়েস্ট
        </button>
        <button 
          onClick={() => setActiveTab('affiliate_proofs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'affiliate_proofs' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <CheckCircle size={18} /> অ্যাফিলিয়েট প্রমাণ
        </button>
        <button 
          onClick={() => setActiveTab('affiliate_referrals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'affiliate_referrals' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <TrendingUp size={18} /> অ্যাফিলিয়েট সাইন-আপ
        </button>
        <button 
          onClick={() => setActiveTab('createUser')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'createUser' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Users size={18} /> নতুন ইউজার তৈরি
        </button>
        <button 
          onClick={() => setActiveTab('recycleBin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'recycleBin' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <XCircle size={18} /> রিসাইকেল বিন
        </button>
        <button 
          onClick={() => setActiveTab('support_messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'support_messages' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <MessageSquare size={18} /> সাপোর্ট মেসেজ
        </button>
        <button 
          onClick={() => setActiveTab('global_notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'global_notifications' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Bell size={18} /> গ্লোবাল নোটিফিকেশন
        </button>
        <button 
          onClick={() => setShowResetConfirm(true)}
          disabled={processingId === -1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 ${processingId === -1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {processingId === -1 ? (
            <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          ) : (
            <XCircle size={18} />
          )}
          {processingId === -1 ? 'রিসেট হচ্ছে...' : 'সব ডাটা রিসেট করুন'}
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="থানা দিয়ে ফিল্টার করুন..."
                value={thanaFilter}
                onChange={(e) => setThanaFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'lawyer', 'clerk', 'client', 'bar_association', 'advertiser', 'admin'].map((filter) => (
              <button
                key={filter}
                onClick={() => setUserFilter(filter as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  userFilter === filter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'all' ? 'সব' : 
                 filter === 'lawyer' ? 'আইনজীবী' : 
                 filter === 'clerk' ? 'মুহুরী' : 
                 filter === 'client' ? 'পক্ষ' :
                 filter === 'bar_association' ? 'বার অ্যাসোসিয়েশন' :
                 filter === 'advertiser' ? 'বিজ্ঞাপনদাতা' : 'অ্যাডমিন'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">লোড হচ্ছে...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">{error}</div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">মোট ব্যবহারকারী</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FileText size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">মোট মামলা</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalCases}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CreditCard size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">মোট আয় (রিচার্জ)</p>
                  <p className="text-3xl font-bold text-emerald-600">৳{stats.rechargeStats.find((s: any) => s.status === 'approved')?.total || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <CreditCard size={24} />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">পেন্ডিং রিচার্জ</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.rechargeStats.find((s: any) => s.status === 'pending')?.count || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <BarChartIcon size={18} className="text-indigo-600" /> ব্যবহারকারী বিভাজন
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.userBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="user_type" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {stats.userBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <PieChartIcon size={18} className="text-emerald-600" /> রিচার্জ স্ট্যাটাস
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.rechargeStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                        >
                          {stats.rechargeStats.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.status === 'approved' ? '#10b981' : entry.status === 'pending' ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {stats.rechargeStats.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.status === 'approved' ? '#10b981' : entry.status === 'pending' ? '#f59e0b' : '#ef4444' }}></div>
                        <span className="text-xs font-medium text-slate-600 capitalize">{entry.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 font-medium">নাম</th>
                    <th className="p-4 font-medium">মোবাইল</th>
                    <th className="p-4 font-medium">থানা</th>
                    <th className="p-4 font-medium">ধরন</th>
                    <th className="p-4 font-medium">ওয়ালেট</th>
                    <th className="p-4 font-medium">যোগদানের তারিখ</th>
                    <th className="p-4 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">{user.name}</td>
                      <td className="p-4 text-slate-600">{user.mobile}</td>
                      <td className="p-4 text-slate-500 text-sm">{user.thana || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.user_type === 'admin' ? 'bg-indigo-100 text-indigo-800' :
                          user.user_type === 'country_manager' ? 'bg-emerald-100 text-emerald-800' :
                          user.user_type === 'lawyer' ? 'bg-blue-100 text-blue-800' :
                          user.user_type === 'clerk' ? 'bg-emerald-100 text-emerald-800' :
                          user.user_type === 'bar_association' ? 'bg-purple-100 text-purple-800' :
                          user.user_type === 'advertiser' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {user.user_type === 'admin' ? 'অ্যাডমিন' : 
                           user.user_type === 'country_manager' ? 'কান্ট্রি ম্যানেজার' :
                           user.user_type === 'lawyer' ? 'আইনজীবী' : 
                           user.user_type === 'clerk' ? 'মুহুরী' : 
                           user.user_type === 'bar_association' ? 'বার অ্যাসোসিয়েশন' :
                           user.user_type === 'advertiser' ? 'বিজ্ঞাপনদাতা' : 'পক্ষ'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-bold">৳{user.wallet_balance || 0}</td>
                      <td className="p-4 text-slate-500 text-sm">
                        {new Date(user.created_at).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="p-4 text-right">
                        {user.user_type !== 'super_admin' && (
                          <div className="flex gap-2 justify-end items-center">
                            {userType === 'super_admin' && user.user_type !== 'admin' && (
                              <button
                                onClick={() => {
                                  const district = prompt(`${user.name}-কে কোন জেলার অ্যাডমিন নিযুক্ত করতে চান? (যেমন: ঢাকা)`);
                                  if (district) appointDistrictAdmin(user.id, district);
                                }}
                                disabled={processingId === user.id}
                                className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                              >
                                অ্যাডমিন নিযুক্ত করুন
                              </button>
                            )}
                            {userType === 'admin' && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, user.is_approved === 0)}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded transition-colors",
                                  user.is_approved === 1 ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-600 text-white hover:bg-green-700"
                                )}
                              >
                                {user.is_approved === 1 ? "বাতিল" : "অনুমোদন"}
                              </button>
                            )}
                            <select 
                              onChange={(e) => updateRole(user.id, e.target.value)}
                              value={user.user_type}
                              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                              disabled={processingId === user.id}
                            >
                              {userType === 'super_admin' && <option value="country_manager">কান্ট্রি ম্যানেজার</option>}
                              {(userType === 'super_admin' || userType === 'country_manager') && <option value="admin">অ্যাডমিন</option>}
                              <option value="lawyer">আইনজীবী (Lawyer)</option>
                              <option value="clerk">মুহুরী (Clerk)</option>
                              <option value="client">পক্ষ (Client)</option>
                              <option value="advertiser">বিজ্ঞাপনদাতা (Advertiser)</option>
                              <option value="bar_association">বার অ্যাসোসিয়েশন (Bar Assoc)</option>
                              {userType === 'super_admin' && <option value="super_admin">সুপার অ্যাডমিন</option>}
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">কোনো ব্যবহারকারী পাওয়া যায়নি</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 font-medium">ব্যবহারকারী</th>
                    <th className="p-4 font-medium">প্যাকেজ</th>
                    <th className="p-4 font-medium">মেয়াদ শেষ</th>
                    <th className="p-4 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.filter(u => u.user_type !== 'admin').map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">
                        <div>{user.name}</div>
                        <div className="text-xs text-slate-400">{user.mobile}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.subscription_package === 'premium' ? 'bg-amber-100 text-amber-800' :
                          user.subscription_package === 'standard' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {user.subscription_package === 'premium' ? 'প্রিমিয়াম' : 
                           user.subscription_package === 'standard' ? 'স্ট্যান্ডার্ড' : 'ফ্রি'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('bn-BD') : 'নেই'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <select 
                            onChange={(e) => updateSubscription(user.id, e.target.value, 30)}
                            value={user.subscription_package || 'free'}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                            disabled={processingId === user.id}
                          >
                            <option value="free">ফ্রি</option>
                            <option value="standard">স্ট্যান্ডার্ড (৩০ দিন)</option>
                            <option value="premium">প্রিমিয়াম (৩০ দিন)</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 font-medium">মামলা নং</th>
                    <th className="p-4 font-medium">আদালত</th>
                    <th className="p-4 font-medium">বাদী/বিবাদী</th>
                    <th className="p-4 font-medium">আইনজীবী/ব্যবহারকারী</th>
                    <th className="p-4 font-medium">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">{c.case_number}</td>
                      <td className="p-4 text-slate-600">{c.court_name}</td>
                      <td className="p-4 text-slate-600 text-sm">
                        <div className="font-medium text-indigo-600">{c.petitioner}</div>
                        <div className="text-xs text-slate-400">বনাম</div>
                        <div className="font-medium text-rose-600">{c.respondent}</div>
                      </td>
                      <td className="p-4 text-slate-600">{c.lawyer_name || 'অজানা'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {c.status || 'চলমান'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {cases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">কোনো মামলা পাওয়া যায়নি</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'recharge' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                    <th className="p-4 font-medium">ব্যবহারকারী</th>
                    <th className="p-4 font-medium">পরিমাণ</th>
                    <th className="p-4 font-medium">পেমেন্ট মেথড</th>
                    <th className="p-4 font-medium">ট্রানজেকশন আইডি</th>
                    <th className="p-4 font-medium text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rechargeRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">{req.user_name}</td>
                      <td className="p-4 text-slate-600 font-bold">৳{req.amount}</td>
                      <td className="p-4 text-slate-600 uppercase">{req.payment_method}</td>
                      <td className="p-4 text-slate-600 font-mono text-sm">{req.transaction_id}</td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleApproveRecharge(req.id)}
                          disabled={processingId === req.id}
                          className={`flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-md font-medium transition-colors ${processingId === req.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle size={14} /> {processingId === req.id ? 'প্রসেসিং...' : 'অনুমোদন'}
                        </button>
                        <button 
                          onClick={() => handleRejectRecharge(req.id)}
                          disabled={processingId === req.id}
                          className={`flex items-center gap-1 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-md font-medium transition-colors ${processingId === req.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <XCircle size={14} /> {processingId === req.id ? 'প্রসেসিং...' : 'বাতিল'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rechargeRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">কোনো পেন্ডিং রিচার্জ রিকোয়েস্ট নেই</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sub_requests' && (
            <div className="bg-white rounded-[30px] border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">ইউজার মোবাইল</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">প্ল্যান</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">টাকা</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">পেমেন্ট</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">ট্রানজেকশন ID</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionRequests.map((req) => (
                    <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-900">{req.user_mobile}</span>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{req.target_type}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase">
                          {req.plan_name} ({req.duration})
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">৳{req.amount}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase">
                          {req.payment_method}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-500">{req.transaction_id}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveSubscription(req.id)}
                            disabled={processingId === req.id}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => rejectSubscription(req.id)}
                            disabled={processingId === req.id}
                            className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subscriptionRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">কোনো পেন্ডিং সাবস্ক্রিপশন রিকোয়েস্ট নেই</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'affiliate_referrals' && (
            <div className="bg-white rounded-[30px] border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" /> অ্যাফিলিয়েট লিড ও সাইন-আপসমূহ
                </h3>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                  মোট: {affiliateReferrals.length}
                </span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">রেফারার (Referrer)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">নতুন মেম্বার</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">ধরন</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">এলাকা (জেলা/থানা)</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliateReferrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{ref.referrer_name || 'N/A'}</div>
                        <div className="text-[10px] text-indigo-600 font-bold uppercase">{ref.referrer_id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{ref.new_user_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{ref.new_user_mobile}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                          ref.user_type === 'lawyer' ? 'bg-blue-50 text-blue-600' :
                          ref.user_type === 'clerk' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {ref.user_type === 'lawyer' ? 'আইনজীবী' : ref.user_type === 'clerk' ? 'মুহুরী' : 'পক্ষ'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-700 font-medium">{ref.district}</div>
                        <div className="text-[10px] text-slate-400">{ref.thana || 'সকল থানা'}</div>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-slate-400">
                        {new Date(ref.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {affiliateReferrals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">এখনও কোনো অ্যাফিলিয়েট সাইন-আপ নেই</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'createUser' && (
            <div className="p-6 max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 text-slate-800">নতুন ইউজার তৈরি করুন</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setProcessingId(-2);
                try {
                  const response = await adminFetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      name: newUserName, 
                      email: newUserEmail, 
                      mobile: newUserMobile, 
                      password: newUserPassword, 
                      user_type: newUserType,
                      district: newUserDistrict,
                      thana: newUserThana 
                    })
                  });
                  if (!response.ok) throw new Error('Failed to create user');
                  alert('ইউজার সফলভাবে তৈরি হয়েছে');
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserMobile('');
                  setNewUserPassword('');
                  setNewUserDistrict('');
                  setNewUserThana('');
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setProcessingId(null);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">নাম</label>
                  <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="নাম" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">মোবাইল</label>
                  <input value={newUserMobile} onChange={e => setNewUserMobile(e.target.value)} placeholder="মোবাইল" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ইমেইল</label>
                  <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} type="email" placeholder="ইমেইল" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">পাসওয়ার্ড</label>
                  <input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="পাসওয়ার্ড" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">জেলা</label>
                    <select
                      value={newUserDistrict}
                      onChange={(e) => {
                        setNewUserDistrict(e.target.value);
                        setNewUserThana('');
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">জেলা নির্বাচন করুন</option>
                      {BANGLADESH_DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">থানা</label>
                    <select
                      value={newUserThana}
                      onChange={(e) => setNewUserThana(e.target.value)}
                      disabled={!newUserDistrict}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">থানা নির্বাচন করুন</option>
                      {newUserDistrict && getPoliceStations(newUserDistrict, 'Bangladesh').map(ps => (
                        <option key={ps} value={ps}>{ps}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ইউজার টাইপ</label>
                  <select value={newUserType} onChange={e => setNewUserType(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    {userType === 'super_admin' && <option value="country_manager">কান্ট্রি ম্যানেজার</option>}
                    {(userType === 'super_admin' || userType === 'country_manager') && <option value="admin">অ্যাডমিন</option>}
                    <option value="lawyer">আইনজীবী (Lawyer)</option>
                    <option value="clerk">মুহুরী (Clerk)</option>
                    <option value="client">মক্কেল (Client)</option>
                  </select>
                </div>
                <button type="submit" disabled={processingId === -2} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {processingId === -2 ? 'তৈরি হচ্ছে...' : 'ইউজার তৈরি করুন'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'recycleBin' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">রিসাইকেল বিন</h2>
              <p className="text-slate-500 mb-4">এখানে ডিলিট করা ডাটাগুলো জমা থাকবে। আপনি চাইলে রিস্টোর করতে পারেন অথবা স্থায়ীভাবে মুছে ফেলতে পারেন।</p>
              {/* Recycle Bin content will be implemented here */}
            </div>
          )}

          {activeTab === 'support_messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] p-6">
              {/* Chat List */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={20} className="text-indigo-600" />
                    সাপোর্ট মেসেজ
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {supportChats.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-slate-500">কোনো মেসেজ নেই</p>
                    </div>
                  ) : (
                    supportChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-4 flex items-center gap-4 border-b border-slate-100 transition-all hover:bg-slate-50 ${
                          selectedChat?.id === chat.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          {chat.user_name?.substring(0, 1).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900 truncate">{chat.user_name}</h4>
                            {chat.last_message_at && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(chat.last_message_at?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{chat.last_message}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                {selectedChat ? (
                  <>
                    <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                          <UserIcon size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{selectedChat.user_name}</h3>
                          <p className="text-xs text-emerald-500 font-bold">সক্রিয় চ্যাট</p>
                        </div>
                      </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === userId.toString() ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] flex gap-3 ${msg.sender_id === userId.toString() ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                              msg.sender_id === userId.toString() ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}>
                              {msg.sender_name?.substring(0, 1).toUpperCase()}
                            </div>
                            <div className={`p-4 rounded-3xl shadow-sm ${
                              msg.sender_id === userId.toString()
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              {msg.created_at && (
                                <div className={`flex items-center gap-1 mt-2 text-[10px] ${
                                  msg.sender_id === userId.toString() ? 'text-indigo-200' : 'text-slate-400'
                                }`}>
                                  <Clock size={10} />
                                  <span>{new Date(msg.created_at?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-white border-t border-slate-200">
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                        <input
                          type="text"
                          placeholder="রিপ্লাই লিখুন..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                          className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-slate-800 font-medium"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!replyMessage.trim() || isSending}
                          className="p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                      <MessageSquare size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">মেসেজ সিলেক্ট করুন</h3>
                    <p className="text-slate-500 max-w-xs">বাম পাশের তালিকা থেকে একটি চ্যাট সিলেক্ট করে কথা বলা শুরু করুন।</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'global_notifications' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">গ্লোবাল নোটিফিকেশন</h2>
                    <p className="text-sm text-slate-500">সব ব্যবহারকারীকে একটি নোটিফিকেশন পাঠান</p>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const title = formData.get('title') as string;
                  const message = formData.get('message') as string;
                  const type = formData.get('type') as string;

                  setProcessingId(-3);
                  try {
                    await sendGlobalNotification({
                      user_id: 'global',
                      title,
                      message,
                      type: type as any
                    });
                    alert('নোটিফিকেশন সফলভাবে পাঠানো হয়েছে');
                    e.currentTarget.reset();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setProcessingId(null);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">শিরোনাম</label>
                    <input name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="নোটিফিকেশনের শিরোনাম..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">মেসেজ</label>
                    <textarea name="message" required rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" placeholder="বিস্তারিত মেসেজ লিখুন..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ধরন</label>
                    <select name="type" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                      <option value="info">তথ্য (Info)</option>
                      <option value="success">সফলতা (Success)</option>
                      <option value="warning">সতর্কতা (Warning)</option>
                      <option value="error">ত্রুটি (Error)</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    disabled={processingId === -3}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processingId === -3 ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Send size={20} /> নোটিফিকেশন পাঠান</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <XCircle className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">আপনি কি নিশ্চিত?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              এটি সব ডাটা মুছে ফেলবে এবং এটি অপরিবর্তনীয়। আপনাকে পুনরায় সাইন-আপ করতে হবে।
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={processingId === -1}
              >
                বাতিল
              </button>
              <button
                onClick={resetAllData}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                disabled={processingId === -1}
              >
                {processingId === -1 ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'হ্যাঁ, রিসেট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
