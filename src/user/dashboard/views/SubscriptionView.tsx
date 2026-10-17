import React, { useState } from 'react';
import { CreditCard, Gift, ShieldCheck, Database, HardDrive, FileText, CheckCircle2 } from 'lucide-react';
import { SUBSCRIPTION_PACKAGES } from '../../../subscriptionConstants';

interface SubscriptionViewProps {
  t: (key: string) => string;
  userId?: string | number;
  userType: string;
  currentPackage?: string;
  expiryDate?: string;
  onSubscribe: (pkg: any) => void;
}

export const SubscriptionView = ({ t, userId, userType, currentPackage, expiryDate, onSubscribe }: SubscriptionViewProps) => {
  const [recipientId, setRecipientId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PACKAGES.filter(p => p.id === 'special')[0]);

  const displayedPackages = SUBSCRIPTION_PACKAGES;

  const handleGift = () => {
    if (!recipientId) return;
    // Implement gift subscription logic
    alert(`Gifted ${selectedPlan.name} to ${recipientId}`);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600">
          <CreditCard size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t('subscription')}</h2>
          <p className="text-slate-500">বর্তমান প্যাকেজ: <span className="font-bold text-indigo-600">{currentPackage || 'ফ্রি'}</span></p>
          {expiryDate && <p className="text-slate-500 text-sm">মেয়াদ: {new Date(expiryDate).toLocaleDateString()}</p>}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
          <Gift size={20} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm md:text-base">সাপ্তাহিক লটারি সংক্রান্ত নিয়মাবলী</h4>
          <p className="text-amber-800 text-xs md:text-sm mt-1">
            ১০০০ টাকার ডায়মন্ড প্যাকেজটি ক্রয় করলেই আপনি ১ বছর মেয়াদে প্রতি সপ্তাহে অনুষ্ঠিত প্রতিটি লটারির জন্য যোগ্য হবেন। প্রতি সপ্তাহের রবিবার ঠিক দুপুর ১২:০০ ঘটিকায় আমাদের লটারি ড্র অনুষ্ঠিত হয়ে থাকে এবং মোট ৫ জন বিজয়ী আকর্ষণীয় পুরস্কার লাভ করেন।
          </p>
        </div>
      </div>

      {/* ক্লাউড ডেটা ব্যাকআপ, ডকুমেন্ট সংরক্ষণ ও ফেয়ার ইউসেজ পলিসি */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100 p-5 md:p-6 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-base md:text-lg">
              ক্লাউড ডেটা ব্যাকআপ ও ফেয়ার ইউসেজ পলিসি (Data & Storage Policy)
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              আপনার মামলার তথ্য ও মূল্যবান নথিপত্রের দীর্ঘমেয়াদী সুরক্ষা এবং সংরক্ষণ নির্দেশিকা
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* ১. টেক্সট ডেটা আজীবন সংরক্ষণ */}
          <div className="bg-white p-4 rounded-2xl border border-indigo-100/60 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-600">
              <Database size={18} />
              <h5 className="font-bold text-sm text-slate-800">মামলার টেক্সট রেকর্ড (আজীবন)</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              মামলার নম্বর, আদালত, পক্ষগণের বিবরণ, শুনানির পূর্বাপর সকল তারিখ ও আদালতের আদেশ ক্লাউডে <strong className="text-indigo-700">আজীবন সংরক্ষিত</strong> থাকবে। ৫ বছর বা তার বেশি সময় পর সাবস্ক্রিপশন শেষ হলেও আপনার ডায়েরির রেকর্ড কখনো নষ্ট বা মুছে ফেলা হবে না।
            </p>
          </div>

          {/* ২. ছবি ও স্ক্যান করা ফাইল পলিসি */}
          <div className="bg-white p-4 rounded-2xl border border-indigo-100/60 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <FileText size={18} />
              <h5 className="font-bold text-sm text-slate-800">ছবি ও স্ক্যান করা ফাইল</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              সক্রিয় সাবস্ক্রিপশনে ক্লাউডে হাই-স্পিড ব্যাকআপ। সাবস্ক্রিপশন শেষ হলেও ডকুমেন্টগুলো অন্তত <strong className="text-emerald-700">১ বছর</strong> অক্ষত রাখা হবে, যাতে আইনজীবী বা চেম্বার যে কোনো সময় ফাইল এক ক্লিকে ডাউনলোড করে নিজের ড্রাইভে সেভ রাখতে পারেন।
            </p>
          </div>

          {/* ৩. লোকাল ক্যাশ ও উত্তরাধিকার সুরক্ষা */}
          <div className="bg-white p-4 rounded-2xl border border-indigo-100/60 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-amber-600">
              <HardDrive size={18} />
              <h5 className="font-bold text-sm text-slate-800">লোকাল ক্যাশ ও ডিজিটাল লেগেসি</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              স্ক্যান করা ফাইলের কপি ডিভাইসেও সেভ থাকে। আইনজীবীর অনুপস্থিতি বা মৃত্যুর পর বার অ্যাসোসিয়েশন বা মনোনীত উত্তরসূরির প্রত্যয়ন সাপেক্ষে পুরো চেম্বার ফাইল রিকভারি ও নতুন জুনিয়রকে হস্তান্তরের সুযোগ রয়েছে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-950 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
          <span>MDC Casebook আন্তর্জাতিক ক্লাউড সিকিউরিটি ও এনক্রিপশন প্রটোকল মেনে চলে— আপনার স্পর্শকাতর আইনি ডেটা শতভাগ নিরাপদ ও ব্যক্তিগত।</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayedPackages.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => setSelectedPlan(pkg)}
            className={`p-6 rounded-3xl border-2 transition-all flex flex-col text-left ${selectedPlan.id === pkg.id ? 'border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50/80 shadow-md transform scale-[1.02]' : 'border-slate-100 hover:border-indigo-200 bg-white hover:bg-slate-50'}`}
          >
            <div className="mb-4">
              <h3 className={`font-bold text-xl ${selectedPlan.id === pkg.id ? 'text-indigo-900' : 'text-slate-800'}`}>{pkg.name}</h3>
              <p className="text-slate-500 font-medium">{pkg.duration}</p>
              <p className={`text-2xl font-black mt-2 ${selectedPlan.id === pkg.id ? 'text-indigo-600' : 'text-slate-900'}`}>{pkg.price === 0 ? 'ফ্রি (গিফট)' : `৳${pkg.price}`}</p>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              {pkg.features && pkg.features.length > 0 && (
                <ul className="space-y-2">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-slate-700">
                      <svg className="w-5 h-5 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              {pkg.excludedFeatures && pkg.excludedFeatures.length > 0 && (
                <ul className="space-y-2 pt-2 border-t border-slate-100">
                  {pkg.excludedFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-slate-400">
                      <svg className="w-5 h-5 text-slate-300 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      <span className="line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedPlan.id === 'special' ? (
        <button
          onClick={() => onSubscribe(selectedPlan)}
          className="w-full py-4 px-2 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 text-base md:text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
        >
          ৫০০ পয়েন্ট দিয়ে স্পেশাল ফ্রি প্যাক কিনুন
        </button>
      ) : (
        <button
          onClick={() => onSubscribe(selectedPlan)}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 text-lg"
        >
          কিনুন {selectedPlan.name} প্যাকেজ
        </button>
      )}

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="text-indigo-600" />
          <h3 className="text-xl font-bold">মুহুরি বা উকিলকে উপহার দিন</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text"
            placeholder="ইউজার আইডি লিখুন"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="flex-1 p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            onClick={handleGift}
            className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 whitespace-nowrap"
          >
            পাঠান Gift
          </button>
        </div>
      </div>
    </div>
  );
};
