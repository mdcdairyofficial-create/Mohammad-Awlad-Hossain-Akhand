import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  Gift, 
  History, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Coins,
  ArrowRightLeft,
  AlertCircle,
  Wallet,
  X
} from 'lucide-react';
import { FullscreenAdViewer } from '../components/FullscreenAdViewer';
import { fetchWithAuth } from '../../../lib/api';

interface PointsViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  userPoints: number;
  onPointsUpdate: (newPoints: number) => void;
  userType?: string;
}

export const PointsView = ({ language, userPoints, onPointsUpdate, userType }: PointsViewProps) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [redBalls, setRedBalls] = useState(0);
  const [whiteBalls, setWhiteBalls] = useState(0);
  const [yellowBalls, setYellowBalls] = useState(0);

  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adWatchCount, setAdWatchCount] = useState(0);
  const [hasSharedToday, setHasSharedToday] = useState(false);
  const [showAdViewer, setShowAdViewer] = useState(false);

  // Conversion States
  const [convertType, setConvertType] = useState<'taka_to_red' | 'white_to_yellow' | 'red_to_yellow'>('taka_to_red');
  const [convertAmount, setConvertAmount] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Deposit States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositType, setDepositType] = useState<'online' | 'manual'>('online');
  const [manualMethod, setManualMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [manualSenderNumber, setManualSenderNumber] = useState<string>('');
  const [manualTxId, setManualTxId] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState(false);

  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  // Real-time listener for user balances & status
  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setWalletBalance(data.wallet_balance || 0);
        setRedBalls(data.red_balls_count || 0);
        setWhiteBalls(data.white_balls_count || 0);
        setYellowBalls(data.yellow_balls_count || 0);
        
        // Check-In Status
        const lastDate = data.lastCheckIn?.toDate();
        if (!lastDate) {
          setCanCheckIn(true);
        } else {
          const today = new Date();
          const isSameDay = lastDate.getDate() === today.getDate() && 
                          lastDate.getMonth() === today.getMonth() && 
                          lastDate.getFullYear() === today.getFullYear();
          setCanCheckIn(!isSameDay);
        }
        setLastCheckIn(data.lastCheckIn);

        // Ad Watch count for today
        const todayStr = new Date().toDateString();
        const lastAdReset = data.lastAdWatchReset;
        let watchCount = 0;
        if (lastAdReset === todayStr) {
          watchCount = data.adWatchCount || 0;
        } else {
          // Reset daily count in DB
          updateDoc(userRef, {
            adWatchCount: 0,
            lastAdWatchReset: todayStr
          }).catch(console.error);
        }
        setAdWatchCount(watchCount);

        // Share status for today
        setHasSharedToday(data.lastShareDate === todayStr);
      }
    }, (error) => {
      console.error("Real-time snapshot error in PointsView:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Point Transactions
  const fetchHistoryAndStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'points_history'),
        where('user_id', '==', auth.currentUser.uid),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(historyData);
    } catch (error) {
      console.error('Error fetching history/status:', error);
    }
  };

  useEffect(() => {
    fetchHistoryAndStatus();
  }, [redBalls, whiteBalls, yellowBalls, walletBalance]);

  const logTransaction = async (amount: number, description: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'points_history'), {
        user_id: auth.currentUser.uid,
        amount,
        description,
        created_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!auth.currentUser || !canCheckIn || isCheckingIn) return;
    setIsCheckingIn(true);
    try {
      const reward = 1; // 1 White Ball daily check-in reward
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        white_balls_count: increment(reward),
        lastCheckIn: serverTimestamp(),
      }, { merge: true });
      
      setCanCheckIn(false);
      await logTransaction(reward, t('ডেইলি চেক-ইন বোনাস (সাদা বল)', 'Daily check-in bonus (White Ball)'));
      alert(t(`অভিনন্দন! আপনি ${reward} ডেইলি বোনাস সাদা বল পেয়েছেন।`, `Congratulations! You earned ${reward} daily bonus White Ball.`));
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleWatchAd = () => {
    if (adWatchCount >= 3) {
      alert(t('আজকের ৩টি বিজ্ঞাপনের কোটা পূর্ণ হয়েছে!', 'You have already watched 3 ads today!'));
      return;
    }
    setShowAdViewer(true);
  };

  const handleShare = async () => {
    if (hasSharedToday) {
      alert(t('আপনি আজ ইতিমধ্যে কন্টেন্ট শেয়ার করেছেন!', 'You have already shared content today!'));
      return;
    }
    
    const referralLink = `${window.location.origin}/join?ref=${auth.currentUser!.uid}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      alert(t('আপনার রেফারেল লিংক ক্লিপবোর্ডে কপি হয়েছে! এটি বন্ধুদের সাথে শেয়ার করুন এবং ২ টি সাদা বল পেতে পারেন।', 'Your referral link has been copied to clipboard! Share it to earn 2 White Balls.'));
      
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      const todayStr = new Date().toDateString();
      const reward = 2; // 2 White Balls

      await updateDoc(userRef, {
        white_balls_count: increment(reward),
        lastShareDate: todayStr
      });

      setHasSharedToday(true);
      await logTransaction(reward, t('কন্টেন্ট শেয়ার করার বোনাস (সাদা বল)', 'Earned from sharing content (White Ball)'));
    } catch (err) {
      console.error('Failed to copy/share:', err);
      alert(t('শেয়ার করতে ব্যর্থ হয়েছে।', 'Failed to share.'));
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(convertAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(t('দয়া করে সঠিক পরিমাণ লিখুন।', 'Please enter a valid amount.'));
      return;
    }

    if (convertType === 'white_to_yellow' && amountNum % 3 !== 0) {
      alert(t('সাদা বল রূপান্তর করতে পরিমাণটি ৩ এর গুণিতক হতে হবে।', 'White ball conversion amount must be a multiple of 3.'));
      return;
    }
    if (convertType === 'red_to_yellow' && amountNum % 10 !== 0) {
      alert(t('লাল বল রূপান্তর করতে পরিমাণটি ১০ এর গুণিতক হতে হবে।', 'Red ball conversion amount must be a multiple of 10.'));
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetchWithAuth('/api/balls/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: convertType, amount: amountNum })
      });
      const resData = await response.json();
      if (response.ok) {
        alert(resData.message || t('কনভার্ট সফল হয়েছে!', 'Conversion successful!'));
        setConvertAmount('');
        fetchHistoryAndStatus();
      } else {
        alert(resData.error || t('কনভার্ট ব্যর্থ হয়েছে।', 'Conversion failed.'));
      }
    } catch (err) {
      console.error(err);
      alert(t('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।', 'Network error. Please try again.'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleBuySubscription = async (plan: any) => {
    const confirmBuy = window.confirm(
      t(
        `আপনি কি নিশ্চিত যে ${plan.cost} লাল বল 🔴 দিয়ে "${plan.title}" অ্যাক্টিভেট করতে চান?`,
        `Are you sure you want to activate "${plan.title}" for ${plan.cost} Red Balls 🔴?`
      )
    );
    if (!confirmBuy) return;

    setIsSubscribing(true);
    try {
      const response = await fetchWithAuth('/api/balls/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.id,
          amount: plan.cost,
          duration: 'monthly'
        })
      });
      const resData = await response.json();
      if (response.ok) {
        alert(resData.message || t('সাবস্ক্রিপশন সফল হয়েছে!', 'Subscription successful!'));
        fetchHistoryAndStatus();
      } else {
        alert(resData.error || t('সাবস্ক্রিপশন ব্যর্থ হয়েছে।', 'Subscription failed.'));
      }
    } catch (err) {
      console.error(err);
      alert(t('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।', 'Network error. Please try again.'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleOnlineDeposit = async () => {
    const amountNum = Number(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(t('দয়া করে সঠিক পরিমাণ লিখুন।', 'Please enter a valid amount.'));
      return;
    }

    setIsDepositing(true);
    try {
      const response = await fetchWithAuth('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          purpose: 'Recharge', // Credited to wallet_balance
          orderId: `DEP_${Date.now()}_${auth.currentUser?.uid?.substring(0, 5)}`
        })
      });
      const data = await response.json();
      if (data.success && data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        alert(data.error || t("পেমেন্ট গেটওয়ে লোড করতে সমস্যা হয়েছে।", "Failed to load payment gateway."));
      }
    } catch (error) {
      console.error("Online payment error:", error);
      alert(t("পেমেন্ট ইনিশিয়েট করতে সমস্যা হয়েছে।", "Failed to initiate payment."));
    } finally {
      setIsDepositing(false);
    }
  };

  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert(t('দয়া করে সঠিক পরিমাণ লিখুন।', 'Please enter a valid amount.'));
      return;
    }
    if (!manualSenderNumber || manualSenderNumber.length < 11) {
      alert(t('দয়া করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।', 'Please enter a valid 11-digit mobile number.'));
      return;
    }
    if (!manualTxId || manualTxId.length < 4) {
      alert(t('দয়া করে সঠিক ট্রানজ্যাকশন আইডি লিখুন।', 'Please enter a valid transaction ID.'));
      return;
    }

    setIsDepositing(true);
    try {
      const response = await fetchWithAuth('/api/recharge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_number: manualSenderNumber,
          operator: manualMethod,
          package_type: 'Wallet Deposit',
          amount: amountNum,
          payment_method: manualMethod,
          transaction_id: manualTxId
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(t(
          'আপনার ডিপোজিট রিকোয়েস্ট জমা হয়েছে! এডমিন শীঘ্রই এটি ভেরিফাই করবেন।',
          'Your deposit request is submitted! Admin will verify it shortly.'
        ));
        setShowDepositModal(false);
        setDepositAmount('');
        setManualSenderNumber('');
        setManualTxId('');
        fetchHistoryAndStatus();
      } else {
        alert(data.error || t('রিকোয়েস্ট জমা দিতে ব্যর্থ হয়েছে।', 'Failed to submit request.'));
      }
    } catch (error) {
      console.error("Manual deposit error:", error);
      alert(t("ত্রুটি ঘটেছে। আবার চেষ্টা করুন।", "An error occurred. Please try again."));
    } finally {
      setIsDepositing(false);
    }
  };

  const dailyQuests = [
    { id: 1, title: t('ডেইলি চেক-ইন', 'Daily Check-in'), subtitle: t('১ টি সাদা বল ⚪', '1 White Ball ⚪'), icon: Calendar, completed: !canCheckIn, action: handleCheckIn },
    { id: 2, title: t('৩টি বিজ্ঞাপন দেখা', 'Watch 3 Ads'), subtitle: `${adWatchCount}/3 ` + t('সাদা বল ⚪', 'White Balls ⚪'), icon: Zap, completed: adWatchCount >= 3, action: handleWatchAd },
    { id: 3, title: t('একটি কন্টেন্ট শেয়ার করা', 'Share a Content'), subtitle: t('২ টি সাদা বল ⚪', '2 White Balls ⚪'), icon: Star, completed: hasSharedToday, action: handleShare },
  ];

  const subPlans = [
    { id: 'Classic', title: t('ক্লাসিক মেম্বারশিপ', 'Classic Membership'), cost: 300, validity: t('৩০ দিন', '30 Days'), icon: ShieldCheck, color: 'from-blue-500 to-indigo-600' },
    { id: 'Premium', title: t('প্রিমিয়াম মেম্বারশিপ', 'Premium Membership'), cost: 500, validity: t('৩০ দিন', '30 Days'), icon: Award, color: 'from-purple-500 to-pink-600' },
    { id: 'Special', title: t('স্পেশাল মেম্বারশিপ', 'Special Membership'), cost: 1000, validity: t('৩০ দিন', '30 Days'), icon: Gift, color: 'from-amber-500 to-orange-600' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">
            {t('বল গেম ও ওয়ালেট 🔴⚪🟡', 'BALL GAME & WALLET 🔴⚪🟡')}
          </h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">
            {t('লাল বল দিয়ে সাবস্ক্রিপশন, বিজ্ঞাপন দেখলে সাদা বল, এবং হলুদ বল দিয়ে মেডিজেন', 'RED BALLS FOR PLANS, WATCH ADS FOR WHITE, AND YELLOW FOR MEDIGEN')}
          </p>
        </div>
      </div>

      {/* 4-Ball Wallet Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Wallet Balance */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Wallet size={24} />
            </div>
            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">ACTIVE</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">{t('টাকা ডিপোজিট ব্যালেন্স', 'TAKA DEPOSIT')}</p>
            <p className="text-3xl font-black">৳{walletBalance.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>+</span>
            <span>{t('ডিপোজিট করুন', 'DEPOSIT NOW')}</span>
          </button>
        </div>

        {/* Red Balls */}
        <div className="bg-rose-950 text-rose-100 p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-rose-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
              <Coins className="animate-pulse" size={24} />
            </div>
            <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 px-2 py-1 rounded-full border border-rose-500/30">🔴 {t('লাল বল', 'RED')}</span>
          </div>
          <div>
            <p className="text-xs text-rose-300 font-bold uppercase tracking-widest mb-1">{t('লাল বল ব্যালেন্স', 'RED BALLS')}</p>
            <p className="text-3xl font-black text-rose-100">{redBalls} <span className="text-xs font-normal opacity-70">🔴</span></p>
          </div>
        </div>

        {/* White Balls */}
        <div className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-slate-200 dark:border-slate-700/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-500/20">
              <Zap size={24} />
            </div>
            <span className="text-[9px] font-black bg-slate-500/10 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full border border-slate-500/20">⚪ {t('সাদা বল', 'WHITE')}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">{t('সাদা বল ব্যালেন্স', 'WHITE BALLS')}</p>
            <p className="text-3xl font-black">{whiteBalls} <span className="text-xs font-normal opacity-70">⚪</span></p>
          </div>
        </div>

        {/* Yellow Balls */}
        <div className="bg-amber-950 text-amber-100 p-6 rounded-3xl shadow-xl flex flex-col justify-between border border-amber-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Award size={24} />
            </div>
            <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full border border-amber-500/30">🟡 {t('হলুদ বল', 'YELLOW')}</span>
          </div>
          <div>
            <p className="text-xs text-amber-300 font-bold uppercase tracking-widest mb-1">{t('হলুদ বল ব্যালেন্স', 'YELLOW BALLS')}</p>
            <p className="text-3xl font-black text-amber-100">{yellowBalls} <span className="text-xs font-normal opacity-70">🟡</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ball Converter Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-6">
              <ArrowRightLeft className="text-indigo-600" />
              {t('বল গেম এক্সচেঞ্জ', 'BALL GAME EXCHANGE')}
            </h3>

            {/* Select Conversion Type */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('রূপান্তর সিলেক্ট করুন', 'SELECT CONVERSION')}</label>
              
              <div 
                onClick={() => { setConvertType('taka_to_red'); setConvertAmount(''); }}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${convertType === 'taka_to_red' ? 'border-rose-500 bg-rose-50/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">৳</div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{t('টাকা ডিপোজিট ➔ লাল বল 🔴', 'Taka ➔ Red Ball 🔴')}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{t('এক্সচেঞ্জ রেট: ১ টাকা = ১ লাল বল', 'Rate: 1 Taka = 1 Red Ball')}</p>
                </div>
              </div>

              <div 
                onClick={() => { setConvertType('white_to_yellow'); setConvertAmount(''); }}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${convertType === 'white_to_yellow' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">⚪</div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{t('সাদা বল ⚪ ➔ হলুদ বল 🟡', 'White Ball ⚪ ➔ Yellow Ball 🟡')}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{t('এক্সচেঞ্জ রেট: ৩ সাদা বল = ১ হলুদ বল', 'Rate: 3 White Balls = 1 Yellow Ball')}</p>
                </div>
              </div>

              <div 
                onClick={() => { setConvertType('red_to_yellow'); setConvertAmount(''); }}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${convertType === 'red_to_yellow' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">🔴</div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100">{t('লাল বল 🔴 ➔ হলুদ বল 🟡', 'Red Ball 🔴 ➔ Yellow Ball 🟡')}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{t('এক্সচেঞ্জ রেট: ১০ লাল বল = ১ হলুদ বল', 'Rate: 10 Red Balls = 1 Yellow Ball')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConvert} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('রূপান্তরের পরিমাণ লিখুন', 'ENTER AMOUNT')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-black"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    {convertType === 'taka_to_red' ? 'Taka' : convertType === 'white_to_yellow' ? 'White' : 'Red'}
                  </span>
                </div>
              </div>

              {/* Dynamic conversion calculator feedback */}
              {Number(convertAmount) > 0 && (() => {
                const chargePercent = convertType === 'taka_to_red' ? 3 : 5;
                const chargeRate = convertType === 'taka_to_red' ? 0.03 : 0.05;
                const calculatedCharge = Number(convertAmount) * chargeRate;
                const totalDeduction = Number(convertAmount) * (1 + chargeRate);

                return (
                  <div className="p-4 bg-indigo-50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-2 text-xs text-indigo-900 dark:text-indigo-300 font-black">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-indigo-600" size={16} />
                      <span>
                        {convertType === 'taka_to_red' && t(`আপনি ${convertAmount} টাকা কনভার্ট করে পাবেন ${convertAmount} লাল বল 🔴`, `You will get ${convertAmount} Red Balls 🔴 for ${convertAmount} Taka`)}
                        {convertType === 'white_to_yellow' && t(`আপনি ${convertAmount} সাদা বল কনভার্ট করে পাবেন ${Math.floor(Number(convertAmount) / 3)} হলুদ বল 🟡`, `You will get ${Math.floor(Number(convertAmount) / 3)} Yellow Balls 🟡 for ${convertAmount} White Balls`)}
                        {convertType === 'red_to_yellow' && t(`আপনি ${convertAmount} লাল বল কনভার্ট করে পাবেন ${Math.floor(Number(convertAmount) / 10)} হলুদ বল 🟡`, `You will get ${Math.floor(Number(convertAmount) / 10)} Yellow Balls 🟡 for ${convertAmount} Red Balls`)}
                      </span>
                    </div>
                    <div className="border-t border-indigo-100 dark:border-slate-700/50 pt-2 mt-1 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{t('পরিমাণ:', 'Base Amount:')}</span>
                        <span>{convertAmount} {convertType === 'taka_to_red' ? t('টাকা', 'Taka') : convertType === 'white_to_yellow' ? t('সাদা বল', 'White Balls') : t('লাল বল', 'Red Balls')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-rose-500">
                        <span>{t(`সার্ভিস চার্জ (${chargePercent}%):`, `Service Charge (${chargePercent}%):`)}</span>
                        <span>{calculatedCharge.toFixed(2)} {convertType === 'taka_to_red' ? t('টাকা', 'Taka') : convertType === 'white_to_yellow' ? t('সাদা বল', 'White Balls') : t('লাল বল', 'Red Balls')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-800 dark:text-slate-100 border-t border-dashed border-indigo-200 dark:border-slate-700 pt-1">
                        <span>{t('মোট কর্তনযোগ্য:', 'Total Deduction:')}</span>
                        <span>{totalDeduction.toFixed(2)} {convertType === 'taka_to_red' ? t('টাকা', 'Taka') : convertType === 'white_to_yellow' ? t('সাদা বল', 'White Balls') : t('লাল বল', 'Red Balls')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={isConverting || !convertAmount || Number(convertAmount) <= 0}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {isConverting ? '...' : t('কনভার্ট সম্পন্ন করুন', 'COMPLETE CONVERSION')}
              </button>
            </form>
          </div>
        </div>

        {/* Daily Quests & History */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quests */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <TrendingUp className="text-indigo-600" />
                {t('বল গেম ডেইলি কুইস্ট', 'DAILY QUESTS')}
              </h3>
              <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Resets Daily
              </div>
            </div>

            <div className="space-y-4">
              {dailyQuests.map((quest) => (
                <div 
                  key={quest.id}
                  className={`group p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${
                    quest.completed 
                    ? 'bg-emerald-50/50 border-emerald-100 opacity-60' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-600 shadow-sm hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${quest.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <quest.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{quest.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {quest.subtitle}
                      </p>
                    </div>
                  </div>

                  {quest.completed ? (
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <ChevronRight size={18} />
                    </div>
                  ) : (
                    <button 
                      onClick={quest.action}
                      disabled={isCheckingIn}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isCheckingIn ? '...' : t('ক্লেম করুন', 'CLAIM')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Package buying via Red Balls */}
          {userType !== 'client' && (
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] border border-slate-800 shadow-xl">
              <h3 className="text-lg font-black uppercase tracking-tight mb-2 flex items-center gap-3">
                <Gift className="text-rose-500" />
                {t('লাল বল দিয়ে সাবস্ক্রিপশন', 'ACTIVATE PLAN WITH RED BALLS')}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{t('লাল বল দিয়ে সরাসরি সাবস্ক্রিপশন সক্রিয় করুন', 'DIRECT PLAN ACTIVATION')}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subPlans.map((plan) => (
                  <div key={plan.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 mb-2">{plan.title}</h4>
                      <p className="text-3xl font-black text-rose-400">{plan.cost} <span className="text-xs font-normal text-slate-400">🔴</span></p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">{plan.validity}</p>
                    </div>
                    <button
                      onClick={() => handleBuySubscription(plan)}
                      disabled={isSubscribing || redBalls < plan.cost}
                      className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 disabled:opacity-40 transition-all"
                    >
                      {isSubscribing ? '...' : t('অ্যাক্টিভেট করুন', 'ACTIVATE')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points History */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
              <History className="text-indigo-600" />
              {t('ট্রানজ্যাকশন হিস্টোরি', 'TRANSACTION HISTORY')}
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 opacity-50">
                  <History size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">{t('সম্প্রতি কোনো ট্রানজ্যাকশন নেই', 'NO RECENT TRANSACTIONS')}</p>
                </div>
              ) : (
                transactions.map((tx: any) => (
                  <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-600">
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {tx.created_at?.toDate ? tx.created_at.toDate().toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Viewer Modal */}
      <AnimatePresence>
        {showAdViewer && (
          <FullscreenAdViewer
            language={language}
            userType="lawyer"
            onClose={() => setShowAdViewer(false)}
            onPointsEarned={async () => {
              try {
                const res = await fetchWithAuth('/api/balls/earn-white', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                  // Increment ad watch count
                  const todayStr = new Date().toDateString();
                  const nextCount = adWatchCount + 1;
                  setAdWatchCount(nextCount);
                  
                  const userRef = doc(db, 'users', auth.currentUser!.uid);
                  await updateDoc(userRef, {
                    adWatchCount: nextCount,
                    lastAdWatchReset: todayStr
                  });

                  alert(t('অভিনন্দন! আপনি বিজ্ঞাপন দেখে ১ টি সাদা বল পেয়েছেন।', 'Congratulations! You successfully watched the ad and earned 1 White Ball.'));
                  fetchHistoryAndStatus();
                } else {
                  alert(data.error || 'সাদা বল যোগ করতে ব্যর্থ হয়েছে।');
                }
              } catch (err: any) {
                console.error(err);
                alert('ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
              }
            }}
          />
        )}

        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDepositModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDepositModal(false)}
                className="absolute right-6 top-6 p-2 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Wallet className="text-indigo-600" />
                  {t('ডিপোজিট ব্যালেন্স', 'DEPOSIT BALANCE')}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {t('আপনার ওয়ালেটে টাকা এড করুন', 'ADD FUNDS TO YOUR WALLET')}
                </p>
              </div>

              {/* Deposit Method Select */}
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setDepositType('online')}
                  className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${depositType === 'online' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  {t('অনলাইন পেমেন্ট', 'ONLINE PAYMENT')}
                </button>
                <button
                  type="button"
                  onClick={() => setDepositType('manual')}
                  className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${depositType === 'manual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  {t('ম্যানুয়াল সেন্ড মানি', 'MANUAL SEND MONEY')}
                </button>
              </div>

              {depositType === 'online' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('ডিপোজিটের পরিমাণ লিখুন (টাকা)', 'ENTER AMOUNT (TAKA)')}</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">৳</span>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-black"
                      />
                    </div>
                  </div>

                  {Number(depositAmount) > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span>{t('ডিপোজিট পরিমাণ:', 'Deposit Amount:')}</span>
                        <span>৳{Number(depositAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-rose-500">
                        <span>{t('সার্ভিস চার্জ (৩%):', 'Service Charge (3%):')}</span>
                        <span>৳{(Number(depositAmount) * 0.03).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5">
                        <span>{t('মোট পরিশোধযোগ্য:', 'Total Payable:')}</span>
                        <span>৳{(Number(depositAmount) * 1.03).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleOnlineDeposit}
                    disabled={isDepositing || !depositAmount || Number(depositAmount) <= 0}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {isDepositing ? '...' : t('অনলাইনে পে করুন (SSLCommerz)', 'PAY ONLINE (SSLCommerz)')}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wide">
                    {t('* অনলাইন পেমেন্ট সফল হলে টাকা সরাসরি ব্যালেন্সে যোগ হবে।', '* Online payment gets instantly credited to your wallet balance.')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleManualDeposit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('পেমেন্ট গেটওয়ে সিলেক্ট করুন', 'SELECT MANUAL PAYMENT METHOD')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        onClick={() => setManualMethod('bkash')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${manualMethod === 'bkash' ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <span className="font-black text-pink-600 text-sm">bKash</span>
                      </div>
                      <div
                        onClick={() => setManualMethod('nagad')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${manualMethod === 'nagad' ? 'border-orange-500 bg-orange-50/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <span className="font-black text-orange-600 text-sm">Nagad</span>
                      </div>
                      <div
                        onClick={() => setManualMethod('rocket')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${manualMethod === 'rocket' ? 'border-purple-500 bg-purple-50/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                      >
                        <span className="font-black text-purple-600 text-sm">Rocket</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment instructions */}
                  <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-indigo-100 dark:border-slate-800 text-center">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      {t('নিচের পার্সোনাল নম্বরে সেন্ড মানি করুন:', 'Please Send Money to this Personal Number:')}
                    </p>
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border-2 border-indigo-100 dark:border-slate-800 inline-block">
                      <span className="font-black text-xl tracking-wider text-indigo-600">01626824282</span>
                    </div>
                    {Number(depositAmount) > 0 && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-black">
                        {t('সার্ভিস চার্জ সহ মোট ', 'Total with service charge: ')} ৳{(Number(depositAmount) * 1.03).toFixed(2)} {t('টাকা সেন্ড মানি করুন', 'Taka Send Money')}
                      </p>
                    )}
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-2 font-black uppercase tracking-wider">
                      {manualMethod.toUpperCase()} PERSONAL ACCOUNT
                    </p>
                  </div>

                  {/* Input form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('ডিপোজিটের পরিমাণ (টাকা)', 'DEPOSIT AMOUNT (TAKA)')}</label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                      />
                    </div>

                    {Number(depositAmount) > 0 && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span>{t('ডিপোজিট পরিমাণ:', 'Deposit Amount:')}</span>
                          <span>৳{Number(depositAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-rose-500">
                          <span>{t('সার্ভিস চার্জ (৩%):', 'Service Charge (3%):')}</span>
                          <span>৳{(Number(depositAmount) * 0.03).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5">
                          <span>{t('মোট সেন্ড মানি করুন:', 'Total to Send:')}</span>
                          <span className="text-indigo-600 dark:text-indigo-400">৳{(Number(depositAmount) * 1.03).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('যে নম্বর থেকে সেন্ড মানি করেছেন', 'SENDER MOBILE NUMBER')}</label>
                      <input
                        type="tel"
                        value={manualSenderNumber}
                        onChange={(e) => setManualSenderNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('ট্রানজ্যাকশন আইডি (Transaction ID)', 'TRANSACTION ID')}</label>
                      <input
                        type="text"
                        value={manualTxId}
                        onChange={(e) => setManualTxId(e.target.value)}
                        placeholder="e.g. 9A8B7C6D"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold font-mono tracking-wider uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isDepositing || !depositAmount || !manualSenderNumber || !manualTxId}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {isDepositing ? '...' : t('রিকোয়েস্ট সাবমিট করুন', 'SUBMIT DEPOSIT REQUEST')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
