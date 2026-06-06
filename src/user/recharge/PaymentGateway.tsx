import React, { useState } from 'react';
import { CheckCircle, XCircle, CreditCard, Copy } from 'lucide-react';

export default function PaymentGateway({ 
  country = 'Bangladesh', 
  amount, 
  onSuccess,
  isSubmitting: externalSubmitting
}: { 
  country?: string, 
  amount?: number, 
  onSuccess?: (method: string, txId: string) => void,
  isSubmitting?: boolean
}) {
  const [txId, setTxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('nagad');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const isSubmitting = externalSubmitting || status === 'verifying';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('নাম্বার কপি করা হয়েছে!');
  };

  const handleVerify = async () => {
    if (txId.trim().length < 2) {
      setStatus('error');
      return;
    }
    
    if (onSuccess) {
      onSuccess(paymentMethod, txId.trim());
      setTxId(''); // Clear after sending
      return;
    }

    setStatus('verifying');
    // Default behavior for recharge if no onSuccess provided
    try {
      const response = await fetch('/api/recharge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator: 'recharge',
          amount: amount || 0,
          payment_method: paymentMethod,
          transaction_id: txId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <CreditCard className="text-indigo-600" />
        {country === 'Bangladesh' ? 'বিকাশ/নগদ/রকেট পেমেন্ট' : 'Payment Gateway'}
      </h3>
      
      <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
        <p className="text-sm font-bold text-slate-800 mb-2">নিচের নাম্বারে সেন্ড মানি (Send Money) করুন:</p>
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <div>
            <span className="text-xs text-slate-500 block">পার্সোনাল নাম্বার (বিকাশ/নগদ/রকেট)</span>
            <span className="font-bold text-lg tracking-wider text-indigo-700">01626824282</span>
          </div>
          <button 
            onClick={() => handleCopy('01626824282')}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'bkash', name: 'বিকাশ', disabled: false },
          { id: 'nagad', name: 'নগদ', disabled: false },
          { id: 'rocket', name: 'রকেট', disabled: false }
        ].map(method => (
          <button
            key={method.id}
            onClick={() => !method.disabled && setPaymentMethod(method.id)}
            disabled={method.disabled}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${
              paymentMethod === method.id 
                ? method.id === 'bkash' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : method.id === 'nagad' 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {method.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 mb-2">
        {country === 'Bangladesh' 
          ? 'পেমেন্ট সম্পন্ন করে ট্রাঞ্জেকশন আইডিটি নিচে দিন।' 
          : 'Please enter your transaction ID after completing the payment.'}
      </p>
      
      <input
        type="text"
        value={txId}
        onChange={(e) => {
          setTxId(e.target.value);
          if (status === 'error') setStatus('idle');
        }}
        placeholder="ট্রাঞ্জেকশন আইডি এখানে দিন (যেমন: 9A8B7C6D)"
        className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl mb-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-mono text-lg transition-all"
      />
      
      <button
        onClick={handleVerify}
        disabled={isSubmitting || !txId}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'যাচাই করা হচ্ছে...' : 'সাবমিট করুন'}
      </button>

      {status === 'success' && (
        <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle size={18} /> পেমেন্ট রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে! অ্যাডমিন যাচাই করে কনফার্ম করবেন।
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-medium">
          <XCircle size={18} /> ট্রাঞ্জেকশন আইডি সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
        </div>
      )}
    </div>
  );
}
