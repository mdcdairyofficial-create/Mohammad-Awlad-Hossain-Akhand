import React, { useState } from 'react';
import { ShieldCheck, UserCheck, XCircle, Clock } from 'lucide-react';

interface BarAdminDashboardProps {
  userId?: number;
  userName: string;
}

export default function BarAdminDashboard({ userId, userName }: BarAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">বার অ্যাডমিন ড্যাশবোর্ড</h1>
        <div className="text-sm text-slate-500">স্বাগতম, {userName}</div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-4 font-medium ${activeTab === 'pending' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
        >
          পেন্ডিং ভেরিফিকেশন
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-4 font-medium ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
        >
          ইতিহাস
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        {activeTab === 'pending' && (
          <div className="text-center py-12">
            <Clock className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700">বর্তমানে কোনো পেন্ডিং রিকোয়েস্ট নেই</h3>
            <p className="text-slate-500">নতুন ভেরিফিকেশন রিকোয়েস্ট আসলে এখানে দেখা যাবে।</p>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="text-center py-12">
            <ShieldCheck className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700">ভেরিফিকেশন ইতিহাস</h3>
            <p className="text-slate-500">এখানে অনুমোদিত বা প্রত্যাখ্যাত রিকোয়েস্টের তালিকা থাকবে।</p>
          </div>
        )}
      </div>
    </div>
  );
}
