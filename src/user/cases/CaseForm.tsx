import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Save, Search, Zap, FileText, UserPlus, Upload, Paperclip, Eye, Loader2 } from 'lucide-react';
import { Case } from '../../types';
import { translations } from '../../translations';
import { BANGLADESH_DISTRICTS, getPoliceStations, getCourtsForDistrict } from '../../constants';
import { uploadFile, getPublicUrl } from '../../lib/storage';

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
  existingCases?: Case[];
  onJoin?: (caseNumber: string, side: 'petitioner' | 'respondent', respondents?: {name: string, serial: string, phone: string}[], totalRespondents?: string, order?: string, additionalOrder?: string, lawyerInfo?: {name: string, phone: string}, clerkInfo?: {name: string, phone: string}, nextDate?: string, caseSection?: string) => void;
  initialMode?: 'detailed' | 'quick' | 'join';
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
  userMobile,
  existingCases = [],
  onJoin,
  initialMode = 'detailed'
}: CaseFormProps) {
  const t = (key: keyof typeof translations['bn']) => translations[language]?.[key] || translations['bn'][key] || key;
  const [mode, setMode] = useState<'detailed' | 'quick' | 'join'>(initialMode);
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
    priority: 'medium',
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

  const [caseDocuments, setCaseDocuments] = useState<{ name: string; type: string; url: string }[]>(initialData?.documents || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plaintiffs, setPlaintiffs] = useState<PartyRow[]>([{ name: '', phone: '' }]);
  const [defendants, setDefendants] = useState<PartyRow[]>([{ name: '', phone: '', serial: 1 }]);
  const [lawyers, setLawyers] = useState<PartyRow[]>([{ name: '', phone: '' }]);
  const [clerks, setClerks] = useState<PartyRow[]>([{ name: '', phone: '' }]);

  // Join Case Specific Logic
  const [joinFilingYear, setJoinFilingYear] = useState(new Date().getFullYear().toString());
  const [side, setSide] = useState<'petitioner' | 'respondent'>('petitioner');
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const caseNumberPreview = useMemo(() => {
    const rawNumber = formData.rawCaseNumber || '';
    const type = formData.caseType || '';
    const thana = formData.policeStation || '';
    let year = '';
    
    if (mode === 'join') {
      year = joinFilingYear;
    } else {
      year = formData.filingDate ? new Date(formData.filingDate).getFullYear().toString() : '';
    }
    
    if (!rawNumber) return '';
    
    const parts = [];
    if (type) parts.push(`${type}-`);
    parts.push(rawNumber);
    if (year) parts.push(`/${year}`);
    if (thana) parts.push(`(${thana})`);
    return parts.join('');
  }, [mode, formData.rawCaseNumber, formData.caseType, formData.policeStation, joinFilingYear, formData.filingDate]);

  const filteredCases = useMemo(() => {
    if (mode !== 'join' || !caseNumberPreview) return [];
    return existingCases.filter(c => 
      c.caseNumber.toLowerCase().includes(caseNumberPreview.toLowerCase()) || 
      (c.rawCaseNumber && c.rawCaseNumber.toLowerCase().includes(caseNumberPreview.toLowerCase()))
    ).slice(0, 5);
  }, [mode, caseNumberPreview, existingCases]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'join' && onJoin) {
      if (step === 1 && side === 'respondent') {
        setStep(2);
        return;
      }
      const rawNumber = formData.rawCaseNumber || '';
      const year = joinFilingYear;
      const type = formData.caseType || '';
      const thana = formData.policeStation || '';
      const caseNumber = `${type}-${rawNumber}/${year}(${thana})`;
      
      onJoin(
        caseNumber.trim(), 
        side, 
        side === 'respondent' ? defendants.map(d => ({ name: d.name, serial: String(d.serial), phone: d.phone })).filter(r => r.name.trim() !== '') : undefined, 
        side === 'respondent' ? formData.totalRespondents : undefined,
        formData.order,
        formData.additionalOrder,
        { name: lawyers[0]?.name || '', phone: lawyers[0]?.phone || '' },
        { name: clerks[0]?.name || '', phone: clerks[0]?.phone || '' },
        formData.nextDate,
        formData.caseSection
      );
      return;
    }

    const rawNumber = formData.rawCaseNumber || formData.caseNumber || '';
    let year = '';
    
    if (formData.filingDate) {
      const d = new Date(formData.filingDate);
      if (!isNaN(d.getFullYear())) {
        year = d.getFullYear().toString();
      }
    }
    
    if (!year && mode === 'quick') year = new Date().getFullYear().toString();
    
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

    onSave({ ...finalData, documents: caseDocuments });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `cases/documents/${Date.now()}_${file.name}`;
      await uploadFile('', path, file);
      const url = await getPublicUrl('', path);
      
      setCaseDocuments(prev => [...prev, {
        name: file.name,
        type: file.type,
        url: url
      }]);
    } catch (err) {
      console.error("File upload failed:", err);
      alert(language === 'bn' ? 'ফাইল আপলোড করতে সমস্যা হয়েছে।' : 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (index: number) => {
    setCaseDocuments(prev => prev.filter((_, i) => i !== index));
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
            animate={{ width: mode === 'detailed' ? `${(step / 3) * 100}%` : '100%' }}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {language === 'bn' ? '📁 মামলা এন্ট্রি' : '📁 Case Entry'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {mode === 'detailed' && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 3</p>}
              {mode === 'quick' && <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Quick Entry Mode</p>}
              {mode === 'join' && <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Search & Join Mode</p>}
            </div>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => { setMode('detailed'); setStep(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'detailed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={14} /> {language === 'bn' ? 'বিস্তারিত' : 'Detailed'}
            </button>
            <button 
              onClick={() => { setMode('quick'); setStep(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'quick' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Zap size={14} /> {language === 'bn' ? 'সহজ' : 'Quick'}
            </button>
            <button 
              onClick={() => { setMode('join'); setStep(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'join' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserPlus size={14} /> {language === 'bn' ? 'আসামী যুক্ত' : 'Join'}
            </button>
          </div>

          <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'quick' && (
              <motion.div
                key="quick-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'মামলার বিভাগ' : 'Case Category'}</label>
                    <div className="flex gap-2">
                      {['Criminal', 'Civil', 'Other'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCaseCategory(cat);
                            setFormData(prev => ({ ...prev, caseType: '' }));
                          }}
                          className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all border ${
                            caseCategory === cat 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          {cat === 'Criminal' ? (language === 'bn' ? 'ফৌজদারী' : 'Criminal') : 
                           cat === 'Civil' ? (language === 'bn' ? 'দেওয়ানী' : 'Civil') : 
                           (language === 'bn' ? 'অন্যান্য' : 'Other')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {caseCategory && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('case_type')}</label>
                      <div className="flex flex-wrap gap-2">
                        {(caseCategory === 'Criminal' ? criminalTypes : caseCategory === 'Civil' ? civilTypes : ['Writ', 'Other']).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, caseType: type }))}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              formData.caseType === type 
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                : 'bg-white text-slate-50 border-slate-200 hover:border-indigo-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('case_number')} *</label>
                    <input
                      type="text"
                      name="rawCaseNumber"
                      value={formData.rawCaseNumber || ''}
                      onChange={handleChange}
                      required
                      placeholder={language === 'bn' ? 'যেমন: ১২৩/২৪ (থানা)' : 'e.g. 123/24 (PS)'}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                    />
                    {caseNumberPreview && (
                      <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">{t('case_number_preview')}</p>
                        <p className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                          <FileText size={14} /> {caseNumberPreview}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</label>
                    <div className="space-y-2">
                      <input
                        placeholder={language === 'bn' ? 'বাদীর নাম' : 'Petitioner Name'}
                        value={plaintiffs[0]?.name}
                        onChange={(e) => handlePartyChange(0, 'name', e.target.value, setPlaintiffs)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                      <input
                        placeholder={language === 'bn' ? 'আসামীর নাম' : 'Respondent Name'}
                        value={defendants[0]?.name}
                        onChange={(e) => handlePartyChange(0, 'name', e.target.value, setDefendants)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('next_date')} *</label>
                      <input
                        type="date"
                        name="nextDate"
                        value={formData.nextDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('district_label')}</label>
                        <select
                          name="district"
                          value={formData.district || userDistrict}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">{t('district_placeholder')}</option>
                          {BANGLADESH_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'থানা' : 'Police Station'}</label>
                        <select
                          name="policeStation"
                          value={formData.policeStation}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">{t('select_police_station' as any)}</option>
                          {getPoliceStations(formData.district || userDistrict, userCountry).map(ps => (
                            <option key={ps} value={ps}>{ps}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('court_name')}</label>
                        <select
                          name="courtName"
                          value={formData.courtName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">{t('court_placeholder')}</option>
                          {getCourtsForDistrict(formData.district || userDistrict).map(court => (
                            <option key={court} value={court}>{court}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('priority_label')}</label>
                    <select
                      name="priority"
                      value={formData.priority || 'medium'}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="low">{t('low')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="high">{t('high')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-grow py-4 bg-green-600 text-white rounded-2xl font-black transition-all hover:bg-green-700 shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Quick Case'}
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'join' && (
              <motion.div
                key="join-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {step === 1 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'মামলার বিভাগ' : 'Case Category'}</label>
                        <select
                          value={caseCategory}
                          onChange={(e) => {
                            setCaseCategory(e.target.value);
                            setFormData(prev => ({ ...prev, caseType: '' }));
                          }}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                          <option value="Criminal">Criminal</option>
                          <option value="Civil">Civil</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'মামলার ধরন' : 'Case Type'}</label>
                        <select
                          name="caseType"
                          value={formData.caseType}
                          onChange={handleChange}
                          required
                          disabled={!caseCategory}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'মামলা নং' : 'Case No'}</label>
                        <input
                          type="text"
                          name="rawCaseNumber"
                          value={formData.rawCaseNumber || ''}
                          onChange={handleChange}
                          required
                          placeholder="123"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'সাল' : 'Year'}</label>
                        <input
                          type="text"
                          value={joinFilingYear}
                          onChange={(e) => setJoinFilingYear(e.target.value)}
                          required
                          placeholder="2026"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'থানার নাম' : 'Police Station'}</label>
                        <select
                          name="policeStation"
                          value={formData.policeStation}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                          {(formData.district || userDistrict) && getPoliceStations(formData.district || userDistrict, userCountry).map(ps => (
                            <option key={ps} value={ps}>{ps}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {caseNumberPreview && (
                      <div className="relative">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('case_number_preview')}</p>
                          <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                            <Search size={14} /> {caseNumberPreview}
                          </p>
                        </div>
                        
                        {filteredCases.length > 0 && (
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden mb-4">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'বিদ্যমান মামলা পাওয়া গেছে' : 'Existing Cases Found'}</p>
                            </div>
                            {filteredCases.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  // Auto-fill some fields or just visual confirmation
                                  setFormData(prev => ({ ...prev, rawCaseNumber: c.rawCaseNumber || c.caseNumber }));
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center group"
                              >
                                <div>
                                  <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{c.caseNumber}</div>
                                  <div className="text-[10px] text-slate-500 font-medium">{c.courtName}</div>
                                </div>
                                <Search size={14} className="text-slate-300 group-hover:text-indigo-400" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পক্ষ হিসেবে যুক্ত হোন' : 'Join As'}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSide('petitioner')}
                          className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                            side === 'petitioner' 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                          }`}
                        >
                          {t('petitioner')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSide('respondent')}
                          className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                            side === 'respondent' 
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                          }`}
                        >
                          {t('respondent')}
                        </button>
                      </div>
                    </div>

                    <button
                      type={side === 'respondent' ? 'button' : 'submit'}
                      onClick={side === 'respondent' ? () => setStep(2) : undefined}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      {side === 'respondent' ? (language === 'bn' ? 'পরবর্তী' : 'Next') : (language === 'bn' ? 'মামলায় যুক্ত হোন' : 'Join Case')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'মোট আসামী সংখ্যা' : 'Total Respondents'}</label>
                        <input
                          type="number"
                          name="totalRespondents"
                          value={formData.totalRespondents || ''}
                          onChange={handleChange}
                          placeholder="e.g. 5"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      {renderPartySection(language === 'bn' ? 'আসামী যুক্ত করুন' : 'Add Respondents', defendants, setDefendants, language === 'bn' ? 'আসামীর নাম' : 'Respondent Name', true, false)}
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black transition-all hover:bg-slate-200"
                      >
                        {language === 'bn' ? 'পিছনে' : 'Back'}
                      </button>
                      <button
                        type="submit"
                        className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black transition-all hover:bg-green-700 shadow-xl shadow-green-100"
                      >
                        {language === 'bn' ? 'যুক্ত হোন' : 'Join Case'}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {mode === 'detailed' && step === 1 && (
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">১. {t('district')}</label>
                    <div className="relative">
                      <select
                        name="district"
                        value={formData.district || userDistrict || ''}
                        onChange={(e) => {
                          const dist = e.target.value;
                          setFormData(prev => ({ ...prev, district: dist, policeStation: '' }));
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">{t('select_district')}</option>
                        {BANGLADESH_DISTRICTS.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="rotate-90" size={18} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">২. {t('thana')}</label>
                    <div className="relative">
                      <select
                        name="policeStation"
                        value={formData.policeStation}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                        disabled={!(formData.district || userDistrict)}
                      >
                        <option value="">{t('select_thana')}</option>
                        {(formData.district || userDistrict) && getPoliceStations(formData.district || userDistrict, userCountry).map(ps => (
                          <option key={ps} value={ps}>{ps}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="rotate-90" size={18} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৩. {t('court')}</label>
                    <select
                      name="courtName"
                      value={formData.courtName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">{t('select_court')}</option>
                      {userDistrict && getCourtsForDistrict(userDistrict, userCountry).map(court => (
                        <option key={court} value={court}>{court}</option>
                      ))}
                      <option value="High Court">{t('high_court')}</option>
                      <option value="Supreme Court">{t('supreme_court')}</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৪. {t('filing_date')}</label>
                    <input
                      type="date"
                      name="filingDate"
                      value={formData.filingDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৫. {t('priority_label')}</label>
                    <select
                      name="priority"
                      value={formData.priority || 'medium'}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="low">{t('low')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="high">{t('high')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৬. মামলার ধরন (বিভাগ)</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">৬. {t('case_type')}</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">৭. {t('case_number')}</label>
                    <input
                      type="text"
                      name="rawCaseNumber"
                      value={formData.rawCaseNumber !== undefined ? formData.rawCaseNumber : formData.caseNumber}
                      onChange={handleChange}
                      required
                      placeholder="মামলা নম্বর (যেমন: ১২৩)"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    />
                    {caseNumberPreview && (
                      <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('case_number_preview')}</p>
                        <p className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                          <FileText size={12} /> {caseNumberPreview}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৮. {t('section')}</label>
                    <input
                      type="text"
                      name="caseSection"
                      value={formData.caseSection || ''}
                      onChange={handleChange}
                      placeholder={t('section_placeholder')}
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('next_date')}</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'bn' ? 'পদক্ষেপ / আদেশ' : 'Case Step / Order'}
                    </label>
                    <select
                      name="order"
                      value={formData.order}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">{language === 'bn' ? 'পদক্ষেপ নির্বাচন করুন' : 'Select Step'}</option>
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
