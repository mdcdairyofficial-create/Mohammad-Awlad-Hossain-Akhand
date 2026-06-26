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
  addDoc
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
  Star
} from 'lucide-react';
import { FullscreenAdViewer } from '../components/FullscreenAdViewer';

interface PointsViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  userPoints: number;
  onPointsUpdate: (newPoints: number) => void;
}

export const PointsView = ({ language, userPoints, onPointsUpdate }: PointsViewProps) => {
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adWatchCount, setAdWatchCount] = useState(0);
  const [hasSharedToday, setHasSharedToday] = useState(false);
  const [showAdViewer, setShowAdViewer] = useState(false);

  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  // Fetch Point Transactions & Status
  const fetchHistoryAndStatus = async () => {
    if (!auth.currentUser) return;
    try {
      // Fetch History
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

      // Fetch User Status
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // 1. Check-In Status
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

        // 2. Ad Watch count for today
        const todayStr = new Date().toDateString();
        const lastAdReset = data.lastAdWatchReset;
        let watchCount = 0;
        if (lastAdReset === todayStr) {
          watchCount = data.adWatchCount || 0;
        } else {
          // Reset daily count in DB
          await updateDoc(userRef, {
            adWatchCount: 0,
            lastAdWatchReset: todayStr
          });
        }
        setAdWatchCount(watchCount);

        // 3. Share status for today
        setHasSharedToday(data.lastShareDate === todayStr);
      }
    } catch (error) {
      console.error('Error fetching history/status:', error);
    }
  };

  useEffect(() => {
    fetchHistoryAndStatus();
  }, [userPoints]);

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
      const reward = 50; // Daily check-in reward
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        points: increment(reward),
        lastCheckIn: serverTimestamp(),
      }, { merge: true });
      
      onPointsUpdate(userPoints + reward);
      setCanCheckIn(false);
      
      await logTransaction(reward, t('ডেইলি চেক-ইন বোনাস', 'Daily check-in bonus'));
      alert(t(`অভিনন্দন! আপনি ${reward} ডেইলি বোনাস পয়েন্ট পেয়েছেন।`, `Congratulations! You earned ${reward} daily bonus points.`));
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
      alert(t('আপনার রেফারেল লিংক ক্লিপবোর্ডে কপি হয়েছে! এটি বন্ধুদের সাথে শেয়ার করুন এবং ২৫০ পয়েন্ট পেতে পারেন।', 'Your referral link has been copied to clipboard! Share it to earn points.'));
      
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      const todayStr = new Date().toDateString();
      const reward = 20;

      await updateDoc(userRef, {
        points: increment(reward),
        lastShareDate: todayStr
      });

      onPointsUpdate(userPoints + reward);
      setHasSharedToday(true);
      await logTransaction(reward, t('কন্টেন্ট শেয়ার করার পয়েন্ট', 'Earned from sharing content'));
    } catch (err) {
      console.error('Failed to copy/share:', err);
      alert(t('শেয়ার করতে ব্যর্থ হয়েছে।', 'Failed to share.'));
    }
  };

  const dailyQuests = [
    { id: 1, title: t('ডেইলি চেক-ইন', 'Daily Check-in'), points: 50, icon: Calendar, completed: !canCheckIn, action: handleCheckIn },
    { id: 2, title: t('৩টি বিজ্ঞাপন দেখা', 'Watch 3 Ads'), points: 30, icon: Zap, completed: adWatchCount >= 3, subtitle: `${adWatchCount}/3`, action: handleWatchAd },
    { id: 3, title: t('একটি কন্টেন্ট শেয়ার করা', 'Share a Content'), points: 20, icon: Star, completed: hasSharedToday, action: handleShare },
  ];

  const rewards = [
    { id: 'special_pack', title: t('স্পেশাল ফ্রি প্যাক', 'Special Free Pack'), cost: 500, icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'ai', title: t('এআই অ্যাসিস্ট্যান্ট আনলিমিটেড', 'AI Assistant Unlimited'), cost: 500, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'premium', title: t('৭ দিন প্রিমিয়াম মেম্বারশিপ', '7 Days Premium'), cost: 2000, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'ad', title: t('নিজস্ব বিজ্ঞাপন প্রচার', 'Run Own Ad'), cost: 5000, icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const handleRedeem = async (reward: any) => {
    if (!auth.currentUser) return;
    if (userPoints < reward.cost) {
      alert(t('আপনার পর্যাপ্ত পয়েন্ট নেই।', 'Not enough points.'));
      return;
    }
    
    const confirmRedeem = window.confirm(
      t(
        `আপনি কি নিশ্চিত যে ${reward.cost} পয়েন্ট দিয়ে "${reward.title}" নিতে চান?`,
        `Are you sure you want to redeem "${reward.title}" for ${reward.cost} points?`
      )
    );
    if (!confirmRedeem) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      let updatePayload: any = {
        points: increment(-reward.cost),
        [`unlockedRewards.${reward.id}`]: true,
      };

      if (reward.id === 'special_pack' || reward.id === 'ai') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updatePayload.subscription_package = 'special';
        updatePayload.subscription_end_date = nextMonth.toISOString();
      } else if (reward.id === 'premium') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        updatePayload.subscription_package = 'premium';
        updatePayload.subscription_end_date = nextWeek.toISOString();
      }

      await setDoc(userRef, updatePayload, { merge: true });
      onPointsUpdate(userPoints - reward.cost);
      
      await logTransaction(-reward.cost, t(`রিওয়ার্ড স্টোর: ${reward.title}`, `Redeemed: ${reward.title}`));
      
      alert(
        t(
          `অভিনন্দন! আপনি সফলভাবে "${reward.title}" আনলক করেছেন।`,
          `Congratulations! You have successfully unlocked "${reward.title}".`
        )
      );
    } catch (e) {
      console.error(e);
      alert(t('রিডিম করতে ব্যর্থ হয়েছে।', 'Failed to redeem.'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 dark:text-white uppercase tracking-tight leading-none mb-2">
            {t('পয়েন্ট ও রিওয়ার্ড', 'POINTS & REWARDS')}
          </h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">
            {t('পয়েন্ট অর্জন করুন এবং আকর্ষণীয় রিওয়ার্ড আনলক করুন', 'EARN POINTS AND UNLOCK EXCITING REWARDS')}
          </p>
        </div>
        
        <div className="bg-indigo-600 text-white px-8 py-4 rounded-[2rem] shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Award size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('আপনার ব্যালেন্স', 'YOUR BALANCE')}</p>
            <p className="text-2xl font-black">{userPoints.toLocaleString()} <span className="text-sm opacity-80">Pts</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Quests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-indigo-950 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <TrendingUp className="text-indigo-600" />
                {t('ডেইলি কুইস্ট', 'DAILY QUESTS')}
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
                        {quest.subtitle || t(`অর্জন করুন +${quest.points} পয়েন্ট`, `Earn +${quest.points} Pts`)}
                      </p>
                    </div>

                  </div>
                  {quest.completed ? (
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                      <ChevronRight size={18} />
                    </div>
                  ) : quest.action ? (
                    <button 
                      onClick={quest.action}
                      disabled={isCheckingIn}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isCheckingIn ? '...' : t('ক্লেম করুন', 'CLAIM')}
                    </button>
                  ) : (
                    <div className="text-slate-300">
                      <ChevronRight size={24} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Points History */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-indigo-950 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
              <History className="text-indigo-600" />
              {t('পয়েন্ট ট্রানজ্যাকশন', 'POINTS HISTORY')}
            </h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300 opacity-50">
                  <History size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">{t('সম্প্রতি কোনো ট্রানজ্যাকশন নেই', 'NO RECENT TRANSACTIONS')}</p>
                </div>
              ) : (
                transactions.map((tx: any) => (
                  <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'}`}>
                        <Award size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          {tx.created_at?.toDate ? tx.created_at.toDate().toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Redemption Store */}
        <div className="space-y-6">
          <div className="bg-indigo-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <Gift size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{t('রিওয়ার্ড স্টোর', 'REWARD STORE')}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">{t('আপনার পয়েন্ট ব্যবহার করুন', 'SPEND YOUR POINTS HERE')}</p>
              
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <button 
                    key={reward.id}
                    onClick={() => handleRedeem(reward)}
                    className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-[2rem] flex items-center justify-between hover:bg-white/10 hover:border-indigo-400 transition-all group/btn"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${reward.bg} ${reward.color} rounded-2xl flex items-center justify-center group-hover/btn:scale-110 transition-transform`}>
                        <reward.icon size={24} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm leading-tight">{reward.title}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <Award size={12} className="text-amber-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reward.cost} Pts</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-600/10 blur-[100px] -ml-32 -mb-32"></div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Star size={20} />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('কিভাবে আরও অর্জন করবেন?', 'EARN MORE')}</h4>
            </div>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-tight">
                <Zap size={14} className="text-indigo-600" />
                {t('প্রতিটি ভিডিও অ্যাডে ৫ পয়েন্ট', '5 Pts per video ad')}
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-tight">
                <Zap size={14} className="text-indigo-600" />
                {t('রেফারেল প্রতি ৫০ পয়েন্ট', '50 Pts per referral')}
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-tight">
                <Zap size={14} className="text-indigo-600" />
                {t('টাস্ক কমপ্লিট করলে বোনাস', 'Bonus for task completion')}
              </li>
            </ul>
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
            onPointsEarned={async (earned) => {
              const nextCount = adWatchCount + 1;
              setAdWatchCount(nextCount);
              
              const userRef = doc(db, 'users', auth.currentUser!.uid);
              const todayStr = new Date().toDateString();
              
              let bonus = 0;
              if (nextCount === 3) {
                bonus = 30; // 30 points bonus
              }

              await updateDoc(userRef, {
                points: increment(earned + bonus),
                adWatchCount: nextCount,
                lastAdWatchReset: todayStr
              });

              onPointsUpdate(userPoints + earned + bonus);
              
              await logTransaction(earned, t('বিজ্ঞাপন দেখার জন্য পয়েন্ট', 'Earned from watching ad'));
              if (bonus > 0) {
                await logTransaction(bonus, t('৩টি বিজ্ঞাপন দেখার বোনাস', 'Bonus for watching 3 ads'));
                alert(t('অভিনন্দন! আপনি ৩টি বিজ্ঞাপন সফলভাবে দেখেছেন এবং অতিরিক্ত ৩০ বোনাস পয়েন্ট পেয়েছেন।', 'Congratulations! You successfully watched 3 ads and received 30 bonus points.'));
              } else {
                alert(t(`আপনি বিজ্ঞাপন দেখে ${earned} পয়েন্ট অর্জন করেছেন।`, `You earned ${earned} points from watching the ad.`));
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
