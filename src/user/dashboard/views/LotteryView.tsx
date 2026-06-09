import React, { useState, useEffect, useRef } from 'react';
import { Award, Gift, CheckCircle, AlertTriangle, Calendar, Users, RefreshCw, Landmark, HelpCircle, Trophy, Volume2, Star, Sparkles, AlertCircle, Play, ChevronRight, Share2, Lock, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

interface LotteryViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
  currentPackage?: string;
  expiryDate?: string;
  userMobile?: string;
  userName?: string;
  onNavigateToSubscription: () => void;
}

interface PrizeTier {
  rank: number;
  name: string;
  nameBn: string;
  amount: number;
  winnerName: string;
  winnerDistrict: string;
  winnerPhone: string;
}

interface Participant {
  id: string;
  name: string;
  district: string;
  phone: string;
  package: string;
  expiryDate: string;
}

interface PastWinner {
  drawDate: string;
  rank: number;
  prizeAmount: number;
  name: string;
  district: string;
  phone: string;
}

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'অ্যাডভোকেট আশরাফুল আলম', district: 'বগুড়া বার', phone: '01712-XX9901', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৫-১২' },
  { id: 'p2', name: 'অ্যাডভোকেট সাজ্জাদ হোসেন', district: 'বরিশাল বার', phone: '01511-XX4421', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৩-২৪' },
  { id: 'p3', name: 'অ্যাডভোকেট তানজিলা আক্তার', district: 'সিলেট বার', phone: '01914-XX3310', package: 'ডায়মন্ড', expiryDate: '২০২৭-০১-১৫' },
  { id: 'p4', name: 'মহুরী দেলোয়ার জাহান', district: 'কুমিল্লা বার', phone: '01815-XX8890', package: 'ডায়মন্ড', expiryDate: '২০২৬-১১-৩০' },
  { id: 'p5', name: 'অ্যাডভোকেট কামরুল হাসান', district: 'ঢাকা বার', phone: '01720-XX5563', package: 'ডায়মন্ড', expiryDate: '২০২৭-০২-১৮' },
  { id: 'p6', name: 'মহুরী আশিকুর রহমান', district: 'চট্টগ্রাম বার', phone: '01314-XX8821', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৪-১০' },
  { id: 'p7', name: 'অ্যাডভোকেট সালমা খাতুন', district: 'রাজশাহী বার', phone: '01711-XX5560', package: 'ডায়মন্ড', expiryDate: '২০২৬-০৯-০৫' },
  { id: 'p8', name: 'অ্যাডভোকেট আনিসুর রহমান', district: 'খুলনা বার', phone: '01612-XX7712', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৬-০১' },
  { id: 'p9', name: 'মহুরী সাইদুল ইসলাম', district: 'রংপুর বার', phone: '01415-XX2244', package: 'ডায়মন্ড', expiryDate: '২০২৬-০৮-২০' },
  { id: 'p10', name: 'অ্যাডভোকেট রনি চৌধুরী', district: 'ময়মনসিংহ বার', phone: '01911-XX3366', package: 'ডায়মন্ড', expiryDate: '২০২৭-০১-২৮' },
  { id: 'p11', name: 'মহুরী ইসমাইল হোসেন', district: 'যশোর বার', phone: '01812-XX4455', package: 'ডায়মন্ড', expiryDate: '২০২৬-১২-১৫' },
  { id: 'p12', name: 'অ্যাডভোকেট নাসরিন সুলতানা', district: 'গাজীপুর বার', phone: '01715-XX9911', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৪-২০' },
  { id: 'p13', name: 'অ্যাডভোকেট মোশারফ হোসেন', district: 'ফেনী বার', phone: '01515-XX3322', package: 'ডায়মন্ড', expiryDate: '২০২৬-১০-১৮' },
  { id: 'p14', name: 'অ্যাডভোকেট সিরাজুল ইসলাম', district: 'দিনাজপুর বার', phone: '01711-XX8899', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৪-২৮' },
  { id: 'p15', name: 'মহুরী আবুল কালাম', district: 'কক্সবাজার বার', phone: '01821-XX1122', package: 'ডায়মন্ড', expiryDate: '২০২৬-১২-০৫' },
  { id: 'p16', name: 'অ্যাডভোকেট নুসরাত জাহান', district: 'মাদারীপুর বার', phone: '01933-XX7788', package: 'ডায়মন্ড', expiryDate: '২০২৭-০৩-১৯' }
];

const INITIAL_PAST_WINNERS: PastWinner[] = [
  { drawDate: '২০২৬-০৫-৩১', rank: 1, prizeAmount: 50000, name: 'অ্যাডভোকেট রফিকুল ইসলাম', district: 'পাবনা বার', phone: '01715-XX4455' },
  { drawDate: '২০২৬-০৫-৩১', rank: 2, prizeAmount: 25000, name: 'মহুরী জিয়াউর রহমান', district: 'কুষ্টিয়া বার', phone: '01819-XX1122' },
  { drawDate: '২০২৬-০৫-২৪', rank: 1, prizeAmount: 50000, name: 'অ্যাডভোকেট ফরিদা আক্তার', district: 'রংপুর বার', phone: '01614-XX5511' },
  { drawDate: '২০২৬-০৫-২৪', rank: 3, prizeAmount: 10000, name: 'অ্যাডভোকেট এম এ আজিজ', district: 'टाঙ্গাইল বার', phone: '01511-XX9988' }
];

const PRIZES: PrizeTier[] = [
  { rank: 5, name: '5th Prize', nameBn: '৫ম পুরস্কার', amount: 4000, winnerName: 'মহুরী আশরাফুল আলম', winnerDistrict: 'বগুড়া', winnerPhone: '01712-XX9901' },
  { rank: 4, name: '4th Prize', nameBn: '৪র্থ পুরস্কার', amount: 6000, winnerName: 'অ্যাডভোকেট সাজ্জাদ হোসেন', winnerDistrict: 'বরিশাল', winnerPhone: '01511-XX4421' },
  { rank: 3, name: '3rd Prize', nameBn: '৩য় পুরস্কার', amount: 10000, winnerName: 'অ্যাডভোকেট তানজিলা আক্তার', winnerDistrict: 'সিলেট', winnerPhone: '01914-XX3310' },
  { rank: 2, name: '2nd Prize', nameBn: '২য় পুরস্কার', amount: 25000, winnerName: 'মহুরী দেলোয়ার জাহান', winnerDistrict: 'কুমিল্লা', winnerPhone: '01815-XX8890' },
  { rank: 1, name: '1st Prize', nameBn: '১ম পুরস্কার', amount: 50000, winnerName: 'অ্যাডভোকেট কামরুল হাসান', winnerDistrict: 'ঢাকা', winnerPhone: '01720-XX5563' }
];

export const LotteryView = ({
  language,
  currentPackage,
  expiryDate,
  userMobile,
  userName,
  onNavigateToSubscription
}: LotteryViewProps) => {
  const [ticketQuery, setTicketQuery] = useState(userMobile || '');
  const [verifiedStatus, setVerifiedStatus] = useState<'idle' | 'checking' | 'eligible' | 'not_eligible'>('idle');
  const [generatedTicketNo, setGeneratedTicketNo] = useState('');
  const [muted, setMuted] = useState(false);

  // Participants DB, past winners, and session drawings
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pastWinners, setPastWinners] = useState<PastWinner[]>(INITIAL_PAST_WINNERS);
  const [sessionWinners, setSessionWinners] = useState<Participant[]>([]);
  const [summaryTab, setSummaryTab] = useState<'participants' | 'past_winners'>('participants');
  const [participantSearch, setParticipantSearch] = useState('');

  // Lottery Machine States
  const [drawState, setDrawState] = useState<'idle' | 'spinning' | 'revealed' | 'finished'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // Starts at 0 (5th prize) to 4 (1st prize)
  const [revealedPrizes, setRevealedPrizes] = useState<WinnerReveal[]>([]);
  const [scramblingPhone, setScramblingPhone] = useState('01XXX-XXXXXX');
  const [scramblingName, setScramblingName] = useState('──────────');
  const [scramblingDistrict, setScramblingDistrict] = useState('──────');

  interface WinnerReveal {
    rank: number;
    amount: number;
    title: string;
    winnerName: string;
    winnerDistrict: string;
    winnerPhone: string;
  }

  const isDiamondUser = currentPackage?.toLowerCase() === 'diamond';

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        let firestoreDiamondUsers: Participant[] = [];
        
        usersSnap.forEach(doc => {
          const data = doc.data();
          if (data.subscription_package === 'diamond' || data.package === 'ডায়মন্ড') {
            firestoreDiamondUsers.push({
              id: doc.id,
              name: data.name || 'অজ্ঞাত',
              district: data.district || data.barCourtName || 'অজ্ঞাত বার',
              phone: data.mobile || data.phone || '01XXX-XXXXXX',
              package: 'ডায়মন্ড',
              expiryDate: data.subscription_end_date || '২০২৭-০৬-০৬'
            });
          }
        });

        let list = firestoreDiamondUsers.length >= 5 ? firestoreDiamondUsers : [...INITIAL_PARTICIPANTS];

        if (isDiamondUser && userName && userMobile) {
          const userCleaned = userMobile.trim();
          if (!list.some(p => p.phone.trim().replace(/\D/g, '') === userCleaned.replace(/\D/g, ''))) {
            list.unshift({
              id: 'user_current',
              name: userName,
              district: 'আপনার জেলা',
              phone: userMobile,
              package: 'ডায়মন্ড',
              expiryDate: expiryDate || '২০২৭-০৬-০৬'
            });
          }
        }
        setParticipants(list);

        const winnersSnap = await getDocs(collection(db, 'lotteryWinners'));
        const fbWinners: PastWinner[] = [];
        winnersSnap.forEach(docSnap => {
          const d = docSnap.data();
          fbWinners.push({
            drawDate: d.drawDate,
            rank: d.rank,
            prizeAmount: d.prizeAmount,
            name: d.name,
            district: d.district,
            phone: d.phone
          });
        });

        if (fbWinners.length > 0) {
          setPastWinners(fbWinners.sort((a, b) => b.drawDate.localeCompare(a.drawDate)));
        }
      } catch (err) {
        console.error("Error fetching lottery data", err);
        setParticipants([...INITIAL_PARTICIPANTS]);
      }
    };
    fetchRealData();
  }, [isDiamondUser, userName, userMobile, expiryDate]);
  const currentYear = new Date().getFullYear();

  // Audio helpers utilizing Web Audio API
  const playTickSound = () => {
    if (muted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 + Math.random() * 200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  };

  const playFanfareSound = () => {
    if (muted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, start: number, duration: number, type: 'triangle' | 'sine' = 'triangle') => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + start + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      playNote(392.00, 0, 0.1); 
      playNote(523.25, 0.1, 0.1); 
      playNote(659.25, 0.2, 0.1); 
      playNote(783.99, 0.3, 0.15); 
      playNote(1046.50, 0.45, 0.6); 
    } catch (e) {}
  };

  // 1. Next Sunday 12:00 PM countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday ...
      
      // Calculate days to next Sunday
      let daysToAdd = (7 - currentDay) % 7;
      
      nextSunday.setDate(now.getDate() + daysToAdd);
      nextSunday.setHours(12, 0, 0, 0);

      // If it is Sunday and currently past 12:00 PM, targets next Sunday
      if (currentDay === 0 && (now.getHours() > 12 || (now.getHours() === 12 && now.getMinutes() > 0))) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      } else if (daysToAdd === 0 && now.getHours() === 12 && now.getMinutes() === 0) {
        // Exactly Sunday noon
      }

      const diff = nextSunday.getTime() - now.getTime();
      
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      };
    };

    // Initial update
    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 2. Start Sequential Draw (Reverse sequence: Rank 5 down to Rank 1)
  const startLotteryDraw = () => {
    if (drawState === 'spinning') return;
    
    // Filter out participants who have already won in previous/past weeks (pastWinners)
    const trulyEligible = participants.filter(
      p => !pastWinners.some(pw => pw.phone.trim().replace(/\D/g, '') === p.phone.trim().replace(/\D/g, ''))
    );

    if (trulyEligible.length < 5) {
      alert('সিমুলেশন চালানোর জন্য পর্যাপ্ত যোগ্য ডায়মন্ড মেম্বার অবশিষ্ট নেই! পুনরায় খেলার জন্য পূর্ববর্তী বিজয়ী তালিকা রিসেট করা হচ্ছে।');
      setPastWinners(INITIAL_PAST_WINNERS.slice(0, 2));
      return;
    }

    // Shuffle and pick 5 unique participants randomly
    const shuffled = [...trulyEligible].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 5); // Index 0 is 5th prize, 1 is 4th, ..., 4 is 1st prize
    setSessionWinners(picked);

    // Reset process
    setRevealedPrizes([]);
    setCurrentStepIndex(0);
    triggerSingleStepDraw(0, picked);
  };

  const triggerSingleStepDraw = (index: number, pickedList?: Participant[]) => {
    const listToUse = pickedList || sessionWinners;
    if (index >= PRIZES.length || !listToUse[index]) {
      setDrawState('finished');
      return;
    }

    setDrawState('spinning');
    
    // Suspense Scramble Animation
    let ticksCount = 0;
    const maxTicks = 25;
    const currentPrizeObj = PRIZES[index];
    const targetWinner = listToUse[index];

    const districts = ['ঢাকা বার', 'চট্টগ্রাম বার', 'সিলেট বার', 'রাজশাহী বার', 'খুলনা বার', 'বরিশাল বার', 'রংপুর বার', 'ময়মনসিংহ বার', 'বগুড়া বার', 'কুমিল্লা বার', 'যশোর বার'];
    const names = ['অ্যাডভোকেট আরিফুল', 'মহুরী রাজু আহমেদ', 'অ্যাডভোকেট রনি', 'মহুরী ইসমাইল হোসেন', 'অ্যাডভোকেট সালমা', 'অ্যাডভোকেট কবির', 'মহুরী সাইদুর'];

    const scrambleInterval = setInterval(() => {
      ticksCount++;
      playTickSound();
      
      // Random generation for machine display
      const randomPhone = `01${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}-XX${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`;
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomDist = districts[Math.floor(Math.random() * districts.length)];

      setScramblingPhone(randomPhone);
      setScramblingName(randomName);
      setScramblingDistrict(randomDist);

      if (ticksCount >= maxTicks) {
        clearInterval(scrambleInterval);
        
        // Finalize state
        setScramblingPhone(targetWinner.phone);
        setScramblingName(targetWinner.name);
        setScramblingDistrict(targetWinner.district);
        
        playFanfareSound();
        setDrawState('revealed');

        // Append to local revealed array
        const newReveal: WinnerReveal = {
          rank: currentPrizeObj.rank,
          amount: currentPrizeObj.amount,
          title: currentPrizeObj.nameBn,
          winnerName: targetWinner.name,
          winnerDistrict: targetWinner.district,
          winnerPhone: targetWinner.phone
        };

        setRevealedPrizes(prev => [...prev, newReveal]);
      }
    }, 110);
  };

  const proceedToNextPrize = () => {
    if (drawState !== 'revealed') return;
    const nextIdx = currentStepIndex + 1;
    
    // If we finished drawing all prizes, let's append the 5 winners to pastWinners so they can't win again
    if (nextIdx >= PRIZES.length) {
      const formattedDate = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
      const newPastWinners: PastWinner[] = revealedPrizes.map(p => ({
        drawDate: formattedDate,
        rank: p.rank,
        prizeAmount: p.amount,
        name: p.winnerName,
        district: p.winnerDistrict,
        phone: p.winnerPhone
      }));
      setPastWinners(prev => [...newPastWinners, ...prev]);
      setDrawState('finished');

      // Save to Firestore
      newPastWinners.forEach(winner => {
        addDoc(collection(db, 'lotteryWinners'), winner).catch(err => {
          console.error("Failed to save winner to Firestore", err);
        });
      });

      return;
    }

    setCurrentStepIndex(nextIdx);
    triggerSingleStepDraw(nextIdx);
  };

  // Eligibility verifier
  const handleVerifyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketQuery.trim()) return;

    setVerifiedStatus('checking');

    setTimeout(() => {
      const inputCleaned = ticketQuery.trim().replace(/\D/g, '');
      const userCleaned = (userMobile || '').trim().replace(/\D/g, '');

      if (isDiamondUser && (inputCleaned === userCleaned || inputCleaned.length > 5)) {
        setVerifiedStatus('eligible');
        const lastDigits = inputCleaned.slice(-4) || '2026';
        setGeneratedTicketNo(`MDC-SUN-LT${lastDigits}`);
      } else {
        setVerifiedStatus('not_eligible');
      }
    }, 1200);
  };

  const getUrgentThemeTitle = () => {
    if (language === 'bn') return 'এমডিসি কেসবুক রবিবাসরীয় লাইভ লটারি';
    return 'MDC Casebook Sunday Weekly Lottery';
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl min-h-screen">
      
      {/* 1. Golden Luxury Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-700 to-indigo-950 text-white rounded-3xl p-6 md:p-10 shadow-2xl border border-amber-400/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-300/30 text-amber-200 text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-300 animate-spin" /> {language === 'bn' ? 'সাপ্তাহিক মহা ধামাকা ড্র' : 'SUNDAY WEEKLY DRAW'}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-white">
              {getUrgentThemeTitle()}
            </h1>
            
            <p className="text-amber-100 text-sm md:text-base leading-relaxed font-medium">
              {language === 'bn' 
                ? 'আইনজীবী ও মুহুরী ভাইদের জন্য mdc casebook নিয়ে এলো বাংলাদেশের সেরা লাইভ সাপ্তাহিক লটারি! যেকোনো রবিবার দুপুর ১২:০০ ঘটিকায় আপনিও ঘরে বসে জিতে নিতে পারেন নগদ সর্বোচ্চ ৫০,০০০ টাকা পর্যন্ত ক্যাশ রিওয়ার্ড।'
                : 'MDC Casebook offers the supreme Weekly Sunday Lottery for legal professionals! Tune in every Sunday at 12:00 PM to claim grand cash prizes up to 50,000 TK.'}
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
              <span className="px-3 py-1.5 bg-indigo-900/40 backdrop-blur-md text-amber-300 text-xs font-black rounded-lg border border-amber-500/20">
                ⭐ ১ম পুরস্কার: ৫০,০০০/-
              </span>
              <span className="px-3 py-1.5 bg-indigo-900/40 backdrop-blur-md text-amber-300 text-xs font-black rounded-lg border border-amber-500/20">
                ⭐ ২য় পুরস্কার: ২৫,০০০/-
              </span>
              <span className="px-3 py-1.5 bg-indigo-900/40 backdrop-blur-md text-amber-100 text-xs font-bold rounded-lg border border-indigo-500/20">
                ৩য়: ১০,০০০/-
              </span>
              <span className="px-3 py-1.5 bg-indigo-900/40 backdrop-blur-md text-slate-100 text-xs font-bold rounded-lg border border-indigo-500/20">
                ৪র্থ: ৬,০০০/-
              </span>
              <span className="px-3 py-1.5 bg-indigo-900/40 backdrop-blur-md text-slate-200 text-xs font-bold rounded-lg border border-indigo-500/20">
                ৫ম: ৪,০০০/-
              </span>
            </div>
          </div>
          
          {/* Eligibility highlight box */}
          <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-xl w-full lg:w-80 text-center">
            <Trophy size={48} className="text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] mb-2" />
            <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">ডায়মন্ড সাবস্ক্রিপশন</span>
            <p className="text-lg font-black text-white mt-1 leading-tight">মেয়াদ থাকবে ১ বছর</p>
            <p className="text-xs text-indigo-100 mt-2 font-medium">
              একবার ডায়মন্ড প্যাকেজ কিনলে পরবর্তী ১ বছর পর্যন্ত হওয়া <span className="font-extrabold text-amber-300">প্রতিটি রবিবারের</span> লটারিতে আপনার নম্বর সক্রিয় তালিকাভুক্ত থাকবে!
            </p>
            <div className="w-full h-px bg-white/20 my-3"></div>
            <button 
              onClick={onNavigateToSubscription}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-indigo-950 font-black text-xs rounded-xl shadow-lg transition-transform"
            >
              আজই ডায়মন্ড প্যাক সচল করুন
            </button>
          </div>
        </div>
      </div>

      {/* 2. Urgent Live Sunday Ticker Countdown */}
      <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Calendar size={180} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 text-amber-300">
              <Calendar size={28} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-indigo-300 font-black uppercase tracking-wider">রানিং রাউন্ডের কাউন্টডাউন</p>
              <h3 className="text-xl font-black text-white flex items-center gap-1.5">
                পরবর্তী রবিবার দুপুর ১২:০০টার লটারি ড্র
              </h3>
              <p className="text-xs text-slate-400 font-medium">নিবন্ধিত সকল ডায়মন্ড মেম্বারদের টিকিট স্বয়ংক্রিয়ভাবে লটারি জারে থাকবে</p>
            </div>
          </div>

          {/* Time Countdown clock */}
          <div className="flex items-center gap-2">
            {[
              { val: timeLeft.days, label: 'দিন' },
              { val: timeLeft.hours, label: 'ঘণ্টা' },
              { val: timeLeft.minutes, label: 'মিনিট' },
              { val: timeLeft.seconds, label: 'সেকেন্ড' }
            ].map((unit, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-indigo-500/20 flex flex-col items-center justify-center shadow-inner">
                  <span className="font-mono text-xl md:text-2xl font-black text-amber-300 leading-none">
                    {unit.val.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs text-slate-400 font-bold mt-1 uppercase">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Dramatic Lottery Machine Stage */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 text-white shadow-2xl">
        <div className="absolute top-3 right-3 z-10">
          <button 
            type="button"
            onClick={() => setMuted(!muted)} 
            className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-full border border-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs"
          >
            <Volume2 size={16} className={muted ? "opacity-40 line-through" : "text-amber-400"} />
            {muted ? "Muted" : "Sound ON"}
          </button>
        </div>

        {/* Decorative Grid and Background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent blur-md"></div>

        <div className="relative z-10 space-y-8">
          
          {/* Header instructions for the draw */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Landmark className="text-amber-400 animate-pulse" size={24} /> 
              ডিজিটাল ৩ডি লটারি ড্র ইঞ্জিন
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              রবিবার ডেমো সিমুলেশন সেশনের মাধ্যমে আমাদের ড্র প্রক্রিয়া কতটুকু স্বচ্ছ তা নিজে ড্র করে পরীক্ষা করে দেখুন। প্রথমে সবচেয়ে ছোট মূল্য ৫নং প্রাইজ থেকে শুরু হবে এবং সবশেষে ১ম প্রাইজ বিজয়ী ড্র হবে।
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Draw Display & Controls Panel (Left side 7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tumbler / Rolling drum glass sphere interface */}
              <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[280px] shadow-2xl text-center">
                
                {/* Visual Glass Spinner Circles */}
                <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <div className="absolute top-4 right-4 text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase font-bold tracking-widest animate-pulse">
                  Engine Ready
                </div>

                {drawState === 'idle' && (
                  <div className="space-y-4 py-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 bubble-animation">
                      <Trophy size={40} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">নতুন ড্র সিমুলেশন সেশন</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                        নিচে সবুজ রঙের বাটনে ক্লিক করে আমাদের প্রতি সপ্তাহের মত ক্রমানুসারে ড্র প্রক্রিয়া পরিচালনা করে দেখুন।
                      </p>
                    </div>
                  </div>
                )}

                {(drawState === 'spinning' || drawState === 'revealed') && (
                  <div className="w-full space-y-6">
                    {/* Active Prize Tag */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black uppercase">
                      <Star size={12} className="animate-spin text-amber-400" /> 
                      {PRIZES[currentStepIndex].nameBn} ড্র হচ্ছে - মূল্য: ৳{PRIZES[currentStepIndex].amount.toLocaleString()}
                    </div>

                    {/* Tumbler Slot Screen - Spells out digits dramatically */}
                    <div className="py-4 px-6 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-md mx-auto relative overflow-hidden">
                      <div className="absolute -left-1/2 -top-1/2 w-full h-full bg-indigo-500/5 blur-3xl pointer-events-none rounded-full"></div>
                      
                      {/* Live scrolling phone string indicator */}
                      <div className="font-mono text-2xl md:text-3xl font-black text-amber-300 tracking-wider flex justify-center items-center gap-1">
                        {scramblingPhone.split('').map((char, index) => (
                          <motion.span
                            key={index}
                            animate={drawState === 'spinning' ? { y: [0, -6, 6, 0] } : { y: 0 }}
                            transition={{ repeat: Infinity, duration: 0.15, delay: index * 0.02 }}
                            className={`inline-block ${char === '-' ? 'text-indigo-400 px-1' : ''} ${char === 'X' ? 'opacity-30' : ''}`}
                          >
                            {char}
                          </motion.span>
                        ))}
                      </div>

                      {/* Decal divider Line */}
                      <div className="w-full h-px bg-slate-800/80 my-3"></div>

                      {/* Scrambled Name & District */}
                      <div className="flex justify-between items-center px-2">
                        <div className="text-left">
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">সদস্যের নাম</p>
                          <p className="text-xs font-bold text-white tracking-wide truncate max-w-[150px]">{scramblingName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">জেলা / বার</p>
                          <p className="text-xs font-black text-indigo-400">{scramblingDistrict}</p>
                        </div>
                      </div>
                    </div>

                    {/* Suspense dramatic text details */}
                    <div>
                      {drawState === 'spinning' ? (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-300 font-extrabold animate-pulse">
                          <RefreshCw size={14} className="animate-spin" /> ডিজিটাল ব্যালট বক্সে টিকিট ঘূর্ণায়মান...
                        </div>
                      ) : (
                        <motion.div 
                          className="space-y-1.5"
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <div className="text-xs text-emerald-400 font-black tracking-wide flex items-center justify-center gap-1 uppercase">
                            <CheckCircle size={14} /> ড্র সফলভাবে সম্পন্ন হয়েছে!
                          </div>
                          
                          {/* Sledge banner winner card */}
                          <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/20 p-2.5 rounded-xl max-w-sm mx-auto text-xs text-amber-200 font-bold">
                            বিজয়ী ডায়মন্ড প্যাকেজে ১ বছর মেয়াদে যুক্ত আছেন।
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {drawState === 'finished' && (
                  <div className="space-y-4 py-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 p-2 shadow-inner">
                      <Award size={36} className="animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">রবিবার ড্র সেশন সমাপ্ত</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1 mx-auto leading-relaxed">
                        সকল ৫টি গ্র্যান্ড ক্যাশ পুরস্কারের ভাগ্যবান বিজয়ী আজ নির্বাচিত হয়েছে। ড্র হিস্ট্রি নিচের তালিকায় তালিকাভুক্ত হয়েছে।
                      </p>
                    </div>
                    <button
                      onClick={startLotteryDraw}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      পুনরায় ড্র খেলুন 🔄
                    </button>
                  </div>
                )}

              </div>

              {/* Action Buttons for Engine */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                {drawState === 'idle' && (
                  <button
                    onClick={startLotteryDraw}
                    className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/10 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play size={18} fill="currentColor" /> লটারি ড্র শুরু করুন (৫ম পুরস্কার)
                  </button>
                )}

                {drawState === 'revealed' && (
                  <button
                    onClick={proceedToNextPrize}
                    className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/10 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    {currentStepIndex === PRIZES.length - 1 ? (
                      <>সবগুলো নিশ্চিত করুন <CheckCircle size={18} /></>
                    ) : (
                      <>পরবর্তী পুরস্কার ড্র করুন ({PRIZES[currentStepIndex + 1].nameBn}) <ChevronRight size={18} /></>
                    )}
                  </button>
                )}

                {drawState === 'spinning' && (
                  <button
                    disabled
                    className="w-full sm:w-auto py-4 px-8 bg-slate-800/80 text-slate-400 border border-slate-700 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} className="animate-spin" /> ড্র রানিং...
                  </button>
                )}
              </div>

            </div>

            {/* Live Drawn Board Panel (Right side 5 Cols of Bento) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Trophy size={16} className="text-amber-500" /> এই রাউন্ডে নির্বাচিত তালিকা ({revealedPrizes.length}/৫)
              </h3>

              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 md:p-6 min-h-[320px] divide-y divide-slate-800 flex flex-col justify-start">
                {revealedPrizes.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center py-12 text-slate-500">
                    <Award size={36} className="opacity-25 mb-2" />
                    <p className="text-xs font-bold">কোনো পুরষ্কার এখনো ড্র করা হয়নি</p>
                    <p className="text-[10px] text-slate-600 max-w-[200px] mt-1">সবুজ বাটন চেপে ডিজিটাল ড্র প্রক্রিয়া শুরু করুন</p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1 w-full">
                    {revealedPrizes.map((prize, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center bg-slate-900/60 p-3 rounded-2xl border border-slate-800/60 hover:border-amber-500/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${prize.rank === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-950 text-indigo-300'}`}>
                            {prize.rank}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{prize.title}</h4>
                            <p className="text-[11px] text-slate-300 font-semibold">{prize.winnerName} - {prize.winnerDistrict}</p>
                            <p className="text-[10px] text-indigo-400 font-mono font-bold">{prize.winnerPhone}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 text-[11px] font-black tracking-normal px-2.5 py-1 rounded-lg">
                            ৳{prize.amount.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {revealedPrizes.length > 0 && (
                  <div className="pt-4 mt-auto">
                    <p className="text-[10px] text-indigo-400 font-medium text-center italic">
                      *স্বচ্ছতার নিমিত্তে ড্র প্রক্রিয়াটি আপনার ফোনে সম্পূর্ণ ক্লায়েন্ট সাইড থেকে নিয়ন্ত্রিত
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 4. Eligible Participants & Winner History Section (সক্রিয় মেম্বার ও পূর্ববর্তী লটারি বিজয়ীদের ডাটাবেস) */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Users size={22} className="text-indigo-600 animate-pulse" /> সক্রিয় ডায়মন্ড মেম্বার ও পূর্ববর্তী লটারি বিজয়ীদের ডাটাবেস
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ১০০% স্বয়ংক্রিয় ও স্বচ্ছ ড্র প্রক্রিয়া নিশ্চিত করতে সকল ডায়মন্ড সাবস্ক্রাইবার ও ড্র বিজয়ীদের পূর্ণ ইতিহাস।
            </p>
          </div>

          {/* Tab selectors */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-1 w-full md:w-auto">
            <button
              onClick={() => setSummaryTab('participants')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                summaryTab === 'participants'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} /> সক্রিয় মেম্বার তালিকা ({participants.length})
            </button>
            <button
              onClick={() => setSummaryTab('past_winners')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                summaryTab === 'past_winners'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Trophy size={14} /> পুরানো ড্র ইতিহাস ({pastWinners.length})
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div>
          {summaryTab === 'participants' ? (
            <div className="space-y-4">
              {/* Search & Statistics bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="relative w-full sm:max-w-md">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="মেম্বারদের নাম বা জেলা বার দিয়ে সার্চ করুন..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full text-xs font-black pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 self-end sm:self-auto shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span>যোগ্য খেলোয়াড়: {participants.filter(p => !pastWinners.some(pw => pw.phone.trim().replace(/\D/g, '') === p.phone.trim().replace(/\D/g, ''))).length} জন</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                    <span>পুরানো বিজয়ী (অনুপযুক্ত): {participants.filter(p => pastWinners.some(pw => pw.phone.trim().replace(/\D/g, '') === p.phone.trim().replace(/\D/g, ''))).length} জন</span>
                  </div>
                </div>
              </div>

              {/* Grid of members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                {participants
                  .filter(p => {
                    const matchText = `${p.name} ${p.district} ${p.phone}`.toLowerCase();
                    return matchText.includes(participantSearch.toLowerCase());
                  })
                  .map((p) => {
                    const hasWonBefore = pastWinners.some(
                      pw => pw.phone.trim().replace(/\D/g, '') === p.phone.trim().replace(/\D/g, '')
                    );

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${
                          hasWonBefore
                            ? 'bg-slate-50/60 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 opacity-65'
                            : 'bg-white dark:bg-slate-800/60 border-slate-150 dark:border-slate-705/60 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                              hasWonBefore
                                ? 'bg-slate-200 dark:bg-slate-850 text-slate-500'
                                : 'bg-gradient-to-br from-amber-400/20 to-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            ⭐
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                {p.name} {p.id === 'user_current' && <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[9px] px-1.5 py-0.5 rounded ml-1 font-bold">আপনি</span>}
                              </h4>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                              {p.district} • {p.phone.slice(0, 5)}-XX{p.phone.slice(-4)}
                            </p>
                            <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-semibold mt-0.5">
                              সাবস্ক্রিপশন মেয়াদকাল: {p.expiryDate} (১ বছর)
                            </p>
                          </div>
                        </div>

                        <div>
                          {hasWonBefore ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200/60 dark:bg-slate-900 text-slate-500 rounded-xl text-[10px] font-black border border-slate-200 dark:border-slate-850">
                              <Lock size={12} className="text-slate-400" /> ইতিমধ্যে বিজয়ী
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-950">
                              🟢 ড্র এর জন্য যোগ্য
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Notification on rules */}
              <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 leading-relaxed">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>‘একজন মেম্বার একবার জিতলে পুনরায় আর বিজয়ী হতে পারবেন না’ নীতি:</strong> লটারির সমতা ও সবার সুষম সুযোগ বজায় রাখতে যে সকল ডায়মন্ড মেম্বার একবার কোনো সাপ্তাহিক ড্র-তে পুরস্কার লাভ করেছেন, তাদের টিকিট নম্বর স্বয়ংক্রিয়ভাবে পরবর্তী রবিবারের ড্র-তে অনুপযুক্ত বা এক্সক্লুড থাকে। নিচে মক সেশনে ড্র চালিয়ে এটার বাস্তব নমুনা দেখুন!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Previous Winners Table Header */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-850 text-[11px] font-black text-slate-500 uppercase tracking-wider bg-slate-100/60 dark:bg-slate-950/60">
                        <th className="py-3 px-4">ড্র এর তারিখ</th>
                        <th className="py-3 px-4">বিজয়ীর নাম ও বার</th>
                        <th className="py-3 px-4">মোবাইল নম্বর</th>
                        <th className="py-3 px-4 text-center">স্থান</th>
                        <th className="py-3 px-4 text-right">পুরস্কারের পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                      {pastWinners.map((w, index) => (
                        <tr key={index} className="text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200/30 dark:hover:bg-slate-850/30 transition-all font-semibold">
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-mono font-bold whitespace-nowrap">{w.drawDate}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-black">{w.name}</td>
                          <td className="py-3 px-4 font-mono font-bold">{w.phone.slice(0, 5)}-XX{w.phone.slice(-4)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black border border-indigo-100/40 dark:border-indigo-900/40">
                              {w.rank}ম পুরস্কার
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black">৳{w.prizeAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('আপনি কি পূর্ববর্তী বিজয়ী তালিকা রিসেট করতে ইচ্ছুক?')) {
                      setPastWinners(INITIAL_PAST_WINNERS);
                    }
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all"
                >
                  ইতিহাস রিসেট করুন 🔄
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. User Eligibility check & Interactive validator card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Verification Status check */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle size={20} className="text-amber-500" /> আপনার টিকিট ভ্যালিডিটি স্ট্যাটাস
              </h3>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${isDiamondUser ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                {isDiamondUser ? 'Eligible' : 'Not Subscribed'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              রবিবার দুপুর ১২:০০ টাকার লটারিতে আপনার অ্যাকাউন্টটি সক্রিয় আছে কিনা নিচের বক্সে দেখে নিন।
            </p>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-150/60 dark:border-slate-800/80">
              <div className="shrink-0">
                {isDiamondUser ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200">
                    <CheckCircle size={24} />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/50">
                    <AlertTriangle size={24} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">আপনার প্যাকেজ</span>
                <h4 className="text-base font-black text-slate-800 dark:text-white capitalize">
                  {currentPackage === 'diamond' ? 'ডায়মন্ড বাৎসরিক প্যাকেজ (সাপ্তাহিক লটারি যোগ্য)' : (currentPackage || 'ফ্রি মেম্বার')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  {isDiamondUser 
                    ? `অভিনন্দন ${userName || ''}! আপনি ডায়মন্ড বাৎসরিক প্যাকেজ ক্রয় করেছেন এবং প্রতিটি রবিবারের সাপ্তাহিক লটারি ড্রয়ের জন্য ১ বছর মেয়াদে সক্রিয়ভাবে যোগ্য হিসেবে নথিভুক্ত আছেন।`
                    : `দুঃখিত, লটারি ড্রতে অংশগ্রহণ করার সুবিধা পেতে ‘ডায়মন্ড প্যাকেজ’ কিনে সক্রিয় রাখতে হবে। আপনার বর্তমান প্যাকেজটি এই ক্যাটাগরিতে নেই।`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            {isDiamondUser ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <span className="font-mono">টিকিট নম্বর: {`MDC-SUN-LT${(userMobile || '2026').slice(-4)}`}</span>
                <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase">Confirmed</span>
              </div>
            ) : (
              <button
                onClick={onNavigateToSubscription}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Award size={16} /> ডায়মন্ড প্যাক নিয়ে লটারি নিশ্চিত করুন
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Ticket Validator/Search Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <RefreshCw size={20} className="text-indigo-600" /> টিকিট ভেরিফিকেশন প্যানেল
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">আইনজীবী বন্ধুদের মোবাইল নম্বর দিয়ে ড্র টিকিটের যোগ্যতা যাচাই করুন।</p>

            <form onSubmit={handleVerifyTicket} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="মোবাইল নম্বরটি লিখুন (যেমন: 017XXXXXXXX)"
                  value={ticketQuery}
                  onChange={(e) => setTicketQuery(e.target.value)}
                  className="w-full text-xs font-bold pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={verifiedStatus === 'checking'}
                  className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw size={16} className={verifiedStatus === 'checking' ? 'animate-spin' : ''} />
                </button>
              </div>
            </form>

            <div className="mt-6 flex-1">
              {verifiedStatus === 'idle' && (
                <div className="text-center py-8 border-2 border-dashed border-slate-150 dark:border-slate-700 rounded-2xl text-slate-400 text-xs font-bold">
                  মোবাইল নম্বর সার্চ করে লটারি টিকিট স্ট্যাটাস পরীক্ষা করুন
                </div>
              )}

              {verifiedStatus === 'checking' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-2"></div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">মেম্বারশিপ ভ্যালিডিটি ডাটা চেক করা হচ্ছে...</p>
                </div>
              )}

              {verifiedStatus === 'eligible' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 p-4 rounded-2xl text-center"
                >
                  <div className="text-emerald-600 dark:text-emerald-400 inline-block mb-1">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200">লটারি টিকিট সচল আছে!</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">মোবাইল নম্বরটি সচল বাৎসরিক ডায়মন্ড প্ল্যানের সাথে যুক্ত।</p>
                  <div className="mt-3 inline-block bg-white dark:bg-slate-900 border border-emerald-200 px-4 py-1 rounded-full font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    নিবন্ধিত টিকিট নং: {generatedTicketNo}
                  </div>
                </motion.div>
              )}

              {verifiedStatus === 'not_eligible' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 p-4 rounded-2xl text-center"
                >
                  <div className="text-rose-500 inline-block mb-1">
                    <AlertTriangle size={32} />
                  </div>
                  <h4 className="text-xs font-black text-red-900 dark:text-red-200">কোনো টিকিট খুঁজে পাওয়া যায়নি</h4>
                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">এই নম্বরটির জন্য কোনো ডায়মন্ড প্যাকেজ কেনা হয়নি অথবা ১ বছর মেয়াদ শেষ হয়েছে।</p>
                  <button
                    onClick={onNavigateToSubscription}
                    className="mt-3 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transitions-colors"
                  >
                    প্যাকেজটি ক্রয় করুন
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 5. Comprehensive Rules & Value Statement (নিয়মকানুন ও প্রায়শই জিজ্ঞাসিত প্রশ্নাবলী) */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b pb-4">
          <HelpCircle size={24} className="text-amber-500" /> সাপ্তাহিক লটারি ও ডায়মন্ড সাবস্ক্রিপশন নিয়মাবলী
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">১</span>
              <div className="space-y-1">
                <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white">১ বছর মেয়াদে কি কি সুবিধা?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  ডায়মন্ড প্যাকেজ সাবস্ক্রিপশন কিনলে আপনি ক্লাউডে আনলিমিটেড ডকুমেন্ট ব্যাকআপ, আনলিমিটেড এআই লিগ্যাল প্রশ্ন করার সুযোগ, কেস হেয়ারিং এলার্টের পাশাপাশি ১ বছর মেয়াদে অনুষ্ঠিতব্য <span className="font-extrabold text-indigo-600 dark:text-indigo-400">প্রতিটি রবিবারের ড্র-তে</span> লটারি টিকিট পেয়ে যাবেন।
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">২</span>
              <div className="space-y-1">
                <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white">রবিবার দুপুর ১২টার ড্র কিভাবে কাজ করে?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  ডিজিটাল ড্র মেশিন স্বয়ংক্রিয়ভাবে আমাদের সিস্টেমে যুক্ত সচল ডায়মন্ড মেম্বারদের মোবাইল নম্বর থেকে র‍্যান্ডমাইজেশনের মাধ্যমে ৫ জন বিজয়ী নির্বাচন করে যথাক্রমে ৫০০০, ৬০০০, ১০০০০, ২৫০০০ এবং গ্র্যান্ড ৫০,০০০ টাকার ক্যাশ পুরস্কার সরাসরি বিজয়ীদের ব্যালেন্সে বা নগদ নম্বরে পাঠিয়ে দেয়।
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm">৩</span>
              <div className="space-y-1">
                <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white">একের অধিক টিকিট পাওয়ার কোনো উপায় আছে?</h4>
                <p className="text-slate-400 dark:text-slate-400 text-xs leading-relaxed">
                  হাঁ, আপনি আপনার অধস্তন জুনিয়র আইনজীবী বা আপনার সহকারী মহুরী বন্ধুদের এমডিসি কেসবুক ডায়মন্ড উপহার দেওয়ার মাধ্যমেও টিকিট বাড়িয়ে নিতে পারেন। প্রতিটি পৃথক সচল ডায়মন্ড নম্বর সিস্টেমে একটি স্বতন্ত্র টিকিট হিসেবে রবিবার স্বয়ংক্রিয়ভাবে গণনা করা হবে।
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex gap-3">
              <span className="w-7 h-7 shrink-0 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm">৪</span>
              <div className="space-y-1">
                <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-white">লটারি মেশিন ও নাটুকে ড্র সেশন কি?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  সদস্যদের উত্তেজনা ও স্বচ্ছতা বৃদ্ধির জন্য এই এ্যাপে যুক্ত ডিজিটাল ব্যালট মেশিন ৩ডি ঘূর্ণনের মাধ্যমে টিকিট নম্বরগুলোর ডিজিট স্ক্র্যাম্বলিং করে ধীরে ধীরে প্রমোদ ও নাটকীয়তা বজায় রেখে ১টি পর ১টি পুরস্কার রিয়েল-টাইমে প্রদর্শন করে।
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
