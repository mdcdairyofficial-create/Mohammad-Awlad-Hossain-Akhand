import React, { useState, useEffect } from 'react';
import { Youtube, Facebook, ExternalLink, PlayCircle, Image as ImageIcon, Video, Link, Save, Loader2 } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Media() {
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [fbLink, setFbLink] = useState('');
  const [ytLink, setYtLink] = useState('');
  const [otherLink, setOtherLink] = useState('');
  const [adMedia, setAdMedia] = useState<File | null>(null);
  const [fbCoverPhoto, setFbCoverPhoto] = useState<File | null>(null);
  const [fbPreview, setFbPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadMediaData = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'user_media', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdTitle(data.adTitle || '');
          setAdDescription(data.adDescription || '');
          setFbLink(data.fbLink || '');
          setYtLink(data.ytLink || '');
          setOtherLink(data.otherLink || '');
          if (data.fbPreview) setFbPreview(data.fbPreview);
        }
      } catch (error) {
        console.error('Error loading media data:', error);
      }
    };
    loadMediaData();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'user_media', auth.currentUser.uid), {
        adTitle,
        adDescription,
        fbLink,
        ytLink,
        otherLink,
        fbPreview, // In a real app we would upload the file to storage first
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (error) {
      console.error('Error saving media:', error);
      alert('সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFbCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFbCoverPhoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFbPreview(url);
    } else {
      setFbPreview(null);
    }
  };

  const videos = [
    {
      id: '1',
      title: 'Legal AI Assistant - How to use',
      thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800',
      url: 'https://www.youtube.com/channel/UCmBRGvfTOnFbWfaJfmA3EHg',
      duration: '5:30'
    },
    {
      id: '2',
      title: 'New Features Update 2026',
      thumbnail: 'https://images.unsplash.com/photo-1505664173691-a28166c15150?auto=format&fit=crop&q=80&w=800',
      url: 'https://www.youtube.com/channel/UCmBRGvfTOnFbWfaJfmA3EHg',
      duration: '3:45'
    },
    {
      id: '3',
      title: 'How to manage cases effectively',
      thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800',
      url: 'https://www.youtube.com/channel/UCmBRGvfTOnFbWfaJfmA3EHg',
      duration: '12:15'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Media Input Form */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-indigo-950 dark:text-white uppercase tracking-tight leading-none">বিজ্ঞাপন কন্টেন্ট পরিচালনা করুন</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage your active campaign creatives</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-indigo-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ক্যাম্পেইন শিরোনাম</label>
            <input 
              type="text" 
              placeholder="বিজ্ঞাপনের শিরোনাম" 
              value={adTitle} 
              onChange={(e) => setAdTitle(e.target.value)} 
              className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ফেসবুক লিংক</label>
            <div className="relative group">
              <Facebook className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" size={18} />
              <input 
                type="text" 
                placeholder="ফেসবুক লিংক" 
                value={fbLink} 
                onChange={(e) => setFbLink(e.target.value)} 
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ইউটিউব লিংক</label>
            <div className="relative group">
              <Youtube className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600" size={18} />
              <input 
                type="text" 
                placeholder="ইউটিউব লিংক" 
                value={ytLink} 
                onChange={(e) => setYtLink(e.target.value)} 
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-red-500 focus:bg-white outline-none transition-all text-sm font-bold" 
              />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">মিডিয়া আপলোড (ছবি/ভিডিও)</label>
              <label className="flex items-center gap-3 w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer transition-all">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                  <Video size={18} className="text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-500 truncate flex-1">
                  {adMedia ? adMedia.name : "বিজ্ঞাপনের ফাইল সিলেক্ট করুন"}
                </span>
                <input type="file" className="hidden" onChange={(e) => setAdMedia(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">MDC Casebook ফেসবুক কাভার ফটো</label>
              <label className="relative flex items-center justify-center w-full min-h-[140px] bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer transition-all overflow-hidden group/cover">
                {fbPreview ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={fbPreview} 
                      alt="FB Cover Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Change Cover Photo</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                      <ImageIcon size={18} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 truncate flex-1">
                      কাভার ফটো আপলোড করুন
                    </span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleFbCoverChange} />
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">মিডিয়া সেন্টার</h2>
            <p className="text-slate-500">আমাদের অফিসিয়াল ইউটিউব চ্যানেল এবং ফেসবুক পেজের সাথে যুক্ত থাকুন</p>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://www.youtube.com/channel/UCmBRGvfTOnFbWfaJfmA3EHg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              <Youtube size={24} />
              YouTube
            </a>
            <a 
              href="https://www.facebook.com/MDCLEGAL" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
            >
              <Facebook size={24} />
              Facebook
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <a 
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <PlayCircle size={48} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded-md">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <Youtube size={16} className="mr-1 text-red-500" />
                  YouTube এ দেখুন
                  <ExternalLink size={14} className="ml-auto" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Facebook size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">আমাদের ফেসবুক কমিউনিটি</h3>
            </div>
            <p className="text-blue-100 text-lg mb-6 max-w-xl">
              আইনজীবী, মুহুরি এবং সাধারণ মানুষের জন্য আমাদের ফেসবুক গ্রুপে যুক্ত হোন। আইনি পরামর্শ, আপডেট এবং আলোচনা করুন।
            </p>
            <a 
              href="https://www.facebook.com/MDCLEGAL" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              গ্রুপে জয়েন করুন
              <ExternalLink size={20} />
            </a>
          </div>
          
          <div className="w-full md:w-1/3 aspect-video bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <Facebook size={64} className="text-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
