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
  CheckCircle2
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
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-[2rem] shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                {category.icon}
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">{category.id}</h3>
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
                    
                    <button
                      onClick={() => {
                        setSelectedLinkId(link.id);
                        fileInputRef.current?.click();
                      }}
                      disabled={uploadingLinkId === link.id || uploadedProofs[link.id]}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        uploadedProofs[link.id]
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                      }`}
                    >
                      {uploadingLinkId === link.id ? (
                        <span className="animate-pulse">আপলোড হচ্ছে...</span>
                      ) : uploadedProofs[link.id] ? (
                        <><CheckCircle2 size={14} />প্রমাণ জমা হয়েছে</>
                      ) : (
                        <><Upload size={14} />স্ক্রিনশট জমা দিন</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
