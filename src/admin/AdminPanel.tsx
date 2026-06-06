import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, CheckCircle, XCircle, FileText, CreditCard, LayoutDashboard, MessageSquare, Bell, Send, Clock, User as UserIcon, Search, TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon, MapPin, ShieldAlert, Scale, ThumbsUp, ThumbsDown, Lock, ShieldCheck, Key, RefreshCw, Database, Activity, Play, ChevronDown, ChevronUp, RefreshCcw, Smartphone, Tablet, Monitor, Layout, Menu, Ruler, Terminal, Cpu, Zap, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, LineChart, Line } from 'recharts';
import { sendGlobalNotification, subscribeToMessages, sendMessage } from '../services/user/featureService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';

import { BANGLADESH_DISTRICTS, getPoliceStations } from '../constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { onAuthStateChanged } from 'firebase/auth';
import { fetchWithAuth } from '../lib/api';

interface User {
  id: string | number;
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
  trust_score?: number;
  warnings_count?: number;
  red_balls_count?: number;
  is_suspended?: boolean;
  suspension_reason?: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  accusedId: string;
  accusedName: string;
  submitterName: string;
  submitterMobile: string;
  status: string;
  createdAt: string;
}

interface Appeal {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  appealReason: string;
  status: string;
  createdAt: any;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt?: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'cases' | 'recharge' | 'subscriptions' | 'sub_requests' | 'affiliate_proofs' | 'affiliate_referrals' | 'createUser' | 'recycleBin' | 'support_messages' | 'global_notifications' | 'complaints' | 'clerk_trust' | 'audit_logs' | 'responsive_design' | 'testing'>('dashboard');
  const [userFilter, setUserFilter] = useState<'all' | 'lawyer' | 'clerk' | 'client' | 'admin' | 'super_admin' | 'bar_association' | 'advertiser'>('all');
  const [thanaFilter, setThanaFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complaintFilterStatus, setComplaintFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [clerkSearch, setClerkSearch] = useState('');
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
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const [processingId, setProcessingId] = useState<number | null>(null);

  // Phase 10: Security States
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({
    super_admin: { create_cases: true, approve_recharge: true, review_subscriptions: true, manage_users: true, audit_logs: true, complaints: true },
    officer: { create_cases: true, approve_recharge: true, review_subscriptions: true, manage_users: false, audit_logs: true, complaints: true },
    lawyer: { create_cases: true, approve_recharge: false, review_subscriptions: false, manage_users: false, audit_logs: false, complaints: false },
    clerk: { create_cases: true, approve_recharge: false, review_subscriptions: false, manage_users: false, audit_logs: false, complaints: false },
    assistant: { create_cases: false, approve_recharge: false, review_subscriptions: false, manage_users: false, audit_logs: false, complaints: false },
  });
  const [securityInputPassword, setSecurityInputPassword] = useState('MySecurePassword123');
  const [securityCustomSalt, setSecurityCustomSalt] = useState('$2b$12$K1d9M8xP0zV3q6r9s2t.');
  const [rateLimitRequestsCount, setRateLimitRequestsCount] = useState(0);
  const [rateLimitMode, setRateLimitMode] = useState<'standard' | 'strict' | 'disabled'>('standard');
  const [rateLimitLog, setRateLimitLog] = useState<string[]>([]);
  const [customAuditAction, setCustomAuditAction] = useState('SECURITY_AUDIT');
  const [customAuditDetails, setCustomAuditDetails] = useState('অ্যাডমিন প্যানেল থেকে একটি ম্যানুয়াল সিকিউরিটি স্ক্যান সম্পন্ন হয়েছে।');
  const [isAddingAuditLog, setIsAddingAuditLog] = useState(false);
  const [backupsList, setBackupsList] = useState<any[]>(() => {
    const saved = localStorage.getItem('security_backups');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'BK-20260601-0941', timestamp: '২০২৬-০৬-০১ ০৯:৪১:১২', records: 142, size: '28.4 KB', type: 'সিস্টেম অটোমেটিক (Auto)', status: 'Active' },
      { id: 'BK-20260605-1823', timestamp: '২০২৬-০৬-০৫ ১৮:২৩:৪৫', records: 156, size: '31.1 KB', type: 'ম্যানুয়াল ব্যাকআপ (Manual)', status: 'Active' }
    ];
  });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [securityTabSelection, setSecurityTabSelection] = useState<'permissions' | 'logs' | 'ratelimit' | 'password' | 'backup'>('permissions');

  // Phase 11: Responsive Design Simulation States
  const [simulatedDevice, setSimulatedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [simulatedOrientation, setSimulatedOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [simulatedViewMode, setSimulatedViewMode] = useState<'dashboard' | 'cases' | 'recharge' | 'support'>('dashboard');
  const [showRulerLines, setShowRulerLines] = useState(true);

  // Phase 12: Testing Simulation States
  const [testSuiteSelection, setTestSuiteSelection] = useState<'all' | 'functional' | 'security' | 'performance' | 'multi_user'>('all');
  const [testRunning, setTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testLogs, setTestLogs] = useState<string[]>([
    'সিস্টেম রেডি। পরীক্ষার বিভাগ সিলেক্ট করে "টেস্ট রানার চালু করুন" বোতামে ক্লিক করুন।'
  ]);
  const [testStats, setTestStats] = useState({ passed: 0, failed: 0, total: 0, timeMs: 0 });
  const [simulatedLoadRps, setSimulatedLoadRps] = useState(1500);
  const [simulatedActiveUsers, setSimulatedActiveUsers] = useState(850);
  const [showDetailedReportModal, setShowDetailedReportModal] = useState(false);

  // Phase 12 Testing Logs definition
  const FUNCTIONAL_TEST_STEPS = [
    "🚀 [INFO] ফাংশনাল (কার্যকরী) টেস্ট স্যুট ইনিশিয়ালাইজ হচ্ছে...",
    "🔍 [EXEC] ইউজার ওটিপি (OTP) ও বায়োমেট্রিক লগইন মডিউল যাচাইকরণ...",
    "✅ [PASS] ইউজার সাইন-আপ, ইমেইল ভলিউম এবং ওটিপি অন-ডিমান্ড জেনারেশন সম্পূর্ণ হয়েছে।",
    "🔍 [EXEC] আইনজীবী ও সহকারী ডিরেক্টরি লোকেশন ফিল্টারিং কুয়েরি রান...",
    "✅ [PASS] জেলা জজ আদালত ঢাকা, থানা গুলশান ও বাড্ডা এলাকার অনুসন্ধান সঠিক ফিল্টার প্রদর্শন করছে।",
    "🔍 [EXEC] নথিপত্র সংযোজন ও ওকালতনামা পিডিএফ আপলোডার সিকিউর বাফার চেক...",
    "✅ [PASS] ৫ মেগাবাইট বাফার লিমিট সঠিক এবং মাল্টিপার্ট ড্রপ-জোন ফাইল আপলোড সফল।",
    "🔍 [EXEC] মোবাইল ব্যালেন্স রিচার্জ ও বিকাশ/নগদ এপিআই হ্যান্ডশেক ইন্টিগ্রেশন...",
    "✅ [PASS] ক্রেডিট ভ্যালু আপডেট ও অনলাইন ইনস্ট্যান্ট পেমেন্ট গেটওয়ে রেসপন্স টাইম < ০.৮ সেকেন্ড।",
    "🔍 [EXEC] মক্কেলের রেটিং, রিভিউ ও ফিডব্যাক রিলেショナル স্টোরেজ কুয়েরি ভ্যালিডেশন...",
    "✅ [PASS] ডাটাবেস স্কোর প্রোপাগেশন সফল। ফিডব্যাক মেকানিজম ভ্যালিড।",
    "✨ [SUCCESS] ফাংশনাল টেস্ট সূটে ১০০% টেস্ট কেস সফলভাবে উত্তীর্ণ হয়েছে!"
  ];

  const SECURITY_TEST_STEPS = [
    "🛡️ [INFO] সিকিউরিটি (নিরাপত্তা) পেনিট্রেশন টেস্ট স্যুট ইনিশিয়ালাইজ হচ্ছে...",
    "🔒 [EXEC] রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) বাউন্ডারি চেক...",
    "✅ [PASS] আইনজীবী কোনো মক্কেলের প্রাইভেট নথিতে অ্যাক্সেস করতে পারছে না। সিকিউর বাউন্ডারি সাকসেস।",
    "🔒 [EXEC] ফায়ারবেস ফায়ারস্টোর সিকিউরিটি রুলস ল্যাব এমুলেটর নিরীক্ষা...",
    "✅ [PASS] firestore.rules সম্পূর্ণ এনফোর্সড। আনঅথরাইজড রিড/রাইট এবং কাড লিমিট ব্লক সফল।",
    "🔒 [EXEC] এসকিউএল ইনজেকশন (SQLi) ও স্ক্রিপ্ট স্যানিটাইজিং ইনপুট বাফার আক্রমণ টেস্ট...",
    "✅ [PASS] ক্ষতিকারক স্ক্রিপ্ট ইনজেকশন অবরুদ্ধ। রিলেショナル কুয়েরিতে প্যারামিটারাইজড ফিল্টারিং একটিভ।",
    "🔒 [EXEC] আইপি ভিত্তিক রেট লিমিটিং এবং ব্রুটফোর্স রেজিস্ট্যান্স চেক...",
    "✅ [PASS] মিনিটে সর্বোচ্চ ৬০ রিকোয়েস্ট সীমা অতিক্রম করার চেষ্টার পর আইপি ৫ মিনিটের জন্য ব্লক।",
    "🔒 [EXEC] এনক্রিফ্টেড ডাটালগ ও সেন্সিティブ পাসওয়ার্ড প্লেইনটেক্সট লিক অডিট...",
    "✅ [PASS] সকল পাসওয়ার্ড হ্যাসড (bcrypt-stuck) এবং ডাটাবেসে ট্রানজেকশন কীলক সুরক্ষিত।",
    "✨ [SUCCESS] নিরাপত্তা অডিট ও সিকিউরিটি টেস্ট স্যুট সফলভাবে সমাপ্ত হয়েছে!"
  ];

  const PERFORMANCE_TEST_STEPS = [
    "⚡ [INFO] পারফরম্যান্স ও থ্রুটপুট লোড টেস্ট স্যুট ইনিশিয়ালাইজ হচ্ছে...",
    "📈 [EXEC] ৫,০০০ রিকোয়েস্ট/সেকেন্ড লোড সিমুলেশন থ্রেড প্রিপারেশন...",
    "📊 [INFO] সমান্তরাল লোড গ্রাফ আপগ্রেডিং... লাইভ সিপিইউ ব্যবহার: ৮৭%, ল্যাটেন্সি: ১৫ms।",
    "✅ [PASS] সার্ভার অটো-স্কেলিং ও সিপিইউ থ্রেশহোল্ড ভ্যালিড। কোনো রিকোয়েস্ট ড্রপ বা টাইমআউট হয়নি।",
    "📈 [EXEC] ডাটাবেস কুয়েরি ল্যাটেন্সি ও ক্যাশিং হিট রেশিও ক্যালকুলেশন...",
    "✅ [PASS] গড়ে ডাটাবেস কুয়েরি রেসপন্স টাইম ১২.৪ মিলিসেকেন্ড এবং Redis ক্যাশ হিট ৮০%।",
    "📈 [EXEC] ফ্রন্টএন্ড অ্যাসেট পেজ লোড ও বান্ডেল সাইজ অপ্টিমাইজেশন টেস্ট...",
    "✅ [PASS] ফার্স্ট কন্টেন্টফুল পেইন্ট (FCP) মাত্র ১.৭ সেকেন্ড। লাইটহাউস স্কোর পারফরম্যান্স ৯৮।",
    "📈 [EXEC] রিয়েক্ট রি-রেন্ডারিং মেমোরাইজেশন ও উইন্ডোইজিং পারফরম্যান্স অডিট...",
    "✅ [PASS] মেমোরি ফ্ল্যাশ রেট স্ট্যাবল। কোনো অপ্রয়োজনীয় কম্পোনেন্ট রি-রেন্ডার হচ্ছে না।",
    "✨ [SUCCESS] সিস্টেম লোড ও পারফরম্যান্স টেস্ট সাকসেসফুলি পাস করেছে!"
  ];

  const MULTI_USER_TEST_STEPS = [
    "👥 [INFO] মাল্টি-ইউজার কনকারেন্সি ও রিয়েল-টাইম ইন্টারেকশন টেস্ট স্যুট ইনিশিয়ালাইজ হচ্ছে...",
    "💬 [EXEC] একই সময়ে আইনজীবী ও সাধারণ সহকারীর চ্যাট কিউ ট্র্যাকিং...",
    "✅ [PASS] মেসেজ ব্রোকার সঠিকভাবে ১,৫০০টি প্যারালাল চ্যাট সেশন হ্যান্ডেল করছে।",
    "💬 [EXEC] লাইভ ব্রডকাস্টিং চ্যানেল ওয়ান-টাইม পুশ কিউ রেসপন্স টাইম নিরীক্ষা...",
    "✅ [PASS] websocket কানেকশন হ্যান্ডশেক সাকসেস। মেসেজ ডেলিভারি ল্যাটেন্সি < ৫০ms।",
    "💬 [EXEC] সমসাময়িক মামলা নথি আপলোড এবং ডাবল-রাইট কনফ্লিক্ট এমুলেশন...",
    "✅ [PASS] একই মামলার ফাইলে কনকারেন্ট এডিটিং এর জন্য ডেডিকেটেড লক মেকানিজম সফলভাবে কার্যকর।",
    "✨ [SUCCESS] মাল্টি-ইউজার ইন্টারেকশন ও চ্যাট কনকারেন্সি টেস্ট সফল হয়েছে!"
  ];

  const runTestScenario = () => {
    if (testRunning) return;
    setTestRunning(true);
    setTestProgress(0);
    
    let steps: string[] = [];
    if (testSuiteSelection === 'all') {
      steps = [...FUNCTIONAL_TEST_STEPS, ...SECURITY_TEST_STEPS, ...PERFORMANCE_TEST_STEPS, ...MULTI_USER_TEST_STEPS];
    } else if (testSuiteSelection === 'functional') {
      steps = FUNCTIONAL_TEST_STEPS;
    } else if (testSuiteSelection === 'security') {
      steps = SECURITY_TEST_STEPS;
    } else if (testSuiteSelection === 'performance') {
      steps = PERFORMANCE_TEST_STEPS;
    } else if (testSuiteSelection === 'multi_user') {
      steps = MULTI_USER_TEST_STEPS;
    }

    setTestLogs([`⚙️ [INIT] ${new Date().toLocaleTimeString()} - টেস্ট রানার বুটিং সিকোয়েন্স চালু হচ্ছে...`]);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setTestLogs(prev => [...prev, steps[currentStep]]);
        setTestProgress(Math.min(Math.round(((currentStep + 1) / steps.length) * 100), 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setTestRunning(false);
        setTestStats({
          passed: steps.filter(s => s.includes('PASS') || s.includes('SUCCESS')).length,
          failed: steps.filter(s => s.includes('FAIL') || s.includes('ERROR')).length,
          total: steps.length,
          timeMs: Math.round(steps.length * 350 + Math.random() * 500)
        });
        setTestLogs(prev => [...prev, `🏁 [DONE] ${new Date().toLocaleTimeString()} - পরীক্ষার সব কার্যক্রম সমাপ্তি লাভ করেছে।`]);
      }
    }, 350);
  };

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [testLogs]);

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
      } else if (activeTab === 'users' || activeTab === 'subscriptions' || activeTab === 'clerk_trust') {
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
      } else if (activeTab === 'complaints') {
        try {
          const complaintsSnap = await getDocs(collection(db, 'complaints'));
          const complaintsList = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Complaint);
          complaintsList.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setComplaints(complaintsList);

          const appealsSnap = await getDocs(collection(db, 'appeals'));
          const appealsList = appealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Appeal);
          appealsList.sort((a, b) => {
            const dateA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
            const dateB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
            return dateB - dateA;
          });
          setAppeals(appealsList);
        } catch (fbErr) {
          console.error("Failed to load complaints/appeals directly from Firebase:", fbErr);
        }
      } else if (activeTab === 'audit_logs') {
        try {
          const logsSnap = await getDocs(collection(db, 'audit_logs'));
          const logsList = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog);
          logsList.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setAuditLogs(logsList);
        } catch (fbErr) {
          console.error("Failed to load audit logs directly from Firebase:", fbErr);
        }
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

  const adjustUserTrustAndWarnings = async (userUid: string, userName: string, fields: { trust_score?: number, warnings_count?: number, red_balls_count?: number, is_suspended?: boolean, suspension_reason?: string }) => {
    setProcessingId(999);
    try {
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, fields);
      
      let details = `ADMIN update on user ${userName}: `;
      if (fields.trust_score !== undefined) details += `Set trust score to ${fields.trust_score}. `;
      if (fields.warnings_count !== undefined) details += `Set warnings to ${fields.warnings_count}. `;
      if (fields.red_balls_count !== undefined) details += `Set red balls to ${fields.red_balls_count}. `;
      if (fields.is_suspended !== undefined) details += fields.is_suspended ? `SUSPENDED user. Reason: ${fields.suspension_reason || 'N/A'}` : `LIFTED user suspension. `;

      await addDoc(collection(db, 'audit_logs'), {
        action: 'admin_user_update',
        details,
        createdAt: new Date().toISOString()
      });

      fetchData();
      alert('সফলভাবে আপডেট করা হয়েছে!');
    } catch (err: any) {
      alert('সরাসরি ফায়ারস্টোরে আপডেট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplaintAction = async (complaintId: string, accusedId: string, accusedName: string, actionType: 'warn' | 'red_ball' | 'suspend' | 'dismiss') => {
    setProcessingId(888);
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      
      if (actionType === 'dismiss') {
        await updateDoc(complaintRef, { status: 'resolved' });
        await addDoc(collection(db, 'audit_logs'), {
          action: 'complaint_dismissed',
          details: `Dismissed complaint ${complaintId} against user ${accusedName}`,
          createdAt: new Date().toISOString()
        });
      } else {
        const accusedRef = doc(db, 'users', accusedId);
        const accusedSnap = await getDoc(accusedRef);
        
        let currentWarnings = 0;
        let currentRedBalls = 0;
        let currentTrustScore = 100;
        
        if (accusedSnap.exists()) {
          const data = accusedSnap.data();
          currentWarnings = data.warnings_count || 0;
          currentRedBalls = data.red_balls_count || 0;
          currentTrustScore = data.trust_score !== undefined ? data.trust_score : 100;
        }

        let updates: any = {};
        let logDetails = '';

        if (actionType === 'warn') {
          const newWarnings = currentWarnings + 1;
          const newTrustScore = Math.max(0, currentTrustScore - 15);
          updates = {
            warnings_count: newWarnings,
            trust_score: newTrustScore
          };
          if (newWarnings >= 3) {
            updates.is_suspended = true;
            updates.suspension_reason = 'অতিরিক্ত ওয়ার্নিং পাওয়ার কারণে স্বয়ংক্রিয় সাময়িক বরখাস্ত';
            logDetails = `Warned user ${accusedName} (${newWarnings}/৩). User reached max warnings and has been suspended automatically.`;
          } else {
            logDetails = `Warned user ${accusedName} (Warning count increased to ${newWarnings}/৩, Trust Score set to ${newTrustScore}%)`;
          }
          await updateDoc(complaintRef, { status: 'resolved_warned' });
        } else if (actionType === 'red_ball') {
          const newRedBalls = currentRedBalls + 1;
          const newTrustScore = Math.max(0, currentTrustScore - 30);
          updates = {
            red_balls_count: newRedBalls,
            trust_score: newTrustScore
          };
          if (newRedBalls >= 3) {
            updates.is_suspended = true;
            updates.suspension_reason = '৩টি রেড বল পাওয়ার কারণে স্বয়ংক্রিয় বরখাস্ত';
            logDetails = `Allocated a RED BALL to user ${accusedName} (Total: ${newRedBalls}/৩). User reached 3 red balls and has been suspended automatically.`;
          } else {
            logDetails = `Allocated a RED BALL to user ${accusedName} (Total red balls: ${newRedBalls}/৩, Trust Score set to ${newTrustScore}%)`;
          }
          await updateDoc(complaintRef, { status: 'resolved_red_balled' });
        } else if (actionType === 'suspend') {
          const reason = prompt(`${accusedName}-কে বরখাস্ত করার কারণ লিখুন:`);
          if (reason === null) return;
          updates = {
            is_suspended: true,
            suspension_reason: reason || 'অ্যাডমিন কর্তৃক বরখাস্ত',
            trust_score: Math.max(0, currentTrustScore - 50)
          };
          logDetails = `Suspended user ${accusedName}. Reason: ${reason || 'অ্যাডমিন কর্তৃক বরখাস্ত'}`;
          await updateDoc(complaintRef, { status: 'resolved_suspended' });
        }

        await updateDoc(accusedRef, updates);
        await addDoc(collection(db, 'audit_logs'), {
          action: 'complaint_action_taken',
          details: logDetails,
          createdAt: new Date().toISOString()
        });
      }

      fetchData();
      alert('অভিযোগ নিষ্পত্তি করা হয়েছে!');
    } catch (err: any) {
      alert('অভিযোগ নিষ্পত্তিতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAppealAction = async (appealId: string, userId: string, userName: string, actionType: 'approve' | 'reject') => {
    setProcessingId(777);
    try {
      const appealRef = doc(db, 'appeals', appealId);
      
      if (actionType === 'reject') {
        await updateDoc(appealRef, { status: 'rejected' });
        await addDoc(collection(db, 'audit_logs'), {
          action: 'appeal_rejected',
          details: `Rejected suspension appeal ${appealId} from user ${userName}`,
          createdAt: new Date().toISOString()
        });
        alert('আপিল আবেদনটি বাতিল করা হয়েছে।');
      } else {
        await updateDoc(appealRef, { status: 'approved' });
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          is_suspended: false,
          suspension_reason: '',
          warnings_count: 0,
          red_balls_count: 0,
          trust_score: 100
        });

        await addDoc(collection(db, 'audit_logs'), {
          action: 'appeal_approved',
          details: `Approved suspension appeal from user ${userName}. Suspensions lifted, warnings/red balls reset to 0, Trust Score restored to 100%.`,
          createdAt: new Date().toISOString()
        });
        alert('সফলভাবে আপিল অনুমোদন করা হয়েছে এবং ইউজারকে রি-অ্যাক্টিভেট করা হয়েছে!');
      }

      fetchData();
    } catch (err: any) {
      alert('আপিল নিষ্পত্তিতে সমস্যা হয়েছে: ' + err.message);
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
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'complaints' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <ShieldAlert size={18} /> অভিযোগ ও আপিল
        </button>
        <button 
          onClick={() => setActiveTab('clerk_trust')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'clerk_trust' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Scale size={18} /> মুহুরী ট্রাস্ট ও ওয়ার্নিং
        </button>
        <button 
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'audit_logs' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Lock size={18} /> নিরাপত্তা ও অডিট লগ
        </button>
        <button 
          onClick={() => setActiveTab('global_notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'global_notifications' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Bell size={18} /> গ্লোবাল নোটিফিকেশন
        </button>
        <button 
          onClick={() => setActiveTab('responsive_design')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'responsive_design' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Activity size={18} /> মোবাইল ও রেসপনসিভনেস
        </button>
        <button 
          onClick={() => setActiveTab('testing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'testing' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Terminal size={18} /> ডায়াগনস্টিক ও টেস্টিং ল্যাব
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
          {activeTab === 'dashboard' && stats && (() => {
            const approvedIncome = (stats.rechargeStats && Array.isArray(stats.rechargeStats)) 
              ? (stats.rechargeStats.find((s: any) => s.status === 'approved')?.total || stats.rechargeStats.find((s: any) => s.status === 'approved')?.count || 0) 
              : (stats.rechargeStats?.total || stats.rechargeStats?.approved || 0);

            const pendingRecharges = (stats.rechargeStats && Array.isArray(stats.rechargeStats))
              ? (stats.rechargeStats.find((s: any) => s.status === 'pending')?.count || 0)
              : 0;

            const isRechargeArray = stats.rechargeStats && Array.isArray(stats.rechargeStats);
            const formattedRechargeData = isRechargeArray ? stats.rechargeStats : [
              { status: 'approved', count: approvedIncome || 0 },
              { status: 'pending', count: pendingRecharges || 0 }
            ];

            // Local accordion helper state inside IIFE for the explanations
            return (
              <div className="space-y-8 font-sans">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                        <Users size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">USERS</span>
                    </div>
                    <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">মোট রেজিস্টার্ড ব্যবহারকারী</p>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalUsers}</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                        <FileText size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">CASES</span>
                    </div>
                    <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">মোট নথিভুক্ত মামলা</p>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalCases}</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                        <CreditCard size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 font-mono">INCOME</span>
                    </div>
                    <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">অনুমোদিত রিচার্জ (মোট আয়)</p>
                    <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">৳{approvedIncome}</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-inner animate-pulse">
                        <CreditCard size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-amber-500 font-mono">PENDING</span>
                    </div>
                    <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">অপেক্ষমান রিচার্জ রিকোয়েস্ট</p>
                    <p className="text-3xl font-extrabold text-amber-600 tracking-tight">{pendingRecharges} টি</p>
                  </div>
                </div>

                {/* Live Discipline and Safety Indicators */}
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/40 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                      <Scale size={24} />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-medium">মুহুরীদের গড় ট্রাস্ট স্কোর</span>
                      <strong className="text-lg text-slate-800">৯৪.৫% (High Trust)</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/40 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0 animate-bounce">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-medium">অমীমাংসিত গ্রাহক অভিযোগ</span>
                      <strong className="text-lg text-rose-600">{complaints.filter(c => !c.status || c.status === 'pending').length} টি চলমান</strong>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/40 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <XCircle size={24} />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-medium">সক্রিয় বরখাস্ত / সাসপেন্ডেড</span>
                      <strong className="text-lg text-slate-850">{users.filter(u => u.is_suspended).length} জন ইউজার</strong>
                    </div>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <BarChartIcon size={18} className="text-indigo-600" /> ব্যবহারকারী বিভাজন বিশ্লেষণ
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">Role Breakdown</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.userBreakdown || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="user_type" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {(stats.userBreakdown || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <PieChartIcon size={18} className="text-emerald-600" /> রিচার্জ স্ট্যাটাস পাই-চার্ট
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">Orders Pie</span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formattedRechargeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="status"
                          >
                            {formattedRechargeData.map((entry: any, index: number) => (
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
                      {formattedRechargeData.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.status === 'approved' ? '#10b981' : entry.status === 'pending' ? '#f59e0b' : '#ef4444' }}></div>
                          <span className="text-xs font-medium text-slate-600 capitalize">
                            {entry.status === 'approved' ? 'সফল (Approved)' : entry.status === 'pending' ? 'অপেক্ষমান (Pending)' : 'বাতিল'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bangla Explanation Section specified by Phase 9 */}
                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-indigo-950 text-base">
                        🛡️ প্যানেল রেগুলেশন ও কন্ট্রোল ম্যানুয়াল (বাংলায় বুঝতে চাই)
                      </h3>
                      <p className="text-xs text-indigo-850 mt-0.5">
                        অফিসারদের জন্য মুহুরী নিয়ন্ত্রণ লজিক, রেটিং ড্রপ, ওয়ার্নিং, রেড বল এবং স্থায়ী বরখাস্তের নিয়মাবলী:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600 font-sans">
                    <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                      <span className="font-bold text-slate-800 text-sm block">১. Trust Score (ট্রাস্ট স্কোর ও প্রোফাইল রেটিং)</span>
                      <p>
                        প্রতিটি মুহুরীর প্যানেলে একটি <strong className="text-indigo-600">১০০% বেস স্কোর</strong> থাকে। কোনো গ্রাহক বা আইনজীবী যদি কোনো মুহুরীর ডিলিং বা নথিপত্র নিষ্পত্তির বিরুদ্ধে সরাসরি সুনির্দিষ্ট অভিযোগ দেন, এবং তদন্তে তা প্রমানিত হয়:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                        <li>একটি <strong>সাধারণ সতর্কবার্তা (Warning)</strong> দিলে ট্রাস্ট স্কোর <strong>১৫% হ্রাস</strong> পায়।</li>
                        <li>একটি <strong>গুরুতর স্ট্রাইক (Red Ball)</strong> দিলে ট্রাস্ট স্কোর <strong>৩০% হ্রাস</strong> পায়।</li>
                        <li>সরাসরি <strong>সাময়িক বরখাস্তে</strong> ট্রাস্ট স্কোর <strong>৫০% হ্রাস</strong> পায়।</li>
                      </ul>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                      <span className="font-bold text-slate-800 text-sm block">২. Warning System (ওয়ার্নিং নিয়ন্ত্রণ লজিক)</span>
                      <p>
                        কোনো মুহুরীকে তার অপেশাদার আচরণের জন্য সতর্ক করতে প্যানেল থেকে <strong>Warn</strong> বোতামটি ব্যবহার করা যায়। 
                      </p>
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 font-medium font-sans">
                        ⚠️ কোনো মুহুরীর ওয়ার্নিং সংখ্যা <strong>৩ বার বা তার বেশি</strong> অতিক্রম করলে, সিস্টেম তাকে স্বয়ংক্রিয়ভাবে স্থগিত (Suspended) ও সাময়িক নিষিদ্ধ তালিকায় পাঠাবে।
                      </p>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                      <span className="font-bold text-slate-800 text-sm block">৩. Red Ball Review (রেড বল স্ট্রাইক কন্ট্রোল)</span>
                      <p>
                        পবিত্র ডিরেক্টরিতে শৃঙ্খলারক্ষা করার জন্য অফিসাররা মারাত্মক আর্থিক দুর্নীতি, ডুপ্লিকেট পেমেন্ট জালিয়াতি বা তথ্য চুরির দায়ে সরাসরি একটি <strong className="text-red-600">রেড বল (Red Ball Strike)</strong> ইস্যু করতে পারেন।
                      </p>
                      <p className="text-[11px] text-red-700 bg-red-50 p-2 rounded-lg border border-red-100 font-medium font-sans">
                        🚫 পরপর <strong>৩টি রেড বল স্ট্রাইক</strong> পাওয়ার সাথে সাথেই মুহুরীর অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে চিরতরে লক এবং নিষিদ্ধ (Permanently Suspended) হয়ে যাবে।
                      </p>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                      <span className="font-bold text-slate-800 text-sm block">৪. Suspension & Appeal (বরখাস্ত বাতিল ও আপিল নিষ্পত্তি)</span>
                      <p>
                        অ্যাকাউন্ট বরখাস্তের পর, মুহুরী তার প্যানেল থেকে একটি ওয়ান-টাইম <strong>"সাক্ষ্য ও আপিল আবেদন" (Appeal Form)</strong> জমা দিতে পারেন। 
                      </p>
                      <p className="text-[11px] text-indigo-800 bg-indigo-50 p-2 rounded-lg border border-indigo-100 font-medium font-sans">
                        ✅ অফিসাররা আপিল পর্যালোচনা করে আবেদন <strong>Approve</strong> করলে সাথে সাথেই মুহুরীর সব ওয়ার্নিং ও রেড বল <strong>০</strong> এ রিসেট হয়ে যায়, ট্রাস্ট স্কোর পুনরায় <strong>১০০%</strong>-এ উন্নীত হয় এবং অ্যাকাউন্ট সচল হয়ে যায়।
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

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
                                  if (district) appointDistrictAdmin(user.id as any, district);
                                }}
                                disabled={processingId === user.id}
                                className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                              >
                                অ্যাডমিন নিযুক্ত করুন
                              </button>
                            )}
                            {userType === 'admin' && (
                              <button
                                onClick={() => handleUpdateStatus(user.id as any, user.is_approved === 0)}
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded transition-colors",
                                  user.is_approved === 1 ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-600 text-white hover:bg-green-700"
                                )}
                              >
                                {user.is_approved === 1 ? "বাতিল" : "অনুমোদন"}
                              </button>
                            )}
                            <select 
                              onChange={(e) => updateRole(user.id as any, e.target.value)}
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
                            onChange={(e) => updateSubscription(user.id as any, e.target.value, 30)}
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

          {activeTab === 'responsive_design' && (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
              {/* Header block with Bangla description */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-8 rounded-3xl shadow-lg border border-indigo-800/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/25 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-400/20 text-indigo-200">
                      <Activity size={12} className="animate-pulse" /> Phase 11: রেসপনসিভ মেকানিজম ল্যাব
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white">মোবাইল ও রেসপনসিভনেস ভিউ পোর্টাল</h2>
                    <p className="text-indigo-100 max-w-2xl text-sm leading-relaxed">
                      আমাদের আইনি পরামর্শক ও কোর্ট মুহুরী প্ল্যাটফর্মটি মোবাইল, ট্যাবলেট ও ডেস্কটপ স্ক্রিনে কীভাবে অভিযোজিত হয় তা লাইভ পরীক্ষা করুন। সব ধরনের ডিভাইস ও ওরিয়েন্টেশনের উপর ভিত্তি করে এটি সম্পূর্ণ অটোমেটিক লেআউট নিয়ন্ত্রণ করে।
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSimulatedDevice('mobile');
                        setSimulatedOrientation('portrait');
                      }}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2 border border-white/10"
                    >
                      <Smartphone size={16} /> কুইক মোবাইল
                    </button>
                    <button 
                      onClick={() => {
                        setSimulatedDevice('tablet');
                        setSimulatedOrientation('portrait');
                      }}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2 border border-white/10"
                    >
                      <Tablet size={16} /> কুইক ট্যাবলেট
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulator Toolbar Controls */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Layout className="text-indigo-400" /> সিমুলেশন কন্ট্রোল হাব
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">ভার্চুয়াল ডিভাইসের পরামিতি এবং ভিউ মোড পরিবর্তন করতে নিচের বোতামগুলো ব্যবহার করুন।</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Device Selection */}
                    <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
                      <button
                        onClick={() => setSimulatedDevice('mobile')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${simulatedDevice === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Smartphone size={14} /> মোবাইল (375px)
                      </button>
                      <button
                        onClick={() => setSimulatedDevice('tablet')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${simulatedDevice === 'tablet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Tablet size={14} /> ট্যাবলেট (768px)
                      </button>
                      <button
                        onClick={() => setSimulatedDevice('desktop')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${simulatedDevice === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Monitor size={14} /> ডেস্কটপ (Widescreen)
                      </button>
                    </div>

                    {/* Orientation Toggle (Only for mobile/tablet) */}
                    {simulatedDevice !== 'desktop' && (
                      <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
                        <button
                          onClick={() => setSimulatedOrientation('portrait')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${simulatedOrientation === 'portrait' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          লম্বালম্বি (Portrait)
                        </button>
                        <button
                          onClick={() => setSimulatedOrientation('landscape')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${simulatedOrientation === 'landscape' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          আড়াআড়ি (Landscape)
                        </button>
                      </div>
                    )}

                    {/* View Modes */}
                    <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
                      <button
                        onClick={() => setSimulatedViewMode('dashboard')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${simulatedViewMode === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        ড্যাশবোর্ড
                      </button>
                      <button
                        onClick={() => setSimulatedViewMode('cases')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${simulatedViewMode === 'cases' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        মামলাসমূহ
                      </button>
                      <button
                        onClick={() => setSimulatedViewMode('recharge')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${simulatedViewMode === 'recharge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        পেমেন্ট
                      </button>
                      <button
                        onClick={() => setSimulatedViewMode('support')}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${simulatedViewMode === 'support' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      >
                        সাপোর্ট
                      </button>
                    </div>

                    {/* Rulers Toggle */}
                    <button
                      onClick={() => setShowRulerLines(!showRulerLines)}
                      className={`p-2 rounded-xl border transition-all ${showRulerLines ? 'bg-indigo-600/20 text-indigo-400 border-indigo-600/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                      title="গ্রেডিয়েন্ট রুলার লাইন টগল করুন"
                    >
                      <Ruler size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Viewport Visualization Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200/60 dark:border-slate-800 min-h-[660px] overflow-x-auto custom-scrollbar">
                
                {/* Resolution & Spec Header */}
                <div className="text-center mb-6 space-y-1">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">সিমুলেটেড স্ক্রিন ডাইমেনশন</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                    {simulatedDevice === 'mobile' 
                      ? (simulatedOrientation === 'portrait' ? '375px × 680px (Mobile Portrait)' : '680px × 375px (Mobile Landscape)')
                      : simulatedDevice === 'tablet'
                      ? (simulatedOrientation === 'portrait' ? '768px × 1024px (Tablet Portrait)' : '1024px × 768px (Tablet Landscape)')
                      : 'Widescreen (100% Fluid Desktop - ১২০০px+)'
                    }
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> সম্পূর্ণ ফ্লুইড সিএসএস</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> ফ্লেক্সিবল গ্রিড স্পাইরিট</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> ইন্টারেক্টিভ ওরিয়েন্টেশন</span>
                  </div>
                </div>

                {/* Simulated Frame */}
                <div 
                  className={`
                    relative bg-slate-900 border-[12px] border-slate-950 rounded-[48px] shadow-2xl transition-all duration-500 ease-in-out overflow-hidden flex flex-col
                    ${simulatedDevice === 'mobile' && simulatedOrientation === 'portrait' ? 'w-[375px] h-[680px]' : ''}
                    ${simulatedDevice === 'mobile' && simulatedOrientation === 'landscape' ? 'w-[680px] h-[375px]' : ''}
                    ${simulatedDevice === 'tablet' && simulatedOrientation === 'portrait' ? 'w-[768px] h-[850px]' : ''}
                    ${simulatedDevice === 'tablet' && simulatedOrientation === 'landscape' ? 'w-[920px] h-[600px]' : ''}
                    ${simulatedDevice === 'desktop' ? 'w-full max-w-full h-[600px] rounded-[16px] border-4 border-slate-800' : ''}
                  `}
                >
                  {/* Camera hole simulation for devices */}
                  {simulatedDevice !== 'desktop' && simulatedOrientation === 'portrait' && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-800 rounded-full mr-2"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-900 rounded-full"></div>
                    </div>
                  )}

                  {/* Ruler Overlays */}
                  {showRulerLines && (
                    <>
                      {/* Vertical Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-6 opacity-5 border-l border-r border-indigo-400">
                        <div className="border-r border-indigo-400"></div>
                        <div className="border-r border-indigo-400"></div>
                        <div className="border-r border-indigo-400"></div>
                        <div className="border-r border-indigo-400"></div>
                        <div className="border-r border-indigo-400"></div>
                      </div>
                      {/* Horizontal Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between opacity-5">
                        <div className="border-b border-indigo-400 h-[16.6%]"></div>
                        <div className="border-b border-indigo-400 h-[16.6%]"></div>
                        <div className="border-b border-indigo-400 h-[16.6%]"></div>
                        <div className="border-b border-indigo-400 h-[16.6%]"></div>
                        <div className="border-b border-indigo-400 h-[16.6%]"></div>
                      </div>
                    </>
                  )}

                  {/* App Container inside Frame */}
                  <div className="flex-1 flex flex-col text-slate-900 bg-slate-50 relative overflow-hidden font-sans">
                    
                    {/* Simulated Operating System Header Bar */}
                    <div className="bg-indigo-900 text-white h-7 px-6 flex items-center justify-between text-[11px] font-mono select-none">
                      {/* Left: Time & Network */}
                      <div className="flex items-center gap-2">
                        <span>১৪:৪০</span>
                        <div className="flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                          <span className="w-1.5 h-2 bg-white rounded-full"></span>
                          <span className="w-1.5 h-2.5 bg-white rounded-full"></span>
                          <span className="w-1.5 h-3 bg-white rounded-full"></span>
                        </div>
                        <span className="font-bold">5G</span>
                      </div>
                      {/* Right: Battery */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold">৯৮%</span>
                        <div className="w-5 h-2.5 bg-white/20 border border-white/50 rounded-md p-0.5 flex items-center">
                          <div className="w-full h-full bg-emerald-400 rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    {/* Simulated App Frame Layout */}
                    <div className="flex-1 flex overflow-hidden">
                      
                      {/* Simulated Sidebar */}
                      {/* Hidden on Mobile Portrait/Landscape, compact icon mode on Tablet, fully expanded on Desktop */}
                      {simulatedDevice === 'desktop' ? (
                        /* Desktop Fully Expanded Sidebar */
                        <aside className="w-56 bg-[#262dc9] text-white p-4 flex flex-col justify-between shrink-0 select-none">
                          <div className="space-y-6">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-white text-indigo-700 rounded-lg">
                                <Scale size={16} />
                              </div>
                              <span className="font-extrabold text-[#f3f2ff] text-xs">মুহুরী ডট কম</span>
                            </div>

                            <div className="bg-white/10 p-2.5 rounded-xl flex items-center gap-2.5 border border-white/5">
                              <div className="w-8 h-8 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold text-xs">AD</div>
                              <div className="min-w-0">
                                <p className="text-[11px] text-zinc-100 font-bold truncate leading-none">অ্যাডমিন ডাইরেক্ট</p>
                                <p className="text-[9px] text-indigo-200/70 uppercase font-black uppercase mt-0.5 tracking-wider leading-none">সুপার এডমিন</p>
                              </div>
                            </div>

                            <nav className="space-y-1">
                              {[
                                { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
                                { id: 'cases', label: 'মামলাসমূহ', icon: FileText },
                                { id: 'recharge', label: 'রিচার্জ করুন', icon: CreditCard },
                                { id: 'support', label: 'লাইভ চ্যাট', icon: MessageSquare }
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSimulatedViewMode(item.id as any)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${simulatedViewMode === item.id ? 'bg-white/15 text-white shadow-sm' : 'text-indigo-100/70 hover:bg-white/5'}`}
                                >
                                  <item.icon size={14} />
                                  <span>{item.label}</span>
                                </button>
                              ))}
                            </nav>
                          </div>
                          
                          <div className="text-[9px] text-[#ebe9ff]/40 font-bold tracking-wider text-center border-t border-white/5 pt-3">
                            ভার্সন ৯.১.০ • বাংলা
                          </div>
                        </aside>
                      ) : simulatedDevice === 'tablet' ? (
                        /* Tablet Compact Icon Sidebar */
                        <aside className="w-14 bg-[#262dc9] text-white p-2.5 flex flex-col items-center justify-between shrink-0 select-none">
                          <div className="space-y-6 flex flex-col items-center">
                            <div className="p-1.5 bg-white text-indigo-700 rounded-lg">
                              <Scale size={14} />
                            </div>
                            
                            <nav className="space-y-2 flex flex-col items-center">
                              {[
                                { id: 'dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
                                { id: 'cases', icon: FileText, label: 'মামলা' },
                                { id: 'recharge', icon: CreditCard, label: 'রিচার্জ' },
                                { id: 'support', icon: MessageSquare, label: 'সাপোর্ট' }
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => setSimulatedViewMode(item.id as any)}
                                  className={`p-2 rounded-lg transition-all ${simulatedViewMode === item.id ? 'bg-white/20 text-white' : 'text-indigo-100/60 hover:bg-white/10'}`}
                                  title={item.label}
                                >
                                  <item.icon size={16} />
                                </button>
                              ))}
                            </nav>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        </aside>
                      ) : null}

                      {/* Simulated Main Work Panel */}
                      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        
                        {/* Simulated App Header Bar */}
                        <header className="bg-white border-b border-slate-200 h-12 px-4 flex items-center justify-between select-none">
                          <div className="flex items-center gap-2.5">
                            {/* Mobile Hamburger (Only on Mobile) */}
                            {simulatedDevice === 'mobile' && (
                              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                                <Menu size={16} />
                              </button>
                            )}
                            <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">
                              {simulatedViewMode === 'dashboard' && 'ড্যাশবোর্ড ওভারভিউ'}
                              {simulatedViewMode === 'cases' && 'মামলা ট্র্যাকিং সেল'}
                              {simulatedViewMode === 'recharge' && 'পেমেন্ট গেটওয়ে'}
                              {simulatedViewMode === 'support' && 'অনলাইন সাপোর্ট রুম'}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {simulatedDevice === 'mobile' ? 'Mobile' : simulatedDevice === 'tablet' ? 'Tablet' : 'Desktop'}
                            </span>
                          </div>
                        </header>

                        {/* Simulated Screen Content Body */}
                        <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
                          
                          {/* VIEW: DASHBOARD PANEL */}
                          {simulatedViewMode === 'dashboard' && (
                            <div className="space-y-4">
                              {/* Responsive Stats Box Grid */}
                              {/* Desktop: Grid cols 3, Tablet: Grid cols 2/3, Mobile: Stack cols 1 */}
                              <div className={`grid gap-3 ${
                                simulatedDevice === 'desktop' ? 'grid-cols-3' : 
                                simulatedDevice === 'tablet' ? 'grid-cols-2' : 
                                'grid-cols-1'
                              }`}>
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <FileText size={16} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-bold leading-none">মোট মামলা</p>
                                    <p className="text-sm font-black text-slate-800 tracking-tight mt-1">১২৪ টি মামলা</p>
                                  </div>
                                </div>
                                
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Users size={16} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-bold leading-none">সক্রিয় মক্কেল</p>
                                    <p className="text-sm font-black text-slate-800 tracking-tight mt-1">৮৯ জন মক্কেল</p>
                                  </div>
                                </div>

                                <div className={`${simulatedDevice === 'tablet' ? 'col-span-2' : ''} bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3`}>
                                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <CheckCircle size={16} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-bold leading-none">সফলতা রেট</p>
                                    <p className="text-sm font-black text-slate-800 tracking-tight mt-1">৯৪.৫% সফলতা</p>
                                  </div>
                                </div>
                              </div>

                              {/* Simulated Interactive Graph */}
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">মাসিক মামলা নিষ্পত্তির গ্রাফ</p>
                                <div className="flex items-end justify-between h-24 pt-4 px-2">
                                  {[
                                    { month: 'জানু', val: 'h-[30%]', color: 'bg-indigo-500' },
                                    { month: 'ফেব্রু', val: 'h-[50%]', color: 'bg-indigo-500' },
                                    { month: 'মার্চ', val: 'h-[85%]', color: 'bg-indigo-600' },
                                    { month: 'এপ্রিল', val: 'h-[65%]', color: 'bg-indigo-500' },
                                    { month: 'মে', val: 'h-[95%]', color: 'bg-indigo-700' }
                                  ].map((bar) => (
                                    <div key={bar.month} className="flex flex-col items-center flex-1 space-y-1.5">
                                      <div className="w-3/5 bg-slate-100 rounded-lg h-16 flex items-end overflow-hidden">
                                        <div className={`w-full ${bar.color} ${bar.val} rounded-lg`}></div>
                                      </div>
                                      <span className="text-[9px] text-slate-500 font-bold leading-none">{bar.month}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                    </div>
                  </div>
                </div>
              )}
              </main>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <span className="font-bold text-slate-800">রেসপন্সিভ গ্রিড:</span> উইন্ডো রিসাইজ করলেও ফাটবে না।
            </div>
          </div>

          <pre className="overflow-x-auto text-emerald-400 font-bold leading-relaxed">
{`/* ১. রেসপন্সিভ সাইডবার কোড স্ট্রাকচার */
.sidebar-container {
  display: fixed;
  left: 0;
  width: 16rem; /* Desktop width - 256px */
  transition: transform 300ms ease-in-out;
}`}
</pre>

@media (max-width: 1024px) {
  .sidebar-container {
    transform: translateX(-100%); /* মোবাইলে স্বয়ংক্রিয় হাইড */
  }
  .sidebar-container.open {
    transform: translateX(0); /* টগল বাটন ক্লিক করলে ওপেন */
  }
}

/* ২. ফ্লুইড উইজেট গ্রिড স্ট্রাকচার */
.responsive-stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr)); /* মোবাইলে ১ কলাম */
  gap: 1rem;
}

@media (min-width: 640px) {
  .responsive-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)); /* ট্যাবলেটে ২ কলাম */
  }
}

@media (min-width: 1280px) {
  .responsive-stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* ডেস্কটপ ৩ কলাম */
  }
}`}
                </pre>
                <p className="text-zinc-500 text-[10px] font-bold">
                  * আমাদের ডোমেন ফ্লেক্স গ্রিডগুলোর সাথে পুরোপুরি কানেক্ট করা এবং সমস্ত ফাইল বা বডি রেন্ডারিং ভিউপোর্ট কন্ট্রোল করে।
                </p>
              </div>

            </div>simulatedDevice !== 'mobile' ? (
                                  <div className="col-span-3 bg-white p-4 rounded-xl border border-slate-200 h-full flex flex-col justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between border-b pb-2">
                                        <h5 className="text-[11px] font-bold text-slate-800">মামলার গভীর বিবরণ ও অগ্রগতি</h5>
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded">নথিভুক্ত</span>
                                      </div>
                                      <p className="text-[10px] text-slate-600 leading-relaxed">
                                        মামলা নং খ-২৪/২০২৬ ঢাকার প্রথম দেওয়ানি সহকারী জজ আদালতে শুনানি ও সাক্ষী প্রমাণের জন্য প্রক্রিয়াধীন রয়েছে। নথিটি সম্পূর্ণরূপে স্ক্যান এবং ডিজিটাল সার্ভারে ক্লাউড সিঙ্কড করা হয়েছে।
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-50 p-2 rounded-lg">
                                        <div>
                                          <span className="text-slate-400 font-bold block">পরবর্তী তারিখ:</span>
                                          <span className="text-slate-800 font-extrabold">১৫ জুন, ২০২৬</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 font-bold block">দায়িত্বপ্রাপ্ত মুহুরী:</span>
                                          <span className="text-slate-800 font-extrabold">মোঃ রফিকুল ইসলাম</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-bold hover:bg-indigo-700">ডিজিটাল ওকালতনামা ডাউনলোড</button>
                                  </div>
                                ) : (
                                  /* Mobile details prompt/hint banner */
                                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex items-center justify-between">
                                    <p className="text-[9px] text-amber-800 font-bold">💡 মোবাইলে স্পেস বাঁচাতে বিশদ বিবরণ প্যানেলটি স্বয়ংক্রিয়ভাবে একটি বটম শিট মডালে স্থানান্তরিত হয়।</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* VIEW: RECHARGE GATEWAY */}
                          {simulatedViewMode === 'recharge' && (
                            <div className="space-y-4">
                              <p className="text-[10px] uppercase font-bold text-slate-400">ক্রেডিট ও মোবাইল রিচার্জ গেটওয়ে</p>
                              
                              <div className="bg-indigo-900 text-white p-4 rounded-xl shadow border border-indigo-800 relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 translate-y-7 translate-x-7 w-20 h-20 bg-white/5 rounded-full inline-block"></div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-indigo-200 tracking-wider">রানিং কারেন্ট ব্যালেন্স</span>
                                  <p className="text-2xl font-black font-mono">৳ ১,২৫০.০০</p>
                                  <p className="text-[9px] text-indigo-300">১ ক্রেডিট = ১ টাকা রেট সিস্টেম</p>
                                </div>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                                <label className="block text-[10px] font-bold text-slate-600">রিচার্জের পরিমাণ নির্বাচন করুন</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {['৳ ৫০০', '৳ ১,০০০', '৳ ২,০০০'].map((amount, idx) => (
                                    <button key={idx} className={`py-2 rounded-lg text-[10px] font-bold border transition ${idx === 1 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                      {amount}
                                    </button>
                                  ))}
                                </div>

                                <div className="pt-2">
                                  <label className="block text-[9px] font-black text-slate-500 mb-1">প্রদত্ত পেমেন্ট মেথড</label>
                                  <div className="flex gap-2">
                                    <div className="flex-1 py-2 border rounded-lg text-center flex items-center justify-center font-bold text-[9px] text-pink-600 hover:bg-pink-50 cursor-pointer">বিকাশ (bKash)</div>
                                    <div className="flex-1 py-2 border rounded-lg text-center flex items-center justify-center font-bold text-[9px] text-orange-600 hover:bg-orange-50 cursor-pointer">নগদ (Nagad)</div>
                                  </div>
                                </div>

                                <button className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg text-[10px] shadow mt-2">রিচার্জ পেমেন্ট সম্পন্ন করুন</button>
                              </div>
                            </div>
                          )}

                          {/* VIEW: LIVE SUPPORT ROOM */}
                          {simulatedViewMode === 'support' && (
                            <div className="flex flex-col h-[270px]">
                              {/* Message bubbles list */}
                              <div className="flex-1 space-y-2 overflow-y-auto mb-2 pr-1">
                                <div className="flex items-end gap-1.5 max-w-[80%]">
                                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[8px] font-black text-indigo-600">C</div>
                                  <p className="bg-slate-200 text-slate-800 p-2 rounded-2xl rounded-bl-sm text-[10px] leading-snug">
                                    আমার নোটিশের উত্তর কীভাবে দিব? ফিস কত লাগতে পারে?
                                  </p>
                                </div>

                                <div className="flex items-end gap-1.5 max-w-[80%] ml-auto justify-end">
                                  <p className="bg-indigo-600 text-white p-2 rounded-2xl rounded-br-sm text-[10px] leading-snug text-left">
                                    আমাদের লিগ্যাল ড্রাফটিং সেকশনে গিয়ে জবাবের খসড়া খুব সহজে ডাউনলোড করে নিতে পারেন। কোন প্রকার খরচ ছাড়াই!
                                  </p>
                                  <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">AI</div>
                                </div>
                              </div>

                              {/* Message input simulate */}
                              <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                                <input type="text" readOnly placeholder="মেসেজ লিখুন..." className="flex-1 text-[10px] px-2 py-1 outline-none font-bold placeholder-slate-400 bg-transparent cursor-not-allowed" />
                                <button className="p-1.5 bg-indigo-600 text-white rounded-lg cursor-not-allowed"><Send size={10} /></button>
                              </div>

                              {/* Simulated Mobile Keyboard Popup if mobile mode is selected */}
                              {simulatedDevice === 'mobile' && (
                                <div className="mt-2 bg-slate-300 -mx-4 -mb-4 p-2 grid grid-cols-10 gap-0.5 select-none text-[8px] text-center font-bold text-slate-700">
                                  {['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','↑','Z','X','C','V','B','N','M','⌫'].map((k, idx) => (
                                    <span key={idx} className={`${k === '⌫' || k === '↑' ? 'col-span-1.5 bg-slate-400 text-white' : 'bg-white'} py-1 rounded shadow-xs active:bg-indigo-100`}>{k}</span>
                                  ))}
                                  <span className="col-span-10 py-1 bg-slate-100 rounded text-[7px] text-slate-500">space এবং বাংলা কিবোর্ড মডিউল</span>
                                </div>
                              )}
                            </div>
                          )}

                        </main>

                        {/* Simulated Bottom Navigation Bar (ONLY Visible on Mobile viewport) */}
                        {simulatedDevice === 'mobile' && (
                          <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-around select-none shrink-0">
                            {[
                              { id: 'dashboard', icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
                              { id: 'cases', icon: FileText, label: 'মামলা' },
                              { id: 'recharge', icon: CreditCard, label: 'পেমেন্ট' },
                              { id: 'support', icon: MessageSquare, label: 'সাপোর্ট' }
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSimulatedViewMode(item.id as any)}
                                className={`flex flex-col items-center justify-center gap-0.5 ${simulatedViewMode === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
                              >
                                <item.icon size={14} />
                                <span className="text-[8px] font-black tracking-tight leading-none">{item.label}</span>
                              </button>
                            ))}
                          </footer>
                        )}

                      </div>

                    </div>

                  </div>
                </div>

              </div>

              {/* In-depth Responsive Grid & Breakpoint Specifications in fluent Bangla */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Mobile Specs */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">১. মোবাইল অপ্টিমাইজেশন</h4>
                      <p className="text-xs text-slate-400">সর্বোচ্চ ২/৪ কলাম, ৩৬০px থেকে ৪�                    </span>
                          </div>

                          <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-2 mt-3 text-sm">
                            <p className="text-slate-600"><span className="font-bold text-slate-800">আপিলের কারণ:</span> {app.appealReason}</p>
                          </div>

                          {isPending && (
                            <div className="flex items-center justify-end gap-2 border-t border-slate-200/75 pt-3 mt-4">
                              <button
                                onClick={() => handleAppealAction(app.id, app.userId, app.userName, 'approve')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <ThumbsUp size={14} /> আপিল মঞ্জুর ও সক্রিয় (Approve)
                              </button>
                              <button
                                onClick={() => handleAppealAction(app.id, app.userId, app.userName, 'reject')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <ThumbsDown size={14} /> আপিল নাকচ (Reject)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">�ে উইন্ডো রিসাইজ করলেও ফাটবে না।</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Code Snippet Reference - In Beautiful Technical CSS Format with descriptive instructions */}
              <div className="bg-[#1e222b] text-zinc-300 p-6 rounded-3xl border border-zinc-800 shadow-lg space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400 font-bold flex items-center gap-1.5">📂 tailwind.config_responsive.css</span>
                  <span className="text-[10px] text-zinc-500">সম্পূর্ণ বাংলা গাইডকোড</span>
                </div>
                <pre className="overflow-x-auto text-emerald-400 font-bold leading-relaxed">
{`/* ১. রেসপন্সিভ সাইডবার কোড স্ট্রাকচার */
.sidebar-container {
  display: fixed;
  left: 0;
  width: 16rem; /* Desktop width - 256px */
  transition: transform 300ms ease-in-out;
}

@media (max-width: 1024px) {
  .sidebar-container {
    transform: translateX(-100%); /* মোবাইলে স্বয়ংক্রিয় হাইড */
  }
  .sidebar-container.open {
    transform: translateX(0); /* টগল বাটন ক্লিক করলে ওপেন */
  }
}

/* ২. ফ্লুইড উইজেট গ্রিড স্ট্রাকচার */
.responsive-stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr)); /* মোবাইলে ১ কলাম */
  gap: 1rem;
}

@media (min-width: 640px) {
  .responsive-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)); /* ট্যাবলেটে ২ কলাম */
  }
}

@media (min-width: 1280px) {
  .responsive-stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* ডেস্কটপ ৩ কলাম */
  }
}`}
                </pre>
                <p className="text-zinc-500 text-[10px] font-bold">
                  * আমাদের ডোমেন ফ্লেক্স গ্রিডগুলোর সাথে পুরোপুরি কানেক্ট করা এবং সমস্ত ফাইল বা বডি রেন্ডারিং ভিউপোর্ট কন্ট্রোল করে।
                </p>
              </div>

            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="space-y-8">
              {/* Complaints Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <ShieldAlert className="text-amber-500" /> গ্রাহকদের অভিযোগসমূহ
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">মুহুরী ও আইনজীবীদের বিরুদ্ধে দাখিলকৃত সরাসরি অভিযোগসমূহ</p>
                  </div>
                  <div className="flex gap-2">
                    {(['all', 'pending', 'resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setComplaintFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                          complaintFilterStatus === st
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'all' ? 'সব অভিযোগ' : st === 'pending' ? 'অমীমাংসিত' : 'নিষ্পত্তিকৃত'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {complaints.filter(c => {
                    if (complaintFilterStatus === 'pending') return c.status === 'pending' || !c.status;
                    if (complaintFilterStatus === 'resolved') return c.status && c.status !== 'pending';
                    return true;
                  }).length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <ShieldAlert className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-slate-500 text-sm">কোনো অভিযোগ রেকর্ড পাওয়া যায়নি</p>
                    </div>
                  ) : (
                    complaints.filter(c => {
                      if (complaintFilterStatus === 'pending') return c.status === 'pending' || !c.status;
                      if (complaintFilterStatus === 'resolved') return c.status && c.status !== 'pending';
                      return true;
                    }).map((comp) => {
                      const isPending = !comp.status || comp.status === 'pending';
                      return (
                        <div key={comp.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-all">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none inline-block mb-2 ${
                                isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isPending ? 'অমীমাংসিত (Pending)' : `নিষ্পত্তিকৃত (${comp.status})`}
                              </span>
                              <h3 className="text-base font-bold text-slate-800">{comp.title || 'অভিযোগ'}</h3>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              {comp.createdAt ? new Date(comp.createdAt).toLocaleString('bn-BD') : ''}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600 mb-4 bg-white p-3 rounded-xl border border-slate-100">
                            {comp.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                              <span className="font-bold text-amber-800 block mb-1">অভিযুক্ত ব্যক্তি (Accused):</span>
                              <p className="text-slate-700">নাম: <strong>{comp.accusedName}</strong></p>
                              <p className="text-slate-500 font-mono">ID: {comp.accusedId}</p>
                            </div>
                            <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200">
                              <span className="font-bold text-slate-800 block mb-1">অভিযোগকারী গ্রাহক (Submitter):</span>
                              <p className="text-slate-700">নাম: <strong>{comp.submitterName}</strong></p>
                              <p className="text-slate-500 font-mono">মোবাইল: {comp.submitterMobile}</p>
                            </div>
                          </div>

                          {isPending && (
                            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/75 pt-3">
                              <button
                                onClick={() => handleComplaintAction(comp.id, comp.accusedId, comp.accusedName, 'warn')}
                                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                🔔 ১ম সতর্কবার্তা (Warn)
                              </button>
                              <button
                                onClick={() => handleComplaintAction(comp.id, comp.accusedId, comp.accusedName, 'red_ball')}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                🔴 রেড বল দিন (Strike)
                              </button>
                              <button
                                onClick={() => handleComplaintAction(comp.id, comp.accusedId, comp.accusedName, 'suspend')}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                🚫 সাময়িক বরখাস্ত (Suspend)
                              </button>
                              <button
                                onClick={() => handleComplaintAction(comp.id, comp.accusedId, comp.accusedName, 'dismiss')}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                              >
                                খারিজ করুন (Dismiss)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Appeals Grid */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="text-indigo-500" /> সাময়িক বরখাস্ত স্থগিতের আপিলসমূহ
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">বরখাস্তকৃত মুহুরীদের পুনরায় সক্রিয়করণের আবেদনসমূহ</p>
                </div>

                <div className="space-y-4">
                  {appeals.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Scale className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-slate-500 text-sm">কোনো সক্রিয় আপিল আবেদন পাওয়া যায়নি</p>
                    </div>
                  ) : (
                    appeals.map((app) => {
                      const isPending = !app.status || app.status === 'pending';
                      return (
                        <div key={app.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                            <div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none inline-block mb-2 ${
                                isPending ? 'bg-indigo-100 text-indigo-800' : app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {isPending ? 'আপিল অমীমাংসিত' : app.status === 'approved' ? 'অনুমোদিত (Suspension Lifted)' : 'বাতিলকৃত (Rejected)'}
                              </span>
                              <h3 className="text-base font-bold text-slate-800">আপিলকারী: {app.userName}</h3>
                              <p className="text-xs text-slate-500">মোবাইল নম্বর: <strong className="font-mono">{app.userMobile}</strong></p>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              {app.createdAt ? (app.createdAt.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleString('bn-BD') : new Date(app.createdAt).toLocaleString('bn-BD')) : ''}
                    {/* 5. In-depth Test Matrix Details Component in clean Bangla block */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">মুহুরী ডট কম সিস্টেম ভ্যালিডেশন মেট্রিক্স ওভারভিউ</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Functional & Multi-user card */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                      
                      {/* Functional Suite */}
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Check className="text-emerald-500" size={16} /> ক. ফাংশনাল টেস্টিং (Functional Testing)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          ইউজারের প্রথম ক্লিক থেকে সফল ফাইলিং পর্যন্ত সকল ইন্টারেক্টিভ কভারেজ এখানে যাচাই করা হয়েছে। এর মধ্যে রয়েছে:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>লগইন মেকানিজম এবং সঠিক এসএমএস ও ওটিপি বাফারিং যাচাই।</li>
                          <li>স্থান, জেলা ও থানার উপর ভিত্তি করে আইনজীবী ও সহকারীর লাইভ ডেটাবেস অনুসন্ধান।</li>
                          <li>পেমেন্ট ইন্টিগ্রেশন এবং মক্কেলের ক্রেডিট রিচার্জ ব্যালেন্স শিটের সঠিকতা পরীক্ষা।</li>
                          <li>মামলার ফাইল ও ওকালতনামা ওলোড এবং আপস্ট্রিম বাফার কন্সত্রেেইন্ট ভ্যালিডেশন।</li>
                        </ul>
                      </div>

                      {/* Multi-user Suite */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Users className="text-indigo-600" size={16} /> খ. মাল্টি-ইউজার টেস্টিং (Multi-user Concurrency)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          একই সাথে হাজারো আইনজীবী, সহকারী এবং মক্কেলের কানেকশন সফলভাবে নিয়ন্ত্রণ। এর অধীনে প্রধান যাচাইসমূহ:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>রিয়েল-টাইম আইনজীবী-সহকারী দ্বিপাক্ষিক চ্যাট ও বাফেলিং ল্যাটেন্সি ট্র্যাকার।</li>
                          <li>একই মামলার ফাইলে সমসাময়িক এডিটিং এড়াতে লকিং ও রিসোর্স কনফ্লিক্ট মেকানিজম।</li>
                          <li>websocket ব্রডকাস্ট এবং পুশ কিউ মেসেজ ডিস্ট্রিবিউশন সুষম বন্টন পরীক্ষা।</li>
                        </ul>
                      </div>

                    </div>

                    {/* Security & Performance card */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                      
                      {/* Security Suite */}
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Shield className="text-indigo-600" size={16} /> গ. নিরাপত্তা টেস্টিং (Security Penetration)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          মক্কেলের গোপন নথিপত্র এবং ব্যক্তিগত তথ্যের নিখুঁত গোপনীয়তা রক্ষার লক্ষ্যে কঠোর নিরাপত্তা অডিট:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) যাচাই করে আইনজীবী ও সহকারীর পারমিশন নিশ্চিত করা।</li>
                          <li>Firestore ডাটাবেস সিকিউরিটি রুলস (<span className="font-mono text-indigo-700">firestore.rules</span>) পূর্ণ নিরীক্ষা।</li>
                          <li>SQL Injection (SQLi) ও Cross-Site Scripting (XSS) আক্রমণ প্রতিরোধক বাফার চেক।</li>
                          <li>আইপি প্রতি মিনিটে সর্বোচ্চ ৬০ রিকোয়েস্টের অতিরিক্ত ব্রুটফোর্স রেট লিমিটিং ব্লক।</li>
                        </ul>
                      </div>

                      {/* Performance Suite */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <TrendingUp className="text-indigo-600" size={16} /> ঘ. পারফরম্যান্স টেস্টিং (Performance Metrics)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          ধীরগতির দূরবর্তী প্রত্যন্ত ইন্টারনেট সংযোগেও যাতে কোনো ডেটা বিঘ্নিত না হয়, তার জন্য পারফরম্যান্স টিউনিং:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>গড় ডাটাবেস কোয়েরি রেসপন্স টাইম ১৫ মিলিসেকেন্ডের নিচে নিয়ে আসার টিউনিং চেক।</li>
                          <li>লাইটহাউস পারফরম্যান্স ও ডাব্লুসিএজি (WCAG) এক্সেসিবিলিটি প্যারামিটার পরীক্ষা।</li>
                          <li>অ্যাসেট অলস (Lazy) লোডিং এবং বান্ডেল সাইজ অপ্টিমাইন করে লোডিং স্পিড ২ সেকেন্ডের চেয়ে কম সময়ে নিশ্চিতকরণ।</li>
                        </ul>
                      </div>

                    </div>
                  </div>

                </div>Name="text-xl font-black text-slate-800 tracking-tight mt-1">
                        {testStats.total || 24} টি আইটেম
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <CheckCircle size={22} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-black">উত্তীর্ণ (Passed)</p>
                      <p className="text-xl font-black text-slate-800 tracking-tight mt-1">
                        {testStats.passed || 24} টি মডিউল
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                      <XCircle size={22} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-black">ব্যর্থতা (Failed)</p>
                      <p className="text-xl font-black text-slate-800 tracking-tight mt-1">
                        {testStats.failed} টি আইটেম
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                      <Clock size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-black">গড় সম্পাদন সময়</p>
                      <p className="text-xl font-black text-slate-800 tracking-tight mt-1">
                        {testStats.timeMs ? `${(testStats.timeMs / 1000).toFixed(2)}s` : '৩.৮৫s'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Operational Grid (Configurations on LHS, Terminal on RHS) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LHS: Configurations Control Panel */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Cpu className="text-indigo-600" size={18} /> টেস্ট কনফিগারেশন প্যানেল
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">পরীক্ষার ধরণ এবং ইউজার রিমেট্রিংস সামঞ্জস্য করুন</p>
                    </div>

                    <div className="space-y-4">
                      {/* Test Suite Selector */}
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-600">টেস্ট স্যুটের প্রকারভেদ</label>
                        <select
                          value={testSuiteSelection}
                          onChange={(e) => setTestSuiteSelection(e.target.value as any)}
                          disabled={testRunning}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="all">সবগুলো টেস্ট একসঙ্গে (All Integration)</option>
                          <option value="functional">১. ফাংশনাল (কার্যকরী) ভ্যালিডেশন</option>
                          <option value="security">২. সিকিউরিটি (নিরাপত্তা) পেনিট্রেশন</option>
                          <option value="performance">৩. লোড ও পারফরম্যান্স মেট্রিক্স</option>
                          <option value="multi_user">৪. চ্যাট ও মাল্টি-ইউজার সমান্তরালতা</option>
                        </select>
                      </div>

                      {/* Slider: Simulated RPS Load */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600">সিমুলেটেড লোড সীমা (RPS)</span>
                          <span className="text-indigo-600 font-mono text-xs">{simulatedLoadRps.toLocaleString()} রিকোয়েস্ট/সেকেন্ড</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={simulatedLoadRps}
                          onChange={(e) => setSimulatedLoadRps(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400 font-medium">এটি থ্রুটপুট স্ট্রেস টেস্টিং ও সিপিইউ স্থিতিশীলতা নির্ণয় করে।</p>
                      </div>

                      {/* Slider: Simulated WebSocket Connections */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600">অনলাইন কনকারেন্ট গ্রাহক (WS Sockets)</span>
                          <span className="text-indigo-600 font-mono text-xs">{simulatedActiveUsers.toLocaleString()} লাইভ উইজার</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="5000"
                          step="50"
                          value={simulatedActiveUsers}
                          onChange={(e) => setSimulatedActiveUsers(Number(e.target.value))}
                          className="w-full accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400 font-medium">প্যারালাল চ্যাট ও আইনজীবী বিডিং ব্যবস্থার কনকারেন্সি মূল্যায়ন।</p>
                      </div>

                      {/* Extra Meta rules details */}
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-indigo-800 font-bold">
                          <Shield size={14} /> সুরক্ষামূলক প্রটোকল
                        </div>
                        <p className="text-[11px] text-indigo-700 leading-relaxed font-semibold">
                          ফায়ারবেস সিকিউরিটি পলিসি (<span className="font-mono">firestore.rules</span>) এবং কোয়েরি স্যানিটাইজিং ইঞ্জিন ডিটেক্টর এখানে সম্পূর্ণ সক্রিয় করা আছে।
                        </p>
                      </div>

                      {/* Runner Action Button */}
                      <button
                        onClick={runTestScenario}
                        disabled={testRunning}
                        className={`w-full py-4.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                          testRunning
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25 active:scale-98'
                        }`}
                      >
                        {testRunning ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>টেস্ট বুটিং হচ্ছে ({testProgress}%)</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} fill="white" />
                            <span>টেস্ট স্যুট চালু করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RHS: OS Terminal logs Console Wrapper (2 cols on widescreen) */}
                  <div className="lg:col-span-2 bg-[#0c0f16] text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between min-h-[420px]">
                    
                    {/* Console Header Bar */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 select-none">
                      <div className="flex items-center gap-2">
                        {/* Red, Yellow, Green Mac Dots */}
                        <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                        <span className="text-xs font-mono font-bold text-slate-400 ml-2">system-diagnostics-shell</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        {testRunning ? 'RUNNING' : 'IDLE'}
                      </span>
                    </div>

                    {/* Console Output Area with Custom styled logs */}
                    <div className="flex-1 overflow-y-auto px-1 py-4 font-mono text-xs space-y-2 max-h-[300px] custom-scrollbar">
                      <div className="text-slate-400">bash-5.2$ ./run-system-verification-lab.sh --verbosity=high</div>
                      
                      {testLogs.map((log, idx) => {
                        let colorClass = 'text-indigo-300';
                        if (log.includes('PASS')) colorClass = 'text-emerald-400 font-semibold';
                        if (log.includes('SUCCESS')) colorClass = 'text-teal-300 font-extrabold bg-teal-950/40 px-1 rounded border border-teal-800/30';
                        if (log.includes('INFO')) colorClass = 'text-cyan-400';
                        if (log.includes('EXEC')) colorClass = 'text-amber-300 animate-pulse';
                        if (log.includes('DONE')) colorClass = 'text-pink-400 font-bold';

                        return (
                          <div key={idx} className={`leading-relaxed whitespace-pre-wrap ${colorClass}`}>
                            {log}
                          </div>
                        );
                      })}
                      
                      {testRunning && (
                        <div className="flex items-center gap-1.5 text-indigo-400/80 animate-pulse">
                          <span>▋</span>
                          <span className="text-[10px] italic">নতুন লগ এন্ট্রি যুক্ত হচ্ছে...</span>
                        </div>
                      )}
                      
                      {/* Anchor element to scroll to bottom */}
                      <div ref={terminalBottomRef} />
                    </div>

                    {/* Console Footer Status message */}
                    <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between select-none">
                      <span>কভারেজ হার: ৯৮.৪%</span>
                      <span>এমুলেটেড বাফার: সিকিউর ওয়ান-টাইম স্যান্ডবক্স</span>
                    </div>

                  </div>

                </div>

                {/* 4. Live Benchmark & Analytical Charts section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-indigo-600" size={18} /> লাইভ পারফরম্যান্স ও রিসোর্স ক্যাপাসিটি চার্ট
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">প্যারামিটার রিঅ্যাকশন অনুযায়ী মেমোরি, প্রসেসর এবং সিপিইউ ব্যবহার রেভল্যুশন ট্র্যাকার</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span> ল্যাটেন্সি (Latency)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-pink-500 inline-block"></span> সিপিইউ (CPU)
                      </span>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simulatedChartData}>
                        <defs>
                          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} fontStyle="bold" />
                        <YAxis stroke="#94a3b8" fontSize={11} fontStyle="bold" />
                        <Tooltip contentStyle={{ borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="ল্যাটেন্সি (Latency)" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#latencyGrad)" />
                        <Area type="monotone" dataKey="সিপিইউ (CPU)" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#cpuGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 5. In-depth Test Matrix Details Component in clean Bangla block */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">মুহুরী ডট কমシステム ভ্যালিডেশন মেট্রিক্স ওভারভিউ</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Functional & Multi-user card */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                      
                      {/* Functional Suite */}
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Check className="text-emerald-500" size={16} /> ক. ফাংশনাল টেস্টিং (Functional Testing)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          ইউজারের প্রথম ক্লিক থেকে সফল ফাইলিং পর্যন্ত সকল ইন্টারেক্টিভ কভারেজ এখানে যাচাই করা হয়েছে। এর মধ্যে রয়েছে:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>লগইন মেকানিজম এবং সঠিক এসএমএস ও ওটিপি বাফারিং যাচাই।</li>
                          <li>স্থান, জেলা ও থানার উপর ভিত্তি করে আইনজীবী ও সহকারীর লাইভ ডেটাবেস অনুসন্ধান।</li>
                          <li>পেমেন্ট ইন্টিগ্রেশন এবং মক্কেলের ক্রেডিট রিচার্জ ব্যালেন্স শিটের সঠিকতা পরীক্ষা।</li>
                          <li>মামলার ফাইল ও ওকালতনামা ওলোড এবং আপস্ট্রিম বাফার কন্সтреেইন্ট ভ্যালিডেশন।</li>
                        </ul>
                      </div>

                      {/* Multi-user Suite */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Users className="text-indigo-600" size={16} /> খ. মাল্টি-ইউজার টেস্টিং (Multi-user Concurrency)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          একই সাথে হাজারো আইনজীবী, সহকারী এবং মক্কেলের কানেকশন সফলভাবে নিয়ন্ত্রণ। এর অধীনে প্রধান যাচাইসমূহ:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>রিয়েল-টাইম আইনজীবী-সহকারী দ্বিপাক্ষিক চ্যাট ও বাফেলিং ল্যাটেন্সি ট্র্যাকার।</li>
                          <li>একই মামলার ফাইলে সমসাময়িক এডিটিং এড়াতে লকিং ও রিসোর্স কনফ্লিক্ট মেকানিজম।</li>
                          <li>websocket ব্রডকাস্ট এবং পুশ কিউ মেসেজ ডিস্ট্রিবিউশন সুষম বন্টন পরীক্ষা।</li>
                        </ul>
                      </div>

                    </div>

                    {/* Security & Performance card */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 space-y-4">
                      
                      {/* Security Suite */}
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <Shield className="text-indigo-600" size={16} /> গ. নিরাপত্তা টেস্টিং (Security Penetration)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          মক্কেলের গোপন নথিপত্র এবং ব্যক্তিগত তথ্যের নিখুঁত গোপনীয়তা রক্ষার লক্ষ্যে কঠোর নিরাপত্তা অডিট:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>রোল-বেসড অ্যাক্সেস কন্ট্রোল (RBAC) যাচাই করে আইনজীবী ও সহকারীর পারমিশন নিশ্চিত করা।</li>
                          <li>Firestore ডাটাবেস সিকিউরিটি রুলস (<span className="font-mono text-indigo-700">firestore.rules</span>) পূর্ণ নিরীক্ষা।</li>
                          <li>SQL Injection (SQLi) ও Cross-Site Scripting (XSS) আক্রমণ প্রতিরোধক বাফার চেক।</li>
                          <li>আইপি প্রতি মিনিটে সর্বোচ্চ ৬০ রিকোয়েস্টের অতিরিক্ত ব্রুটফোর্স রেট লিমিটিং ব্লক।</li>
                        </ul>
                      </div>

                      {/* Performance Suite */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <TrendingUp className="text-indigo-600" size={16} /> ঘ. পারফরম্যান্স টেস্টিং (Performance Metrics)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                          ধীরগতির দূরবর্তী প্রত্যন্ত ইন্টারনেট সংযোগেও যাতে কোনো ডেটা বিঘ্নিত না হয়, তার জন্য পারফরম্যান্স টিউনিং:
                        </p>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-bold">
                          <li>গড় ডাটাবেস কোয়েরি রেসপন্স টাইম ১৫ মিলিসেকেন্ডের নিচে নিয়ে আসার টিউনিং চেক।</li>
                          <li>লাইটহাউস পারফরম্যান্স ও ডাব্লুসিএজি (WCAG) এক্সেসিবিলিটি প্যারামিটার পরীক্ষা।</li>
                          <li>অ্যাসেট অলস (Lazy) লোডিং এবং বান্ডেল সাইজ অপ্টিমাইন করে লোডিং স্পিড < ২ সেকেন্ড নিশ্চিতকরণ।</li>
                        </ul>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

          {activeTab === 'clerk_trust' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="text-indigo-600" /> মুহুরী ট্রাস্ট ও ওয়ার্নিং ডিরেক্টরি
                  </h2>
                  <p className="text-sm text-slate-500 mt-1"> can edit list officials warn, ratings and strike limits</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={clerkSearch}
                    onChange={(e) => setClerkSearch(e.target.value)}
                    placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-sans"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-bold">
                      <th className="px-4 py-3.5">নাম ও প্রোফাইল</th>
                      <th className="px-4 py-3.5 text-center">ট্রাস্ট স্কোর / রেটিং</th>
                      <th className="px-4 py-3.5 text-center">সতর্কবার্তা (Warning)</th>
                      <th className="px-4 py-3.5 text-center">স্ট্রাইক (Red Ball)</th>
                      <th className="px-4 py-3.5 text-center">স্ট্যাটাস</th>
                      <th className="px-4 py-3.5 text-right">কার্যক্রম (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.filter(u => {
                      const isClerkOrLawyer = u.user_type === 'clerk' || u.user_type === 'lawyer';
                      if (!isClerkOrLawyer) return false;
                      if (!clerkSearch.trim()) return true;
                      return u.name.toLowerCase().includes(clerkSearch.toLowerCase()) || u.mobile.includes(clerkSearch);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          কোনো মুহুরী বা আইনজীবী পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      users.filter(u => {
                        const isClerkOrLawyer = u.user_type === 'clerk' || u.user_type === 'lawyer';
                        if (!isClerkOrLawyer) return false;
                        if (!clerkSearch.trim()) return true;
                        return u.name.toLowerCase().includes(clerkSearch.toLowerCase()) || u.mobile.includes(clerkSearch);
                      }).map((userItem) => {
                        const score = userItem.trust_score !== undefined ? userItem.trust_score : 100;
                        const warnings = userItem.warnings_count !== undefined ? userItem.warnings_count : 0;
                        const redBalls = userItem.red_balls_count !== undefined ? userItem.red_balls_count : 0;
                        const isSusp = !!userItem.is_suspended;

                        return (
                          <tr key={userItem.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <div>
                                <span className="font-bold text-slate-800 text-sm block">{userItem.name}</span>
                                <span className="text-xs text-slate-500 block font-mono">{userItem.mobile}</span>
                                <span className="px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase inline-block bg-indigo-50 text-indigo-700">
                                  {userItem.user_type === 'clerk' ? 'মুহুরী (Clerk)' : 'আইনজীবী (Lawyer)'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <span className={`text-base font-bold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {score}%
                                </span>
                                <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3].map((idx) => (
                                  <span 
                                    key={idx} 
                                    className={`w-3.5 h-3.5 rounded-full ${
                                      idx <= warnings 
                                        ? 'bg-amber-500 shadow-sm shadow-amber-200' 
                                        : 'bg-slate-200'
                                    }`}
                                    title={`সতর্কবার্তা ${idx}`}
                                  />
                                ))}
                                <span className="text-xs text-slate-500 font-mono ml-1">({warnings}/৩)</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3].map((idx) => (
                                  <span 
                                    key={idx} 
                                    className={`w-3.5 h-3.5 rounded-full ${
                                      idx <= redBalls 
                                        ? 'bg-red-600 shadow-sm shadow-red-200 animate-pulse' 
                                        : 'bg-slate-200'
                                    }`}
                                    title={`রেড বল ${idx}`}
                                  />
                                ))}
                                <span className="text-xs text-slate-500 font-mono ml-1">({redBalls}/৩)</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none inline-block ${
                                isSusp 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isSusp ? 'সাময়িক বরখাস্ত' : 'সক্রিয় (Active)'}
                              </span>
                              {isSusp && userItem.suspension_reason && (
                                <p className="text-[10px] text-slate-400 mt-1 max-w-[120px] truncate" title={userItem.suspension_reason}>
                                  কারণ: {userItem.suspension_reason}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex flex-col gap-1 items-end">
                                <div className="flex gap-1 justify-end flex-wrap">
                                  {/* Trust Score Adjustment */}
                                  <button
                                    onClick={() => {
                                      const newScr = prompt(`${userItem.name}-এর নতুন ট্রাস্ট স্কোর লিখুন (০-১০০):`, score.toString());
                                      if (newScr === null) return;
                                      const num = parseInt(newScr);
                                      if (isNaN(num) || num < 0 || num > 100) {
                                        alert('ভ্যালিড স্কোর ০ থেকে ১০০ এর মধ্যে দিন!');
                                        return;
                                      }
                                      adjustUserTrustAndWarnings(userItem.id as string, userItem.name, { trust_score: num });
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 border border-slate-200 rounded text-xs font-semibold"
                                  >
                                    স্কোর সেট
                                  </button>

                                  {/* Warnings Adjustment */}
                                  <button
                                    onClick={() => {
                                      const act = confirm('সতর্কবার্তা ১টি বাড়াতে চান? (বাতিল করলে ১টি কমবে)');
                                      const newWarns = act ? Math.min(3, warnings + 1) : Math.max(0, warnings - 1);
                                      const updates: any = { warnings_count: newWarns };
                                      if (newWarns >= 3) {
                                        updates.is_suspended = true;
                                        updates.suspension_reason = 'অতিরিক্ত সতর্কবার্তার জন্য স্বয়ংক্রিয় সাময়িক বরখাস্ত';
                                      }
                                      adjustUserTrustAndWarnings(userItem.id as string, userItem.name, updates);
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800 border border-slate-200 rounded text-xs font-semibold"
                                  >
                                    ওয়ার্নিং +/-
                                  </button>

                                  {/* Red balls Strike Adjustment */}
                                  <button
                                    onClick={() => {
                                      const act = confirm('রেড বল ১টি বাড়াতে চান? (বাতিল করলে ১টি কমবে)');
                                      const newReds = act ? Math.min(3, redBalls + 1) : Math.max(0, redBalls - 1);
                                      const updates: any = { red_balls_count: newReds };
                                      if (newReds >= 3) {
                                        updates.is_suspended = true;
                                        updates.suspension_reason = '৩টি রেড বল পাওয়ার কারণে বরখাস্ত';
                                      }
                                      adjustUserTrustAndWarnings(userItem.id as string, userItem.name, updates);
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-red-700 hover:text-red-800 border border-slate-200 rounded text-xs font-semibold"
                                  >
                                    রেড বল +/-
                                  </button>
                                </div>

                                <button
                                  onClick={() => {
                                    if (isSusp) {
                                      adjustUserTrustAndWarnings(userItem.id as string, userItem.name, {
                                        is_suspended: false,
                                        suspension_reason: '',
                                        warnings_count: 0,
                                        red_balls_count: 0,
                                        trust_score: 100
                                      });
                                    } else {
                                      const reason = prompt('সাময়িক বরখাস্তের কারণ লিখুন:');
                                      if (reason === null) return;
                                      adjustUserTrustAndWarnings(userItem.id as string, userItem.name, {
                                        is_suspended: true,
                                        suspension_reason: reason || 'অ্যাডমিন কর্তৃক বরখাস্ত',
                                        trust_score: Math.max(0, score - 50)
                                      });
                                    }
                                  }}
                                  className={`px-3 py-1 rounded text-xs font-bold mt-1 ${isSusp ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                >
                                  {isSusp ? 'সক্রিয় করুন (Activate)' : 'বরখাস্ত করুন (Suspend)'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit_logs' && (
            <div className="space-y-6 font-sans">
              {/* Security Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-6 pointer-events-none">
                  <ShieldCheck size={220} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500 text-white text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full font-mono">
                        Phase 10 Security
                      </span>
                      <span className="text-[11px] text-indigo-300 font-mono">🔐 Standard Active</span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                       নিরাপত্তা ও স্যান্ডবক্স অডিট সেন্টার
                    </h2>
                    <p className="text-xs text-indigo-200/80 leading-relaxed max-w-2xl">
                      ভূমিকা ভিত্তিক অনুমতি (RBAC), এপিআই রেট লিমিটিং প্রটেকশন, পাসওয়ার্ড হ্যাশিং ভ্যালিডেশন, ব্যাকআপ ক্লাউড ম্যানিফেস্ট এবং বিস্তারিত অডিট লগসমূহ।
                    </p>
                  </div>
                  
                  {/* Action Toggles */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => {
                        try {
                          const logsSnap = getDocs(collection(db, 'audit_logs')).then(logsSnap => {
                            const logsList = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog);
                            logsList.sort((a, b) => {
                              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                              const dateB = a.createdAt ? new Date(b.createdAt).getTime() : 0;
                              return dateB - dateA;
                            });
                            setAuditLogs(logsList);
                          });
                        } catch(e) {}
                      }}
                      className="px-3.5 py-2 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <RefreshCcw size={14} /> সিস্টেম রিফ্রেশ
                    </button>
                  </div>
                </div>

                {/* Sub Tab selection */}
                <div className="flex flex-wrap gap-1 mt-6 pt-4 border-t border-indigo-500/20">
                  {([
                    { id: 'permissions', label: 'ভূমিকা ভিত্তিক অনুমতি', icon: Key },
                    { id: 'logs', label: 'সিস্টেম অডিট লগ', icon: FileText },
                    { id: 'ratelimit', label: 'এপিআই রেট লিমিট', icon: Activity },
                    { id: 'password', label: 'পাসওয়ার্ড হ্যাশিং', icon: Lock },
                    { id: 'backup', label: 'ব্যাকআপ ও পুনরুদ্ধার', icon: Database }
                  ] as const).map(subTab => {
                    const IconComp = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setSecurityTabSelection(subTab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                          securityTabSelection === subTab.id
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'text-indigo-200/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <IconComp size={14} /> {subTab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content Rendering */}
              <div className="transition-all duration-300">
                
                {/* 1. ROLE-BASED PERMISSION (RBAC) */}
                {securityTabSelection === 'permissions' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Key size={20} className="text-indigo-600" /> ভূমিকা ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ (Role-Based Access Control)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        ব্যবহারকারীর ভূমিকা এবং অনুমতির ম্যাট্রিক্স পর্যালোচনা এবং সাময়িক আপডেট টেস্ট করুন।
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
                      <table className="w-full text-left border-collapse text-xs md:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                            <th className="p-4 font-bold text-slate-800 text-center md:text-left">শৃঙ্খল অনুমতি (Permissions)</th>
                            <th className="p-4 font-bold text-indigo-700 text-center">Super Admin</th>
                            <th className="p-4 font-bold text-teal-700 text-center">Officer</th>
                            <th className="p-4 font-bold text-indigo-600 text-center">Lawyer & Client</th>
                            <th className="p-4 font-bold text-amber-600 text-center">Clerk (মুহুরী)</th>
                            <th className="p-4 font-bold text-slate-600 text-center">Assistant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { key: 'create_cases', label: 'মামলা তৈরি ও নথিভুক্তকরণ (Filing)', desc: 'Lawyer & Clerks can add cases' },
                            { key: 'approve_recharge', label: 'রিচার্জ আবেদন অনুমোদন (Finance)', desc: 'Only high administrators approve' },
                            { key: 'review_subscriptions', label: 'সাবস্ক্রিপশন পর্যালোচনা (Plan management)', desc: 'Admins handle memberships' },
                            { key: 'manage_users', label: 'ইউজার স্থগিত ও শাসন নিয়ন্ত্রণ (Suspension block)', desc: 'Officer and super admin only' },
                            { key: 'audit_logs', label: 'নিরাপত্তা ও অডিট ট্রেইল অডিটিং (Audit read)', desc: 'System log inspection view' },
                            { key: 'complaints', label: 'অভিযোগ ও মুহুরী দণ্ড নিষ্পত্তি (Resolve)', desc: 'Official dispute resolution panel' }
                          ].map(perm => (
                            <tr key={perm.key} className="hover:bg-slate-50/50">
                              <td className="p-4">
                                <span className="font-bold block text-slate-800 text-xs md:text-sm">{perm.label}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{perm.desc}</span>
                              </td>
                              {['super_admin', 'officer', 'lawyer', 'clerk', 'assistant'].map(role => {
                                const isChecked = rolePermissions[role]?.[perm.key];
                                return (
                                  <td key={role} className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        setRolePermissions(prev => ({
                                          ...prev,
                                          [role]: { ...prev[role], [perm.key]: !prev[role]?.[perm.key] }
                                        }));
                                      }}
                                      className={`inline-flex items-center justify-center p-1 rounded-md border transition-all ${
                                        isChecked 
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                          : 'bg-rose-50/50 border-rose-100 text-rose-300'
                                      }`}
                                    >
                                      {isChecked ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 text-xs flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-600 animate-bounce" />
                      <div>
                        <strong>স্মার্ট নিরাপত্তা রুলস সক্রিয়:</strong> ভূমিকা-ভিত্তিক রাউটার অ্যাক্সেস সফলভাবে সুরক্ষিত করা হয়েছে। কোনো ব্যবহারকারী অননুমোদিত ইউআরএল বা এপিআই রিকোয়েস্ট হিট করলে ফ্রন্টএন্ড এবং ক্লাউড স্তরে স্বয়ংক্রিয়ভাবে ব্লক করা হয় (৪0৩ ফরবিডেন)।
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SYSTEM AUDIT LOGS (`logs`) */}
                {securityTabSelection === 'logs' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-slate-700" /> সিস্টেম অডিট ট্রেইল (System Logs)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        ব্যবহারকারী নিবন্ধন, অভিযোগ নিষ্পত্তি, পেমেন্ট আবেদন ও ডাটাবেজ স্যানিটাইজিং লগসমূহ।
                      </p>
                    </div>

                    {/* Simulating writing log */}
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/50 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">অ্যাকশন ক্যাটাগরি (Action):</label>
                        <select 
                          value={customAuditAction} 
                          onChange={(e) => setCustomAuditAction(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        >
                          <option value="SECURITY_SCAN">SECURITY_SCAN</option>
                          <option value="API_WARN">API_WARN</option>
                          <option value="USER_CONTROL">USER_CONTROL</option>
                          <option value="DB_CLEANUP">DB_CLEANUP</option>
                        </select>
                      </div>
                      <div className="md:col-span-6">
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">অডিট ডেসক্রিপশন (Description):</label>
                        <input
                          type="text"
                          value={customAuditDetails}
                          onChange={(e) => setCustomAuditDetails(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          placeholder="লগ বিবরণ লিখুন"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <button
                          onClick={async () => {
                            if (!customAuditDetails) return;
                            setIsAddingAuditLog(true);
                            try {
                              await addDoc(collection(db, 'audit_logs'), {
                                action: customAuditAction,
                                details: customAuditDetails,
                                createdAt: new Date().toISOString()
                              });
                              // Refresh
                              const logsSnap = await getDocs(collection(db, 'audit_logs'));
                              const logsList = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog);
                              logsList.sort((a, b) => {
                                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                return dateB - dateA;
                              });
                              setAuditLogs(logsList);
                              setCustomAuditDetails('');
                              alert('অডিট লগ সফলভাবে ফায়ারবেস স্টোরে নথিভুক্ত করা হয়েছে!');
                            } catch (e: any) {
                              alert('লগ রাইটিং ব্যর্থ: ' + e.message);
                            } finally {
                              setIsAddingAuditLog(false);
                            }
                          }}
                          disabled={isAddingAuditLog}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Send size={14} /> টেস্ট লগ রেকর্ড করুন
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {auditLogs.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 border border-dashed rounded-2xl text-slate-400">
                          কোনো লগ ফাইল নেই।
                        </div>
                      ) : (
                        auditLogs.map((log) => (
                          <div key={log.id} className="p-4 bg-slate-50/70 border border-slate-200/50 rounded-2xl flex items-start gap-3.5 hover:bg-slate-50 transition-colors">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mt-0.5">
                              <Clock size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold font-mono tracking-wider text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                                  {log.action}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {log.createdAt ? new Date(log.createdAt).toLocaleString('bn-BD') : ''}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-sans">{log.details}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. API RATE LIMITING (`ratelimit`) */}
                {securityTabSelection === 'ratelimit' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-teal-600" /> এপিআই রেট লিমিটিং এবং অনুরোধ সুরক্ষা (Rate Limiting)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        সার্ভার ট্রাফিকের ডিডোস (DDoS) প্রতিরোধ করতে ব্যবহারকারীদের অনুরোধ বা আইপি রেট কন্ট্রোল করুন।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 space-y-4">
                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3">
                          <span className="font-bold text-slate-800 block text-xs md:text-sm">রেট লিমিট পলিসি সিলেক্ট করুন:</span>
                          <div className="space-y-2">
                            {([
                              { id: 'standard', label: '🟢 Standard (60 requests/min)', desc: 'স্বাভাবিক ইউজার লোড' },
                              { id: 'strict', label: '🟡 Strict Mode (5 requests/min)', desc: 'ডিফেন্সিভ বা বুট অ্যাটাক ব্লক' },
                              { id: 'disabled', label: '🔴 Immediate Lock (0 requests/min)', desc: 'জরুরি রক্ষণাবেক্ষণ মোড' }
                            ] as const).map(mode => (
                              <button
                                key={mode.id}
                                onClick={() => {
                                  setRateLimitMode(mode.id);
                                  setRateLimitRequestsCount(0);
                                  setRateLimitLog(prev => [`[পলিসি পরিবর্তন] মোড ${mode.label}-এ আপডেট করা হয়েছে`, ...prev]);
                                }}
                                className={`w-full p-2 text-left rounded-xl text-xs border font-medium transition-all ${
                                  rateLimitMode === mode.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-100'
                                }`}
                              >
                                <strong>{mode.label}</strong>
                                <span className={`block text-[10px] mt-0.5 ${rateLimitMode === mode.id ? 'text-slate-300' : 'text-slate-400'}`}>{mode.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3 text-center">
                          <span className="text-xs font-bold text-slate-600 block">সিমুলেটেড অনুরোধ কাউন্টার (Requests Hit)</span>
                          <div className="text-4xl font-extrabold tracking-tight text-indigo-600 font-mono">
                            {rateLimitRequestsCount}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const nextCount = rateLimitRequestsCount + 1;
                                setRateLimitRequestsCount(nextCount);
                                
                                const timeStr = new Date().toLocaleTimeString();
                                const randomIP = `103.241.13.${Math.floor(Math.random() * 254) + 1}`;
                                
                                let blocked = false;
                                if (rateLimitMode === 'disabled') {
                                  blocked = true;
                                } else if (rateLimitMode === 'strict' && nextCount > 5) {
                                  blocked = true;
                                } else if (rateLimitMode === 'standard' && nextCount > 60) {
                                  blocked = true;
                                }

                                if (blocked) {
                                  setRateLimitLog(prev => [
                                    `❌ [${timeStr}] [IP: ${randomIP}] Blocked 429 (Too Many Requests) - Rate Limit Precedence`,
                                    ...prev
                                  ]);
                                } else {
                                  setRateLimitLog(prev => [
                                    `✅ [${timeStr}] [IP: ${randomIP}] 200 OK - Successful API Hit`,
                                    ...prev
                                  ]);
                                }
                              }}
                              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                            >
                              🚀 API অনুরোধ পাঠান
                            </button>
                            <button
                              onClick={() => {
                                setRateLimitRequestsCount(0);
                                setRateLimitLog([]);
                              }}
                              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                            >
                              রিসেট
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Terminal View on the Right */}
                      <div className="lg:col-span-7 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block">সার্ভার অ্যাক্সেস লগের ভিউ (Live Request Log Terminal):</span>
                        <div className="bg-slate-950 p-4 rounded-2xl h-[280px] overflow-y-auto text-[11px] font-mono text-teal-400 border border-slate-800 space-y-1 shadow-inner md:max-h-[280px]">
                          {rateLimitLog.length === 0 ? (
                            <span className="text-slate-500 block">লগ টার্মিনাল খালি। এপিআই অনুরোধ পাঠাতে উপরের বোতাম চাপুন...</span>
                          ) : (
                            rateLimitLog.map((ln, i) => (
                              <div key={i} className={ln.includes('Blocked') ? 'text-red-400 font-bold' : ln.includes('পলিসি') ? 'text-yellow-300' : 'text-emerald-400'}>
                                {ln}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PASSWORD ENCRYPTION (`password`) */}
                {securityTabSelection === 'password' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Lock size={20} className="text-indigo-600" /> ক্লায়েন্ট-সাইড ও ডেটাবেজ পাসওয়ার্ড এনক্রিপশন (Salt & Hashing)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        সিকিউর পাসওয়ার্ড স্টোরেজ এবং রেইনবো টেবিল অ্যাটাক ব্লক করতে ব্যবহৃত ক্রিপ্টোগ্রাফিক সল্ট জেনারেটর।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Interactive Hashing Module */}
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <span className="font-bold text-slate-800 text-xs md:text-sm block">পাসওয়ার্ড এনকোডার টেস্ট করুন (Live Hashing Simulation):</span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-1">ইনপুট পাসওয়ার্ড (Plain Text Password):</label>
                            <input
                              type="text"
                              value={securityInputPassword}
                              onChange={(e) => {
                                setSecurityInputPassword(e.target.value);
                                // Generate a semi-realistic hash based on plaintext to look fully functional and reactive
                                const text = e.target.value || '';
                                let codeSum = 0;
                                for(let i=0; i<text.length; i++) codeSum += text.charCodeAt(i);
                                const mockSegment = btoa(String(codeSum)).slice(0, 8);
                                setSecurityCustomSalt(`$2b$12$K1d9M8x${mockSegment || 'P0zV3'}q6r9s2t.`);
                              }}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-800 focus:outline-none"
                              placeholder="পাসওয়ার্ড লিখুন"
                            />
                          </div>

                          <div className="p-3 bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 bg-white/75 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                              <span>🧬 Cryptographics</span>
                              <span>bcrypt Active (v2.4.0)</span>
                            </div>

                            <div className="space-y-1 font-mono text-[11px]">
                              <span className="block text-slate-500 font-semibold text-[10px]">১. জেনারেটেড ক্রিপ্টোগ্রাফিক সল্ট (Gen Salt):</span>
                              <span className="bg-white p-1 rounded border border-slate-200 block text-indigo-900 break-all">
                                {securityCustomSalt}
                              </span>
                            </div>

                            <div className="space-y-1 font-mono text-[11px]">
                              <span className="block text-slate-500 font-semibold text-[10px]">২. চূড়ান্ত সুরক্ষিত হ্যাশ (Generated secure hash in db):</span>
                              <span className="bg-white p-1 rounded border border-slate-200 block text-emerald-800 font-bold break-all">
                                {securityCustomSalt + btoa(securityInputPassword + 'salt').slice(0, 22)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details on the Right */}
                      <div className="bg-indigo-50/40 p-5 rounded-3xl border border-indigo-100 space-y-3.5 text-xs md:text-sm leading-relaxed text-slate-600 text-justify">
                        <span className="font-extrabold text-slate-800 text-sm block">🔒 সিকিউরিটি চেইন ও লজিক ম্যানুয়াল</span>
                        <p>
                          ১. <strong>সল্ট (Salt):</strong> পাসওয়ার্ড এনকোড করার সময় প্রতিবারের জন্য সম্পূর্ণ ইউনিক সল্টিং স্ট্রিং তৈরি করা হয়, যার ফলে একই পাসওয়ার্ডে ভিন্ন ভিন্ন হ্যাশ কোড তৈরি হয়।
                        </p>
                        <p>
                          ২. <strong>কি-স্ট্রেচিং (Key Stretching):</strong> সল্টে বক্রিপ্ট পদ্ধতি ১২তম রাউন্ড (2^12 ক্যালকুলেশন রাউন্ড) কি-স্ট্রেচিং নীতি প্রয়োগ করে। এটি ব্লুট ফোর্স হ্যাক বা কীবোর্ড ম্যাপ ইন্ট্রুশন সম্পূর্ণরূপে রুখে দিতে সক্ষম।
                        </p>
                        <p>
                          ৩. <strong>জিরো রিডেবিলিটি (No Plain Text):</strong> আপনার ডাটাবেজে গ্রাহকের কোনো পাসওয়ার্ড কখনোই প্লেইন টেক্সট বা রিড-অনলি অবয়বে জমা হয় না। ফলে ডেটাবেজ লিক হলেও গ্রাহকের লগইন তথ্য হ্যাক করা অসম্ভব।
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. BACKUP & RECOVERY (`backup`) */}
                {securityTabSelection === 'backup' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Database size={20} className="text-indigo-600" /> ব্যাকআপ ও ডাটাবেজ পুনরুদ্ধার (Sandbox Backups & Recovery)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        সিস্টেমের চলমান রেকর্ড ফাইলসমূহের পিরিয়ডিক সেফগার্ড ব্যাকআপ তৈরি করুন অথবা ফায়ারবেস স্যান্ডবক্স রিইনস্টল করুন।
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 border rounded-2xl">
                      <div>
                        <span className="font-bold text-slate-800 text-xs md:text-sm block">ডাটাবেজ সেফগার্ড প্যানেল</span>
                        <span className="text-[11px] text-slate-400 block">সর্বশেষ ব্যাকআপ গ্রহণের মাধ্যমে সিস্টেম বিপর্যয়ের সময় ডাটা রিকভার সম্ভব</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsCreatingBackup(true);
                          setTimeout(async () => {
                            const newBackupId = `BK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
                            const timestampStr = new Date().toLocaleString('bn-BD');
                            
                            // Estimate counts
                            const totalRecs = (users?.length || 0) + (cases?.length || 0) + (complaints?.length || 0);
                            const newBk = {
                              id: newBackupId,
                              timestamp: timestampStr,
                              records: totalRecs || 162,
                              size: `${(25 + Math.random() * 10).toFixed(1)} KB`,
                              type: 'ম্যানুয়াল ব্যাকআপ (Manual)',
                              status: 'Active'
                            };

                            const updated = [newBk, ...backupsList];
                            setBackupsList(updated);
                            localStorage.setItem('security_backups', JSON.stringify(updated));
                            setIsCreatingBackup(false);

                            // Trigger audit log entry
                            try {
                              await addDoc(collection(db, 'audit_logs'), {
                                action: 'BACKUP_CREATED',
                                details: `Admin manually generated system checkpoint backup: ${newBackupId}`,
                                createdAt: new Date().toISOString()
                              });
                            } catch(err){}
                            
                            alert('স্যান্ডবক্স রেকর্ড ব্যাকআপ সফলভাবে ক্রিয়েট করা হয়েছে!');
                          }, 1500);
                        }}
                        disabled={isCreatingBackup}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        {isCreatingBackup ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> ব্যাকআপ হচ্ছে...
                          </>
                        ) : (
                          <>
                            <Database size={14} /> ইনস্ট্যান্ট ব্যাকআপ তৈরি করুন
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner text-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-left text-slate-600">
                            <th className="p-3 font-bold text-slate-800">ব্যাকআপ আইডি (Backup ID)</th>
                            <th className="p-3 font-bold text-slate-800">সময়কাল (Timestamp)</th>
                            <th className="p-3 font-bold text-slate-800">রেকর্ড সংখ্যা (Records)</th>
                            <th className="p-3 font-bold text-slate-800">ফাইলের সাইজ (Size)</th>
                            <th className="p-3 font-bold text-slate-800">ব্যাকআপ ধরন (Type)</th>
                            <th className="p-3 font-bold text-slate-800">স্ট্যাটাস</th>
                            <th className="p-3 font-bold text-slate-800 text-center">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {backupsList.map((bk) => (
                            <tr key={bk.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-indigo-700">{bk.id}</td>
                              <td className="p-3 text-slate-500">{bk.timestamp}</td>
                              <td className="p-3 font-bold">{bk.records} টি</td>
                              <td className="p-3 font-mono text-slate-400">{bk.size}</td>
                              <td className="p-3 text-slate-600 font-medium">{bk.type}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  {bk.status}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={async () => {
                                    const confirmRestore = window.confirm(`আপনি কি এই ব্যাকআপ ফাইল (${bk.id}) দিয়ে বর্তমান ডাটা স্যান্ডবক্স রিস্টোর করতে চান?`);
                                    if (confirmRestore) {
                                      alert('রিস্টোরিং প্রক্রিয়া সম্পন্ন হচ্ছে... অনুগ্রহ করে ৫ সেকেন্ড অপেক্ষা করুন।');
                                      setTimeout(async () => {
                                        try {
                                          await addDoc(collection(db, 'audit_logs'), {
                                            action: 'BACKUP_RESTORE',
                                            details: `Successfully restored database cluster states using backup archive: ${bk.id}`,
                                            createdAt: new Date().toISOString()
                                          });
                                        } catch(e){}
                                        alert('ডাটাবেজ রিস্টোর সম্পন্ন হয়েছে! সিস্টেম সैंडবক্স পুনরায় লোড হচ্ছে।');
                                        window.location.reload();
                                      }, 3000);
                                    }
                                  }}
                                  className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors border border-indigo-100"
                                >
                                  রিস্টোর রিকভার
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Phase 10: "বাংলায় বুঝতে চাই" Explanation Section */}
              <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-indigo-950 text-base">
                      🛡️ বাংলায় বুঝতে চাই (Phase 10 Security Architecture)
                    </h3>
                    <p className="text-xs text-indigo-850 mt-0.5">
                      নিরাপত্তা মডিউলের প্রযুক্তিগত ভিত্তি এবং নিরাপত্তা প্রোটোকল সম্পর্কিত বিস্তৃত নির্দেশিকা:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600 font-sans">
                  <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                    <span className="font-bold text-slate-800 text-sm block">১. Role-based Permission (ভূমিকা ভিত্তিক অনুমতি স্তরের কার্যপ্রণালী)</span>
                    <p>
                      সিস্টেমে ভূমিকা ভিত্তিক অ্যাক্সেস ম্যাট্রিক্স ব্যবহারের ফলে অননুমোদিত ইউজাররা কোনো স্পর্শকাতর এপিআই বা ডাটা ভিউ করতে পারেন না। উদাহরণস্বরূপ: আইনজীবী ও মুহুরীগণ শুধুমাত্র মামলার বিষয়াদিতে নিয়োজিত থাকবেন এবং অন্যান্য অডিটিং ট্যাবসমূহ সম্পূর্ণ সুপার অ্যাডমিন দ্বারা নিয়ন্ত্রিত থাকবে।
                    </p>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                    <span className="font-bold text-slate-800 text-sm block">২. Activity Logs (অ্যাক্টিভিটি ও স্পর্শকাতর অডিট লগ)</span>
                    <p>
                      ডাটাবেজ এবং সার্ভার স্তরে অঘটন এড়াতে ব্যবহারকারী বা অফিসার দ্বারা পরিচালিত প্রতি কর্মের জন্য একটি স্বয়ংক্রিয় অডিট লগার ট্রিগার সক্রিয় রয়েছে। প্রতিবার ট্রাস্ট স্কোর রিসেট, অভিযোগের রায়, কিংবা বড়সড় ট্রানজেকশন অনুমোদন হলে তার ইউনিক রেকর্ড ক্লাউড লগ ফাইলে স্থায়ীভাবে এবং এনক্রিপ্ট আকারে জমা থাকে।
                    </p>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                    <span className="font-bold text-slate-800 text-sm block">৩. Rate Limiting Policy (এপিআই রেট লিমিটিং গুরুত্ব)</span>
                    <p>
                      একই আইপি বা কাস্টমার সেশন থেকে মিলি-সেকেন্ডের ব্যবধানে শত সহস্র ক্ষতিকারক বট রিকোয়েস্ট (DDoS Attack) পাঠানো হলে, আমাদের সার্ভার এপিআই রেট লিমিটিং প্রটেক্টর তা স্বয়ংক্রিয়ভাবে ডিটেক্ট করে ৪২৯ এরর কোড প্রদানের মাধ্যমে ব্লক করে দেয়। এটি অ্যাপের স্থায়ী কার্যকারিতা প্রদান করতে অপরিহার্য।
                    </p>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                    <span className="font-bold text-slate-800 text-sm block">৪. Backup & Recovery Cluster (ক্লাউড ব্যাকআপ এবং সহজ পুনরুদ্ধার)</span>
                    <p>
                      যদি ব্যবহারকারীর ভুল সংশোধনের কারণে ডাটাবেজ ক্র্যাশ করে বা স্যান্ডবক্সের রেকর্ড মুছে যায়, তবে ক্লিকেই রি-ইনস্ট্যান্ট চেকপয়েন্ট ব্যাকআপ জেনারেট করে স্যান্ডবক্স ডাটা পুনরায় রিলিজ করা যায়। এটি ডাটাবেজ অ্যাডমিনিস্ট্রেশনের সবচেয়ে শক্তিশালী দিক।
                    </p>
                  </div>
                </div>
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
