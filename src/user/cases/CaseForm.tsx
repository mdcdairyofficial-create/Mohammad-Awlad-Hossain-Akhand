import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Search, 
  Zap, 
  FileText, 
  UserPlus, 
  Upload, 
  Paperclip, 
  Eye, 
  Loader2, 
  Camera, 
  Briefcase,
  BookOpen,
  Calendar,
  MapPin,
  Scale,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  Check,
  AlertCircle
} from 'lucide-react';
import { Case, ChamberAssociate } from '../../types';
import { translations } from '../../translations';
import { BANGLADESH_DISTRICTS, getPoliceStations, getCourtsForDistrict, CIVIL_CASE_STEPS, CRIMINAL_CASE_STEPS } from '../../constants';
import { uploadFile, getPublicUrl } from '../../lib/storage';
import { DocumentScannerModal } from '../../components/DocumentScannerModal';
import WhatsAppPhoneInput from './WhatsAppPhoneInput';

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
  onJoin?: (caseNumber: string, side: 'petitioner' | 'respondent', respondents?: {name: string, serial: string, phone: string, addedByMobile?: string, addedByName?: string, addedByRole?: string}[], totalRespondents?: string, order?: string, additionalOrder?: string, lawyerInfo?: {name: string, phone: string}, clerkInfo?: {name: string, phone: string}, nextDate?: string, caseSection?: string, authorityHolder?: 'lawyer' | 'clerk') => void;
  initialMode?: 'diary' | 'detailed' | 'quick' | 'join';
  chamberAssociates?: ChamberAssociate[];
  isSubscribed?: boolean;
  referralCode?: string;
  sponsorName?: string;
  sponsorMobile?: string;
}

interface PartyRow {
  name: string;
  phone: string;
  optionalPhone?: string;
  serial?: number;
  addedByMobile?: string;
  addedByName?: string;
  addedByRole?: string;
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
  initialMode = 'diary',
  chamberAssociates = [],
  isSubscribed = false,
  referralCode = '',
  sponsorName = '',
  sponsorMobile = ''
}: CaseFormProps) {
  const t = (key: keyof typeof translations['bn']) => translations[language]?.[key] || translations['bn'][key] || key;
  const [mode, setMode] = useState<'diary' | 'detailed' | 'quick' | 'join'>(initialMode);
  const [diaryHearingDate, setDiaryHearingDate] = useState<string>(
    initialData?.nextDate || new Date().toISOString().split('T')[0]
  );
  const [diaryNextHearingDate, setDiaryNextHearingDate] = useState<string>('');
  const [step, setStep] = useState(1);
  const [caseCategory, setCaseCategory] = useState('');
  const [formData, setFormData] = useState<Partial<Case>>({
    caseNumber: initialData?.caseNumber || '',
    rawCaseNumber: initialData?.rawCaseNumber || '',
    court: initialData?.court || '',
    courtName: initialData?.courtName || initialData?.court || '',
    district: initialData?.district || userDistrict || '',
    policeStation: initialData?.policeStation || '',
    nextDate: initialData?.nextDate || '',
    status: initialData?.status || 'Pending',
    caseType: initialData?.caseType || '',
    priority: initialData?.priority || 'medium',
    petitioner: initialData?.petitioner || '',
    respondent: initialData?.respondent || '',
    petitionerMobile: initialData?.petitionerMobile || '',
    respondentMobile: initialData?.respondentMobile || '',
    petitionerLawyer: initialData?.petitionerLawyer || '',
    respondentLawyer: initialData?.respondentLawyer || '',
    petitionerLawyerMobile: initialData?.petitionerLawyerMobile || [],
    respondentLawyerMobile: initialData?.respondentLawyerMobile || [],
    petitionerClerk: initialData?.petitionerClerk || '',
    respondentClerk: initialData?.respondentClerk || '',
    petitionerClerkMobile: initialData?.petitionerClerkMobile || [],
    respondentClerkMobile: initialData?.respondentClerkMobile || [],
    assignedAssociateName: initialData?.assignedAssociateName || '',
    assignedAssociateMobile: initialData?.assignedAssociateMobile || '',
    assignedAssociateRole: initialData?.assignedAssociateRole || '',
    filingDate: initialData?.filingDate || '',
    visibility: initialData?.visibility || 'private',
    isUpdated: initialData?.isUpdated || false,
    caseSection: initialData?.caseSection || '',
    order: initialData?.order || '',
    lastDate: initialData?.lastDate || '',
    additionalOrder: initialData?.additionalOrder || '',
    totalRespondents: initialData?.totalRespondents || '',
    authorityHolder: initialData?.authorityHolder || (userType === 'lawyer' || userType === 'clerk' ? userType : 'lawyer'),
    selectedParty: initialData?.selectedParty || 'petitioner'
  });

  const [caseDocuments, setCaseDocuments] = useState<{ name: string; type: string; url: string }[]>(initialData?.documents || []);
  const [isUploading, setIsUploading] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detailedTotalRespondents, setDetailedTotalRespondents] = useState(initialData?.totalRespondents || '');
  const [quickTotalRespondents, setQuickTotalRespondents] = useState(initialData?.totalRespondents || '');
  const [joinTotalRespondents, setJoinTotalRespondents] = useState(initialData?.totalRespondents || '');

  const [plaintiffs, setPlaintiffs] = useState<PartyRow[]>([{ name: '', phone: '', optionalPhone: '' }]);
  const [defendants, setDefendants] = useState<PartyRow[]>([{ name: '', phone: '', optionalPhone: '', serial: 1 }]);
  const [lawyers, setLawyers] = useState<PartyRow[]>([{ name: '', phone: '' }]);
  const [clerks, setClerks] = useState<PartyRow[]>([{ name: '', phone: '' }]);
  const [showSecondaryMobile, setShowSecondaryMobile] = useState<boolean>(
    Boolean(initialData?.petitionerSecondaryMobile || initialData?.respondentSecondaryMobile)
  );
  const [secondaryMobile, setSecondaryMobile] = useState<string>(
    initialData?.petitionerSecondaryMobile || initialData?.respondentSecondaryMobile || ''
  );

  // Join Case Specific Logic
  const [joinFilingYear, setJoinFilingYear] = useState(new Date().getFullYear().toString());
  const [side, setSide] = useState<'petitioner' | 'respondent'>('petitioner');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const criminalTypes = ['জি.আর', 'সি.আর', 'মানব পাচার পিটিশন', 'পিটিশন', 'ICT', 'জি আর', 'সি আর', 'এস টি', 'দায়রা', 'ফৌজদারী'];
  const civilTypes = ['দেওয়ানী', 'পারিবারিক', 'অর্থঋণ', 'ল্যান্ড ট্রাইব্যুনাল', 'দেওয়ানি'];

  const isCriminalCase = caseCategory === 'Criminal' || criminalTypes.includes(formData.caseType || '') || formData.caseType === 'ফৌজদারী';
  const isCivilCase = caseCategory === 'Civil' || civilTypes.includes(formData.caseType || '') || formData.caseType === 'দেওয়ানী' || formData.caseType === 'পারিবারিক' || formData.caseType === 'দেওয়ানি';

  const quickPickSteps = useMemo(() => {
    if (isCriminalCase) {
      return CRIMINAL_CASE_STEPS;
    }
    if (isCivilCase) {
      return CIVIL_CASE_STEPS;
    }
    return CRIMINAL_CASE_STEPS;
  }, [isCriminalCase, isCivilCase]);

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

      setFormData(prev => ({
        ...prev,
        ...initialData,
        caseNumber: initialData.caseNumber || prev.caseNumber || '',
        rawCaseNumber: initialRaw || prev.rawCaseNumber || '',
        court: initialData.court || prev.court || '',
        courtName: initialData.courtName || initialData.court || prev.courtName || '',
        district: initialData.district || prev.district || userDistrict || '',
        policeStation: initialData.policeStation || prev.policeStation || '',
        nextDate: initialData.nextDate || prev.nextDate || '',
        status: initialData.status || prev.status || 'Pending',
        caseType: initialData.caseType || prev.caseType || '',
        priority: initialData.priority || prev.priority || 'medium',
        petitioner: initialData.petitioner || prev.petitioner || '',
        respondent: initialData.respondent || prev.respondent || '',
        petitionerMobile: initialData.petitionerMobile || prev.petitionerMobile || '',
        respondentMobile: initialData.respondentMobile || prev.respondentMobile || '',
        petitionerLawyer: initialData.petitionerLawyer || prev.petitionerLawyer || '',
        respondentLawyer: initialData.respondentLawyer || prev.respondentLawyer || '',
        order: initialData.order || prev.order || '',
        lastDate: initialData.lastDate || prev.lastDate || '',
        additionalOrder: initialData.additionalOrder || prev.additionalOrder || '',
        totalRespondents: initialData.totalRespondents || prev.totalRespondents || '',
        caseSection: initialData.caseSection || prev.caseSection || '',
        filingDate: initialData.filingDate || prev.filingDate || '',
        authorityHolder: initialData.authorityHolder || prev.authorityHolder || 'lawyer',
        selectedParty: initialData.selectedParty || prev.selectedParty || 'petitioner'
      }));
      
      if (initialData.caseYear) {
        setJoinFilingYear(initialData.caseYear);
      } else if (initialData.filingDate) {
        setJoinFilingYear(new Date(initialData.filingDate).getFullYear().toString());
      } else if (initialData.caseNumber) {
        const match = initialData.caseNumber.match(/\/(\d{4}|\d{2})/);
        if (match) {
          setJoinFilingYear(match[1]);
        }
      }

      if (initialData.lastDate) {
        setDiaryHearingDate(initialData.lastDate);
        setDiaryNextHearingDate(initialData.nextDate || '');
      } else if (initialData.nextDate) {
        setDiaryHearingDate(initialData.nextDate);
      }
      
      setDetailedTotalRespondents(initialData.totalRespondents || '');
      setQuickTotalRespondents(initialData.totalRespondents || '');
      setJoinTotalRespondents(initialData.totalRespondents || '');
      
      // Set case category based on caseType
      if (criminalTypes.includes(initialData.caseType || '')) {
        setCaseCategory('Criminal');
      } else if (civilTypes.includes(initialData.caseType || '')) {
        setCaseCategory('Civil');
      } else if (initialData.caseType) {
        setCaseCategory('Other');
      }
      
      // Parse Petitioner/Plaintiffs
      if (initialData.petitionerDetails && initialData.petitionerDetails.length > 0) {
        setPlaintiffs(initialData.petitionerDetails.map(p => ({
          name: p.name,
          phone: p.phone,
          optionalPhone: p.optionalPhone,
          serial: Number(p.serial) || 1
        })));
      } else if (initialData.petitioner) {
        const names = initialData.petitioner.split(', ');
        setPlaintiffs(names.map(name => ({ name, phone: initialData.petitionerMobile || '', optionalPhone: '' })));
      }
      
      // Parse Respondent/Defendants
      if (initialData.respondentDetails && initialData.respondentDetails.length > 0) {
        setDefendants(initialData.respondentDetails.map(d => ({ 
          name: d.name, 
          phone: d.phone, 
          optionalPhone: d.optionalPhone,
          serial: Number(d.serial) || 1,
          addedByMobile: d.addedByMobile,
          addedByName: d.addedByName,
          addedByRole: d.addedByRole
        })));
      } else if (initialData.respondent) {
        const names = initialData.respondent.split(', ');
        setDefendants(names.map((name, i) => ({ name, phone: initialData.respondentMobile || '', optionalPhone: '', serial: i + 1 })));
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
        if (sponsorName || sponsorMobile) {
          setLawyers([{ name: sponsorName, phone: sponsorMobile }]);
        }
      }
    }
  }, [initialData, userType, userName, userMobile, sponsorName, sponsorMobile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartyChange = (
    index: number,
    field: keyof PartyRow,
    value: any,
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

  const removeRow = (index: number, setter: React.Dispatch<React.SetStateAction<PartyRow[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const caseNumberPreview = useMemo(() => {
    const rawNumber = formData.rawCaseNumber || '';
    const type = formData.caseType || '';
    const thana = formData.policeStation || '';
    let year = '';
    
    if (mode === 'join') {
      year = joinFilingYear;
    } else {
      year = formData.filingDate 
        ? new Date(formData.filingDate).getFullYear().toString() 
        : ((mode === 'quick' || mode === 'diary') ? new Date().getFullYear().toString() : '');
    }
    
    if (!rawNumber) return '';
    
    const parts = [];
    if (type) parts.push(`${type}-`);
    parts.push(rawNumber);
    if (year && !rawNumber.includes('/') && !rawNumber.includes('\\')) parts.push(`/${year}`);
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
        side === 'respondent' 
          ? defendants
              .filter(r => r.name.trim() !== '')
              .map(d => ({ 
                name: d.name, 
                serial: String(d.serial), 
                phone: d.phone,
                addedByMobile: d.addedByMobile || userMobile,
                addedByName: d.addedByName || userName,
                addedByRole: d.addedByRole || userType
              })) 
          : undefined, 
        side === 'respondent' ? joinTotalRespondents : undefined,
        formData.order,
        formData.additionalOrder,
        { name: lawyers[0]?.name || '', phone: lawyers[0]?.phone || '' },
        { name: clerks[0]?.name || '', phone: clerks[0]?.phone || '' },
        formData.nextDate,
        formData.caseSection,
        formData.authorityHolder
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
    
    if (!year && (mode === 'quick' || mode === 'diary')) year = new Date().getFullYear().toString();
    
    const type = formData.caseType || '';
    const thana = formData.policeStation || '';
    
    let formattedCaseNumber = rawNumber;
    if (rawNumber) {
      const parts = [];
      if (type) parts.push(`${type}-`);
      parts.push(rawNumber);
      if (year && !rawNumber.includes('/') && !rawNumber.includes('\\')) parts.push(`/${year}`);
      if (thana) parts.push(`(${thana})`);
      formattedCaseNumber = parts.join('');
    }

    const effectiveHearingDate = diaryHearingDate || formData.nextDate || new Date().toISOString().split('T')[0];
    const effectiveNextDate = diaryNextHearingDate || effectiveHearingDate;
    const effectiveLastDate = diaryNextHearingDate ? effectiveHearingDate : (formData.lastDate || '');

    // Combine data for saving
    const finalData = {
      ...formData,
      totalRespondents: mode === 'detailed' ? detailedTotalRespondents : quickTotalRespondents,
      caseNumber: formattedCaseNumber,
      rawCaseNumber: rawNumber,
      court: formData.courtName || formData.court, // Ensure court is updated
      nextDate: mode === 'diary' ? effectiveNextDate : formData.nextDate,
      lastDate: mode === 'diary' ? effectiveLastDate : formData.lastDate,
      pastDates: mode === 'diary' ? [effectiveHearingDate] : (formData.pastDates || []),
      history: mode === 'diary' ? [
        {
          id: Date.now().toString(),
          date: effectiveHearingDate,
          order: formData.order || 'হাজিরা',
          actionBy: (userType || 'lawyer') as any,
          description: language === 'bn' ? 'তারিখ ডায়েরি থেকে নতুন মামলা এন্ট্রি করা হয়েছে।' : 'New case entry from Date Diary.'
        }
      ] : (formData.history || []),
      status: formData.status || 'Running',
      petitioner: plaintiffs.map(p => p.name).filter(Boolean).join(', ') || formData.petitioner,
      petitionerMobile: plaintiffs[0]?.phone || formData.petitionerMobile || '',
      petitionerSecondaryMobile: formData.selectedParty === 'petitioner' ? secondaryMobile : (initialData?.petitionerSecondaryMobile || ''),
      petitionerDetails: plaintiffs
        .filter(p => p.name.trim() !== '')
        .map((p, idx) => ({
          name: p.name,
          phone: p.phone,
          serial: idx + 1,
          addedByMobile: p.addedByMobile || userMobile,
          addedByName: p.addedByName || userName,
          addedByRole: p.addedByRole || userType
        })),
      respondent: defendants.map(d => d.name).filter(Boolean).join(', ') || formData.respondent,
      respondentMobile: defendants[0]?.phone || formData.respondentMobile || '',
      respondentSecondaryMobile: formData.selectedParty === 'respondent' ? secondaryMobile : (initialData?.respondentSecondaryMobile || ''),
      respondentDetails: defendants
        .filter(d => d.name.trim() !== '')
        .map(d => ({ 
          name: d.name, 
          phone: d.phone, 
          serial: d.serial,
          addedByMobile: d.addedByMobile || userMobile,
          addedByName: d.addedByName || userName,
          addedByRole: d.addedByRole || userType
        })),
      petitionerLawyer: lawyers.map(l => l.name).filter(Boolean).join(', ') || (formData.selectedParty === 'petitioner' && userType === 'lawyer' ? userName : formData.petitionerLawyer),
      petitionerLawyerMobile: lawyers.map(l => l.phone).filter(Boolean).length > 0 ? lawyers.map(l => l.phone).filter(Boolean) : (formData.selectedParty === 'petitioner' && userType === 'lawyer' && userMobile ? [userMobile] : formData.petitionerLawyerMobile),
      respondentLawyer: formData.selectedParty === 'respondent' && userType === 'lawyer' ? (userName || formData.respondentLawyer) : formData.respondentLawyer,
      respondentLawyerMobile: formData.selectedParty === 'respondent' && userType === 'lawyer' && userMobile ? [userMobile] : formData.respondentLawyerMobile,
      petitionerClerk: clerks.map(c => c.name).filter(Boolean).join(', ') || (formData.selectedParty === 'petitioner' && userType === 'clerk' ? userName : formData.petitionerClerk),
      petitionerClerkMobile: clerks.map(c => c.phone).filter(Boolean).length > 0 ? clerks.map(c => c.phone).filter(Boolean) : (formData.selectedParty === 'petitioner' && userType === 'clerk' && userMobile ? [userMobile] : formData.petitionerClerkMobile),
      respondentClerk: formData.selectedParty === 'respondent' && userType === 'clerk' ? (userName || formData.respondentClerk) : formData.respondentClerk,
      respondentClerkMobile: formData.selectedParty === 'respondent' && userType === 'clerk' && userMobile ? [userMobile] : formData.respondentClerkMobile,
      authorityHolder: formData.authorityHolder || (userType === 'lawyer' || userType === 'clerk' ? userType : 'lawyer'),
      selectedParty: formData.selectedParty || 'petitioner'
    };

    onSave({ ...finalData, documents: caseDocuments });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSubscribed) {
      alert(language === 'bn' 
        ? 'দলিল বা ওকালতনামা আপলোড করতে প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন। দয়া করে প্রোফাইল থেকে সাবস্ক্রাইব করুন।' 
        : 'Premium subscription is required to upload files or documents. Please subscribe from your profile.');
      e.target.value = ''; // Reset
      return;
    }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-700">{title}</h4>
            {isDefendant && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  ({language === 'bn' ? 'মোট:' : 'Total:'})
                </span>
                <input
                  type="number"
                  name="totalRespondents"
                  value={
                    (mode === 'detailed'
                      ? detailedTotalRespondents
                      : mode === 'quick'
                      ? quickTotalRespondents
                      : joinTotalRespondents) || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (mode === 'detailed') {
                      setDetailedTotalRespondents(val);
                    } else if (mode === 'quick') {
                      setQuickTotalRespondents(val);
                    } else if (mode === 'join') {
                      setJoinTotalRespondents(val);
                    }
                  }}
                  placeholder="?"
                  className="w-14 px-2 py-0.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-center bg-white"
                />
              </div>
            )}
          </div>
          {!hideAddButton && (
            <button
              type="button"
              onClick={() => addRow(setter, isDefendant)}
              className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-bold self-end sm:self-auto"
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
              value={row.name || ''}
              onChange={(e) => handlePartyChange(index, 'name', e.target.value, setter)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[38px]"
            />
            <WhatsAppPhoneInput
              value={row.phone || ''}
              onChange={(val) => handlePartyChange(index, 'phone', val, setter)}
              placeholder={language === 'bn' ? 'মেইন মোবাইল নং (হোয়াটসঅ্যাপ)' : 'Main Mobile (WhatsApp)'}
              language={language}
              className="h-[38px]"
            />
            <WhatsAppPhoneInput
              value={row.optionalPhone || ''}
              onChange={(val) => handlePartyChange(index, 'optionalPhone', val, setter)}
              placeholder={language === 'bn' ? 'অপশনাল মোবাইল নং (ঐচ্ছিক)' : 'Optional Mobile (Optional)'}
              language={language}
              className="h-[38px]"
            />
          </div>
          {isDefendant && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{language === 'bn' ? 'কত নং আসামী:' : 'Serial No:'}</span>
              <input
                type="number"
                value={row.serial || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  handlePartyChange(index, 'serial', isNaN(val) ? undefined : val, setter);
                }}
                className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          )}
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(index, setter)}
              className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Plus button below each box to duplicate format and text below */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setter(prev => {
                  const newRows = [...prev];
                  const currentRow = prev[index] || { name: '', phone: '' };
                  const newRow: PartyRow = { 
                    name: currentRow.name, 
                    phone: currentRow.phone,
                    serial: isDefendant ? (currentRow.serial ? currentRow.serial + 1 : prev.length + 1) : undefined
                  };
                  newRows.splice(index + 1, 0, newRow);
                  return newRows;
                });
              }}
              title={language === 'bn' ? 'এই ফরম্যাট ও লেখা সহ ডুপ্লিকেট করুন' : 'Duplicate format and text below'}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-center transition-all cursor-pointer text-xs font-extrabold gap-2 animate-bounce ring-4 ring-emerald-300"
            >
              <Plus size={16} />
              <span>{language === 'bn' ? '➕ এই ফরম্যাট ও লেখা সহ কপি করুন' : '➕ Duplicate Box & Text'}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-8 pt-12 sm:pt-20 pb-20 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className={`bg-white rounded-[1.75rem] p-4 sm:p-6 w-full ${mode === 'diary' ? 'max-w-3xl' : 'max-w-xl'} mb-16 shadow-2xl relative overflow-hidden transition-all duration-300`}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
          <motion.div 
            className="h-full bg-emerald-600"
            initial={{ width: '33.33%' }}
            animate={{ width: mode === 'detailed' ? `${(step / 3) * 100}%` : '100%' }}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{mode === 'diary' ? '📖 তারিখ ডায়েরি এন্ট্রি' : '📁 মামলা এন্ট্রি'}</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {mode === 'diary' && (
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={13} className="text-emerald-500" />
                  {language === 'bn' ? 'তারিখ ডায়েরিতে এন্ট্রি ➔ কেস কার্ডে তথ্য পূরণ' : 'Date Diary Entry ➔ Live Case Card'}
                </p>
              )}
              {mode === 'detailed' && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of 3</p>}
              {mode === 'quick' && <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Quick Entry Mode</p>}
              {mode === 'join' && <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Search & Join Mode</p>}
            </div>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto gap-1">
            <button 
              type="button"
              onClick={() => { setMode('diary'); setStep(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${mode === 'diary' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BookOpen size={14} /> {language === 'bn' ? 'তারিখ ডায়েরি' : 'Date Diary'}
            </button>
            <button 
              type="button"
              onClick={() => { setMode('detailed'); setStep(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'detailed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={14} /> {language === 'bn' ? 'বিস্তারিত' : 'Detailed'}
            </button>
            <button 
              type="button"
              onClick={() => { setMode('join'); setStep(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'join' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserPlus size={14} /> {language === 'bn' ? 'আসামী যুক্ত' : 'Join'}
            </button>
          </div>

          <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'diary' && (
              <motion.div
                key="diary-mode"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-5"
              >
                {/* Workflow Guidance Banner */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-800">
                        {language === 'bn' ? 'তারিখ ডায়েরিতে এন্ট্রি ➔ স্বয়ংক্রিয় কেস কার্ড প্রস্তুত' : 'Date Diary Entry ➔ Live Case Card Creation'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {language === 'bn' 
                          ? 'ডায়েরিতে মামলার শুনানির তথ্য লিখলেই ডানপাশে সরাসরি কেস কার্ড তৈরি হয়ে যাবে। পরে চাইলে যেকোনো সময় পূর্ণাঙ্গ আপডেট করতে পারবেন।'
                          : 'As you enter hearing diary info, the case card is instantly populated on the right. You can update full details anytime later.'}
                      </p>
                    </div>
                  </div>
                  <span className="self-end sm:self-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200 whitespace-nowrap">
                    {language === 'bn' ? '⚡ স্মার্ট রিভার্স এন্ট্রি' : '⚡ Smart Diary Mode'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Date Diary Entry Sheet (7 cols) */}
                  <div className="lg:col-span-7 bg-[#fffdf9] border-2 border-[#e6dfcb] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
                    {/* Notebook Margin Line Effect */}
                    <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-rose-400/40 pointer-events-none" />

                    <div className="pl-3 sm:pl-4 space-y-5">
                      {/* Section 1: Hearing Date */}
                      <div className="border-b border-[#ece5d4] pb-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <label className="text-xs font-black text-[#5c5035] uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={14} className="text-emerald-600" />
                            {language === 'bn' ? '১. ডায়েরির শুনানির তারিখ *' : '1. Diary Hearing Date *'}
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const tDate = new Date().toISOString().split('T')[0];
                                setDiaryHearingDate(tDate);
                                setFormData(prev => ({ ...prev, nextDate: tDate }));
                              }}
                              className="px-2 py-0.5 text-[10px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                            >
                              {language === 'bn' ? 'আজ' : 'Today'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 1);
                                const tomStr = d.toISOString().split('T')[0];
                                setDiaryHearingDate(tomStr);
                                setFormData(prev => ({ ...prev, nextDate: tomStr }));
                              }}
                              className="px-2 py-0.5 text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                            >
                              {language === 'bn' ? 'আগামীকাল' : 'Tomorrow'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 7);
                                const wStr = d.toISOString().split('T')[0];
                                setDiaryHearingDate(wStr);
                                setFormData(prev => ({ ...prev, nextDate: wStr }));
                              }}
                              className="px-2 py-0.5 text-[10px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                            >
                              {language === 'bn' ? '+৭ দিন' : '+7 Days'}
                            </button>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={diaryHearingDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDiaryHearingDate(val);
                            setFormData(prev => ({ ...prev, nextDate: val }));
                          }}
                          required
                          className="w-full px-4 py-3 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-800 text-sm shadow-2xs"
                        />
                      </div>

                      {/* Section 2: Court & District */}
                      <div className="border-b border-[#ece5d4] pb-4 space-y-3">
                        <label className="text-xs font-black text-[#5c5035] uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin size={14} className="text-indigo-600" />
                          {language === 'bn' ? '২. আদালত ও এলাকা' : '2. Court & District'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              {language === 'bn' ? 'জেলা' : 'District'}
                            </span>
                            <select
                              name="district"
                              value={formData.district || userDistrict || ''}
                              onChange={(e) => {
                                handleChange(e);
                                setFormData(prev => ({ ...prev, district: e.target.value, courtName: '' }));
                              }}
                              className="w-full px-3 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                            >
                              <option value="">{t('district_placeholder')}</option>
                              {BANGLADESH_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              {language === 'bn' ? 'আদালতের নাম' : 'Court Name'}
                            </span>
                            <div className="flex gap-1.5">
                              <select
                                name="courtName"
                                value={formData.courtName || ''}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                              >
                                <option value="">{t('court_placeholder')}</option>
                                {getCourtsForDistrict(formData.district || userDistrict).map(court => (
                                  <option key={court} value={court}>{court}</option>
                                ))}
                                <option value="High Court">High Court Division</option>
                                <option value="Supreme Court">Supreme Court of Bangladesh</option>
                              </select>
                              {formData.courtName && (
                                <select
                                  name="courtNumber"
                                  value={formData.courtNumber || ''}
                                  onChange={handleChange}
                                  className="w-20 px-2 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-center shrink-0"
                                >
                                  <option value="">সংখ্যা</option>
                                  <option value="১ম">১ম</option>
                                  <option value="২য়">২য়</option>
                                  <option value="৩য়">৩য়</option>
                                  <option value="৪র্থ">৪র্থ</option>
                                  <option value="৫ম">৫ম</option>
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Case Number, Type, Thana */}
                      <div className="border-b border-[#ece5d4] pb-4 space-y-3">
                        <label className="text-xs font-black text-[#5c5035] uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={14} className="text-amber-600" />
                          {language === 'bn' ? '৩. মামলার বিবরণ ও নম্বর *' : '3. Case Details & Number *'}
                        </label>
                        
                        {/* Case Category Pills */}
                        <div className="flex gap-2">
                          {['Criminal', 'Civil', 'Other'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCaseCategory(cat);
                                if (cat === 'Criminal' && !formData.caseType) setFormData(prev => ({ ...prev, caseType: 'জি.আর' }));
                                if (cat === 'Civil' && !formData.caseType) setFormData(prev => ({ ...prev, caseType: 'দেওয়ানী' }));
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                                caseCategory === cat 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                  : 'bg-white text-slate-700 font-bold border-[#d8d0b8] hover:border-indigo-300'
                              }`}
                            >
                              {cat === 'Criminal' ? (language === 'bn' ? 'ফৌজদারী' : 'Criminal') : 
                               cat === 'Civil' ? (language === 'bn' ? 'দেওয়ানী' : 'Civil') : 
                               (language === 'bn' ? 'অন্যান্য' : 'Other')}
                            </button>
                          ))}
                        </div>

                        {/* Quick Type Selection */}
                        <div className="flex flex-wrap gap-1.5">
                          {(caseCategory === 'Civil' ? civilTypes : criminalTypes).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, caseType: type }))}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border cursor-pointer ${
                                formData.caseType === type 
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                                  : 'bg-white text-slate-800 font-bold border-[#d8d0b8] hover:bg-amber-50'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              {language === 'bn' ? 'মামলা নম্বর (যেমন: ১২৩/২৪) *' : 'Case Number *'}
                            </span>
                            <input
                              type="text"
                              name="rawCaseNumber"
                              value={formData.rawCaseNumber || ''}
                              onChange={handleChange}
                              required
                              placeholder={language === 'bn' ? 'যেমন: ১২৩/২৪' : 'e.g. 123/24'}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-sm text-slate-900"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">
                              {language === 'bn' ? 'থানা (ঐচ্ছিক)' : 'Police Station'}
                            </span>
                            <select
                              name="policeStation"
                              value={formData.policeStation || ''}
                              onChange={handleChange}
                              className="w-full px-3 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                            >
                              <option value="">{t('select_police_station' as any)}</option>
                              {getPoliceStations(formData.district || userDistrict, userCountry).map(ps => (
                                <option key={ps} value={ps}>{ps}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {caseNumberPreview && (
                          <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200/70 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                              {t('case_number_preview')}:
                            </span>
                            <span className="text-xs font-black text-indigo-700">
                              {caseNumberPreview}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Section 4: Client Side & Parties */}
                      <div className="border-b border-[#ece5d4] pb-4 space-y-3">
                        <label className="text-xs font-black text-[#5c5035] uppercase tracking-wider flex items-center gap-1.5">
                          <Scale size={14} className="text-emerald-600" />
                          {language === 'bn' ? '৪. পক্ষগণ ও আমার মক্কেল নির্বাচন *' : '4. Parties & Client Side *'}
                        </label>

                        {/* Representation Side Selector */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, selectedParty: 'petitioner' }))}
                            className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              formData.selectedParty === 'petitioner'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                                : 'bg-white text-slate-700 font-bold border-[#d8d0b8] hover:border-emerald-300'
                            }`}
                          >
                            <span className="text-base">👨‍⚖️</span>
                            <span>{language === 'bn' ? 'বাদী পক্ষ (আমার মক্কেল)' : 'Plaintiff / Petitioner'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, selectedParty: 'respondent' }))}
                            className={`py-2.5 px-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              formData.selectedParty === 'respondent'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100'
                                : 'bg-white text-slate-700 font-bold border-[#d8d0b8] hover:border-rose-300'
                            }`}
                          >
                            <span className="text-base">⚖️</span>
                            <span>{language === 'bn' ? 'বিবাদী পক্ষ (আমার মক্কেল)' : 'Defendant / Accused'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Plaintiffs Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-emerald-800 block">
                                {language === 'bn' ? 'বাদীগণ (Plaintiffs) *' : 'Petitioners *'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPlaintiffs(prev => [...prev, { name: '', phone: '' }])}
                                className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Plus size={12} /> {language === 'bn' ? 'বাদী যোগ' : 'Add'}
                              </button>
                            </div>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                              {plaintiffs.map((p, index) => (
                                <div key={index} className="flex items-center gap-1.5 relative bg-emerald-50/40 p-2 rounded-xl border border-emerald-100">
                                  <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPlaintiffs(prev => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], name: val };
                                        return next;
                                      });
                                      if (index === 0) setFormData(prev => ({ ...prev, petitioner: val }));
                                    }}
                                    required={index === 0 && formData.selectedParty === 'petitioner'}
                                    placeholder={language === 'bn' ? `বাদীর নাম ${index + 1}` : `Petitioner ${index + 1}`}
                                    className="flex-1 min-w-[100px] px-2.5 py-1.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs sm:text-sm h-[34px] transition-all"
                                  />
                                  <WhatsAppPhoneInput
                                    value={p.phone || ''}
                                    onChange={(val) => {
                                      setPlaintiffs(prev => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], phone: val };
                                        return next;
                                      });
                                      if (index === 0) setFormData(prev => ({ ...prev, petitionerMobile: val }));
                                    }}
                                    placeholder={language === 'bn' ? 'মেইন' : 'Main'}
                                    language={language}
                                    compactExpandable
                                    className="h-[34px]"
                                  />
                                  <WhatsAppPhoneInput
                                    value={p.optionalPhone || ''}
                                    onChange={(val) => {
                                      setPlaintiffs(prev => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], optionalPhone: val };
                                        return next;
                                      });
                                    }}
                                    placeholder={language === 'bn' ? 'অপ্ট' : 'Opt'}
                                    language={language}
                                    compactExpandable
                                    className="h-[34px]"
                                  />
                                  {plaintiffs.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setPlaintiffs(prev => prev.filter((_, i) => i !== index))}
                                      className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Defendants Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-rose-800 block">
                                {language === 'bn' ? 'আসামী/বিবাদীগণ (Defendants) *' : 'Respondents *'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setDefendants(prev => [...prev, { name: '', phone: '', serial: prev.length + 1 }])}
                                className="text-[11px] font-black text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Plus size={12} /> {language === 'bn' ? 'আসামী যোগ' : 'Add'}
                              </button>
                            </div>
                            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                              {defendants.map((d, index) => (
                                <div key={index} className="flex items-center gap-1.5 relative bg-rose-50/40 p-2 rounded-xl border border-rose-100">
                                  <span className="text-[10px] font-bold text-slate-500 shrink-0 w-4 text-center">{d.serial || index + 1}.</span>
                                  <input
                                    type="text"
                                    value={d.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDefendants(prev => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], name: val };
                                        return next;
                                      });
                                      if (index === 0) setFormData(prev => ({ ...prev, respondent: val }));
                                    }}
                                    required={index === 0 && formData.selectedParty === 'respondent'}
                                    placeholder={language === 'bn' ? `আসামী/বিবাদীর নাম ${index + 1}` : `Defendant ${index + 1}`}
                                    className="flex-1 min-w-[100px] px-2.5 py-1.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs sm:text-sm h-[34px] transition-all"
                                  />
                                  <WhatsAppPhoneInput
                                    value={d.phone || ''}
                                    onChange={(val) => {
                                      setDefendants(prev => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], phone: val };
                                        return next;
                                      });
                                      if (index === 0) setFormData(prev => ({ ...prev, respondentMobile: val }));
                                    }}
                                    placeholder={language === 'bn' ? 'মেইন' : 'Main'}
                                    language={language}
                                    compactExpandable
                                    className="h-[34px]"
                                  />
                                  <WhatsAppPhoneInput
                                    value={d.optionalPhone || ''}
                                    onChange={(val) => {
                                      setDefendants(prev => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], optionalPhone: val };
                                        return next;
                                      });
                                    }}
                                    placeholder={language === 'bn' ? 'অপ্ট' : 'Opt'}
                                    language={language}
                                    compactExpandable
                                    className="h-[34px]"
                                  />
                                  {defendants.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setDefendants(prev => prev.filter((_, i) => i !== index))}
                                      className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>


                      </div>

                      {/* Section 5: Today's Hearing Step / Order */}
                      <div className="border-b border-[#ece5d4] pb-4 space-y-3">
                        <label className="text-xs font-black text-[#5c5035] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-600" />
                          {language === 'bn' ? '৫. ডায়েরির পদক্ষেপ / আদেশ *' : '5. Hearing Step / Order *'}
                        </label>
                        <input
                          type="text"
                          name="order"
                          value={formData.order || ''}
                          onChange={handleChange}
                          placeholder={language === 'bn' ? 'যেমন: হাজিরা, শুনানি, সাক্ষ্য গ্রহণ, জামিন শুনানি...' : 'e.g. Hearing, Evidence, Bail hearing...'}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                        />
                        {/* Distinct & Separated Steps Display */}
                        {isCriminalCase ? (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-black text-rose-800 flex items-center gap-1">
                              ⚖️ {language === 'bn' ? 'ফৌজদারী মামলার পদক্ষেপসমূহ:' : 'Criminal Case Steps:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {CRIMINAL_CASE_STEPS.map((sItem) => (
                                <button
                                  key={sItem}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, order: sItem }))}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border cursor-pointer ${
                                    formData.order === sItem
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-white text-slate-800 font-bold border-rose-200 hover:bg-rose-50'
                                  }`}
                                >
                                  {sItem}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : isCivilCase ? (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-black text-indigo-800 flex items-center gap-1">
                              📜 {language === 'bn' ? 'দেওয়ানী মামলার পদক্ষেপসমূহ:' : 'Civil Case Steps:'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {CIVIL_CASE_STEPS.map((sItem) => (
                                <button
                                  key={sItem}
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, order: sItem }))}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border cursor-pointer ${
                                    formData.order === sItem
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-white text-slate-800 font-bold border-indigo-200 hover:bg-indigo-50'
                                  }`}
                                >
                                  {sItem}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1">
                            {/* Criminal Steps */}
                            <div className="space-y-1">
                              <span className="text-[11px] font-black text-rose-800 flex items-center gap-1">
                                ⚖️ {language === 'bn' ? 'ফৌজদারী মামলার পদক্ষেপ:' : 'Criminal Case Steps:'}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {CRIMINAL_CASE_STEPS.map((sItem) => (
                                  <button
                                    key={sItem}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, order: sItem }))}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border cursor-pointer ${
                                      formData.order === sItem
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                        : 'bg-white text-slate-800 font-bold border-rose-200 hover:bg-rose-50'
                                    }`}
                                  >
                                    {sItem}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Civil Steps */}
                            <div className="space-y-1">
                              <span className="text-[11px] font-black text-indigo-800 flex items-center gap-1">
                                📜 {language === 'bn' ? 'দেওয়ানী মামলার পদক্ষেপ:' : 'Civil Case Steps:'}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {CIVIL_CASE_STEPS.map((sItem) => (
                                  <button
                                    key={sItem}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, order: sItem }))}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border cursor-pointer ${
                                      formData.order === sItem
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-white text-slate-800 font-bold border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {sItem}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 6: Next Date (Optional) & Authority */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#ece5d4] pb-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              {language === 'bn' ? 'পরবর্তী শুনানির তারিখ' : 'Next Hearing Date'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
                            </span>
                          </div>
                          <input
                            type="date"
                            value={diaryNextHearingDate}
                            onChange={(e) => setDiaryNextHearingDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-[#d8d0b8] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            {language === 'bn' ? 'পরবর্তী তারিখ ধার্য থাকলে দিন, না থাকলে পরে দেওয়া যাবে।' : 'Leave blank if next date is not fixed yet.'}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            {language === 'bn' ? 'মামলা পরিচালনার পূর্ণ অধিকার কার?' : 'Full Authority Holder'}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, authorityHolder: 'lawyer' }))}
                              className={`py-2 px-2 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                formData.authorityHolder === 'lawyer'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 font-bold border-[#d8d0b8]'
                              }`}
                            >
                              💼 {language === 'bn' ? 'আইনজীবী' : 'Lawyer'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, authorityHolder: 'clerk' }))}
                              className={`py-2 px-2 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                formData.authorityHolder === 'clerk'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 font-bold border-[#d8d0b8]'
                              }`}
                            >
                              📋 {language === 'bn' ? 'মুহুরি' : 'Clerk'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Chamber Associate if Lawyer */}
                      {userType === 'lawyer' && chamberAssociates && chamberAssociates.length > 0 && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Briefcase size={14} className="text-amber-600" />
                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                              {language === 'bn' ? 'ল’ চেম্বার দায়িত্বপ্রাপ্ত অ্যাসোসিয়েট' : 'Chamber Assigned Associate'}
                            </span>
                          </div>
                          <select
                            value={formData.assignedAssociateName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setFormData(prev => ({ ...prev, assignedAssociateName: '', assignedAssociateMobile: '', assignedAssociateRole: '' }));
                              } else {
                                const found = chamberAssociates.find(a => a.name === val);
                                if (found) {
                                  setFormData(prev => ({
                                    ...prev,
                                    assignedAssociateName: found.name,
                                    assignedAssociateMobile: found.mobile,
                                    assignedAssociateRole: found.role || 'Associate'
                                  }));
                                } else {
                                  setFormData(prev => ({ ...prev, assignedAssociateName: val }));
                                }
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">-- {language === 'bn' ? 'চেম্বার প্রধানের প্রত্যক্ষ দায়িত্বে (Lead)' : 'Directly Under Lead Advocate'} --</option>
                            {chamberAssociates.map(a => (
                              <option key={a.id} value={a.name}>
                                ⚖️ {a.name} ({a.role || 'Associate'}) - {a.mobile}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Main Save Button in Diary */}
                      <button
                        type="submit"
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <Save size={18} />
                        <span>{language === 'bn' ? '💾 ডায়েরি এন্ট্রি সংরক্ষণ করুন ও কেস কার্ড তৈরি করুন' : 'Save Diary Entry & Generate Case Card'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Live Case Card (5 cols) */}
                  <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
                    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                          {language === 'bn' ? 'লাইভ কেস কার্ড পূরণ' : 'Live Case Card'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {language === 'bn' ? 'স্বয়ংক্রিয়ভাবে তৈরি হচ্ছে' : 'Auto Generated'}
                      </span>
                    </div>

                    {/* The Live Case Card itself */}
                    <div className={`rounded-3xl p-5 border-2 shadow-xl transition-all relative overflow-hidden ${
                      formData.selectedParty === 'petitioner'
                        ? 'bg-gradient-to-b from-[#f0fdf4] to-white border-emerald-300'
                        : formData.selectedParty === 'respondent'
                          ? 'bg-gradient-to-b from-[#fff1f2] to-white border-rose-300'
                          : 'bg-gradient-to-b from-[#fcfbf7] to-white border-[#e3dcc4]'
                    }`}>
                      {/* Top Ribbon */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/70 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                          <BookOpen size={11} />
                          {language === 'bn' ? 'তারিখ ডায়েরি এন্ট্রি' : 'Date Diary'}
                        </span>
                        {formData.selectedParty === 'petitioner' ? (
                          <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-600 text-white rounded-full flex items-center gap-1 shadow-3xs">
                            <CheckCircle2 size={11} />
                            {language === 'bn' ? 'মক্কেল: বাদী পক্ষ' : 'Client: Petitioner'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-0.5 bg-rose-600 text-white rounded-full flex items-center gap-1 shadow-3xs">
                            <CheckCircle2 size={11} />
                            {language === 'bn' ? 'মক্কেল: বিবাদী পক্ষ' : 'Client: Defendant'}
                          </span>
                        )}
                      </div>

                      {/* Case Number & Court */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            {caseNumberPreview || (formData.rawCaseNumber ? formData.rawCaseNumber : (language === 'bn' ? 'মামলা নং লিখুন...' : 'Enter Case No...'))}
                          </h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            caseCategory === 'Criminal' || formData.caseType === 'ফৌজদারী'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {formData.caseType || (caseCategory === 'Civil' ? 'দেওয়ানী' : 'ফৌজদারী')}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <MapPin size={12} className="text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {formData.courtName 
                              ? `${formData.courtName}${formData.courtNumber ? ` (${formData.courtNumber})` : ''}, ${formData.district || userDistrict}` 
                              : (language === 'bn' ? 'আদালত নির্বাচন করুন' : 'Select Court')}
                          </span>
                        </p>
                      </div>

                      {/* Parties Table */}
                      <div className="grid grid-cols-2 gap-2 mb-3.5">
                        <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200/70 shadow-3xs">
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block mb-0.5">
                            {language === 'bn' ? 'বাদী (Plaintiff)' : 'Petitioner'}
                          </span>
                          <p className="text-xs font-black text-slate-900 truncate">
                            {plaintiffs[0]?.name || (language === 'bn' ? 'বাদীর নাম...' : 'Petitioner...')}
                          </p>
                          {plaintiffs[0]?.phone && (
                            <p className="text-[10px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone size={9} className="text-emerald-600" />
                              {plaintiffs[0]?.phone}
                            </p>
                          )}
                        </div>

                        <div className="p-2.5 bg-white/80 rounded-xl border border-rose-200/70 shadow-3xs">
                          <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 block mb-0.5">
                            {language === 'bn' ? 'বিবাদী (Defendant)' : 'Respondent'}
                          </span>
                          <p className="text-xs font-black text-slate-900 truncate">
                            {defendants[0]?.name || (language === 'bn' ? 'বিবাদীর নাম...' : 'Respondent...')}
                          </p>
                          {defendants[0]?.phone && (
                            <p className="text-[10px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone size={9} className="text-rose-600" />
                              {defendants[0]?.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dates and Order Pills */}
                      <div className="space-y-2 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/70 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500 flex items-center gap-1">
                            <Calendar size={12} className="text-emerald-600" />
                            {language === 'bn' ? 'শুনানির তারিখ:' : 'Hearing Date:'}
                          </span>
                          <span className="font-black text-slate-900">
                            {diaryHearingDate}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500 flex items-center gap-1">
                            <Clock size={12} className="text-indigo-600" />
                            {language === 'bn' ? 'পরবর্তী শুনানির তারিখ:' : 'Next Date:'}
                          </span>
                          <span className="font-black text-indigo-700">
                            {diaryNextHearingDate || (language === 'bn' ? 'পরে ধার্য হবে' : 'Not set')}
                          </span>
                        </div>

                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500">
                            {language === 'bn' ? 'পদক্ষেপ / আদেশ:' : 'Step / Order:'}
                          </span>
                          <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            {formData.order || (language === 'bn' ? 'হাজিরা' : 'Attendance')}
                          </span>
                        </div>
                      </div>

                      {/* Update Later Notice as requested by user */}
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-[11px] space-y-1">
                        <p className="font-black text-amber-900 flex items-center gap-1.5">
                          <span>💡</span>
                          <span>{language === 'bn' ? 'পরে চাইলে যেকোনো তথ্য আপডেট করতে পারবেন:' : 'Update anytime later:'}</span>
                        </p>
                        <p className="text-amber-800 leading-relaxed font-medium">
                          {language === 'bn' 
                            ? 'ডায়েরি এন্ট্রি সংরক্ষণ করার পর আপনি যেকোনো সময় কেস কার্ডে ক্লিক করে তথ্য সংশোধন, ওকালতনামা ও নথি আপলোড বা অ্যাসোসিয়েট যুক্ত করতে পারবেন।'
                            : 'After saving this diary entry, you can edit case info, upload documents, power of attorney, or add associates at any time.'}
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                      >
                        <Save size={14} />
                        <span>{language === 'bn' ? 'কেস কার্ড সংরক্ষণ করুন' : 'Save Case Card'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

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
                          className={`flex-1 py-3 px-4 rounded-2xl text-sm font-black transition-all border ${
                            caseCategory === cat 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                              : 'bg-white text-black font-extrabold border-slate-300 hover:border-indigo-300'
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
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                              formData.caseType === type 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                : 'bg-white text-black font-extrabold border-slate-300 hover:border-indigo-400 shadow-sm'
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

                  {/* Case Authority Selection */}
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                      {language === 'bn' ? 'এই মামলাটি পরিচালনার পূর্ণ অধিকার কার?' : 'Who holds full authority over this case?'}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, authorityHolder: 'lawyer' }))}
                        className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all flex items-center justify-center gap-2 ${
                          formData.authorityHolder === 'lawyer'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                            : 'bg-white text-slate-700 font-extrabold border-slate-200 hover:border-indigo-450'
                        }`}
                      >
                        💼 {language === 'bn' ? 'উকিল (Lawyer)' : 'Lawyer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, authorityHolder: 'clerk' }))}
                        className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all flex items-center justify-center gap-2 ${
                          formData.authorityHolder === 'clerk'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                            : 'bg-white text-slate-700 font-extrabold border-slate-200 hover:border-indigo-450'
                        }`}
                      >
                        📋 {language === 'bn' ? 'মুহুরি (Clerk)' : 'Clerk'}
                      </button>
                    </div>
                  </div>

                  {/* Case Representation Side Selection */}
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                      {language === 'bn' ? 'আপনি কোন পক্ষের প্রতিনিধিত্ব করছেন? (যার হোয়াটসঅ্যাপে বার্তা যাবে)' : 'Which side do you represent? (Who gets the WhatsApp info)'}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, selectedParty: 'petitioner' }))}
                        className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                          formData.selectedParty === 'petitioner'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                            : 'bg-white text-slate-700 font-extrabold border-slate-200 hover:border-blue-450'
                        }`}
                      >
                        <span className="text-xl">👨‍⚖️</span>
                        <span>{language === 'bn' ? 'বাদী পক্ষ (Plaintiff)' : 'Plaintiff / Petitioner'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, selectedParty: 'respondent' }))}
                        className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                          formData.selectedParty === 'respondent'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-100'
                            : 'bg-white text-slate-700 font-extrabold border-slate-200 hover:border-amber-450'
                        }`}
                      >
                        <span className="text-xl">⚖️</span>
                        <span>{language === 'bn' ? 'বিবাদী পক্ষ (Defendant)' : 'Defendant / Respondent'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</label>
                    <div className="space-y-4">
                      {renderPartySection(
                        language === 'bn' ? 'বাদীর বিবরণ' : 'Petitioner Details',
                        plaintiffs,
                        setPlaintiffs,
                        language === 'bn' ? 'বাদীর নাম' : 'Petitioner Name'
                      )}
                      {renderPartySection(
                        language === 'bn' ? 'বিবাদীর বিবরণ' : 'Respondent Details',
                        defendants,
                        setDefendants,
                        language === 'bn' ? 'বিবাদীর নাম' : 'Respondent Name',
                        true
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                        {language === 'bn' ? 'পূর্ববর্তী তারিখ' : 'Previous Date'}
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                        {language === 'bn' ? 'ঐচ্ছিক / অপশনাল' : 'Optional'}
                      </span>
                    </div>
                    <input
                      type="date"
                      name="lastDate"
                      value={formData.lastDate || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                    <p className="text-[10.5px] font-medium text-slate-400 mt-1">
                      {language === 'bn' ? 'পূর্ববর্তী তারিখ না হলেও মামলাটি অনায়াসে সংরক্ষণ করা যাবে।' : 'Case can be saved even without previous date.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('next_date')} *</label>
                    <input
                      type="date"
                      name="nextDate"
                      value={formData.nextDate || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'পদক্ষেপ / আদেশ' : 'Step / Order'}</label>
                    <input
                      type="text"
                      name="order"
                      value={formData.order || ''}
                      onChange={handleChange}
                      placeholder={language === 'bn' ? 'যেমন: S.R/AD(সমন/চিঠি), W/S (জবাব), ADR...' : 'e.g. S.R/AD, W/S, ADR...'}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold mb-2"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 self-center mr-1">{language === 'bn' ? 'দ্রুত নির্বাচন:' : 'Quick Pick:'}</span>
                      {quickPickSteps.map((sItem) => (
                        <button
                          key={sItem}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, order: sItem }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
                            formData.order === sItem
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-black font-extrabold border-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 shadow-sm'
                          }`}
                        >
                          {sItem}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chamber Associate for Quick Mode */}
                  {userType === 'lawyer' && chamberAssociates && chamberAssociates.length > 0 && (
                    <div className="md:col-span-2 p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-amber-600" />
                        <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                          {language === 'bn' ? 'ল’ চেম্বার দায়িত্বপ্রাপ্ত অ্যাসোসিয়েট' : 'Chamber Assigned Associate'}
                        </span>
                      </div>
                      <select
                        value={formData.assignedAssociateName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            setFormData(prev => ({ ...prev, assignedAssociateName: '', assignedAssociateMobile: '', assignedAssociateRole: '' }));
                          } else {
                            const found = chamberAssociates.find(a => a.name === val);
                            if (found) {
                              setFormData(prev => ({
                                ...prev,
                                assignedAssociateName: found.name,
                                assignedAssociateMobile: found.mobile,
                                assignedAssociateRole: found.role || 'Associate'
                              }));
                            } else {
                              setFormData(prev => ({ ...prev, assignedAssociateName: val }));
                            }
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">-- {language === 'bn' ? 'চেম্বার প্রধানের প্রত্যক্ষ দায়িত্বে (Lead)' : 'Directly Under Lead Advocate'} --</option>
                        {chamberAssociates.map(a => (
                          <option key={a.id} value={a.name}>
                            ⚖️ {a.name} ({a.role || 'Associate'}) - {a.mobile}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'ডকুমেন্ট আপলোড' : 'Document Upload'}</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {caseDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600">
                          <FileText size={14} />
                          <span className="truncate max-w-[150px]">{doc.name}</span>
                          <button type="button" onClick={() => removeDocument(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <button 
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-2xl text-sm font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all bg-white"
                    >
                      {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                      {language === 'bn' ? 'ফাইল সিলেক্ট করুন' : 'Select Files'}
                    </button>
                  </div>
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('district_label')}</label>
                        <select
                          name="district"
                          value={formData.district || userDistrict || ''}
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
                          value={formData.policeStation || ''}
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
                        <div className="flex gap-2">
                          <select
                            name="courtName"
                            value={formData.courtName || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                          >
                            <option value="">{t('court_placeholder')}</option>
                            {getCourtsForDistrict(formData.district || userDistrict).map(court => (
                              <option key={court} value={court}>{court}</option>
                            ))}
                          </select>
                          {formData.courtName && (
                            <select
                              name="courtNumber"
                              value={formData.courtNumber || ''}
                              onChange={handleChange}
                              className="w-1/3 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                            >
                              <option value="">সংখ্যা</option>
                              <option value="১ম">১ম</option>
                              <option value="২য়">২য়</option>
                              <option value="৩য়">৩য়</option>
                              <option value="৪র্থ">৪র্থ</option>
                              <option value="৫ম">৫ম</option>
                            </select>
                          )}
                        </div>
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
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'মামলার ধরন' : 'Case Type'}</label>
                        <select
                          name="caseType"
                          value={formData.caseType || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleChange(e);
                            if (criminalTypes.includes(val)) {
                              setCaseCategory('Criminal');
                            } else if (civilTypes.includes(val)) {
                              setCaseCategory('Civil');
                            }
                          }}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">{language === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                          <optgroup label={language === 'bn' ? 'ফৌজদারী (Criminal)' : 'Criminal'}>
                            {criminalTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </optgroup>
                          <optgroup label={language === 'bn' ? 'দেওয়ানী (Civil)' : 'Civil'}>
                            {civilTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </optgroup>
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
                          value={joinFilingYear || ''}
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
                          value={formData.policeStation || ''}
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

                    {/* Case Authority Selection in Join Mode */}
                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                        {language === 'bn' ? 'এই মামলা পরিচালনার পূর্ণ অধিকার কার?' : 'Who holds full authority over this case?'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, authorityHolder: 'lawyer' }))}
                          className={`py-3 px-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                            formData.authorityHolder === 'lawyer'
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                              : 'bg-white border-slate-200 text-slate-650 hover:border-indigo-300'
                          }`}
                        >
                          💼 {language === 'bn' ? 'উকিল' : 'Lawyer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, authorityHolder: 'clerk' }))}
                          className={`py-3 px-4 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                            formData.authorityHolder === 'clerk'
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                              : 'bg-white border-slate-200 text-slate-650 hover:border-indigo-300'
                          }`}
                        >
                          📋 {language === 'bn' ? 'মুহুরি' : 'Clerk'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                        {language === 'bn' ? 'আপনি কোন পক্ষের প্রতিনিধিত্ব করছেন? (যার হোয়াটসঅ্যাপে বার্তা যাবে)' : 'Which side do you represent? (Who gets the WhatsApp info)'}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSide('petitioner')}
                          className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all flex flex-col items-center justify-center gap-2 ${
                            side === 'petitioner'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                              : 'bg-white text-slate-700 font-extrabold border-slate-200 hover:border-blue-450'
                          }`}
                        >
                          <span className="text-xl">👨‍⚖️</span>
                          <span className="text-center">{language === 'bn' ? 'বাদী পক্ষ (Plaintiff)' : 'Plaintiff / Petitioner'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSide('respondent')}
                          className={`py-3.5 px-4 rounded-2xl border text-sm font-black transition-all flex flex-col items-center justify-center gap-2 ${
                            side === 'respondent'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-100'
                              : 'bg-white text-slate-700 font-extrabold border-slate-200 hover:border-amber-450'
                          }`}
                        >
                          <span className="text-xl">⚖️</span>
                          <span className="text-center">{language === 'bn' ? 'বিবাদী পক্ষ (Defendant)' : 'Defendant / Respondent'}</span>
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
                      {renderPartySection(language === 'bn' ? 'আসামী যুক্ত করুন' : 'Add Respondents', defendants, setDefendants, language === 'bn' ? 'আসামীর নাম' : 'Respondent Name', true, false)}
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
                        value={formData.policeStation || ''}
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
                    <div className="flex gap-2">
                      <select
                        name="courtName"
                        value={formData.courtName || ''}
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
                      {formData.courtName && (
                        <select
                          name="courtNumber"
                          value={formData.courtNumber || ''}
                          onChange={handleChange}
                          className="w-1/3 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        >
                          <option value="">সংখ্যা</option>
                          <option value="১ম">১ম</option>
                          <option value="২য়">২য়</option>
                          <option value="৩য়">৩য়</option>
                          <option value="৪র্থ">৪র্থ</option>
                          <option value="৫ম">৫ম</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-slate-700">
                        ৪. {language === 'bn' ? 'পূর্ববর্তী তারিখ' : 'Previous Date'}
                      </label>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {language === 'bn' ? 'ঐচ্ছিক / অপশনাল' : 'Optional'}
                      </span>
                    </div>
                    <input
                      type="date"
                      name="lastDate"
                      value={formData.lastDate || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      {language === 'bn' ? 'পূর্ববর্তী তারিখ না হলেও মামলাটি অনায়াসে সংরক্ষণ করা যাবে।' : 'Can be saved even without previous date.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৫. {t('filing_date')}</label>
                    <input
                      type="date"
                      name="filingDate"
                      value={formData.filingDate || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৬. {t('priority_label')}</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">৭. {t('case_type')}</label>
                    <select
                      name="caseType"
                      value={formData.caseType || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange(e);
                        if (criminalTypes.includes(val)) {
                          setCaseCategory('Criminal');
                        } else if (civilTypes.includes(val)) {
                          setCaseCategory('Civil');
                        } else {
                          setCaseCategory('Other');
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    >
                      <option value="">নির্বাচন করুন</option>
                      <optgroup label={language === 'bn' ? 'ফৌজদারী (Criminal)' : 'Criminal'}>
                        {criminalTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'bn' ? 'দেওয়ানী (Civil)' : 'Civil'}>
                        {civilTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </optgroup>
                      <optgroup label={language === 'bn' ? 'অন্যান্য' : 'Other'}>
                        <option value="Writ">Writ</option>
                        <option value="Other">Other</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">৮. {t('case_number')}</label>
                    <input
                      type="text"
                      name="rawCaseNumber"
                      value={(formData.rawCaseNumber !== undefined && formData.rawCaseNumber !== null ? formData.rawCaseNumber : (formData.caseNumber || '')) || ''}
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">৯. {t('section')}</label>
                    <input
                      type="text"
                      name="caseSection"
                      value={formData.caseSection || ''}
                      onChange={handleChange}
                      placeholder={t('section_placeholder')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">১০. মামলা পরিচালনার পূর্ণ অধিকার কার?</label>
                    <select
                      name="authorityHolder"
                      value={formData.authorityHolder || 'lawyer'}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="lawyer">{language === 'bn' ? 'উকিল (Lawyer)' : 'Lawyer'}</option>
                      <option value="clerk">{language === 'bn' ? 'মুহুরি (Clerk)' : 'Clerk'}</option>
                    </select>
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
                  {renderPartySection(language === 'bn' ? '👨‍⚖️ বিবাদী / আসামী' : '👨‍⚖️ Defendant / Accused', defendants, setDefendants, language === 'bn' ? 'আসামীর নাম' : 'Defendant Name', true, false)}
                </div>

                {userType !== 'lawyer' && renderPartySection(language === 'bn' ? '⚖️ উকিল' : '⚖️ Lawyer', lawyers, setLawyers, language === 'bn' ? 'উকিলের নাম' : 'Lawyer Name', false, false, 'lawyer')}
                {userType !== 'clerk' && renderPartySection(language === 'bn' ? '📋 মুহুরি' : '📋 Clerk', clerks, setClerks, language === 'bn' ? 'মুহুরির নাম' : 'Clerk Name', false, false, 'clerk')}

                {/* Chamber Associate for Detailed Mode */}
                {userType === 'lawyer' && chamberAssociates && chamberAssociates.length > 0 && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-amber-600" />
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                        {language === 'bn' ? 'ল’ চেম্বার দায়িত্বপ্রাপ্ত অ্যাসোসিয়েট' : 'Chamber Assigned Associate'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {language === 'bn' 
                        ? 'এই মামলাটি চেম্বারের কোন সহযোগী আইনজীবী পরিচালনা করবেন তা নির্বাচন করুন:' 
                        : 'Select which associate lawyer in your chamber will manage this case:'}
                    </p>
                    <select
                      value={formData.assignedAssociateName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setFormData(prev => ({ ...prev, assignedAssociateName: '', assignedAssociateMobile: '', assignedAssociateRole: '' }));
                        } else {
                          const found = chamberAssociates.find(a => a.name === val);
                          if (found) {
                            setFormData(prev => ({
                              ...prev,
                              assignedAssociateName: found.name,
                              assignedAssociateMobile: found.mobile,
                              assignedAssociateRole: found.role || 'Associate'
                            }));
                          } else {
                            setFormData(prev => ({ ...prev, assignedAssociateName: val }));
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- {language === 'bn' ? 'চেম্বার প্রধানের প্রত্যক্ষ দায়িত্বে (Lead)' : 'Directly Under Lead Advocate'} --</option>
                      {chamberAssociates.map(a => (
                        <option key={a.id} value={a.name}>
                          ⚖️ {a.name} ({a.role || 'Associate'}) - {a.mobile}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                      value={formData.nextDate || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'অবস্থা' : 'Status'}</label>
                    <select
                      name="status"
                      value={formData.status || 'Pending'}
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
                      value={formData.order || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-sm"
                    >
                      <option value="">{language === 'bn' ? 'পদক্ষেপ নির্বাচন করুন' : 'Select Step'}</option>
                      {caseCategory === 'Criminal' && (
                        CRIMINAL_CASE_STEPS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))
                      )}
                      {caseCategory === 'Civil' && (
                        CIVIL_CASE_STEPS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))
                      )}
                      {caseCategory !== 'Criminal' && caseCategory !== 'Civil' && (
                        <>
                          <optgroup label="দেওয়ানী (Civil)">
                            {CIVIL_CASE_STEPS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                          <optgroup label="ফৌজদারী (Criminal)">
                            {CRIMINAL_CASE_STEPS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[11px] font-bold text-slate-500 self-center mr-1">{language === 'bn' ? 'দ্রুত নির্বাচন:' : 'Quick Pick:'}</span>
                      {quickPickSteps.map((sItem) => (
                        <button
                          key={sItem}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, order: sItem }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
                            formData.order === sItem
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-black font-extrabold border-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 shadow-sm'
                          }`}
                        >
                          {sItem}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'bn' ? 'অতিরিক্ত আদেশ/নোট' : 'Additional Order/Notes'}</label>
                    <textarea
                      name="additionalOrder"
                      value={formData.additionalOrder || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder={language === 'bn' ? 'অতিরিক্ত কোন আদেশ থাকলে তা লিখুন...' : 'Enter any additional order or notes...'}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-4"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'bn' ? 'ডকুমেন্ট আপলোড' : 'Document Upload'}</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {caseDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600">
                          <FileText size={14} />
                          <span className="truncate max-w-[200px]">{doc.name}</span>
                          <button type="button" onClick={() => removeDocument(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input 
                      type="file" 
                      id="detailed-doc-upload"
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button 
                        type="button"
                        disabled={isUploading}
                        onClick={() => document.getElementById('detailed-doc-upload')?.click()}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50"
                      >
                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} />}
                        {language === 'bn' ? 'ফাইল নির্বাচন করুন' : 'Attach File'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (!isSubscribed) {
                            alert(language === 'bn' 
                              ? 'দলিল বা ওকালতনামা স্ক্যান করতে প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন। দয়া করে প্রোফাইল থেকে সাবস্ক্রাইব করুন।' 
                              : 'Premium subscription is required to scan documents. Please subscribe from your profile.');
                            return;
                          }
                          setShowScannerModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all shadow-md shadow-indigo-100"
                      >
                        <Camera size={18} />
                        {language === 'bn' ? 'ক্যামেরা দিয়ে স্ক্যান করুন' : 'Scan with Camera'}
                      </button>
                    </div>
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

      <DocumentScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        caseNumber={formData.caseNumber || 'New'}
        onDocumentScanned={(scannedDoc) => {
          setCaseDocuments((prev) => [...prev, scannedDoc]);
        }}
        language={language === 'bn' ? 'bn' : 'en'}
      />
    </div>
  );
}
