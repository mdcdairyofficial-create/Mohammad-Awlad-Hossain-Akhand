import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Utensils, 
  GraduationCap, 
  Server, 
  CreditCard, 
  Wrench, 
  ExternalLink, 
  AlertTriangle, 
  Upload, 
  CheckCircle,
  Users,
  Share2,
  Copy,
  MessageCircle,
  ChevronRight,
  Target,
  Trophy,
  CheckCircle2,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { uploadFile, getPublicUrl } from '../../lib/storage';
import { fetchWithAuth } from '../../lib/api';

interface AffiliateLink {
  id: string;
  name: string;
  url: string;
}

interface AffiliateCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  links: AffiliateLink[];
}

interface AffiliateZoneProps {
  userType?: string;
  userId?: number;
  referralCode?: string;
  t?: (key: string) => string;
  language?: string;
  onUpdateProfile?: (data: any) => void;
}

export default function AffiliateZone({ userType, userId, referralCode, t = (k) => k, language, onUpdateProfile }: AffiliateZoneProps) {
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [uploadingLinkId, setUploadingLinkId] = useState<string | null>(null);
  const [uploadedProofs, setUploadedProofs] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [checkingLinkId, setCheckingLinkId] = useState<string | null>(null);

  const handleCheck = async (linkId: string) => {
    // Check if clicked
    const clicks = clickCounts[linkId] || 0;
    if (clicks === 0) {
      alert(language === 'bn' 
        ? 'আপনি এখনও এই লিংকটি ভিজিট করেননি। অনুগ্রহ করে প্রথমে লিংকে ক্লিক করে সাইন আপ করুন।' 
        : 'You have not visited this link yet. Please click the link to visit and sign up first.');
      return;
    }

    setCheckingLinkId(linkId);
    try {
      const response = await fetchWithAuth('/api/affiliate/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId })
      });

      if (!response.ok) {
        throw new Error('Failed to verify signup');
      }

      const data = await response.json();
      if (data.success) {
        // Mark as uploaded/proved so status updates in UI
        const nextProofs = { ...uploadedProofs, [linkId]: true };
        setUploadedProofs(nextProofs);
        localStorage.setItem(`aff_proofs_${userId}`, JSON.stringify(nextProofs));
        
        alert(data.message || (language === 'bn' ? 'সফল হয়েছে! সাইন আপ ভেরিফাইড।' : 'Success! Signup verified.'));
        
        if (typeof onUpdateProfile === 'function') {
          onUpdateProfile({ points: 100, subscription_package: 'special' });
        }
      } else {
        alert(data.error || (language === 'bn' ? 'সাইন আপ খুঁজে পাওয়া যায়নি।' : 'Signup not found.'));
      }
    } catch (error) {
      console.error('Error checking affiliate signup:', error);
      alert(language === 'bn' 
        ? 'ভেরিফিকেশনে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' 
        : 'Verification failed. Please try again.');
    } finally {
      setCheckingLinkId(null);
    }
  };

  const categoryTitles: Record<string, { bn: string; en: string }> = {
    shopping: { bn: 'শপিং ও ই-কমার্স', en: 'Shopping & E-Commerce' },
    food: { bn: 'খাবার ও রেস্টুরেন্ট', en: 'Food & Restaurant' },
    learning: { bn: 'শিক্ষা ও অনলাইন কোর্স', en: 'Learning & Courses' },
    hosting: { bn: 'ডোমেন ও হোস্টিং', en: 'Domain & Hosting' },
    finance: { bn: 'লেনদেন ও ফাইন্যান্স', en: 'Finance & Payments' },
    digital_tools: { bn: 'ডিজিটাল টুলস', en: 'Digital Tools' }
  };

  useEffect(() => {
    // Load click counts from localStorage on mount
    const counts: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('aff_')) {
        counts[key.replace('aff_', '')] = parseInt(localStorage.getItem(key) || '0', 10);
      }
    }
    setClickCounts(counts);

    // Load proofs from localStorage on mount (simple persistence)
    const savedProofs = localStorage.getItem(`aff_proofs_${userId}`);
    if (savedProofs) {
      setUploadedProofs(JSON.parse(savedProofs));
    }
  }, [userId]);

  const handleLinkClick = (id: string, url: string) => {
    // Update click count in localStorage
    const storageKey = `aff_${id}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const newCount = currentCount + 1;
    
    localStorage.setItem(storageKey, newCount.toString());
    
    // Update state
    setClickCounts(prev => ({
      ...prev,
      [id]: newCount
    }));

    // Open link in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLinkId || !userId) return;

    setUploadingLinkId(selectedLinkId);
    try {
      const path = `affiliate-proofs/${userId}/${selectedLinkId}_${Date.now()}_${file.name}`;
      await uploadFile('documents', path, file);
      const url = await getPublicUrl('documents', path);

      // Submit to backend
      const response = await fetchWithAuth('/api/affiliate/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          link_id: selectedLinkId,
          screenshot_url: url
        }),
      });

      if (!response.ok) throw new Error('Failed to submit proof');

      const nextProofs = { ...uploadedProofs, [selectedLinkId]: true };
      setUploadedProofs(nextProofs);
      localStorage.setItem(`aff_proofs_${userId}`, JSON.stringify(nextProofs));
      alert('প্রমাণ সফলভাবে জমা দেওয়া হয়েছে!');
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('প্রমাণ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setUploadingLinkId(null);
      setSelectedLinkId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const categories: AffiliateCategory[] = [
    {
      id: 'shopping',
      title: 'Shopping',
      icon: <ShoppingCart size={20} className="text-blue-500" />,
      links: [
        { id: 'martnix', name: 'martnix.com', url: 'https://martnix.com/customer/register?ref=1012' },
        { id: 'daraz', name: 'Daraz', url: 'https://www.daraz.com.bd/' },
        { id: 'ajkerdeal', name: 'AjkerDeal', url: 'https://ajkerdeal.com/' },
        { id: 'pickaboo', name: 'Pickaboo', url: 'https://www.pickaboo.com/' },
        { id: 'bagdoom', name: 'Bagdoom', url: 'https://www.bagdoom.com/' },
        { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com/' },
        { id: 'alibaba', name: 'Alibaba', url: 'https://www.alibaba.com/' },
        { id: 'aliexpress', name: 'AliExpress', url: 'https://www.aliexpress.com/' },
      ]
    },
    {
      id: 'food',
      title: 'Food',
      icon: <Utensils size={20} className="text-orange-500" />,
      links: [
        { id: 'foodpanda', name: 'Foodpanda', url: 'https://www.foodpanda.com.bd/' },
        { id: 'hungrynaki', name: 'HungryNaki', url: 'https://hungrynaki.com/' },
        { id: 'pathaofood', name: 'Pathao Food', url: 'https://pathao.com/food/' },
      ]
    },
    {
      id: 'learning',
      title: 'Learning',
      icon: <GraduationCap size={20} className="text-emerald-500" />,
      links: [
        { id: 'udemy', name: 'Udemy', url: 'https://www.udemy.com/' },
        { id: 'coursera', name: 'Coursera', url: 'https://www.coursera.org/' },
        { id: 'skillshare', name: 'Skillshare', url: 'https://www.skillshare.com/' },
        { id: 'teachable', name: 'Teachable', url: 'https://teachable.com/' },
      ]
    },
    {
      id: 'hosting',
      title: 'Hosting',
      icon: <Server size={20} className="text-purple-500" />,
      links: [
        { id: 'hostinger', name: 'Hostinger', url: 'https://www.hostinger.com/' },
        { id: 'bluehost', name: 'Bluehost', url: 'https://www.bluehost.com/' },
        { id: 'namecheap', name: 'Namecheap', url: 'https://www.namecheap.com/' },
        { id: 'siteground', name: 'SiteGround', url: 'https://www.siteground.com/' },
        { id: 'godaddy', name: 'GoDaddy', url: 'https://www.godaddy.com/' },
      ]
    },
    {
      id: 'finance',
      title: 'Finance',
      icon: <CreditCard size={20} className="text-teal-500" />,
      links: [
        { id: 'payoneer', name: 'Payoneer', url: 'https://www.payoneer.com/' },
        { id: 'wise', name: 'Wise', url: 'https://wise.com/' },
        { id: 'bkash', name: 'bKash', url: 'https://www.bkash.com/' },
        { id: 'nagad', name: 'Nagad', url: 'https://nagad.com.bd/' },
      ]
    },
    {
      id: 'digital_tools',
      title: 'Digital Tools',
      icon: <Wrench size={20} className="text-indigo-500" />,
      links: [
        { id: 'canva', name: 'Canva', url: 'https://www.canva.com/' },
        { id: 'fiverr', name: 'Fiverr', url: 'https://www.fiverr.com/' },
        { id: 'envato', name: 'Envato', url: 'https://elements.envato.com/' },
        { id: 'shopify', name: 'Shopify', url: 'https://www.shopify.com/' },
      ]
    }
  ].map(cat => ({
    ...cat,
    links: cat.links.filter(link => {
      try {
        const urlObj = new URL(link.url);
        const search = urlObj.search.toLowerCase();
        return search.includes('ref=') || 
               search.includes('aff=') || 
               search.includes('referral=') || 
               search.includes('promo=') || 
               search.includes('tag=') || 
               search.includes('clickid=') || 
               search.includes('affiliate=');
      } catch (e) {
        return false;
      }
    })
  })).filter(cat => cat.links.length > 0);

  const filteredCategories = activeCategory === 'all'
    ? categories
    : categories.filter(cat => cat.id === activeCategory);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Simple Guide */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Share2 size={120} />
          </div>
          <div className="relative z-10 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-black mb-4">{t('affiliate_zone')}</h2>
            <p className="text-white/80 font-medium max-w-lg mb-8 leading-relaxed mx-auto lg:mx-0">
              {t('special_offer_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs Menu */}
      <div className="bg-slate-50 p-2 rounded-3xl border border-slate-100 flex gap-2 overflow-x-auto scrollbar-none shadow-inner">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'bg-white text-slate-600 hover:bg-slate-100/50 border border-slate-100'
          }`}
        >
          {language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}
        </button>
        {categories.map((cat) => {
          const title = categoryTitles[cat.id]
            ? (language === 'bn' ? categoryTitles[cat.id].bn : categoryTitles[cat.id].en)
            : cat.title;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-white text-slate-600 hover:bg-slate-100/50 border border-slate-100'
              }`}
            >
              <span className={activeCategory === cat.id ? 'text-white' : ''}>{cat.icon}</span>
              <span>{title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const title = categoryTitles[category.id]
            ? (language === 'bn' ? categoryTitles[category.id].bn : categoryTitles[category.id].en)
            : category.title;
          return (
            <div key={category.id} className="bg-white rounded-[2rem] shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    {category.icon}
                  </div>
                  <h3 className="font-black text-slate-900 tracking-wider text-sm">{title}</h3>
                </div>
                <div className="p-4 space-y-2">
                  {category.links.map((link) => (
                    <div key={link.id} className="group p-3 hover:bg-indigo-50/50 rounded-2xl transition-all">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleLinkClick(link.id, link.url)}
                          className="flex-1 text-left"
                        >
                          <h4 className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase">{link.name}</h4>
                          {clickCounts[link.id] > 0 && (
                            <span className="text-[9px] font-black text-indigo-400 uppercase">{clickCounts[link.id]} {t('clicks')}</span>
                          )}
                        </button>
                        <ExternalLink size={14} className="text-slate-400" />
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {link.id === 'martnix' && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-3">
                            <p className="text-[10px] font-bold text-emerald-700 leading-tight">
                              {['lawyer', 'clerk'].includes(userType || '') 
                                ? 'সাইন আপ করলে ১মাস ডায়ামন্ড সাবস্ক্রিপশন ফ্রি' 
                                : 'সাইন আপ করলেই ১০০ পয়েন্ট ফ্রি (১০টি AI প্রশ্ন)!'}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setSelectedLinkId(link.id);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploadingLinkId === link.id || uploadedProofs[link.id]}
                            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              uploadedProofs[link.id]
                                ? 'bg-emerald-100 text-emerald-700 col-span-2'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                            }`}
                          >
                            {uploadingLinkId === link.id ? (
                              <span className="animate-pulse">আপলোড...</span>
                            ) : uploadedProofs[link.id] ? (
                              <><CheckCircle2 size={12} />প্রমাণিত হয়েছে</>
                            ) : (
                              <><Upload size={12} />প্রমাণ দিন</>
                            )}
                          </button>

                          {!uploadedProofs[link.id] && (
                            <button
                              onClick={() => handleCheck(link.id)}
                              disabled={checkingLinkId === link.id}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 border border-transparent"
                            >
                              {checkingLinkId === link.id ? (
                                <RotateCw size={12} className="animate-spin" />
                              ) : (
                                <Sparkles size={12} />
                              )}
                              <span>চেক করুন</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-start gap-4 text-amber-800">
        <AlertTriangle size={24} className="shrink-0 text-amber-600" />
        <div className="text-xs font-bold leading-relaxed">
          <strong className="block mb-1 text-sm">{t('warning')}:</strong>
          অ্যাফিলিয়েট লিংক ব্যবহারের ফলে সংগৃহীত কমিশন প্ল্যাটফর্মের সার্ভার ও AI খরচ মেটাতে ব্যবহৃত হয়। আপনার কেনাকাটার মূল্যে এর কোনো প্রভাব পড়বে না।
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
    </div>
  );
}
