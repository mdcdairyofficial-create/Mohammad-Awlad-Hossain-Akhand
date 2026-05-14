import React, { useState } from 'react';
import { CreditCard, Gift } from 'lucide-react';
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
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PACKAGES[0]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {SUBSCRIPTION_PACKAGES.map(pkg => (
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
          disabled
          className="w-full py-4 px-2 bg-slate-300 text-slate-600 font-bold rounded-2xl cursor-not-allowed text-base md:text-lg"
        >
          এই প্যাকেজটি ৫ টি রেফার করে অথবা রেফার লিংকের মাধ্যমে সাইনআপ করলে পাওয়া যাবে
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
