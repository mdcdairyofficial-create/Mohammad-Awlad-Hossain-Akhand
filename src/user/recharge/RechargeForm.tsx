import React, { useState, useEffect } from 'react';
import { Phone, DollarSign, CreditCard, Send, History } from 'lucide-react';

interface RechargeHistory {
  id: number;
  mobile_number: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function RechargeForm({ userId }: { userId: number }) {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    operator: 'Grameenphone',
    amount: '',
    paymentMethod: 'Bkash',
    transactionId: ''
  });
  const [history, setHistory] = useState<RechargeHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    const res = await fetch(`/api/recharge/history/${userId}`);
    const data = await res.json();
    setHistory(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/recharge/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, userId })
    });

    if (res.ok) {
      setMessage('রিচার্জ রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে।');
      setFormData({ mobileNumber: '', operator: 'Grameenphone', amount: '', paymentMethod: 'Bkash', transactionId: '' });
      fetchHistory();
    } else {
      setMessage('রিচার্জ রিকোয়েস্ট ব্যর্থ হয়েছে।');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 text-slate-900">রিচার্জ করুন</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="মোবাইল নম্বর" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required />
          <select value={formData.operator} onChange={e => setFormData({...formData, operator: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <option>Grameenphone</option>
            <option>Robi</option>
            <option>Banglalink</option>
            <option>Teletalk</option>
          </select>
          <input type="number" placeholder="পরিমাণ" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required />
          <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <option>Bkash</option>
            <option>Nagad</option>
            <option>Rocket</option>
          </select>
          <input type="text" placeholder="ট্রানজেকশন আইডি" value={formData.transactionId} onChange={e => setFormData({...formData, transactionId: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-3 rounded-xl font-semibold">
            {loading ? 'পাঠানো হচ্ছে...' : 'রিচার্জ রিকোয়েস্ট পাঠান'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm font-medium text-slate-700">{message}</p>}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 text-slate-900">রিচার্জ হিস্ট্রি</h2>
        <div className="space-y-4">
          {history.map(h => (
            <div key={h.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold">{h.mobile_number}</p>
                <p className="text-sm text-slate-500">{new Date(h.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">{h.amount} BDT</p>
                <p className={cn("text-sm font-medium", h.status === 'approved' ? 'text-green-600' : h.status === 'rejected' ? 'text-red-600' : 'text-amber-600')}>{h.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
