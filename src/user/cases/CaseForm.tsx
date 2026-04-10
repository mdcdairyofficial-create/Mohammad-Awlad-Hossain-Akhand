import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { Case } from '../../types';
import { translations } from '../../translations';
import { BANGLADESH_DISTRICTS, getPoliceStations, getCourtsForDistrict } from '../../constants';

interface CaseFormProps {
  onSave: (caseData: any) => void;
  onCancel: () => void;
  initialData?: Case | null;
  language: 'en' | 'bn' | 'hi' | 'ur';
  userDistrict: string;
  userCountry: string;
  canEditPetitioner: boolean;
  canEditRespondent: boolean;
  userType?: string;
  userName?: string;
  userMobile?: string;
}

interface PartyRow {
  name: string;
  phone: string;
  serial?: number;
}

export default function CaseForm({
  onSave,
  onCancel,
  initialData,
  language,
  userDistrict,
  userCountry,
  canEditPetitioner,
  canEditRespondent,
  userType,
  userName,
  userMobile
}: CaseFormProps) {
  const t = translations[language];
  const [step, setStep] = useState(1);
  const [caseCategory, setCaseCategory] = useState('');
  const [formData, setFormData] = useState<Partial<Case>>({
    caseNumber: '',
    rawCaseNumber: '',
    court: '',
    courtName: '',
    district: userDistrict || '',
    policeStation: '',
    nextDate: '',
    status: 'Pending',
    caseType: '',
    petitioner: '',
    respondent: '',
    petitionerMobile: '',
    respondentMobile: '',
    petitionerLawyer: '',
    respondentLawyer: '',
    petitionerLawyerMobile: [],
    respondentLawyerMobile: [],
    petitionerClerk: '',
    respondentClerk: '',
    petitionerClerkMobile: [],
    respondentClerkMobile: [],
    filingDate: '',
    visibility: 'private',
    isUpdated: false,
    caseSection: '',
    order: '',
    additionalOrder: '',
    totalRespondents: ''
  });

  const [plaintiffs, setPlaintiffs] = useState<PartyRow[]>([{ name: '', phone: '' }]);
  const [defendants, setDefendants] = useState<PartyRow[]>([{ name: '', phone: '', serial: 1 }]);
  const [lawyers, setLawyers] = useState<PartyRow[]>([{ name: '', phone: '' }]);
  const [clerks, setClerks] = useState<PartyRow[]>([{ name: '', phone: '' }]);

  const criminalTypes = ['জি.আর', 'সি.আর', 'মানব পাচার পিটিশন', 'পিটিশন', 'ICT'];
  const civilTypes = ['দেওয়ানী', 'পারিবারিক'];

  useEffect(() => {
    if (initialData) {
      let initialRaw = initialData.rawCaseNumber;
      if (!initialRaw && initialData.caseNumber) {
        // Try to extract raw number if it was formatted
        const year = initialData.filingDate ? new Date(initialData.filingDate).getFullYear() : '';
        const prefix = initialData.caseType ? `${initialData.caseType}-` : '';
        const suffix = (year && initialData.policeStation) ? `/${year}(${initialData.policeStation})` : '';
        
        if (prefix && suffix && initialData.caseNumber.startsWith(prefix) && initialData.caseNumber.endsWith(suffix)) {
          initialRaw = initialData.caseNumber.substring(prefix.length, initialData.caseNumber.length - suffix.length);
        } else {
          initialRaw = initialData.caseNumber;
        }
      }

      setFormData({
        ...initialData,
        rawCaseNumber: initialRaw || '',
        courtName: initialData.courtName || initialData.court || '',
        totalRespondents: initialData.totalRespondents || '',
        caseSection: initialData.caseSection || ''
      });
      
      // Set case category based on caseType
      if (criminalTypes.includes(initialData.caseType || '')) {
        setCaseCategory('Criminal');
      } else if (civilTypes.includes(initialData.caseType || '')) {
        setCaseCategory('Civil');
      } else if (initialData.caseType) {
        setCaseCategory('Other');
      }
      
      // Parse Petitioner/Plaintiffs
      if (initialData.petitioner) {
        const names = initialData.petitioner.split(', ');
        setPlaintiffs(names.map(name => ({ name, phone: initialData.petitionerMobile || '' })));
      }
      
      // Parse Respondent/Defendants
      if (initialData.respondentDetails && initialData.respondentDetails.length > 0) {
        setDefendants(initialData.respondentDetails.map(d => ({ name: d.name, phone: d.phone, serial: Number(d.serial) || 1 })));
      } else if (initialData.respondent) {
        const names = initialData.respondent.split(', ');
        setDefendants(names.map((name, i) => ({ name, phone: initialData.respondentMobile || '', serial: i + 1 })));
      }

      // Parse Lawyers
      if (initialData.petitionerLawyer) {
        const names = initialData.petitionerLawyer.split(', ');
        const mobiles = Array.isArray(initialData.petitionerLawyerMobile) 
          ? initialData.petitionerLawyerMobile 
          : (initialData.petitionerLawyerMobile ? [initialData.petitionerLawyerMobile] : []);
        setLawyers(names.map((name, i) => ({ name, phone: mobiles[i] || '' })));
      }

      // Parse Clerks
      if (initialData.petitionerClerk) {
        const names = initialData.petitionerClerk.split(', ');
        const mobiles = Array.isArray(initialData.petitionerClerkMobile) 
          ? initialData.petitionerClerkMobile 
          : (initialData.petitionerClerkMobile ? [initialData.petitionerClerkMobile] : []);
        setClerks(names.map((name, i) => ({ name, phone: mobiles[i] || '' })));
      }
    } else {
      // Auto-fill for new cases based on userType
      if (userType === 'lawyer') {
        setLawyers([{ name: userName || '', phone: userMobile || '' }]);
      } else if (userType === 'clerk') {
        setClerks([{ name: userName || '', phone: userMobile || '' }]);
      }
    }
  }, [initialData, userType, userName, userMobile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartyChange = (
    index: number,
    field: keyof PartyRow,
    value: string,
    setter: React.Dispatch<React.SetStateAction<PartyRow[]>>
  ) => {
    setter(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = (setter: React.Dispatch<React.SetStateAction<PartyRow[]>>, isDefendant = false) => {
    setter(prev => {
      const newRow: PartyRow = { name: '', phone: '' };
      if (isDefendant) {
        newRow.serial = prev.length + 1;
      }
      return [...prev, newRow];
    });
  };

  const removeRow = (index: number, setter: React.Dispatch<React.SetStateAction<PartyRow[]>>, isDefendant = false) => {
    setter(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (isDefendant) {
        return updated.map((row, i) => ({ ...row, serial: i + 1 }));
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawNumber = formData.rawCaseNumber || formData.caseNumber || '';
    const year = formData.filingDate ? new Date(formData.filingDate).getFullYear() : '';
    const type = formData.caseType || '';
    const thana = formData.policeStation || '';
    
    let formattedCaseNumber = rawNumber;
    if (rawNumber) {
      const parts = [];
      if (type) parts.push(`${type}-`);
      parts.push(rawNumber);
      if (year) parts.push(`/${year}`);
      if (thana) parts.push(`(${thana})`);
      formattedCaseNumber = parts.join('');
    }

    // Combine data for saving
    const finalData = {
      ...formData,
      caseNumber: formattedCaseNumber,
      rawCaseNumber: rawNumber,
      court: formData.courtName, // Ensure court is updated
      petitioner: plaintiffs.map(p => p.name).filter(Boolean).join(', '),
      petitionerMobile: plaintiffs[0]?.phone || '',
      respondent: defendants.map(d => d.name).filter(Boolean).join(', '),
      respondentMobile: defendants[0]?.phone || '',
      respondentDetails: defendants.map(d => ({ name: d.name, phone: d.phone, serial: d.serial })),
      petitionerLawyer: lawyers.map(l => l.name).filter(Boolean).join(', '),
      petitionerLawyerMobile: lawyers.map(l => l.phone).filter(Boolean),
      petitionerClerk: clerks.map(c => c.name).filter(Boolean).join(', '),
      petitionerClerkMobile: clerks.map(c => c.phone).filter(Boolean),
    };

    onSave(finalData);
  };

  const renderPartySection = (
    title: string,
    rows: PartyRow[],
    setter: React.Dispatch<React.SetStateAction<PartyRow[]>>,
    namePlaceholder: string,
    isDefendant = false,
    hideAddButton = false,
    type?: 'lawyer' | 'clerk'
  ) => {
    // Auto-search effect for each row
    const SearchEffect = ({ index, phone, type }: { index: number, phone: string, type: 'lawyer' | 'clerk' }) => {
      useEffect(() => {
        const search = async () => {
          if (phone.length >= 11) {
            try {
              const res = await fetch(`/api/users/search?mobile=${phone}&type=${type}`);
              if (res.ok) {
                const user = await res.json();
                if (user && user.name) {
                  handlePartyChange(index, 'name', user.name, setter);
                }
              }
            } catch (err) {
              console.error(`Error searching ${type}:`, err);
            }
          }
        };
        search();
      }, [phone]);
      return null;
    };

    return (
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-slate-700">{title}</h4>
          {!hideAddButton && (
            <button
              type="button"
              onClick={() => addRow(setter, isDefendant)}
              className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus size={14} /> {language === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}
            </button>
          )}
        </div>
        {rows.map((row, index) => (
          <div key={index} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2 relative">
            {type && <SearchEffect index={index} phone={row.phone} type={type} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              placeholder={namePlaceholder}
              value={row.name}
              onChange={(e) => handlePartyChange(index, 'name', e.target.value, setter)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              placeholder={language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
              value={row.phone}
              onChange={(e) => handlePartyChange(index, 'phone', e.target.value, setter)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {isDefendant && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{language === 'bn' ? 'কত নং আসামী:' : 'Serial No:'}</span>
              <input
                type="number"
                value={row.serial}
                readOnly
                className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-100 outline-none"
              />
            </div>
          )}
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(index, setter, isDefendant)}
              className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-2xl mb-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: '33.33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {language === 'bn' ? '📁 নতুন মামলা এন্ট্রি' : '📁 New Case Entry'}
            </h2>
            <p className="text-sm text-slate-500">Step {step} of 3</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm">1</span>
                  📌 Basic Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">১. {t.district}</label>
                    <input
                      type="text"
                      name="district"
                      value={userDistrict || ''}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 focus:outline-none transition-all cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">২. {t.thana}</label>
                    <select
                      name="policeStation"
                      value={formData.policeStation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      disabled={!userDistrict}
                    >
                      <option value="">{t.select_thana}</option>
                      {userDistrict && getPoliceStations(userDistrict, userCountry).map(ps => (
                        <option key={ps} value={ps}>{ps}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৩. {t.court}</label>
                    <select
                      name="courtName"
                      value={formData.courtName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">{t.select_court}</option>
                      {userDistrict && getCourtsForDistrict(userDistrict, userCountry).map(court => (
                        <option key={court} value={court}>{court}</option>
                      ))}
                      <option value="High Court">{t.high_court}</option>
                      <option value="Supreme Court">{t.supreme_court}</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৪. {t.filing_date}</label>
                    <input
                      type="date"
                      name="filingDate"
                      value={formData.filingDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৫. মামলার ধরন (বিভাগ)</label>
                    <select
                      value={caseCategory}
                      onChange={(e) => {
                        setCaseCategory(e.target.value);
                        setFormData(prev => ({ ...prev, caseType: '' }));
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value="Criminal">ফৌজদারী</option>
                      <option value="Civil">দেওয়ানী</option>
                      <option value="Other">অন্যান্য</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৬. {t.case_type}</label>
                    <select
                      name="caseType"
                      value={formData.caseType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      disabled={!caseCategory}
                    >
                      <option value="">নির্বাচন করুন</option>
                      {caseCategory === 'Criminal' && criminalTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      {caseCategory === 'Civil' && civilTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      {caseCategory === 'Other' && (
                        <>
                          <option value="Writ">Writ</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৭. {t.case_number}</label>
                    <input
                      type="text"
                      name="rawCaseNumber"
                      value={formData.rawCaseNumber !== undefined ? formData.rawCaseNumber : formData.caseNumber}
                      onChange={handleChange}
                      required
                      placeholder="মামলা নম্বর (যেমন: ১২৩)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    {formData.rawCaseNumber && (
                      <p className="text-xs text-slate-500 mt-1">
                        ফরম্যাট: {`${formData.caseType || 'ধরন'}-${formData.rawCaseNumber}/${formData.filingDate ? new Date(formData.filingDate).getFullYear() : 'সাল'}(${formData.policeStation || 'থানা'})`}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৮. {t.section}</label>
                    <input
                      type="text"
                      name="caseSection"
                      value={formData.caseSection || ''}
                      onChange={handleChange}
                      placeholder={t.section_placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Next <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
              >
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm">2</span>
                  👥 Parties Info
                </h4>
                
                {renderPartySection(language === 'bn' ? '👨‍⚖️ বাদী' : '👨‍⚖️ Plaintiff', plaintiffs, setPlaintiffs, language === 'bn' ? 'বাদীর নাম' : 'Plaintiff Name', false, caseCategory === 'Criminal')}
                
                <div className="mb-6">
                  <div className="mb-4 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'bn' ? 'মোট আসামী সংখ্যা' : 'Total Defendants'}
                    </label>
                    <input
                      type="number"
                      name="totalRespondents"
                      value={formData.totalRespondents || ''}
                      onChange={handleChange}
                      placeholder={language === 'bn' ? 'মোট আসামী সংখ্যা লিখুন' : 'Enter total defendants'}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  {renderPartySection(language === 'bn' ? '👨‍⚖️ বিবাদী / আসামী' : '👨‍⚖️ Defendant / Accused', defendants, setDefendants, language === 'bn' ? 'আসামীর নাম' : 'Defendant Name', true, true)}
                </div>

                {userType !== 'lawyer' && renderPartySection(language === 'bn' ? '⚖️ উকিল' : '⚖️ Lawyer', lawyers, setLawyers, language === 'bn' ? 'উকিলের নাম' : 'Lawyer Name', false, false, 'lawyer')}
                {userType !== 'clerk' && renderPartySection(language === 'bn' ? '📋 মুহুরি' : '📋 Clerk', clerks, setClerks, language === 'bn' ? 'মুহুরির নাম' : 'Clerk Name', false, false, 'clerk')}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Next <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm">3</span>
                  📄 Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.next_date}</label>
                    <input
                      type="date"
                      name="nextDate"
                      value={formData.nextDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'অবস্থা' : 'Status'}</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Running">Running</option>
                      <option value="Hearing">Hearing</option>
                      <option value="Disposed">Disposed</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'মামলার আদেশ' : 'Case Order'}</label>
                    <select
                      name="order"
                      value={formData.order}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">{language === 'bn' ? 'আদেশ নির্বাচন করুন' : 'Select Order'}</option>
                      {caseCategory === 'Criminal' && (
                        <>
                          <option value="তদন্ত">তদন্ত</option>
                          <option value="চার্জশিট">চার্জশিট</option>
                          <option value="সাক্ষ্য">সাক্ষ্য</option>
                          <option value="রায়">রায়</option>
                          <option value="হাজিরা">হাজিরা</option>
                          <option value="সময়">সময়</option>
                        </>
                      )}
                      {caseCategory === 'Civil' && (
                        <>
                          <option value="সমন">সমন</option>
                          <option value="জবাব">জবাব</option>
                          <option value="ইস্যু গঠন">ইস্যু গঠন</option>
                          <option value="শুনানি">শুনানি</option>
                          <option value="রায়">রায়</option>
                          <option value="সময়">সময়</option>
                        </>
                      )}
                      {caseCategory !== 'Criminal' && caseCategory !== 'Civil' && (
                        <>
                          <option value="শুনানি">শুনানি</option>
                          <option value="রায়">রায়</option>
                          <option value="হাজিরা">হাজিরা</option>
                          <option value="সময়">সময়</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'অতিরিক্ত আদেশ/নোট' : 'Additional Order/Notes'}</label>
                    <textarea
                      name="additionalOrder"
                      value={formData.additionalOrder || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder={language === 'bn' ? 'অতিরিক্ত কোন আদেশ থাকলে তা লিখুন...' : 'Enter any additional order or notes...'}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-10 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                  >
                    <Save size={20} /> {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Case'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  );
}
