import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, MessageSquare, Copy, Check, Sparkles, AlertCircle, ShieldCheck, ArrowRight, RefreshCw, Send } from 'lucide-react';
import { Case } from '../../types';
import { checkWhatsAppNumber, generateCaseWhatsAppMessage, getMagicCaseTrackUrl } from './WhatsAppPhoneHelper';

interface CaseSavedWhatsAppModalProps {
  caseData: Partial<Case>;
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
  lawyerName?: string;
  language?: 'en' | 'bn';
  targetSide?: 'petitioner' | 'respondent' | 'all';
}

export default function CaseSavedWhatsAppModal({
  caseData,
  isOpen,
  onClose,
  referralCode = '',
  lawyerName = 'আইনজীবী',
  language = 'bn',
  targetSide = 'petitioner'
}: CaseSavedWhatsAppModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Toggle between representing Plaintiff (বাদী) or Defendant (বিবাদী)
  const [activeSide, setActiveSide] = useState<'petitioner' | 'respondent'>(
    targetSide === 'respondent' ? 'respondent' : 'petitioner'
  );

  // Track checked/selected contacts for sending
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({});

  // Confirm and Queue States
  const [showConfirm, setShowConfirm] = useState(false);
  const [isQueueActive, setIsQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [queue, setQueue] = useState<{ name: string; phone: string; status: 'pending' | 'sending' | 'sent' }[]>([]);

  // Get contact list for the selected side
  const getContacts = () => {
    if (activeSide === 'petitioner') {
      if (caseData.petitionerDetails && caseData.petitionerDetails.length > 0) {
        return caseData.petitionerDetails.map((p, i) => ({
          name: p.name || `${language === 'bn' ? 'বাদী' : 'Petitioner'} ${p.serial || i + 1}`,
          phone: p.phone || '',
          serial: p.serial || i + 1
        }));
      }
      return [{
        name: caseData.petitioner || (language === 'bn' ? 'বাদী' : 'Petitioner'),
        phone: caseData.petitionerMobile || '',
        serial: 1
      }];
    } else {
      if (caseData.respondentDetails && caseData.respondentDetails.length > 0) {
        return caseData.respondentDetails.map((r, i) => ({
          name: r.name || `${language === 'bn' ? 'বিবাদী/আসামী' : 'Respondent/Accused'} ${r.serial || i + 1}`,
          phone: r.phone || '',
          serial: r.serial || i + 1
        }));
      }
      return [{
        name: caseData.respondent || (language === 'bn' ? 'বিবাদী / আসামী' : 'Respondent / Accused'),
        phone: caseData.respondentMobile || '',
        serial: 1
      }];
    }
  };

  const contacts = getContacts().filter(c => c.name || c.phone);

  // Reset or initialize selected contacts when activeSide or caseData changes
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    contacts.forEach((c, idx) => {
      const key = `${activeSide}_${idx}`;
      initial[key] = !!c.phone; // Checked by default if phone number is present
    });
    setSelectedContacts(initial);
  }, [activeSide, caseData]);

  if (!isOpen || !caseData) return null;

  const caseIdForMessage = caseData.id || (caseData as any)._id;

  const handleSendWhatsApp = (cleanNumber: string, name: string, isSingle: boolean = true) => {
    if (!cleanNumber) return;
    const msg = generateCaseWhatsAppMessage({
      caseId: caseIdForMessage,
      caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
      courtName: caseData.courtName || caseData.court,
      nextDate: caseData.nextDate,
      order: caseData.order,
      partyType: activeSide,
      partyName: name,
      lawyerName,
      referralCode,
      language
    });

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = (id: string, name: string) => {
    const msg = generateCaseWhatsAppMessage({
      caseId: caseIdForMessage,
      caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
      courtName: caseData.courtName || caseData.court,
      nextDate: caseData.nextDate,
      order: caseData.order,
      partyType: activeSide,
      partyName: name,
      lawyerName,
      referralCode,
      language
    });

    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const toggleContactSelection = (idx: number) => {
    const key = `${activeSide}_${idx}`;
    setSelectedContacts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Automated Send Queue handlers
  const handleStartQueue = () => {
    const activeContacts = contacts.filter((c, idx) => selectedContacts[`${activeSide}_${idx}`] && c.phone);
    if (activeContacts.length === 0) {
      alert(language === 'bn' ? 'দয়া করে অন্তত একজন মোবাইল নম্বরসহ ক্লায়েন্ট সিলেক্ট করুন।' : 'Please select at least one client with a mobile number.');
      return;
    }
    
    // Set up queue
    const queueList = activeContacts.map(c => ({
      name: c.name,
      phone: c.phone,
      status: 'pending' as const
    }));
    setQueue(queueList);
    setShowConfirm(true);
  };

  const handleConfirmSend = () => {
    setShowConfirm(false);
    setIsQueueActive(true);
    setQueueIndex(0);
    // Trigger first send
    triggerSend(0);
  };

  const triggerSend = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    
    setQueue(prev => prev.map((item, idx) => idx === index ? { ...item, status: 'sending' } : item));
    
    const contact = queue[index];
    const wa = checkWhatsAppNumber(contact.phone, language);
    const msg = generateCaseWhatsAppMessage({
      caseId: caseIdForMessage,
      caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
      courtName: caseData.courtName || caseData.court,
      nextDate: caseData.nextDate,
      order: caseData.order,
      partyType: activeSide,
      partyName: contact.name,
      lawyerName,
      referralCode,
      language
    });

    if (wa.isValid) {
      const url = `https://wa.me/${wa.cleanNumber}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      
      // Update to sent status immediately after opening link
      setQueue(prev => prev.map((item, idx) => idx === index ? { ...item, status: 'sent' } : item));
    }
  };

  const handleNextInQueue = () => {
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      triggerSend(nextIdx);
    } else {
      setIsQueueActive(false);
      setQueueIndex(-1);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative border border-slate-100 my-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
        >
          <X size={20} />
        </button>

        {/* Success Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {language === 'bn' ? 'মামলাটি সফলভাবে সংরক্ষিত হয়েছে!' : 'Case Saved Successfully!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {language === 'bn' ? 'আপনি কোন পক্ষের প্রতিনিধিত্ব করছেন তা নির্বাচন করুন' : 'Select which side you represent'}
            </p>
          </div>
        </div>

        {/* 2 Represent Selector Boxes (বাদী vs বিবাদী) */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <button
            type="button"
            onClick={() => {
              if (!isQueueActive) setActiveSide('petitioner');
            }}
            disabled={isQueueActive}
            className={`py-4 px-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
              activeSide === 'petitioner'
                ? 'bg-blue-50/50 border-blue-500 text-blue-900 shadow-lg shadow-blue-100/50 ring-2 ring-blue-500/10'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-50/50'
            }`}
          >
            {activeSide === 'petitioner' && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <span className="text-2xl">👨‍⚖️</span>
            <span className="text-sm font-black text-center">{language === 'bn' ? 'আমি বাদী পক্ষ' : 'Represent Plaintiff'}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{language === 'bn' ? 'বাদী/ফরিয়াদী' : 'Petitioner / Plaintiff'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isQueueActive) setActiveSide('respondent');
            }}
            disabled={isQueueActive}
            className={`py-4 px-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${
              activeSide === 'respondent'
                ? 'bg-amber-50/50 border-amber-500 text-amber-900 shadow-lg shadow-amber-100/50 ring-2 ring-amber-500/10'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350 hover:bg-slate-50/50'
            }`}
          >
            {activeSide === 'respondent' && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <span className="text-2xl">⚖️</span>
            <span className="text-sm font-black text-center">{language === 'bn' ? 'আমি বিবাদী পক্ষ' : 'Represent Defendant'}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{language === 'bn' ? 'বিবাদী/আসামী' : 'Respondent / Accused'}</span>
          </button>
        </div>

        {/* Professional Ethics Notice */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl mb-4 text-[11px] text-indigo-800 font-bold leading-relaxed">
          <ShieldCheck size={15} className="text-indigo-600 shrink-0" />
          <span>
            {activeSide === 'petitioner'
              ? (language === 'bn'
                  ? 'প্রফেশনাল গোপনীয়তা ও আইনগত মান রক্ষার্থে শুধুমাত্র বাদী পক্ষের ক্লায়েন্টদের মেসেজ পাঠানোর অপশন সক্রিয় রয়েছে।'
                  : 'Following legal ethics, messages are restricted to your selected Petitioner/Plaintiff clients.')
              : (language === 'bn'
                  ? 'প্রফেশনাল গোপনীয়তা ও আইনগত মান রক্ষার্থে শুধুমাত্র বিবাদী/আসামি পক্ষের ক্লায়েন্টদের মেসেজ পাঠানোর অপশন সক্রিয় রয়েছে।'
                  : 'Following legal ethics, messages are restricted to your selected Respondent/Accused clients.')}
          </span>
        </div>

        {/* Case Info Ribbon */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-bold block">{language === 'bn' ? 'মামলা নং' : 'Case No'}:</span>
            <span className="font-extrabold text-slate-800 text-sm">{caseData.caseNumber || caseData.rawCaseNumber || 'N/A'}</span>
          </div>
          {caseData.courtName && (
            <div>
              <span className="text-slate-400 font-bold block">{language === 'bn' ? 'আদালত' : 'Court'}:</span>
              <span className="font-bold text-slate-700">{caseData.courtName}</span>
            </div>
          )}
          {caseData.nextDate && (
            <div>
              <span className="text-slate-400 font-bold block">{language === 'bn' ? 'পরবর্তী তারিখ' : 'Next Date'}:</span>
              <span className="font-bold text-indigo-600">{caseData.nextDate}</span>
            </div>
          )}
        </div>

        {/* Sending progress queue UI or Standard Listing UI */}
        {isQueueActive ? (
          <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-3xl mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                {language === 'bn' ? 'স্বয়ংক্রিয় প্রসেসিং কিউ সক্রিয়...' : 'Auto Sending Queue Active...'}
              </span>
              <span className="text-xs font-black text-slate-500">
                {queueIndex + 1} / {queue.length}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {queue.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    idx === queueIndex
                      ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900 shadow-sm'
                      : item.status === 'sent'
                      ? 'bg-emerald-50/50 border-emerald-100 text-slate-500'
                      : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{idx + 1}.</span>
                    <span>{item.name} ({item.phone})</span>
                  </div>
                  <span className="font-extrabold uppercase text-[10px]">
                    {item.status === 'sent' && <span className="text-emerald-600">পাঠানো হয়েছে ✅</span>}
                    {item.status === 'sending' && <span className="text-indigo-600 animate-pulse">ওপেন হচ্ছে...</span>}
                    {item.status === 'pending' && <span className="text-slate-400">অপেক্ষমাণ</span>}
                  </span>
                </div>
              ))}
            </div>

            {queueIndex < queue.length && (
              <div className="pt-3 border-t border-slate-150 flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerSend(queueIndex)}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md"
                >
                  <Send size={14} />
                  <span>
                    {language === 'bn'
                      ? `পুনরায় পাঠান: ${queue[queueIndex].name}`
                      : `Resend to: ${queue[queueIndex].name}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleNextInQueue}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl font-black text-xs flex items-center gap-1.5 transition-transform active:scale-98 shadow-md"
                >
                  <span>{queueIndex + 1 === queue.length ? (language === 'bn' ? 'শেষ করুন' : 'Finish') : (language === 'bn' ? 'পরবর্তী ব্যক্তি' : 'Next Recipient')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {language === 'bn' ? `ক্লায়েন্ট তালিকা (${contacts.length} জন)` : `Client list (${contacts.length})`}
              </span>
              <span className="text-[10px] text-slate-400 font-bold italic">
                {language === 'bn' ? 'টিক দিয়ে স্বয়ংক্রিয় পাঠান' : 'Select to send to all'}
              </span>
            </div>

            {contacts.map((contact, idx) => {
              const wa = checkWhatsAppNumber(contact.phone, language);
              const isSelected = !!selectedContacts[`${activeSide}_${idx}`];
              const copyKey = `${activeSide}_${idx}`;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isSelected
                      ? (activeSide === 'petitioner' ? 'bg-blue-50/10 border-blue-200' : 'bg-amber-50/10 border-amber-200')
                      : 'bg-white border-slate-150'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleContactSelection(idx)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? (activeSide === 'petitioner' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-amber-600 border-amber-600 text-white')
                          : 'border-slate-300 hover:border-slate-450 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-950 font-black text-sm">{contact.name}</strong>
                        {contact.serial && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            #{contact.serial}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="text-slate-400 font-medium">{language === 'bn' ? 'মোবাইল নং:' : 'Mobile:'}</span>
                        <span className="font-mono font-bold text-slate-700">{contact.phone || (language === 'bn' ? '(দেওয়া হয়নি)' : '(Not provided)')}</span>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {wa.isValid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {language === 'bn' ? 'সক্রিয় হোয়াটসঅ্যাপ' : 'WA Active'}
                      </span>
                    ) : contact.phone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-150 shrink-0">
                        <AlertCircle size={10} />
                        {language === 'bn' ? 'অসম্পূর্ণ' : 'Incomplete'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic shrink-0">
                        {language === 'bn' ? 'নম্বর নেই' : 'No mobile'}
                      </span>
                    )}
                  </div>

                  {/* Individual Sending Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!wa.isValid}
                      onClick={() => handleSendWhatsApp(wa.cleanNumber, contact.name)}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                        wa.isValid
                          ? 'bg-[#25D366] hover:bg-[#1fb355] text-white active:scale-98 shadow-sm'
                          : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <MessageSquare size={12} fill="currentColor" />
                      <span>{language === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send WhatsApp'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(copyKey, contact.name)}
                      className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all"
                    >
                      {copiedId === copyKey ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>{language === 'bn' ? 'মেসেজ কপি' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Dialog Overlay */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-5"
            >
              <div className="w-14 h-14 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center shrink-0 border border-[#25D366]/20">
                <MessageSquare size={32} fill="currentColor" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-900">
                  {language === 'bn' ? 'হোয়াটসঅ্যাপ বার্তা প্রেরণের অনুমতি' : 'WhatsApp Dispatch Confirmation'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm leading-relaxed">
                  {language === 'bn'
                    ? `আপনি কি নিশ্চিত যে নির্বাচিত ${queue.length} জন ${activeSide === 'petitioner' ? 'বাদী' : 'বিবাদী/আসামী'} পক্ষের ক্লায়েন্টদের মোবাইলে রেফারেল লিংকসহ মামলার বিবরণ পাঠাতে চান?`
                    : `Are you sure you want to send case details with referral link to ${queue.length} selected ${activeSide === 'petitioner' ? 'Plaintiff' : 'Defendant'} clients?`}
                </p>
                <div className="text-[11px] text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 font-bold inline-block">
                  {language === 'bn' ? '💡 এটি কিউ আকারে একের পর এক ব্রাউজারের পপ-আপ ব্লক ছাড়াই পাঠাবে।' : '💡 This will queue messages one by one to avoid popup blocking.'}
                </div>
              </div>
              <div className="flex gap-3 w-full max-w-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-all active:scale-98"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  className="flex-1 py-3 bg-[#25D366] hover:bg-[#1fb355] text-white rounded-2xl font-black text-xs transition-all active:scale-98 shadow-md shadow-emerald-100"
                >
                  {language === 'bn' ? 'হ্যাঁ, শুরু করুন' : 'Yes, Dispatch'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Magic Tracking Link Display Card */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                {language === 'bn' ? 'ম্যাজিক কেস ট্র্যাকিং ও অটো পুশ লিংক' : 'Magic Case Tracking & Push Link'}
              </p>
              <p className="text-[10px] text-slate-500">
                {language === 'bn' ? 'মক্কেল এই লিংকে ক্লিক করলেই ১-ট্যাপে অটো নোটিফিকেশন চালু করতে পারবেন' : 'Client can click to enable 1-tap push alerts'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const url = getMagicCaseTrackUrl({
                caseId: caseIdForMessage,
                caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
                referralCode
              });
              navigator.clipboard.writeText(url);
              setCopiedId('magic_track_link');
              setTimeout(() => setCopiedId(null), 2500);
            }}
            className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            {copiedId === 'magic_track_link' ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedId === 'magic_track_link' ? (language === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (language === 'bn' ? 'লিংক কপি করুন' : 'Copy Link')}</span>
          </button>
        </div>

        {/* Referral info tip */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center gap-2.5 mb-6 text-xs text-blue-900">
          <Sparkles size={16} className="text-blue-600 shrink-0" />
          <div className="flex-1 leading-relaxed">
            <strong>{language === 'bn' ? 'রেফারেল সুবিধা:' : 'Referral Reward:'}</strong>{' '}
            {language === 'bn' 
              ? `বার্তাটিতে আপনার সক্রিয় রেফারেল কোড (${referralCode || 'সক্রিয়'}) যুক্ত রয়েছে। আপনার ক্লায়েন্ট অ্যাপে রেজিস্ট্রেশন করলে আপনি ১০০ পয়েন্ট ও সাদা বল উপহার পাবেন!`
              : `Your active referral link (${referralCode}) is embedded in the message. You earn 100 points when your client signs up!`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
          {!isQueueActive && (
            <button
              type="button"
              onClick={handleStartQueue}
              className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all active:scale-98 shadow-lg shadow-indigo-100/50 flex items-center justify-center gap-2"
            >
              <Send size={14} />
              <span>
                {language === 'bn' ? 'সবাইকে স্বয়ংক্রিয়ভাবে পাঠান' : 'Send to All Automatically'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all active:scale-98 text-center"
          >
            {language === 'bn' ? 'সম্পন্ন / বন্ধ করুন' : 'Done / Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
