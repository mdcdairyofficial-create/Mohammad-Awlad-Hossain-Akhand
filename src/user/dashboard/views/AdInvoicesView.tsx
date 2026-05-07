import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  FileText, 
  Download, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  Clock,
  DollarSign
} from 'lucide-react';

interface AdInvoice {
  id: string;
  adTitle: string;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: any;
  type: string;
}

interface AdInvoicesViewProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
}

export const AdInvoicesView = ({ language }: AdInvoicesViewProps) => {
  const [invoices, setInvoices] = useState<AdInvoice[]>([]);
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
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdInvoice[];
      setInvoices(docs);
    });

    return () => unsubscribe();
  }, []);

  const totalSpent = invoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
  const pendingPayments = invoices.filter(inv => inv.paymentStatus === 'pending').length;

  const filteredInvoices = invoices.filter(inv => 
    (inv.adTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-indigo-950 dark:text-white uppercase tracking-tight leading-none mb-2">
            {t('পেমেন্ট ও ইনভয়েস', 'PAYMENTS & INVOICES')}
          </h2>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase opacity-60">
            {t('আপনার সকল বিজ্ঞাপনের পেমেন্ট হিস্ট্রি দেখুন', 'VIEW ALL YOUR AD CAMPAIGN PAYMENT HISTORY')}
          </p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t('সার্চ ইনভয়েস...', 'Search invoices...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold focus:border-indigo-600 focus:outline-none transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t('মোট খরচ', 'TOTAL SPENT')}</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">৳ {totalSpent.toLocaleString()}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t('পেন্ডিং পেমেন্ট', 'PENDING PAYMENTS')}</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">{pendingPayments}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{t('সফল পেমেন্ট', 'COMPLETED')}</p>
          <h4 className="text-2xl font-black text-indigo-950 dark:text-white">{invoices.filter(i => i.paymentStatus === 'completed').length}</h4>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('ইনভয়েস নং', 'INVOICE NO')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('ক্যাম্পেইন', 'CAMPAIGN')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('তারিখ', 'DATE')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('পরিমাণ', 'AMOUNT')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('অবস্থা', 'STATUS')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('অ্যাকশন', 'ACTION')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-5 font-mono text-xs text-indigo-600 font-bold">#INV-{inv.id.substring(0, 8).toUpperCase()}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{inv.adTitle || inv.type}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{inv.type} Ad</p>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-black text-slate-900 dark:text-white">৳ {inv.totalPrice.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      inv.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                      inv.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all">
                      <Download size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">{t('কোন ইনভয়েস পাওয়া যায়নি', 'NO INVOICES FOUND')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
