import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Utensils, GraduationCap, Server, CreditCard, Wrench, ExternalLink, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import { uploadFile, getPublicUrl } from '../../lib/storage';

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
}

export default function AffiliateZone({ userType, userId }: AffiliateZoneProps) {
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
  }, []);

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

      const response = await fetch('/api/affiliate/proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          link_id: selectedLinkId,
          screenshot_url: url
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit proof');
      }

      setUploadedProofs(prev => ({ ...prev, [selectedLinkId]: true }));
      alert('প্রমাণ সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন যাচাই করার পর পয়েন্ট যুক্ত হবে।');
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('প্রমাণ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setUploadingLinkId(null);
      setSelectedLinkId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  console.log('AffiliateZone rendered, userType:', userType);
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <ShoppingCart size={32} />
          Affiliate Zone (Updated)
        </h2>
        <p className="opacity-90 max-w-2xl">
          আপনার প্রয়োজনীয় সার্ভিস এবং প্রোডাক্টগুলো এখান থেকে কিনুন। নিচের লিংকগুলো ব্যবহার করে কেনাকাটা করলে MDC Diary একটি ছোট কমিশন পেতে পারে, যা এই প্ল্যাটফর্মকে আরও উন্নত করতে সাহায্য করবে।
        </p>
      </div>

      {true && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">আপনার অ্যাফিলিয়েট ব্যালেন্স</h3>
            <p className="text-sm text-slate-500">সাইন আপ করুন আর ফ্রি সাবস্ক্রিপশন নিন।</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="text-2xl font-black text-emerald-600">৳০</div>
              <div className="text-[10px] font-bold text-emerald-600/70 uppercase">বর্তমান ব্যালেন্স</div>
            </div>
            <button 
              disabled
              className="px-6 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold transition-all cursor-not-allowed"
            >
              রিচার্জ করুন
            </button>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {category.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{category.title}</h3>
            </div>
            <div className="p-2">
              {category.links.map((link) => (
                <div key={link.id} className="flex flex-col gap-2 p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                  <button
                    onClick={() => handleLinkClick(link.id, link.url)}
                    className="w-full text-left px-2 py-1 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                        {link.name}
                      </span>
                      <div className="flex items-center gap-3">
                        {clickCounts[link.id] > 0 && (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            {clickCounts[link.id]} clicks
                          </span>
                        )}
                        <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </button>
                  
                  {link.id === 'martnix' && (
                    <div className="px-2 pb-2">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium px-2 py-1 rounded-md w-fit border border-emerald-100 mb-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        {['lawyer', 'clerk'].includes(userType || '') 
                          ? 'সাইন আপ করলে ১মাস ডায়মন্ড সাবস্ক্রিপশন ফ্রি' 
                          : 'সাইন আপ করলেই ১০০ পয়েন্ট ফ্রি (১০টি AI প্রশ্ন)!'}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => {
                            setSelectedLinkId(link.id);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadingLinkId === link.id || uploadedProofs[link.id]}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            uploadedProofs[link.id]
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          {uploadingLinkId === link.id ? (
                            <span className="animate-pulse">আপলোড হচ্ছে...</span>
                          ) : uploadedProofs[link.id] ? (
                            <>
                              <CheckCircle size={14} />
                              প্রমাণ জমা হয়েছে
                            </>
                          ) : (
                            <>
                              <Upload size={14} />
                              স্ক্রিনশট জমা দিন
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
        <div className="text-sm font-medium">
          <strong>সতর্কতা:</strong> কিছু লিংক অ্যাফিলিয়েট লিংক হতে পারে। এই লিংক ব্যবহার করলে MDC Diary কমিশন পেতে পারে। এটি আপনার কেনাকাটার খরচে কোনো প্রভাব ফেলবে না।
        </div>
      </div>
    </div>
  );
}
