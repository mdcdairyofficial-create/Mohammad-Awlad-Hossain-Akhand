import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, MessageSquare, Copy, Check, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { Case } from '../../types';
import { checkWhatsAppNumber, generateCaseWhatsAppMessage } from './WhatsAppPhoneHelper';

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

  if (!isOpen || !caseData) return null;

  const showPetitioner = targetSide === 'petitioner' || targetSide === 'all';
  const showRespondent = targetSide === 'respondent' || targetSide === 'all';

  // Petitioner info
  const petitionerName = caseData.petitioner || 'বাদী';
  const petitionerPhone = caseData.petitionerMobile || '';
  const petitionerWa = checkWhatsAppNumber(petitionerPhone, language);

  const petitionerMsg = generateCaseWhatsAppMessage({
    caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
    courtName: caseData.courtName || caseData.court,
    nextDate: caseData.nextDate,
    order: caseData.order,
    partyType: 'petitioner',
    partyName: petitionerName,
    lawyerName,
    referralCode,
    language
  });

  // Respondent info - Check if multiple respondents in respondentDetails
  const respondentDetailsList = caseData.respondentDetails && caseData.respondentDetails.length > 0
    ? caseData.respondentDetails.filter(d => d && (d.name || d.phone))
    : [];

  const handleSendWhatsApp = (cleanNumber: string, message: string) => {
    if (!cleanNumber) return;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
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
              {targetSide === 'petitioner'
                ? (language === 'bn' 
                    ? 'আপনার ক্লায়েন্ট (বাদী)-এর হোয়াটসঅ্যাপে মামলার তথ্য ও রেফারেল লিংক পাঠান' 
                    : 'Send case details & referral link to your Client (Petitioner) via WhatsApp')
                : (language === 'bn' 
                    ? 'আপনার ক্লায়েন্ট (বিবাদী/আসামি)-এর হোয়াটসঅ্যাপে মামলার তথ্য ও রেফারেল লিংক পাঠান' 
                    : 'Send case details & referral link to your Client (Respondent/Accused) via WhatsApp')}
            </p>
          </div>
        </div>

        {/* Professional Ethics Notice */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-4 text-[11px] text-indigo-800 font-medium">
          <ShieldCheck size={15} className="text-indigo-600 shrink-0" />
          <span>
            {targetSide === 'petitioner'
              ? (language === 'bn'
                  ? 'প্রফেশনাল গোপনীয়তা ও আইনগত মান রক্ষার্থে শুধুমাত্র বাদী পক্ষের নম্বরে মেসেজ পাঠানোর অপশন রাখা হয়েছে।'
                  : 'Following legal ethics, WhatsApp message option is restricted exclusively to your Petitioner client.')
              : (language === 'bn'
                  ? 'প্রফেশনাল গোপনীয়তা ও আইনগত মান রক্ষার্থে শুধুমাত্র বিবাদী/আসামি পক্ষের নম্বরে মেসেজ পাঠানোর অপশন রাখা হয়েছে।'
                  : 'Following legal ethics, WhatsApp message option is restricted exclusively to your Respondent/Accused client.')}
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

        {/* Parties List for WhatsApp dispatch */}
        <div className="space-y-4 mb-6">
          {/* Party 1: Petitioner (বাদী / ক্লায়েন্ট) - ONLY SHOWN IF TARGET SIDE IS PETITIONER OR ALL */}
          {showPetitioner && (
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {language === 'bn' ? '👨‍⚖️ আপনার ক্লায়েন্ট (বাদী)' : 'Your Client (Petitioner)'}
                    </span>
                    <strong className="text-slate-900 text-sm">{petitionerName}</strong>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <span className="text-slate-500">{language === 'bn' ? 'মোবাইল নং:' : 'Mobile:'}</span>
                    <span className="font-mono font-bold text-slate-800">{petitionerPhone || (language === 'bn' ? '(দেওয়া হয়নি)' : '(Not provided)')}</span>
                  </div>
                </div>

                {/* Status Badge */}
                {petitionerWa.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    {language === 'bn' ? 'নীল: হোয়াটসঅ্যাপ সক্রিয়' : 'Blue: WhatsApp Active'}
                  </span>
                ) : petitionerPhone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle size={12} />
                    {petitionerWa.statusText}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    {language === 'bn' ? 'নম্বর নেই' : 'No number'}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-blue-100">
                <button
                  type="button"
                  disabled={!petitionerWa.isValid}
                  onClick={() => handleSendWhatsApp(petitionerWa.cleanNumber, petitionerMsg)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    petitionerWa.isValid
                      ? 'bg-[#25D366] hover:bg-[#1fb355] text-white active:scale-98'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <MessageSquare size={14} fill="currentColor" />
                  <span>{language === 'bn' ? 'বাদীকে হোয়াটসঅ্যাপে পাঠান' : 'Send to Petitioner via WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyMessage('petitioner', petitionerMsg)}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                  title="মেসেজ কপি করুন"
                >
                  {copiedId === 'petitioner' ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>কপি</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Party 2: Respondent / Accused (বিবাদী / আসামী) - ONLY SHOWN IF TARGET SIDE IS RESPONDENT OR ALL */}
          {showRespondent && (
            <>
              {respondentDetailsList.length > 0 ? (
                // Multiple or detailed respondents
                respondentDetailsList.map((resp, idx) => {
                  const rPhone = resp.phone || '';
                  const rWa = checkWhatsAppNumber(rPhone, language);
                  const rName = resp.name || `আসামী/বিবাদী ${resp.serial || idx + 1}`;
                  const rMsg = generateCaseWhatsAppMessage({
                    caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
                    courtName: caseData.courtName || caseData.court,
                    nextDate: caseData.nextDate,
                    order: caseData.order,
                    partyType: 'respondent',
                    partyName: rName,
                    lawyerName,
                    referralCode,
                    language
                  });
                  const copyKey = `respondent_${idx}`;

                  return (
                    <div key={idx} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              {language === 'bn' 
                                ? `👨‍⚖️ আপনার ক্লায়েন্ট (আসামী #${resp.serial || idx + 1})` 
                                : `Your Client (Accused #${resp.serial || idx + 1})`}
                            </span>
                            <strong className="text-slate-900 text-sm">{rName}</strong>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="text-slate-500">{language === 'bn' ? 'মোবাইল নং:' : 'Mobile:'}</span>
                            <span className="font-mono font-bold text-slate-800">{rPhone || (language === 'bn' ? '(দেওয়া হয়নি)' : '(Not provided)')}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {rWa.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            {language === 'bn' ? 'নীল: হোয়াটসঅ্যাপ সক্রিয়' : 'Blue: WhatsApp Active'}
                          </span>
                        ) : rPhone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle size={12} />
                            {rWa.statusText}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {language === 'bn' ? 'নম্বর নেই' : 'No number'}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-amber-100">
                        <button
                          type="button"
                          disabled={!rWa.isValid}
                          onClick={() => handleSendWhatsApp(rWa.cleanNumber, rMsg)}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                            rWa.isValid
                              ? 'bg-[#25D366] hover:bg-[#1fb355] text-white active:scale-98'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <MessageSquare size={14} fill="currentColor" />
                          <span>
                            {language === 'bn' 
                              ? `আসামি (${resp.serial ? `#${resp.serial}` : ''})-কে হোয়াটসঅ্যাপে পাঠান` 
                              : `Send to Accused via WhatsApp`}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(copyKey, rMsg)}
                          className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                          title="মেসেজ কপি করুন"
                        >
                          {copiedId === copyKey ? (
                            <>
                              <Check size={14} className="text-emerald-600" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>কপি</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback single respondent
                (() => {
                  const rName = caseData.respondent || 'বিবাদী / আসামী';
                  const rPhone = caseData.respondentMobile || '';
                  const rWa = checkWhatsAppNumber(rPhone, language);
                  const rMsg = generateCaseWhatsAppMessage({
                    caseNumber: caseData.caseNumber || caseData.rawCaseNumber,
                    courtName: caseData.courtName || caseData.court,
                    nextDate: caseData.nextDate,
                    order: caseData.order,
                    partyType: 'respondent',
                    partyName: rName,
                    lawyerName,
                    referralCode,
                    language
                  });

                  return (
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              {language === 'bn' ? '👨‍⚖️ আপনার ক্লায়েন্ট (বিবাদী / আসামী)' : 'Your Client (Respondent / Accused)'}
                            </span>
                            <strong className="text-slate-900 text-sm">{rName}</strong>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="text-slate-500">{language === 'bn' ? 'মোবাইল নং:' : 'Mobile:'}</span>
                            <span className="font-mono font-bold text-slate-800">{rPhone || (language === 'bn' ? '(দেওয়া হয়নি)' : '(Not provided)')}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {rWa.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            {language === 'bn' ? 'নীল: হোয়াটসঅ্যাপ সক্রিয়' : 'Blue: WhatsApp Active'}
                          </span>
                        ) : rPhone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle size={12} />
                            {rWa.statusText}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {language === 'bn' ? 'নম্বর নেই' : 'No number'}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-amber-100">
                        <button
                          type="button"
                          disabled={!rWa.isValid}
                          onClick={() => handleSendWhatsApp(rWa.cleanNumber, rMsg)}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                            rWa.isValid
                              ? 'bg-[#25D366] hover:bg-[#1fb355] text-white active:scale-98'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <MessageSquare size={14} fill="currentColor" />
                          <span>{language === 'bn' ? 'আসামি/বিবাদীকে হোয়াটসঅ্যাপে পাঠান' : 'Send to Accused via WhatsApp'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage('respondent_single', rMsg)}
                          className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
                          title="মেসেজ কপি করুন"
                        >
                          {copiedId === 'respondent_single' ? (
                            <>
                              <Check size={14} className="text-emerald-600" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>কপি</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </>
          )}
        </div>

        {/* Referral info tip */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center gap-2.5 mb-6 text-xs text-blue-900">
          <Sparkles size={16} className="text-blue-600 shrink-0" />
          <div className="flex-1">
            <strong>{language === 'bn' ? 'রেফারেল সুবিধা:' : 'Referral Reward:'}</strong>{' '}
            {language === 'bn' 
              ? `বার্তাটিতে আপনার সক্রিয় রেফারেল কোড (${referralCode || 'সক্রিয়'}) যুক্ত রয়েছে। আপনার ক্লায়েন্ট অ্যাপে রেজিস্ট্রেশন করলে আপনি ১০০ পয়েন্ট ও সাদা বল উপহার পাবেন!`
              : `Your active referral link (${referralCode}) is embedded in the message. You earn 100 points when your client signs up!`}
          </div>
        </div>

        {/* Footer Done button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-md"
          >
            {language === 'bn' ? 'সম্পন্ন / বন্ধ করুন' : 'Done / Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
