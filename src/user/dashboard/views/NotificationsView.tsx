import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Check, Trash2, ShieldAlert, Sparkles, 
  AlertCircle, RefreshCw, Smartphone, Settings, 
  ShieldCheck, CreditCard, Clock, Calendar, 
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BellRing, PlayCircle
} from 'lucide-react';
import { Notification } from '../../../types';
import { sendNotification } from '../../../services/user/featureService';
import { db } from '../../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface NotificationsViewProps {
  t: (key: string) => string;
  notifications: Notification[];
  userId: string;
  onMarkAsRead: (id: string | number) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsView = ({ 
  t, 
  notifications, 
  userId, 
  onMarkAsRead, 
  onMarkAllAsRead 
}: NotificationsViewProps) => {
  // Category/Filter tabs
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'hearing' | 'update' | 'payment' | 'task'>('all');
  
  // Settings Toggles (saved in localStorage for persistence)
  const [prefHearing, setPrefHearing] = useState<boolean>(() => {
    return localStorage.getItem('notif_pref_hearing') !== 'false';
  });
  const [prefUpdate, setPrefUpdate] = useState<boolean>(() => {
    return localStorage.getItem('notif_pref_update') !== 'false';
  });
  const [prefPayment, setPrefPayment] = useState<boolean>(() => {
    return localStorage.getItem('notif_pref_payment') !== 'false';
  });
  const [prefExpiry, setPrefExpiry] = useState<boolean>(() => {
    return localStorage.getItem('notif_pref_expiry') !== 'false';
  });

  // Simulator Inputs
  const [simCourtName, setSimCourtName] = useState('ঢাকা জেলা ও দায়রা জজ আদালত');
  const [simCaseNo, setSimCaseNo] = useState('CR-452/2025');
  const [simUpdateTitle, setSimUpdateTitle] = useState('নতুন জামিন রুল সংযোজন v2.4');
  const [simAmount, setSimAmount] = useState('৫০০');
  const [simDaysLeft, setSimDaysLeft] = useState('৩');

  // Accordion for "বাংলায় বুঝতে চাই"
  const [openSection, setOpenSection] = useState<number | null>(0);

  // States for alerts/feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Sync preferences to localStorage
  useEffect(() => {
    localStorage.setItem('notif_pref_hearing', String(prefHearing));
  }, [prefHearing]);
  useEffect(() => {
    localStorage.setItem('notif_pref_update', String(prefUpdate));
  }, [prefUpdate]);
  useEffect(() => {
    localStorage.setItem('notif_pref_payment', String(prefPayment));
  }, [prefPayment]);
  useEffect(() => {
    localStorage.setItem('notif_pref_expiry', String(prefExpiry));
  }, [prefExpiry]);

  // Shows brief feedback toast
  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Delete notification via Firestore
  const handleDeleteNotification = async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'notifications', id.toString()));
      triggerFeedback('নোটিফিকেশনটি মুছে ফেলা হয়েছে।');
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      triggerFeedback('ডিলেটে অক্ষম: ' + err.message);
    }
  };

  // Helper to trigger simulated notification
  const handleSimulate = async (type: 'hearing' | 'update' | 'payment' | 'expiry') => {
    setIsSimulating(true);
    let title = '';
    let message = '';
    let iconType: any = 'system';

    if (type === 'hearing') {
      if (!prefHearing) {
        alert('আদালত শুনানি নোটিফিকেশনটি আপনি বন্ধ রেখেছেন। অনুগ্রহ করে সেটিংস থেকে চালু করুন।');
        setIsSimulating(false);
        return;
      }
      title = '🗓️ আদালতের শুনানির তারিখ অনুস্মারক';
      message = `মামলা নং ${simCaseNo}, ${simCourtName}-এ আগামীকাল শুনানি অনুষ্ঠিত হবে। প্রয়োজনীয় তথ্য ও ডকুমেন্টস সাথে রাখুন।`;
      iconType = 'hearing';
    } else if (type === 'update') {
      if (!prefUpdate) {
        alert('সিস্টেম আপডেট নোটিফিকেশনটি আপনি বন্ধ রেখেছেন। অনুগ্রহ করে সেটিংস থেকে চালু করুন।');
        setIsSimulating(false);
        return;
      }
      title = '🚀 নতুন সফটওয়্যার আপডেট রিলিজ';
      message = `নতুন আপডেট এসেছে: "${simUpdateTitle}"। দ্রুত এবং মসৃণ পারফরম্যান্স পেতে আপনার প্যানেল লোড করুন।`;
      iconType = 'update';
    } else if (type === 'payment') {
      if (!prefPayment) {
        alert('পেমেন্ট রিমাইন্ডারটি আপনি বন্ধ রেখেছেন। অনুগ্রহ করে সেটিংস থেকে চালু করুন।');
        setIsSimulating(false);
        return;
      }
      title = '💳 পেমেন্ট অনুস্মারক ও রিচার্জ সতর্কতা';
      message = `আপনার একাউন্ট ব্যালেন্স কম। নিরবচ্ছিন্ন সেবা অব্যাহত রাখতে আপনার ওয়ালেটে ${simAmount} টাকা রিচার্জ করুন।`;
      iconType = 'payment';
    } else if (type === 'expiry') {
      if (!prefExpiry) {
        alert('সাবস্ক্রিপশন মেয়াদোত্তীর্ণ সতর্কতাটি আপনি বন্ধ রেখেছেন। অনুগ্রহ করে সেটিংস থেকে চালু করুন।');
        setIsSimulating(false);
        return;
      }
      title = '⏳ সাবস্ক্রিপশন মেয়াদোত্তীর্ণের সতর্কতা';
      message = `আপনার ডেসকো বা ডায়মন্ড প্রিমিয়াম সাবস্ক্রিপশনের মেয়াদ আগামী ${simDaysLeft} দিনের মধ্যে শেষ হবে। রিনিউ করতে এখনই সাবস্ক্রিপশন ম্যানেজ করুন।`;
      iconType = 'hearing'; // maps to high importance alert style
    }

    try {
      if (!userId) {
        alert('ইউজার সাইন-ইন করা নেই। সিমুলেশন করা সম্ভব নয়।');
        setIsSimulating(false);
        return;
      }
      await sendNotification(userId, {
        title,
        message,
        time: 'এখন (Now)',
        type: iconType
      });
      triggerFeedback('নতুন নোটিফিকেশন সফলভাবে ট্রিগার হয়েছে!');
    } catch (e: any) {
      alert('Error triggering simulation: ' + e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Filter logic
  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'unread') return !notif.isRead;
    if (activeFilter === 'hearing') return notif.type === 'hearing';
    if (activeFilter === 'update') return notif.type === 'update';
    if (activeFilter === 'payment') return notif.type === 'payment';
    if (activeFilter === 'task') return notif.type === 'task' || notif.type === 'task_assigned';
    return true;
  });

  const getPriorityStyle = (type?: string) => {
    if (type === 'hearing' || type === 'payment') {
      return {
        bg: 'bg-rose-50 border-rose-100 text-rose-700 hover:border-rose-200',
        badge: 'bg-rose-100 text-rose-800'
      };
    }
    if (type === 'task' || type === 'task_assigned') {
      return {
        bg: 'bg-amber-50 border-amber-100 text-amber-700 hover:border-amber-200',
        badge: 'bg-amber-100 text-amber-800'
      };
    }
    return {
      bg: 'bg-indigo-50/40 border-indigo-100 text-indigo-700 hover:border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-800'
    };
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm font-sans">
      
      {/* Dynamic Feedback Toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
            <BellRing size={32} className="animate-swing" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              নোটিফিকেশন ও অ্যালার্ট সেন্টার <span className="text-sm font-normal text-slate-400 font-mono">Phase 8</span>
            </h2>
            <p className="text-slate-500 mt-0.5 text-sm">
              রিমাইন্ডার ট্র্যাকিং, নতুন আপডেট নোটিস, পেমেন্ট অনুস্মারক ও সাবস্ক্রিপশন মেয়াদোত্তীর্ণ অ্যালার্টসমূহ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100"
            >
              <Check className="w-4 h-4" /> পঠিত চিহ্নিত করুন (Mark all read)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Notification Ledger / Lists */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-1.5">
              🔔 ইনবক্স ({filteredNotifications.length})
            </h3>
            
            {/* Horizontal Filter Selectors */}
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'all', label: 'সব' },
                { id: 'unread', label: 'অপঠিত' },
                { id: 'hearing', label: 'শুনানি' },
                { id: 'update', label: 'আপডেট' },
                { id: 'payment', label: 'পেমেন্ট' }
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeFilter === f.id 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Bell size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">কোনো নোটিফিকেশন পাওয়া যায়নি</p>
                <p className="text-xs text-slate-400 mt-1">ডানপাশের প্যানেলটি ব্যবহার করে নোটিফিকেশন টেস্ট করতে পারেন।</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const styles = getPriorityStyle(notif.type);
                return (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative hover:shadow-md ${
                      !notif.isRead 
                        ? 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-200' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Priority indicator circle */}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      !notif.isRead ? 'bg-indigo-600' : 'bg-slate-300'
                    }`} />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {notif.type && (
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${styles.badge}`}>
                            {notif.type === 'hearing' ? 'শুনানি / Expiry' : notif.type === 'payment' ? 'পেমেন্ট' : notif.type === 'update' ? 'আপডেট' : 'টাস্ক'}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> {notif.time || 'এখন'}
                        </span>
                      </div>

                      {notif.title && (
                        <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                      )}
                      
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-sans">{notif.message}</p>
                    </div>

                    {/* Action Panel on Hover/Right */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {!notif.isRead && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all"
                          title="পঠিত চিহ্নিত করুন (Mark as Read)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                        title="মুছে ফেলুন (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Custom Preferences & Interactive Simulator & Bangla Tutorial Docs */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Notification Preferences Configuration */}
          <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/50 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" /> সেটিংস ও ফিল্টারিং সেটিংস (Configuration)
              </h3>
              <p className="text-xs text-slate-500 mt-1">সব চ্যানেলের নোযোগাযোগের সতর্কতা সচল অথবা অচল করুন</p>
            </div>

            <div className="divide-y divide-slate-200/60 text-sm">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800 text-xs md:text-sm">🗓️ শুনানির তারিখের রিমাইন্ডার</span>
                  <span className="text-[11px] text-slate-400 block">Court date hearing alerts & requirements</span>
                </div>
                <button
                  onClick={() => setPrefHearing(!prefHearing)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                    prefHearing ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ${
                    prefHearing ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800 text-xs md:text-sm">📢 নতুন আপডেট নোটিশ</span>
                  <span className="text-[11px] text-slate-400 block">New release updates & case synchronizations</span>
                </div>
                <button
                  onClick={() => setPrefUpdate(!prefUpdate)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                    prefUpdate ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ${
                    prefUpdate ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800 text-xs md:text-sm">💳 পেমেন্ট ও ওয়ালেট রিমাইন্ডার</span>
                  <span className="text-[11px] text-slate-400 block">Wallet balances & invoice updates</span>
                </div>
                <button
                  onClick={() => setPrefPayment(!prefPayment)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                    prefPayment ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ${
                    prefPayment ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800 text-xs md:text-sm">⏳ সাবস্ক্রিপশন মেয়াদোত্তীর্ণ সতর্কতা</span>
                  <span className="text-[11px] text-slate-400 block">Premium plan expiry warnings</span>
                </div>
                <button
                  onClick={() => setPrefExpiry(!prefExpiry)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                    prefExpiry ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ${
                    prefExpiry ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Panel */}
          <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-200/50 space-y-4">
            <div>
              <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
                <PlayCircle size={18} className="text-amber-600" /> নোটিফিকেশন সিমুলেশন সেন্টার (Playground)
              </h3>
              <p className="text-xs text-amber-700/80 mt-1">
                ৪ টি মূল ক্যাটাগরির নোটিফিকেশন সিস্টেম ইনস্ট্যান্ট ট্রিগার করে কার্যক্রম পরীক্ষা করুন
              </p>
            </div>

            <div className="space-y-4.5">
              
              {/* Type 1: Court Date */}
              <div className="p-3 bg-white border border-amber-200 rounded-2xl md:space-y-2 text-xs">
                <span className="font-bold text-slate-800 block mb-1">১. Court Date Reminder</span>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">আদালতের নাম:</label>
                    <input 
                      type="text" 
                      value={simCourtName}
                      onChange={(e) => setSimCourtName(e.target.value)}
                      className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-[11px]" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">মামলা নম্বর:</label>
                    <input 
                      type="text" 
                      value={simCaseNo}
                      onChange={(e) => setSimCaseNo(e.target.value)}
                      className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-[11px]" 
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSimulate('hearing')}
                  disabled={isSimulating}
                  className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  শুনানি তারিখের সতর্কবার্তা পাঠান (Send Date Alert)
                </button>
              </div>

              {/* Type 2: Update Alert */}
              <div className="p-3 bg-white border border-amber-200 rounded-2xl md:space-y-2 text-xs">
                <span className="font-bold text-slate-800 block mb-1">২. New Update Alert</span>
                <div className="mb-2">
                  <label className="text-[10px] text-slate-500 font-semibold block">আপডেট টাইটেল / ফিচার:</label>
                  <input 
                    type="text" 
                    value={simUpdateTitle}
                    onChange={(e) => setSimUpdateTitle(e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-[11px]" 
                  />
                </div>
                <button
                  onClick={() => handleSimulate('update')}
                  disabled={isSimulating}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  আপডেট নোটিশ পাঠান (Send Update Alert)
                </button>
              </div>

              {/* Type 3: Payment Reminder */}
              <div className="p-3 bg-white border border-amber-200 rounded-2xl md:space-y-2 text-xs">
                <span className="font-bold text-slate-800 block mb-1">৩. Payment Reminder</span>
                <div className="mb-2">
                  <label className="text-[10px] text-slate-500 font-semibold block">রিচার্জ বা বকেয়া পরিমাণ (টাকা):</label>
                  <input 
                    type="text" 
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-[11px]" 
                  />
                </div>
                <button
                  onClick={() => handleSimulate('payment')}
                  disabled={isSimulating}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  পেমেন্ট অনুস্মারক পাঠান (Send Payment Alert)
                </button>
              </div>

              {/* Type 4: Subscription Expiry */}
              <div className="p-3 bg-white border border-amber-200 rounded-2xl md:space-y-2 text-xs">
                <span className="font-bold text-slate-800 block mb-1">৪. Subscription Expiry Alert</span>
                <div className="mb-2">
                  <label className="text-[10px] text-slate-500 font-semibold block">বাকি দিন (Days Left):</label>
                  <input 
                    type="text" 
                    value={simDaysLeft}
                    onChange={(e) => setSimDaysLeft(e.target.value)}
                    className="w-full p-1 bg-slate-50 border border-slate-200 rounded text-[11px]" 
                  />
                </div>
                <button
                  onClick={() => handleSimulate('expiry')}
                  disabled={isSimulating}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-950 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  সাবস্ক্রিপশন মেয়াদ অ্যালার্ট পাঠান (Send Expiry Alert)
                </button>
              </div>

            </div>
          </div>

          {/* Bengali Explanation: "বাংলায় বুঝতে চাই" Tutorial Section */}
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 space-y-4">
            <div>
              <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-700" /> বাংলায় বুঝতে চাই (Phase 8 Overview)
              </h3>
              <p className="text-xs text-indigo-800 mt-1">
                পদ্ধতি এবং অ্যালার্টসমূহের অভ্যন্তরীণ কারিগরি ব্যাকগ্রাউন্ড ও লজিক বর্ণনা:
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  title: 'Court Date Reminder (আদালতের তারিখের অনুস্মারক)',
                  desc: 'এই রিমাইন্ডারটি প্রতিদিন ব্যবহারকারীর চলমান মামলাগুলোর (nextDate বা শুনানির তারিখ) ডাটাবেজ ট্র্যাক করে। পরবর্তী ২৪ ঘণ্টার মধ্যে শুনানির বা পদক্ষেপের তারিখ থাকলে সিস্টেমে স্বয়ংক্রিয়ভাবে অ্যালার্ট জেনারেট হয়, যা আইনজীবীর প্রস্তুতিকে নিশ্চিত করে।'
                },
                {
                  title: 'New Update Alert (নতুন আপডেট নোটিশ)',
                  desc: 'যখনই নতুন কোনো সংস্করণ, আইন ডিরেক্টরি রুলবুক, বা ফিচারের সংযোজন আমাদের সার্ভারে প্রকাশ করা হয়, তখন অডিটের পাশাপাশি ব্যবহারকারীদের অ্যাক্টিভ উইন্ডোতে এই সফটওয়্যার রিলিজ নোটিশটি সরাসরি ফ্লাশ করে।'
                },
                {
                  title: 'Payment Reminder (পেমেন্ট বা রিচার্জ অনুস্মারক)',
                  desc: 'মুহুরী বা আইনজীবীর ওয়ালেট ব্যালেন্স যদি কাজের নির্ধারিত প্রসেস ফি সীমার নিচে নেমে যায় বা কোনো রিচার্জ অনুমোদন সম্পন্ন হয়, তখন ব্যবহারকারীর অ্যাকাউন্টে তাৎক্ষণিকভাবে পেমেন্ট সতর্কবার্তাটি পাঠানো হয়।'
                },
                {
                  title: 'Subscription Expiry Alert (মেয়াদোত্তীর্ণ সতর্কতা)',
                  desc: 'রানিং ডায়মন্ড বা বিশেষ সাবস্ক্রিপশন প্যাকেজের শেষ সময়কাল (expiryDate) নিয়মিত পিরিয়ডিক জব দ্বারা চেক হয়। মেয়াদ শেষ হওয়ার ৩ দিন পূর্বে ব্যবহারকারীকে স্বয়ংক্রিয় মেসেজের মাধ্যমে রিনিউ করার সতর্ক বার্তা প্রদান করা হয়।'
                }
              ].map((item, idx) => {
                const isOpen = openSection === idx;
                return (
                  <div key={idx} className="bg-white rounded-xl border border-indigo-100/80 overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenSection(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-center justify-between font-bold text-indigo-900 text-xs md:text-sm hover:bg-slate-50 transition-all focus:outline-none"
                    >
                      <span>{item.title}</span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isOpen && (
                      <div className="p-3.5 bg-slate-50/70 border-t border-indigo-50 text-slate-600 text-xs leading-relaxed font-sans">
                        {item.desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
