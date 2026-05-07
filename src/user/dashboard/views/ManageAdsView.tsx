import React, { useEffect, useState } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { deleteFile } from '../../../lib/storage';
import { 
  Search, 
  Filter, 
  Trash2, 
  Pause, 
  Play, 
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  Award,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Campaign } from '../types';

interface ManageAdsViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
}

export const ManageAdsView = ({ language }: ManageAdsViewProps) => {
  const [ads, setAds] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const bn = language === 'bn';
  const t = (bnText: string, enText: string) => bn ? bnText : enText;

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'campaigns'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      setAds(adsData);

      // Auto-purge old completed ads (older than 30 days) to save storage/database costs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const expiredAds = adsData.filter(ad => {
        if (ad.status !== 'completed') return false;
        // Check createdAt or use current time if missing
        const createdAt = ad.createdAt?.toDate?.() || new Date(ad.createdAt) || new Date(0);
        return createdAt < thirtyDaysAgo;
      });

      if (expiredAds.length > 0) {
        console.log(`Auto-purging ${expiredAds.length} expired ads...`);
        const batch = writeBatch(db);
        expiredAds.forEach(ad => {
          batch.delete(doc(db, 'campaigns', ad.id));
          if (ad.adMediaPath) deleteFile('', ad.adMediaPath).catch(() => {});
          if (ad.fbCoverPhotoPath) deleteFile('', ad.fbCoverPhotoPath).catch(() => {});
        });
        batch.commit().catch(err => console.error("Auto-purge failed:", err));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (ad: Campaign) => {
    if (confirm(t('আপনি কি নিশ্চিত যে এই বিজ্ঞাপনটি মুছে ফেলতে চান? এর ফলে আপলোড করা মিডিয়া ফাইলগুলোও ডিলিট হয়ে যাবে।', 'Are you sure you want to delete this ad? This will also remove the uploaded media files.'))) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'campaigns', ad.id));
        
        // Delete from Storage if paths exist
        if (ad.adMediaPath) {
          await deleteFile('', ad.adMediaPath).catch(e => console.error('Storage delete error:', e));
        }
        if (ad.fbCoverPhotoPath) {
          await deleteFile('', ad.fbCoverPhotoPath).catch(e => console.error('FB cover storage delete error:', e));
        }
      } catch (error) {
        console.error('Error deleting ad:', error);
      }
    }
  };

  const clearCompletedAds = async () => {
    const completedAds = ads.filter(ad => ad.status === 'completed');
    if (completedAds.length === 0) {
      alert(t('কোনো সম্পন্ন হওয়া বিজ্ঞাপন নেই!', 'No completed ads found!'));
      return;
    }

    if (confirm(t(`আপনি কি ${completedAds.length}টি সম্পন্ন হওয়া বিজ্ঞাপন ডিলিট করতে চান?`, `Do you want to delete ${completedAds.length} completed ads?`))) {
      try {
        const batch = writeBatch(db);
        for (const ad of completedAds) {
          batch.delete(doc(db, 'campaigns', ad.id));
          if (ad.adMediaPath) deleteFile('', ad.adMediaPath).catch(() => {});
          if (ad.fbCoverPhotoPath) deleteFile('', ad.fbCoverPhotoPath).catch(() => {});
        }
        await batch.commit();
        alert(t('সম্পন্ন হওয়া বিজ্ঞাপনগুলো সফলভাবে মুছে ফেলা হয়েছে।', 'Completed ads cleared successfully.'));
      } catch (error) {
        console.error('Error clearing ads:', error);
      }
    }
  };

  const toggleStatus = async (ad: Campaign) => {
    try {
      const newStatus = ad.status === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, 'campaigns', ad.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = (ad.type || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (ad.adTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ad.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || ad.status === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 dark:text-white uppercase tracking-tight leading-none mb-2">
            {t('বিজ্ঞাপন নিয়ন্ত্রণ', 'AD MANAGEMENT')}
          </h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">
            {t('আপনার সকল সক্রিয় ও পূর্বের ক্যাম্পেইন ম্যানেজ করুন', 'MANAGE ALL YOUR ACTIVE & PAST CAMPAIGNS')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t('সার্চ করুন...', 'Search ads...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold focus:border-indigo-600 focus:outline-none transition-all w-full md:w-64"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 text-sm font-bold appearance-none cursor-pointer focus:border-indigo-600 outline-none transition-all flex-1 md:flex-none"
            >
              <option value="All">{t('সব অবস্থা', 'All Status')}</option>
              <option value="Active">{t('সক্রিয়', 'Active')}</option>
              <option value="Paused">{t('স্থগিত', 'Paused')}</option>
            </select>

            <button 
              onClick={clearCompletedAds}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm active:scale-95 whitespace-nowrap"
              title={t('সম্পন্ন বিজ্ঞাপনগুলো মুছুন', 'CLEAR COMPLETED ADS')}
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">{t('ক্লিয়ার', 'CLEAR COMPLETED')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAds.length > 0 ? (
            filteredAds.map((ad, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={idx}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-8 group"
              >
                {/* Ad Icon/Type */}
                <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-lg shrink-0 ${
                  ad.type === 'Election' ? 'bg-amber-600' : 'bg-indigo-600'
                } text-white`}>
                  {ad.type === 'Election' ? <Award size={32} /> : <Layers size={32} />}
                  <span className="text-[10px] font-black uppercase tracking-tighter">{ad.type}</span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h3 className="text-xl font-black text-indigo-950 dark:text-white uppercase tracking-tight">
                      {ad.type} Campaign - {ad.location}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      ad.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {ad.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {ad.activatedAt ? new Date(ad.activatedAt).toLocaleDateString() : (ad.createdAt?.toDate ? ad.createdAt.toDate().toLocaleDateString() : t('অপেক্ষমান', 'Pending'))}
                    </div>
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                      <Info size={14} />
                      Target: {ad.targetRoles?.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="flex items-center gap-10 px-8 border-x-2 border-slate-50 dark:border-slate-800 hidden lg:flex">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reach</p>
                    <p className="text-lg font-black text-indigo-950 dark:text-white">{ad.reach?.toLocaleString() || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Clicks</p>
                    <p className="text-lg font-black text-indigo-950 dark:text-white">0</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Days Left</p>
                    <p className="text-lg font-black text-amber-600">{ad.validity || 0}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleStatus(ad)}
                    className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                    title={ad.status === 'active' ? 'Pause' : 'Start'}
                  >
                    {ad.status === 'active' ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(ad)}
                    className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-400 rounded-2xl flex items-center justify-center hover:border-slate-300 cursor-pointer">
                    <MoreVertical size={20} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center border-4 border-dashed border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6 shadow-xl">
                <Layers size={48} />
              </div>
              <h3 className="text-2xl font-black text-indigo-950 dark:text-white uppercase tracking-tight mb-2">
                {t('কোন বিজ্ঞাপন পাওয়া যায়নি', 'NO ADS FOUND')}
              </h3>
              <p className="text-slate-500 font-bold text-sm max-w-sm uppercase tracking-widest opacity-60">
                {t('অনুগ্রহ করে নতুন একটি ক্যাল্পেইন শুরু করুন', 'PLEASE START A NEW CAMPAIGN TO SEE IT HERE')}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
