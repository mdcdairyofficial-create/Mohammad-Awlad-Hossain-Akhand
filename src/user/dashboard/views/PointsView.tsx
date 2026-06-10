import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../../firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
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

interface PointsViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  userPoints: number;
  onPointsUpdate: (newPoints: number) => void;
}

export const PointsView = ({ language, userPoints, onPointsUpdate }: PointsViewProps) => {
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  useEffect(() => {
    const checkCheckInStatus = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
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
      }
    };
    checkCheckInStatus();
  }, []);

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
      alert(t(`অভিনন্দন! আপনি ${reward} ডেইলি বোনাস পয়েন্ট পেয়েছেন।`, `Congratulations! You earned ${reward} daily bonus points.`));
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const dailyQuests = [
    { id: 1, title: t('ডেইলি চেক-ইন', 'Daily Check-in'), points: 50, icon: Calendar, completed: !canCheckIn, action: handleCheckIn },
    { id: 2, title: t('৩টি বিজ্ঞাপন দেখা', 'Watch 3 Ads'), points: 30, icon: Zap, completed: false, subtitle: '0/3' },
    { id: 3, title: t('একটি কন্টেন্ট শেয়ার করা', 'Share a Content'), points: 20, icon: Star, completed: false },
  ];

  const rewards = [
    { id: 'special_pack', title: t('স্পেশাল ফ্রি প্যাক', 'Special Free Pack'), cost: 500, icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50', unlockable: true },
    { id: 'ai', title: t('এআই অ্যাসিস্ট্যান্ট আনলিমিটেড', 'AI Assistant Unlimited'), cost: 500, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'premium', title: t('৭ দিন প্রিমিয়াম মেম্বারশিপ', '7 Days Premium'), cost: 2000, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'ad', title: t('নিজস্ব বিজ্ঞাপন প্রচার', 'Run Own Ad'), cost: 5000, icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const handleRedeem = async (reward: any) => {
    if (userPoints < reward.cost) {
      alert(t('আপনার পর্যাপ্ত পয়েন্ট নেই।', 'Not enough points.'));
      return;
    }
    try {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      await setDoc(userRef, {
        points: increment(-reward.cost),
        [`unlockedRewards.${reward.id}`]: true,
      }, { merge: true });
      onPointsUpdate(userPoints - reward.cost);
      alert(t('অভিনন্দন! আপনি স্পেশাল প্যাক আনলক করেছেন।', 'Congratulations! You unlocked the special pack.'));
    } catch (e) {
      console.error(e);
      alert('Error redeeming reward.');
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
                Resets in 12h
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
            
            <div className="flex flex-col items-center justify-center py-12 text-slate-300 opacity-50">
              <History size={48} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">{t('সম্প্রতি কোনো ট্রানজ্যাকশন নেই', 'NO RECENT TRANSACTIONS')}</p>
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
    </div>
  );
};
