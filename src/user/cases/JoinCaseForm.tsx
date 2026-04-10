import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { translations } from '../../translations';
import { Case } from '../../types';
import { getPoliceStations } from '../../constants';

interface JoinCaseFormProps {
  onJoin: (caseNumber: string, side: 'petitioner' | 'respondent', respondents?: {name: string, serial: string, phone: string}[], totalRespondents?: string, order?: string, additionalOrder?: string, lawyerInfo?: {name: string, phone: string}, clerkInfo?: {name: string, phone: string}, nextDate?: string, caseSection?: string) => void;
  onCancel: () => void;
  language: 'en' | 'bn' | 'hi' | 'ur';
  existingCases?: Case[];
  userDistrict?: string;
  userCountry?: string;
  userType?: string;
  userName?: string;
  userMobile?: string;
}

export default function JoinCaseForm({ onJoin, onCancel, language, existingCases = [], userDistrict, userCountry = 'Bangladesh', userType, userName, userMobile }: JoinCaseFormProps) {
  const t = translations[language];
  const [step, setStep] = useState(1);
  const [caseCategory, setCaseCategory] = useState('');
  const [caseType, setCaseType] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [rawCaseNumber, setRawCaseNumber] = useState('');
  const [filingYear, setFilingYear] = useState(new Date().getFullYear().toString());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [side, setSide] = useState<'petitioner' | 'respondent'>('petitioner');
  const [respondents, setRespondents] = useState([{ name: '', serial: '', phone: '' }]);
  const [totalRespondents, setTotalRespondents] = useState('');
  const [order, setOrder] = useState('');
  const [additionalOrder, setAdditionalOrder] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [caseSection, setCaseSection] = useState('');
  
  // Lawyer and Clerk info
  const [lawyerName, setLawyerName] = useState('');
  const [lawyerPhone, setLawyerPhone] = useState('');
  const [clerkName, setClerkName] = useState('');
  const [clerkPhone, setClerkPhone] = useState('');

  // Auto-fill for Lawyer/Clerk based on userType
  useEffect(() => {
    if (userType === 'lawyer') {
      setLawyerName(userName || '');
      setLawyerPhone(userMobile || '');
    } else if (userType === 'clerk') {
      setClerkName(userName || '');
      setClerkPhone(userMobile || '');
    }
  }, [userType, userName, userMobile]);

  // Auto-search for Lawyer
  useEffect(() => {
    const searchLawyer = async () => {
      if (lawyerPhone.length >= 11) {
        try {
          const res = await fetch(`/api/users/search?mobile=${lawyerPhone}&type=lawyer`);
          if (res.ok) {
            const user = await res.json();
            if (user && user.name) {
              setLawyerName(user.name);
            }
          }
        } catch (err) {
          console.error("Error searching lawyer:", err);
        }
      }
    };
    searchLawyer();
  }, [lawyerPhone]);

  // Auto-search for Clerk
  useEffect(() => {
    const searchClerk = async () => {
      if (clerkPhone.length >= 11) {
        try {
          const res = await fetch(`/api/users/search?mobile=${clerkPhone}&type=clerk`);
          if (res.ok) {
            const user = await res.json();
            if (user && user.name) {
              setClerkName(user.name);
            }
          }
        } catch (err) {
          console.error("Error searching clerk:", err);
        }
      }
    };
    searchClerk();
  }, [clerkPhone]);

  const criminalTypes = ['জি.আর', 'সি.আর', 'মানব পাচার পিটিশন', 'পিটিশন', 'ICT'];
  const civilTypes = ['দেওয়ানী', 'পারিবারিক'];

  const caseNumber = React.useMemo(() => {
    if (!caseType || !rawCaseNumber || !filingYear || !policeStation) return '';
    return `${caseType}-${rawCaseNumber}/${filingYear}(${policeStation})`;
  }, [caseType, rawCaseNumber, filingYear, policeStation]);

  const filteredCases = React.useMemo(() => {
    if (!caseNumber) return [];
    return existingCases.filter(c => 
      c.caseNumber.toLowerCase().includes(caseNumber.toLowerCase()) || 
      (c.rawCaseNumber && c.rawCaseNumber.toLowerCase().includes(caseNumber.toLowerCase()))
    ).slice(0, 5);
  }, [caseNumber, existingCases]);

  const handleAddRespondent = () => {
    setRespondents([...respondents, { name: '', serial: '', phone: '' }]);
  };

  const handleRemoveRespondent = (index: number) => {
    setRespondents(respondents.filter((_, i) => i !== index));
  };

  const handleRespondentChange = (index: number, field: 'name' | 'serial' | 'phone', value: string) => {
    const newRespondents = [...respondents];
    newRespondents[index][field] = value;
    setRespondents(newRespondents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseNumber.trim()) {
      if (step === 1) {
        setStep(2);
        return;
      }
      onJoin(
        caseNumber.trim(), 
        side, 
        side === 'respondent' ? respondents.filter(r => r.name.trim() !== '') : undefined, 
        side === 'respondent' ? totalRespondents : undefined,
        order,
        additionalOrder,
        { name: lawyerName, phone: lawyerPhone },
        { name: clerkName, phone: clerkPhone },
        nextDate,
        caseSection
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md mb-12 shadow-2xl relative"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {t.join_case_title}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'bn' ? 'মামলার ধরন (বিভাগ)' : 'Case Category'}
                  </label>
                  <select
                    value={caseCategory}
                    onChange={(e) => {
                      setCaseCategory(e.target.value);
                      setCaseType('');
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'bn' ? 'মামলার ধরন' : 'Case Type'}
                  </label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    required
                    disabled={!caseCategory}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                    {caseCategory === 'Criminal' && criminalTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    {caseCategory === 'Civil' && civilTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'bn' ? 'মামলা নং' : 'Case No'}
                  </label>
                  <input
                    type="text"
                    value={rawCaseNumber}
                    onChange={(e) => setRawCaseNumber(e.target.value)}
                    required
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'bn' ? 'সাল' : 'Year'}
                  </label>
                  <input
                    type="text"
                    value={filingYear}
                    onChange={(e) => setFilingYear(e.target.value)}
                    required
                    placeholder="2026"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'bn' ? 'থানার নাম' : 'Police Station'}
                  </label>
                  <select
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                    {userDistrict && getPoliceStations(userDistrict, userCountry).map(ps => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t.section}
                  </label>
                  <input
                    type="text"
                    value={caseSection}
                    onChange={(e) => setCaseSection(e.target.value)}
                    placeholder={t.section_placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              {caseNumber && (
                <p className="text-sm text-slate-600 mt-2 font-medium">
                  {language === 'bn' ? 'মামলা নং: ' : 'Case No: '} {caseNumber}
                </p>
              )}
              
              {showSuggestions && filteredCases.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredCases.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="font-medium text-slate-800">{c.caseNumber}</div>
                      <div className="text-xs text-slate-500">{c.courtName}</div>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Join As
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSide('petitioner')}
                    className={`py-2 px-4 rounded-xl border font-medium transition-colors ${
                      side === 'petitioner' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.petitioner}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('respondent')}
                    className={`py-2 px-4 rounded-xl border font-medium transition-colors ${
                      side === 'respondent' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.respondent}
                  </button>
                </div>
              </div>

              {side === 'respondent' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'bn' ? 'মোট আসামী/বিবাদী সংখ্যা' : 'Total Accused/Respondents'}
                    </label>
                    <input
                      type="number"
                      value={totalRespondents}
                      onChange={(e) => setTotalRespondents(e.target.value)}
                      placeholder={language === 'bn' ? 'মোট সংখ্যা লিখুন' : 'Enter total number'}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-slate-700">
                        {language === 'bn' ? 'আসামী/বিবাদীর বিবরণ' : 'Respondent/Accused Details'}
                      </label>
                      <button
                        type="button"
                        onClick={handleAddRespondent}
                        className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Plus size={14} /> {language === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}
                      </button>
                    </div>
                    
                    {respondents.map((respondent, index) => (
                      <div key={index} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3 relative">
                        {respondents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRespondent(index)}
                            className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              {language === 'bn' ? 'নাম' : 'Name'}
                            </label>
                            <input
                              type="text"
                              value={respondent.name}
                              onChange={(e) => handleRespondentChange(index, 'name', e.target.value)}
                              required
                              placeholder={language === 'bn' ? 'নাম লিখুন' : 'Enter name'}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              {language === 'bn' ? 'আসামী/বিবাদী নং' : 'Accused/Respondent No'}
                            </label>
                            <input
                              type="number"
                              value={respondent.serial}
                              onChange={(e) => handleRespondentChange(index, 'serial', e.target.value)}
                              placeholder={language === 'bn' ? 'নং লিখুন' : 'Enter no'}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              {language === 'bn' ? 'মোবাইল নং' : 'Mobile No'}
                            </label>
                            <input
                              type="tel"
                              value={respondent.phone}
                              onChange={(e) => handleRespondentChange(index, 'phone', e.target.value)}
                              placeholder={language === 'bn' ? 'মোবাইল নং লিখুন' : 'Enter mobile no'}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'আগামী তারিখ' : 'Next Date'}</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'মামলার আদেশ' : 'Case Order'}</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">{language === 'bn' ? 'আদেশ নির্বাচন করুন' : 'Select Order'}</option>
                  <optgroup label={language === 'bn' ? 'ফৌজদারী (Criminal)' : 'Criminal'}>
                    <option value="তদন্ত">তদন্ত</option>
                    <option value="চার্জশিট">চার্জশিট</option>
                    <option value="সাক্ষ্য">সাক্ষ্য</option>
                    <option value="রায়">রায়</option>
                    <option value="হাজিরা">হাজিরা</option>
                    <option value="সময়">সময়</option>
                  </optgroup>
                  <optgroup label={language === 'bn' ? 'দেওয়ানী (Civil)' : 'Civil'}>
                    <option value="সমন">সমন</option>
                    <option value="জবাব">জবাব</option>
                    <option value="ইস্যু গঠন">ইস্যু গঠন</option>
                    <option value="শুনানি">শুনানি</option>
                    <option value="রায়">রায়</option>
                    <option value="সময়">সময়</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'অতিরিক্ত আদেশ/নোট' : 'Additional Order/Notes'}</label>
                <textarea
                  value={additionalOrder}
                  onChange={(e) => setAdditionalOrder(e.target.value)}
                  rows={3}
                  placeholder={language === 'bn' ? 'অতিরিক্ত কোন আদেশ থাকলে তা লিখুন...' : 'Enter any additional order or notes...'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </>
          ) : (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> {language === 'bn' ? 'উকিল ও মুহুরি’র তথ্য' : 'Lawyer & Clerk Info'}
                </h3>
                
                <div className="space-y-4">
                  {userType !== 'lawyer' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {language === 'bn' ? 'উকিলের নাম' : 'Lawyer Name'}
                        </label>
                        <input
                          type="text"
                          value={lawyerName}
                          onChange={(e) => setLawyerName(e.target.value)}
                          placeholder={language === 'bn' ? 'নাম লিখুন' : 'Enter name'}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {language === 'bn' ? 'উকিলের মোবাইল নং' : 'Lawyer Mobile No'}
                        </label>
                        <input
                          type="tel"
                          value={lawyerPhone}
                          onChange={(e) => setLawyerPhone(e.target.value)}
                          placeholder={language === 'bn' ? 'মোবাইল নং লিখুন' : 'Enter mobile no'}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {userType !== 'clerk' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {language === 'bn' ? 'মুহুরির নাম' : 'Clerk Name'}
                        </label>
                        <input
                          type="text"
                          value={clerkName}
                          onChange={(e) => setClerkName(e.target.value)}
                          placeholder={language === 'bn' ? 'নাম লিখুন' : 'Enter name'}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {language === 'bn' ? 'মুহুরির মোবাইল নং' : 'Clerk Mobile No'}
                        </label>
                        <input
                          type="tel"
                          value={clerkPhone}
                          onChange={(e) => setClerkPhone(e.target.value)}
                          placeholder={language === 'bn' ? 'মোবাইল নং লিখুন' : 'Enter mobile no'}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={step === 2 ? () => setStep(1) : onCancel}
              className="px-6 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {step === 2 ? (language === 'bn' ? 'পিছনে' : 'Back') : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!caseNumber.trim()}
              className="px-6 py-2 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {side === 'respondent' && step === 1 ? (language === 'bn' ? 'পরবর্তী' : 'Next') : (language === 'bn' ? 'মামলায় যুক্ত হোন' : 'Join Case')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
