import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  Copy, 
  FileText, 
  User, 
  Building2,
  Trash2, 
  Smartphone,
  CheckCircle2,
  Camera,
  Share2,
  Paperclip,
  X,
  Loader2,
  Upload,
  AlertTriangle,
  Coins,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Case } from '../../types';
import { formatCourtNameWithNo } from '../../constants';
import { uploadFile, getPublicUrl } from '../../lib/storage';
import { fetchWithAuth } from '../../lib/api';
import { AdBanner } from './AdBanner';
import { DocumentScannerModal } from '../../components/DocumentScannerModal';

interface CaseCardProProps {
  caseData: Case;
  onUpdate: (id: string | number, nextDate: string, order: string, selectedParty: 'petitioner' | 'respondent' | 'accused', clerkCanCall?: boolean, lawyerCanCall?: boolean, visibility?: 'private' | 'public', attachedDocs?: {name: string, type: string, url: string}[], lastDate?: string, extraData?: Partial<Case>) => void;
  onCaseNumberClick?: (caseNumber: string) => void;
  onAddDocument: (id: string | number, document: { name: string; type: string; url: string }) => void;
  onDelete?: (id: string | number) => void;
  isPetitioner?: boolean;
  isRespondent?: boolean;
  userType: string;
  userMobile: string;
}

export const CaseCardPro = ({ 
  caseData, 
  onUpdate, 
  onCaseNumberClick, 
  onAddDocument, 
  onDelete, 
  isPetitioner, 
  isRespondent, 
  userType, 
  userMobile 
}: CaseCardProProps) => {
  const [side, setSide] = useState<'petitioner' | 'respondent' | 'accused'>(caseData.selectedParty || 'petitioner');
  const [nextDate, setNextDate] = useState(caseData.nextDate);
  const [lastDate, setLastDate] = useState(caseData.lastDate || '');
  const [order, setOrder] = useState(caseData.order || '');
  const [clerkCanCall, setClerkCanCall] = useState(caseData.clerkCanCall || false);
  const [lawyerCanCall, setLawyerCanCall] = useState(caseData.lawyerCanCall || false);
  const [visibility, setVisibility] = useState<'private' | 'public'>(caseData.visibility as any || 'private');
  const [attachedDocs, setAttachedDocs] = useState<{name: string, type: string, url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [showAd, setShowAd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  // Document Scanner State
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Yellow Ball & Warning Complaint States
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintNote, setComplaintNote] = useState('');
  const [conflictDateInput, setConflictDateInput] = useState(caseData.nextDate || '');
  const [conflictStepInput, setConflictStepInput] = useState(caseData.order || caseData.status || '');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Lawyer & Clerk Edit Modal States
  const [showLawyerModal, setShowLawyerModal] = useState(false);
  const [targetSide, setTargetSide] = useState<'petitioner' | 'respondent'>('petitioner');
  const [lawyerNameInput, setLawyerNameInput] = useState('');
  const [lawyerMobileInput, setLawyerMobileInput] = useState('');
  const [clerkNameInput, setClerkNameInput] = useState('');
  const [clerkMobileInput, setClerkMobileInput] = useState('');
  const [isSavingLawyerClerk, setIsSavingLawyerClerk] = useState(false);

  const formatMobile = (m?: string[] | string) => {
    if (!m) return '';
    if (Array.isArray(m)) return m.filter(Boolean).join(', ');
    return m;
  };

  const currentLawyerName = side === 'petitioner' 
    ? (caseData.petitionerLawyer || caseData.respondentLawyer || '')
    : (caseData.respondentLawyer || caseData.petitionerLawyer || '');

  const currentLawyerMobile = side === 'petitioner'
    ? formatMobile(caseData.petitionerLawyerMobile || caseData.respondentLawyerMobile)
    : formatMobile(caseData.respondentLawyerMobile || caseData.petitionerLawyerMobile);

  const currentClerkName = side === 'petitioner'
    ? (caseData.petitionerClerk || caseData.respondentClerk || '')
    : (caseData.respondentClerk || caseData.petitionerClerk || '');

  const currentClerkMobile = side === 'petitioner'
    ? formatMobile(caseData.petitionerClerkMobile || caseData.respondentClerkMobile)
    : formatMobile(caseData.respondentClerkMobile || caseData.petitionerClerkMobile);

  const handleOpenLawyerModal = () => {
    const activeIsPet = side === 'petitioner';
    const initialSide = activeIsPet ? 'petitioner' : 'respondent';
    setTargetSide(initialSide);
    setLawyerNameInput(activeIsPet ? (caseData.petitionerLawyer || '') : (caseData.respondentLawyer || ''));
    setLawyerMobileInput(activeIsPet ? formatMobile(caseData.petitionerLawyerMobile) : formatMobile(caseData.respondentLawyerMobile));
    setClerkNameInput(activeIsPet ? (caseData.petitionerClerk || '') : (caseData.respondentClerk || ''));
    setClerkMobileInput(activeIsPet ? formatMobile(caseData.petitionerClerkMobile) : formatMobile(caseData.respondentClerkMobile));
    setShowLawyerModal(true);
  };

  const handleSaveLawyerClerk = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLawyerClerk(true);

    const isPet = targetSide === 'petitioner';
    const extraData: Partial<Case> = isPet ? {
      petitionerLawyer: lawyerNameInput,
      petitionerLawyerMobile: lawyerMobileInput,
      petitionerClerk: clerkNameInput,
      petitionerClerkMobile: clerkMobileInput,
    } : {
      respondentLawyer: lawyerNameInput,
      respondentLawyerMobile: lawyerMobileInput,
      respondentClerk: clerkNameInput,
      respondentClerkMobile: clerkMobileInput,
    };

    if (isPet) {
      caseData.petitionerLawyer = lawyerNameInput;
      caseData.petitionerLawyerMobile = lawyerMobileInput;
      caseData.petitionerClerk = clerkNameInput;
      caseData.petitionerClerkMobile = clerkMobileInput;
    } else {
      caseData.respondentLawyer = lawyerNameInput;
      caseData.respondentLawyerMobile = lawyerMobileInput;
      caseData.respondentClerk = clerkNameInput;
      caseData.respondentClerkMobile = clerkMobileInput;
    }

    onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate, extraData);

    setShowLawyerModal(false);
    setIsSavingLawyerClerk(false);
    setConfirmMsg('নতুন উকিল/মুহুরির তথ্য সফলভাবে যোগ করা হয়েছে!');
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  const handleSyncToWallet = async () => {
    setIsSyncingWallet(true);
    try {
      const res = await fetchWithAuth('/api/cases/sync-to-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseData.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'মামলাটি ১টি হলুদ বল খরচে আপনার ওয়ালেটে/স্ক্রিনে যুক্ত হয়েছে!');
      } else {
        alert(data.error || 'ওয়ালেটে যুক্ত করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      console.error(err);
      alert('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setIsSyncingWallet(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingComplaint(true);
    try {
      const res = await fetchWithAuth('/api/cases/warning-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseData.id,
          conflictingDate: conflictDateInput,
          conflictingStep: conflictStepInput,
          note: complaintNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'ওয়ার্নিং কমপ্লেইন সফলভাবে জমা হয়েছে!');
        setShowComplaintModal(false);
        setComplaintNote('');
      } else {
        alert(data.error || 'কমপ্লেইন জমা করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      alert('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const isOwner = isPetitioner || isRespondent;
  const canCall = (isOwner || (userType === 'lawyer' ? caseData.lawyerCanCall : caseData.clerkCanCall));

  const getDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const renderCalendarTable = () => {
    const month = calDate.getMonth();
    const year = calDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const weekDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const todayStr = getDateStr(new Date());

    return (
      <div className="bg-white border border-slate-200 shadow-2xl p-3 rounded-2xl min-w-[220px] text-slate-900 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-3 bg-slate-50 p-1.5 rounded-xl">
          <button onClick={(e) => { e.stopPropagation(); setCalDate(new Date(year, month - 1)); }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">{'<'}</button>
          <span className="font-bold text-sm text-slate-700">{monthNames[month]} {year}</span>
          <button onClick={(e) => { e.stopPropagation(); setCalDate(new Date(year, month + 1)); }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">{'>'}</button>
        </div>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr>
              {weekDays.map(d => <th key={d} className="p-1 text-slate-400 font-bold uppercase text-[9px]">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(days.length / 7) }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {days.slice(rowIndex * 7, (rowIndex + 1) * 7).map((day, colIndex) => {
                  if (!day) return <td key={colIndex} className="p-0.5" />;
                  const currentStr = getDateStr(new Date(year, month, day));
                  const isSelected = nextDate === currentStr;
                  const isToday = todayStr === currentStr;
                  
                  return (
                    <td key={colIndex} className="p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNextDate(currentStr);
                          setShowCalendar(false);
                        }}
                        className={`w-full h-8 flex items-center justify-center rounded-lg transition-all ${
                          isSelected 
                          ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200' 
                          : isToday
                          ? 'bg-orange-100 text-orange-700 font-bold border border-orange-200'
                          : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setNextDate(todayStr);
            setShowCalendar(false);
          }}
          className="w-full mt-3 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          আজকের তারিখ সেট করুন
        </button>
      </div>
    );
  };

  const handleAction = (msg: string, update: boolean = false) => {
    if (update) {
      onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate);
      setAttachedDocs([]);
    }
    setConfirmMsg(msg);
    setShowAd(true);
  };

  const handleAllPartiesUpdate = () => {
    if (caseData.isUpdated) {
      handleAction('ধন্যবাদ, আপনার আগেই তথ্য আপলোড করা হয়েছে। আপনি অন্যত্র চেষ্টা করুন।', false);
      return;
    }
    onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate);
    setAttachedDocs([]);
    handleAction('সকল পক্ষের ক্যালেন্ডারে তথ্য আপডেট করা হয়েছে।', true);
  };

  const onAdClose = () => {
    setShowAd(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const doc = new jsPDF();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onload = (event) => {
          const imgData = event.target?.result as string;
          if (i > 0) doc.addPage();
          doc.addImage(imgData, 'JPEG', 10, 10, 180, 250);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    const pdfBlob = doc.output('blob');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${caseData.caseNumber}_${Date.now()}.pdf`;
    const path = `${caseData.caseNumber}/${dateStr}/${fileName}`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    await uploadFile('documents', path, file);
    const url = await getPublicUrl('documents', path);
    
    onAddDocument(caseData.id, { name: fileName, type: 'pdf', url });
    alert('PDF আপলোড হয়েছে: ' + url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {showAd && <AdBanner />}
      
      {showConfirm && (
        <div className="fixed top-4 right-4 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">{confirmMsg}</span>
        </div>
      )}

      <div className="p-6">
        {caseData.hasConflictWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold">
            <ShieldAlert size={18} className="text-amber-600 shrink-0" />
            <p>⚠️ এই মামলায় তথ্যের অসঙ্গতি সংক্রান্ত ওয়ার্নিং কমপ্লেইন রয়েছে। তথ্য ভুল থাকলে সংশোধন করুন (ভুল সংশোধন করলে ২টি হলুদ বল জরিমানা প্রদেয়)।</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${caseData.caseType === 'Civil' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  onClick={() => onCaseNumberClick?.(caseData.caseNumber)}
                  className="text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  {caseData.caseNumber}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${caseData.caseType === 'Civil' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                  {caseData.caseType}
                </span>
              </div>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" />
                {formatCourtNameWithNo(caseData.courtName, caseData.courtNumber)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSyncingWallet}
              onClick={handleSyncToWallet}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="মামলার তথ্য নিজ ওয়ালেটে/স্ক্রিনে যুক্ত করুন (১টি হলুদ বল)"
            >
              {isSyncingWallet ? <Loader2 className="animate-spin" size={14} /> : <Coins size={14} className="text-amber-500" />}
              <span>স্ক্রিনে যুক্ত করুন (১টি 🟡)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComplaintModal(true)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="তারিখ বা পদক্ষেপ ভিন্ন হলে ওয়ার্নিং কমপ্লেইন করুন"
            >
              <AlertTriangle size={14} className="text-rose-500" />
              <span>ওয়ার্নিং কমপ্লেইন</span>
            </button>

            {onDelete && (
              <button 
                onClick={() => onDelete(caseData.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="মামলা মুছুন"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                গত তারিখ <span className="opacity-70">(Last Date)</span>
              </p>
              <p className="text-sm font-bold text-slate-500">{caseData.lastDate || 'N/A'}</p>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                আগামী তারিখ <span className="opacity-70">(Next Date)</span>
              </p>
              <p className="text-sm font-bold text-indigo-600">{caseData.nextDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">বাদী/আবেদনকারী (Petitioner)</p>
                  <p className="font-bold text-slate-800">{caseData.petitioner}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-300">VS</span>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">বিবাদী/আসামী (Respondent)</p>
                  <p className="font-bold text-slate-800">{caseData.respondent}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-rose-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">পদক্ষেপ (Step/Action)</p>
                <p className="text-sm font-bold text-slate-700">{caseData.order || caseData.status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">আসামী সংখ্যা (Total Respondents)</p>
                <p className="text-sm font-bold text-slate-700">{caseData.totalRespondents || '১'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    ⚖️ আইনজীবী ও মুহুরি (Lawyer & Clerk)
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenLawyerModal}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm border border-indigo-100/80"
                  >
                    <UserPlus size={14} className="text-indigo-600" />
                    <span>+ নতুন উকিল/মুহুরি যুক্ত করুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Lawyer Box */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">আইনজীবী (Lawyer)</p>
                      {currentLawyerMobile && (
                        <a href={`tel:${currentLawyerMobile}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-bold">
                          <Smartphone size={12} /> {currentLawyerMobile}
                        </a>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {currentLawyerName || 'নির্ধারিত নেই'}
                    </p>
                  </div>

                  {/* Clerk Box */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">মুহুরি (Clerk)</p>
                      {currentClerkMobile && (
                        <a href={`tel:${currentClerkMobile}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-bold">
                          <Smartphone size={12} /> {currentClerkMobile}
                        </a>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {currentClerkName || 'নির্ধারিত নেই'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {userType === 'client' ? (
            <div className="space-y-6">
              <div className="p-5 bg-indigo-50/70 border border-indigo-100/50 rounded-3xl space-y-4">
                <h4 className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={14} /> মামলার অগ্রগতি (Case Health & Summary)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase">স্ট্যাটাস (Status)</p>
                    <p className="text-sm font-black text-emerald-600 capitalize">{caseData.status}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase">পরবর্তী পদক্ষেপ (Next Step)</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{caseData.order || caseData.status || 'হাজিরা (Hearing)'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase">গত শুনানির তারিখ (Last Date)</p>
                    <p className="text-sm font-bold text-slate-600">{caseData.lastDate || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-indigo-100/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase">পরবর্তী শুনানির তারিখ (Next Date)</p>
                    <p className="text-sm font-black text-indigo-600">{caseData.nextDate || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={16} className="text-slate-500" /> মামলা সম্পর্কিত ডকুমেন্ট (Case Documents)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowScannerModal(true)}
                      className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-200"
                    >
                      <Camera size={13} />
                      <span>ক্যামেরা স্ক্যান</span>
                    </button>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {(() => {
                        const caseDocs = caseData.documents || [];
                        const historyDocs = caseData.history?.reduce<any[]>((acc, entry) => {
                          if (entry.documents) acc.push(...entry.documents);
                          return acc;
                        }, []) || [];
                        const uniqueUrls = new Set([...caseDocs.map(d => d.url), ...historyDocs.map(d => d.url)]);
                        return uniqueUrls.size;
                      })()} Files
                    </span>
                  </div>
                </div>
                {(() => {
                  const caseDocs = caseData.documents || [];
                  const historyDocs = caseData.history?.reduce<{name: string, type: string, url: string}[]>((acc, entry) => {
                    if (entry.documents && entry.documents.length > 0) {
                      entry.documents.forEach(doc => {
                        if (!acc.some(d => d.url === doc.url)) {
                          acc.push({ name: doc.name, type: doc.type || 'application/pdf', url: doc.url });
                        }
                      });
                    }
                    return acc;
                  }, []) || [];
                  
                  const allDocsDict: { [url: string]: { name: string, type: string, url: string } } = {};
                  caseDocs.forEach(d => { allDocsDict[d.url] = d; });
                  historyDocs.forEach(d => { allDocsDict[d.url] = d; });
                  const allCaseDocs = Object.values(allDocsDict);

                  if (allCaseDocs.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-300" />
                        <p className="text-sm font-bold text-slate-500">কোনো ফাইল সংযুক্ত নেই</p>
                        <p className="text-[10px] text-slate-400">আপনার আইনজীবী এই মামলার সাথে যুক্ত করলে এখানে দেখতে পাবেন।</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                      {allCaseDocs.map((doc, idx) => (
                        <a 
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-all shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[140px]" title={doc.name}>{doc.name}</p>
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">দেখা ও ডাউনলোড</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">গত তারিখ (Last Date)</p>
                    <input 
                      type="date"
                      value={lastDate}
                      onChange={(e) => setLastDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">আগামী তারিখ (Next Date)</p>
                    <div className="relative">
                      <input 
                        type="text"
                        value={nextDate}
                        readOnly
                        onClick={() => setShowCalendar(true)}
                        placeholder="YYYY-MM-DD"
                        className="w-full pl-4 pr-10 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar); }}
                        className="absolute right-3 top-3.5 text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50 p-1 rounded-lg"
                      >
                        <Calendar size={18} />
                      </button>
                      {showCalendar && (
                        <div className="absolute z-[60] mt-2 top-full right-0">
                          {renderCalendarTable()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">আপনার পক্ষ (Your Party)</p>
                    <select 
                      value={side}
                      onChange={(e) => setSide(e.target.value as any)}
                      className={`w-full px-4 py-3 border rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                        side === 'petitioner' 
                          ? 'bg-sky-50 text-sky-700 border-sky-100 focus:ring-sky-500' 
                          : 'bg-red-50 text-red-700 border-red-100 focus:ring-red-500'
                      }`}
                    >
                      <option value="petitioner" className="text-sky-700">বাদী পক্ষ (Petitioner - Sky)</option>
                      <option value="respondent" className="text-red-700">বিবাদী পক্ষ (Respondent - Red)</option>
                      <option value="accused" className="text-red-700">আসামি পক্ষ (Accused - Red)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">পদক্ষেপ / আদেশ (Step / Order)</p>
                  <textarea 
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="হাজিরা, সময়, স্বাক্ষী, জেরা অথবা আজকের আদেশ লিখুন..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24 mb-3"
                  />
                  
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 ml-1">সংযুক্ত ডকুমেন্ট (Attached Documents)</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {attachedDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600">
                          <FileText size={14} />
                          <span className="truncate max-w-[100px]">{doc.name}</span>
                          <button type="button" onClick={() => setAttachedDocs(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                             <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input 
                      type="file" 
                      id="update-doc-upload"
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        try {
                          const dateStr = new Date().toISOString().split('T')[0];
                          const path = `${caseData.caseNumber}/${dateStr}/updates/${Date.now()}_${file.name}`;
                          await uploadFile('documents', path, file);
                          const url = await getPublicUrl('documents', path);
                          setAttachedDocs(prev => [...prev, { name: file.name, type: file.type, url }]);
                        } catch (err) {
                          console.error("Upload failed", err);
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        type="button"
                        disabled={isUploading}
                        onClick={() => document.getElementById('update-doc-upload')?.click()}
                        className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                      >
                        {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Paperclip size={14} />}
                        ডকুমেন্ট ফাইল
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowScannerModal(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-sm shadow-indigo-100"
                      >
                        <Camera size={14} />
                        ক্যামেরা দিয়ে স্ক্যান
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => handleAction('আপনার তথ্য সফলভাবে আপডেট হয়েছে।', true)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    আপডেট করুন
                  </button>
                  <button 
                    onClick={handleAllPartiesUpdate}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    সকল পক্ষকে জানান
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setShowScannerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200"
            >
              <Camera size={16} />
              মোবাইল ক্যামেরা স্ক্যানার
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
            >
              ছবি থেকে PDF
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
            
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">কল করার অনুমতি:</span>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={clerkCanCall} 
                  onChange={(e) => setClerkCanCall(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">মুহুরি</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={lawyerCanCall} 
                  onChange={(e) => setLawyerCanCall(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">আইনজীবী</span>
              </label>

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={visibility === 'public'} 
                  onChange={(e) => setVisibility(e.target.checked ? 'public' : 'private')}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">পাবলিক ভিউ</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCall && (
              <a 
                href={`tel:${caseData.petitionerMobile}`}
                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                title="কল করুন"
              >
                <Smartphone size={20} />
              </a>
            )}
            <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {showComplaintModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                ওয়ার্নিং কমপ্লেইন জমা দিন
              </h3>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              একই মামলার তারিখ বা পদক্ষেপ অন্য পক্ষ ভুল দিলে আপনি ওয়ার্নিং কমপ্লেইন জমা দিতে পারেন। অপর পক্ষ তথ্য সংশোধন করলে তার ব্যালেন্স থেকে <b>২ টি হলুদ বল জরিমানা</b> কাটা হবে।
            </p>

            <form onSubmit={handleSubmitComplaint} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">অসংগতিপূর্ণ তারিখ (Conflicting Date)</label>
                <input 
                  type="text" 
                  value={conflictDateInput} 
                  onChange={(e) => setConflictDateInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">অসংগতিপূর্ণ পদক্ষেপ/আদেশ (Conflicting Step)</label>
                <input 
                  type="text" 
                  value={conflictStepInput} 
                  onChange={(e) => setConflictStepInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  placeholder="যেমন: হাজিরা / জেরা / সমন"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">অভিযোগের তথ্য / বিবরণ</label>
                <textarea 
                  value={complaintNote} 
                  onChange={(e) => setComplaintNote(e.target.value)}
                  required
                  placeholder="কেন এটি ভুল তারিখ বা পদক্ষেপ তা বিস্তারিত লিখুন..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowComplaintModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingComplaint}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-200 flex justify-center items-center gap-2"
                >
                  {isSubmittingComplaint && <Loader2 className="animate-spin" size={14} />}
                  কমপ্লেইন পাঠাল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLawyerModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="text-indigo-600" size={20} />
                নতুন উকিল / মুহুরি যোগ করুন
              </h3>
              <button onClick={() => setShowLawyerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLawyerClerk} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">পক্ষ নির্বাচন করুন (Select Side)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSide('petitioner');
                      setLawyerNameInput(caseData.petitionerLawyer || '');
                      setLawyerMobileInput(formatMobile(caseData.petitionerLawyerMobile));
                      setClerkNameInput(caseData.petitionerClerk || '');
                      setClerkMobileInput(formatMobile(caseData.petitionerClerkMobile));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      targetSide === 'petitioner'
                        ? 'bg-sky-50 text-sky-700 border-sky-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    বাদী পক্ষ (Petitioner)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSide('respondent');
                      setLawyerNameInput(caseData.respondentLawyer || '');
                      setLawyerMobileInput(formatMobile(caseData.respondentLawyerMobile));
                      setClerkNameInput(caseData.respondentClerk || '');
                      setClerkMobileInput(formatMobile(caseData.respondentClerkMobile));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      targetSide === 'respondent'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    বিবাদী/আসামী পক্ষ (Respondent)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">উকিলের নাম (Lawyer Name)</label>
                <input 
                  type="text" 
                  value={lawyerNameInput} 
                  onChange={(e) => setLawyerNameInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="যেমন: অ্যাডভোকেট কায়সার আহমেদ"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">উকিলের মোবাইল নম্বর (Lawyer Mobile)</label>
                <input 
                  type="tel" 
                  value={lawyerMobileInput} 
                  onChange={(e) => setLawyerMobileInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="যেমন: 01711000000"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">মুহুরির নাম (Clerk Name)</label>
                <input 
                  type="text" 
                  value={clerkNameInput} 
                  onChange={(e) => setClerkNameInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="যেমন: আব্দুর রহিম"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">মুহুরির মোবাইল নম্বর (Clerk Mobile)</label>
                <input 
                  type="tel" 
                  value={clerkMobileInput} 
                  onChange={(e) => setClerkMobileInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="যেমন: 01811000000"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowLawyerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingLawyerClerk}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 flex justify-center items-center gap-2"
                >
                  {isSavingLawyerClerk && <Loader2 className="animate-spin" size={14} />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DocumentScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        caseNumber={caseData.caseNumber}
        onDocumentScanned={(doc) => {
          onAddDocument(caseData.id, doc);
          setConfirmMsg('নথি সফলভাবে স্ক্যান করে মামলায় যুক্ত করা হয়েছে!');
          setShowConfirm(true);
          setTimeout(() => setShowConfirm(false), 3500);
        }}
        language="bn"
      />
    </div>
  );
};
