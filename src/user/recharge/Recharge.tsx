import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Wifi, Clock, Gift, CreditCard, History, Wallet, CheckCircle2, ChevronRight, ArrowLeft, Users } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

interface RechargeProps {
  userId: number | undefined;
}

export default function Recharge({ userId }: RechargeProps) {
  const [activeTab, setActiveTab] = useState<'recharge' | 'history' | 'wallet'>('recharge');
  const [mobileNumber, setMobileNumber] = useState('');
  const [operator, setOperator] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [step, setStep] = useState(1); // 1: Select Package, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [cashbackEarned, setCashbackEarned] = useState(0);
  const [isOnlinePaymentLoading, setIsOnlinePaymentLoading] = useState(false);

  const initiateOnlinePayment = async (amount: number, purpose: string) => {
    setIsOnlinePaymentLoading(true);
    try {
      const response = await fetchWithAuth('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          purpose,
          orderId: `REC_${Date.now()}_${userId}`
        })
      });
      const data = await response.json();
      if (data.success && data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        alert(data.error || "পেমেন্ট গেটওয়ে লোড করতে সমস্যা হয়েছে।");
      }
    } catch (error) {
      console.error("Online payment error:", error);
      alert("পেমেন্ট ইনিশিয়েট করতে সমস্যা হয়েছে।");
    } finally {
      setIsOnlinePaymentLoading(false);
    }
  };

  const operators = [
    { id: 'gp', name: 'Grameenphone', color: 'bg-blue-500', logo: 'GP' },
    { id: 'robi', name: 'Robi', color: 'bg-red-500', logo: 'Robi' },
    { id: 'airtel', name: 'Airtel', color: 'bg-rose-500', logo: 'Airtel' },
    { id: 'bl', name: 'Banglalink', color: 'bg-orange-500', logo: 'BL' },
    { id: 'teletalk', name: 'Teletalk', color: 'bg-emerald-500', logo: 'Tele' },
  ];

  const packages = [
    { id: 1, type: 'Internet', name: '1GB', amount: 49, validity: '3 Days' },
    { id: 2, type: 'Internet', name: '5GB', amount: 149, validity: '7 Days' },
    { id: 3, type: 'Internet', name: '10GB', amount: 299, validity: '30 Days' },
    { id: 4, type: 'Minute', name: '100 Minutes', amount: 69, validity: '7 Days' },
    { id: 5, type: 'Minute', name: '300 Minutes', amount: 199, validity: '30 Days' },
    { id: 6, type: 'Combo', name: '10GB + 300 Min', amount: 399, validity: '30 Days' },
    { id: 7, type: 'Recharge', name: 'Regular Recharge', amount: 50, validity: 'N/A' },
    { id: 8, type: 'Recharge', name: 'Regular Recharge', amount: 100, validity: 'N/A' },
  ];

  const specialOffers = [
    { id: 101, operator: 'gp', type: 'Combo', name: '40GB + 800 Min', amount: 799, validity: '30 Days', cashback: 24 },
    { id: 102, operator: 'gp', type: 'Internet', name: '50GB', amount: 599, validity: '30 Days', cashback: 18 },
    { id: 103, operator: 'robi', type: 'Combo', name: '45GB + 900 Min', amount: 799, validity: '30 Days', cashback: 24 },
    { id: 104, operator: 'robi', type: 'Internet', name: '60GB', amount: 699, validity: '30 Days', cashback: 21 },
    { id: 105, operator: 'airtel', type: 'Combo', name: '50GB + 1000 Min', amount: 899, validity: '30 Days', cashback: 27 },
    { id: 106, operator: 'airtel', type: 'Internet', name: '65GB', amount: 749, validity: '30 Days', cashback: 22 },
    { id: 107, operator: 'bl', type: 'Combo', name: '40GB + 800 Min', amount: 749, validity: '30 Days', cashback: 22 },
    { id: 108, operator: 'bl', type: 'Internet', name: '55GB', amount: 599, validity: '30 Days', cashback: 18 },
    { id: 109, operator: 'teletalk', type: 'Combo', name: '30GB + 500 Min', amount: 499, validity: '30 Days', cashback: 15 },
    { id: 110, operator: 'teletalk', type: 'Internet', name: '40GB', amount: 399, validity: '30 Days', cashback: 12 },
  ];

  useEffect(() => {
    if (userId) {
      fetchWallet();
      fetchHistory();
    }
  }, [userId]);

  const fetchWallet = async () => {
    try {
      const res = await fetchWithAuth(`/api/recharge/wallet/${userId}`);
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.wallet.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetchWithAuth(`/api/recharge/history/${userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMobileNumber(val);
    
    // Auto detect operator based on prefix
    if (val.length >= 3) {
      const prefix = val.substring(0, 3);
      if (prefix === '017' || prefix === '013') setOperator('gp');
      else if (prefix === '018') setOperator('robi');
      else if (prefix === '016') setOperator('airtel');
      else if (prefix === '019' || prefix === '014') setOperator('bl');
      else if (prefix === '015') setOperator('teletalk');
    } else {
      setOperator('');
    }
  };

  const handleProceedToPayment = () => {
    const amountToPay = selectedPackage ? selectedPackage.amount : Number(customAmount);
    if (!mobileNumber || !operator || !amountToPay || amountToPay <= 0) {
      alert("Please fill all fields and enter a valid amount");
      return;
    }
    setStep(2);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }
    if (!transactionId || transactionId.length < 5) {
      alert("Please enter a valid transaction ID");
      return;
    }
    
    setLoading(true);
    try {
      const amountToPay = selectedPackage ? selectedPackage.amount : Number(customAmount);
      const packageName = selectedPackage ? selectedPackage.name : 'Custom Recharge';

      // 1. Create Order
      const createRes = await fetch('/api/recharge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          mobile_number: mobileNumber,
          operator,
          package_type: packageName,
          amount: amountToPay,
          payment_method: paymentMethod,
          transaction_id: transactionId
        })
      });
      
      const createData = await createRes.json();
      
      if (createData.success) {
        setStep(3);
        fetchWallet();
        fetchHistory();
      } else {
        alert(createData.error || "Failed to create order");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setMobileNumber('');
    setOperator('');
    setSelectedPackage(null);
    setCustomAmount('');
    setPaymentMethod('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 relative z-10">
          <Smartphone size={32} />
          Recharge & Bills
        </h2>
        <p className="opacity-90 max-w-2xl relative z-10">
          Instant mobile recharge, internet bundles, and combo offers with guaranteed cashback.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
        <button
          onClick={() => setActiveTab('recharge')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'recharge' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Smartphone size={18} />
          Recharge
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <History size={18} />
          History
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'wallet' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Wallet size={18} />
          Wallet
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[500px]">
        
        {/* RECHARGE TAB */}
        {activeTab === 'recharge' && (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors">
                    <Smartphone size={24} />
                    <span className="font-bold text-sm">Mobile Recharge</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-emerald-700 cursor-pointer hover:bg-emerald-100 transition-colors">
                    <Wifi size={24} />
                    <span className="font-bold text-sm">Internet Bundle</span>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-orange-700 cursor-pointer hover:bg-orange-100 transition-colors">
                    <Clock size={24} />
                    <span className="font-bold text-sm">Minute Bundle</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-purple-700 cursor-pointer hover:bg-purple-100 transition-colors">
                    <Gift size={24} />
                    <span className="font-bold text-sm">Combo Offer</span>
                  </div>
                </div>

                {/* Form */}
                <div className="max-w-md mx-auto space-y-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={handleMobileChange}
                        placeholder="01XXXXXXXXX"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-lg"
                      />
                    </div>
                  </div>

                  {/* Operator Auto Detect */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Operator</label>
                    <div className="flex gap-3">
                      {operators.map(op => (
                        <div 
                          key={op.id}
                          onClick={() => setOperator(op.id)}
                          className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center font-bold text-sm cursor-pointer transition-all ${operator === op.id ? `border-${op.color.split('-')[1]}-500 ${op.color} text-white` : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}
                        >
                          {op.logo}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Package Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Select Package</label>
                    <div className="grid grid-cols-2 gap-3">
                      {packages.map(pkg => (
                        <div 
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPackage?.id === pkg.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                        >
                          <div className="font-bold text-slate-800">{pkg.name}</div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-slate-500">{pkg.validity}</span>
                            <span className="font-bold text-indigo-600">৳{pkg.amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Offers (High Commission) */}
                  {operator && specialOffers.filter(o => o.operator === operator).length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Gift size={16} className="text-emerald-500" />
                          বেশি কমিশন যুক্ত অফার
                        </label>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Cashback</span>
                      </div>
                      <div className="space-y-3">
                        {specialOffers.filter(o => o.operator === operator).map(pkg => (
                          <div 
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedPackage?.id === pkg.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-slate-300 shadow-sm'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${pkg.type === 'Combo' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                                {pkg.type === 'Combo' ? <Gift size={20} /> : <Wifi size={20} />}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{pkg.name}</div>
                                <div className="text-xs text-slate-500">{pkg.validity}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-slate-800">৳{pkg.amount}</div>
                              <div className="text-xs font-bold text-emerald-600">Cashback ৳{pkg.cashback}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amount (Auto-filled or Custom) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">৳</span>
                      <input
                        type="number"
                        value={selectedPackage ? selectedPackage.amount : customAmount}
                        onChange={(e) => {
                          setSelectedPackage(null);
                          setCustomAmount(e.target.value);
                        }}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-xl text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={!mobileNumber || !operator || (!selectedPackage && (!customAmount || Number(customAmount) <= 0))}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    Proceed to Payment
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-md mx-auto space-y-8 py-8"
              >
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft size={20} />
                  Back to Details
                </button>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-2">
                  <div className="text-slate-500 font-medium">Total Amount to Pay</div>
                  <div className="text-4xl font-black text-slate-800">৳{selectedPackage ? selectedPackage.amount : customAmount}</div>
                  <div className="text-sm text-slate-500 pt-2">
                    For {mobileNumber} ({operators.find(o => o.id === operator)?.name})
                  </div>
                </div>

                <button
                  onClick={() => initiateOnlinePayment(selectedPackage ? selectedPackage.amount : Number(customAmount), 'Recharge')}
                  disabled={isOnlinePaymentLoading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
                >
                  {isOnlinePaymentLoading ? (
                    <span className="animate-pulse">প্রসেসিং হচ্ছে...</span>
                  ) : (
                    <>
                      <CreditCard size={22} />
                      অনলাইনে পেমেন্ট করুন (SSLCommerz)
                    </>
                  )}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-slate-400 font-bold">অথবা ম্যানুয়ালি</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">Select Payment Method</label>
                  
                  <div 
                    onClick={() => setPaymentMethod('bkash')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-white font-black text-xl">b</div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">bKash</div>
                      <div className="text-xs text-slate-500">Pay with bKash account</div>
                    </div>
                    {paymentMethod === 'bkash' && <CheckCircle2 className="text-pink-500" />}
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl">N</div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">Nagad</div>
                      <div className="text-xs text-slate-500">Pay with Nagad account</div>
                    </div>
                    {paymentMethod === 'nagad' && <CheckCircle2 className="text-orange-500" />}
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('rocket')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === 'rocket' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl">R</div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">Rocket</div>
                      <div className="text-xs text-slate-500">Pay with Rocket account</div>
                    </div>
                    {paymentMethod === 'rocket' && <CheckCircle2 className="text-purple-500" />}
                  </div>
                </div>

                {paymentMethod && (
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-indigo-900 mb-2">Please Send Money to this Number:</p>
                      <div className="bg-white px-4 py-3 rounded-xl border border-indigo-200 inline-block">
                        <span className="font-black text-2xl tracking-wider text-indigo-700">01626824282</span>
                      </div>
                      <p className="text-xs text-indigo-600 mt-2 font-medium">Personal Account ({paymentMethod.toUpperCase()})</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Enter Transaction ID</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 9A8B7C6D"
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center tracking-widest uppercase"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod || !transactionId || loading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {loading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>Submit Request <CreditCard size={20} /></>
                  )}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto py-12 text-center space-y-6"
              >
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-indigo-500" />
                </div>
                
                <h3 className="text-3xl font-black text-slate-800">Request Submitted!</h3>
                <p className="text-slate-500">Your recharge request has been sent to the admin for verification. It will be processed shortly.</p>
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 text-left">
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-500">Mobile Number</span>
                    <span className="font-bold text-slate-800">{mobileNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-bold text-slate-800">৳{selectedPackage ? selectedPackage.amount : customAmount}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-500">Payment Method</span>
                    <span className="font-bold text-slate-800 capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-emerald-600 font-bold">Cashback Earned</span>
                    <span className="font-bold text-emerald-600">৳{cashbackEarned.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-lg hover:bg-indigo-100 transition-colors"
                >
                  Make Another Recharge
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Transactions</h3>
            
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p>No recharge history found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${item.operator === 'gp' ? 'bg-blue-500' : item.operator === 'robi' ? 'bg-red-500' : item.operator === 'airtel' ? 'bg-rose-500' : item.operator === 'bl' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                        {item.operator.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{item.mobile_number}</div>
                        <div className="text-xs text-slate-500">{new Date(item.date).toLocaleString()} • {item.package}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-800">৳{item.amount}</div>
                      <div className="text-xs font-bold text-emerald-500 capitalize">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-100 mb-2">
                  <Wallet size={20} />
                  <span className="font-medium">Available Balance</span>
                </div>
                <div className="text-5xl font-black mb-8">৳{walletBalance.toFixed(2)}</div>
                
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                    Withdraw
                  </button>
                  <button className="px-6 py-3 bg-indigo-500/30 text-white rounded-xl font-bold hover:bg-indigo-500/50 transition-colors border border-indigo-400/30">
                    Use for Recharge
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                  <Gift size={24} />
                </div>
                <div className="text-slate-500 font-medium mb-1">Total Cashback Earned</div>
                <div className="text-2xl font-black text-emerald-700">৳{walletBalance.toFixed(2)}</div>
              </div>
              
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Users size={24} />
                </div>
                <div className="text-slate-500 font-medium mb-1">Referral Earnings</div>
                <div className="text-2xl font-black text-blue-700">৳0.00</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
