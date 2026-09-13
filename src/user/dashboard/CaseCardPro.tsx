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
  UserPlus,
  Phone,
  Briefcase
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Case, ChamberAssociate } from '../../types';
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
  language?: 'bn' | 'en' | 'hi' | 'ur';
  chamberAssociates?: ChamberAssociate[];
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
  userMobile,
  language = 'bn',
  chamberAssociates = []
}: CaseCardProProps) => {
  const [side, setSide] = useState<'petitioner' | 'respondent' | 'accused'>(caseData.selectedParty || 'petitioner');
  const [nextDate, setNextDate] = useState(caseData.nextDate);
  const [lastDate, setLastDate] = useState(caseData.lastDate || '');
  const [order, setOrder] = useState(caseData.order || '');
  const standardSteps = ["হাজিরা", "সময় পিটিশন", "নথি তলব", "দরখাস্ত পেশ", "শুনানী", "স্বাক্ষী", "জেরা", "জবাব দাখিল", "অন্যান্য"];
  const initialStep = caseData.status && standardSteps.includes(caseData.status) ? caseData.status : 'হাজিরা';
  const [step, setStep] = useState(initialStep);
  const [customStep, setCustomStep] = useState(caseData.status && !standardSteps.includes(caseData.status) ? caseData.status : '');
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

  // Associate States
  const [assignedAssociateInput, setAssignedAssociateInput] = useState(caseData.assignedAssociateName || '');
  const [assignedAssociateMobileInput, setAssignedAssociateMobileInput] = useState(caseData.assignedAssociateMobile || '');
  const [assignedAssociateRoleInput, setAssignedAssociateRoleInput] = useState(caseData.assignedAssociateRole || '');
  const [showAssignAssociateModal, setShowAssignAssociateModal] = useState(false);

  // Document Scanner State
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Yellow Ball & Warning Complaint States
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintNote, setComplaintNote] = useState('');
  const [conflictDateInput, setConflictDateInput] = useState(caseData.nextDate || '');
  const [conflictStepInput, setConflictStepInput] = useState(caseData.order || caseData.status || '');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [showCardRespondentDropdown, setShowCardRespondentDropdown] = useState(false);
  const [showAddRespondentInput, setShowAddRespondentInput] = useState(false);
  const [newRespondentName, setNewRespondentName] = useState('');
  const [newRespondentPhone, setNewRespondentPhone] = useState('');
  const [newRespondentSerial, setNewRespondentSerial] = useState('');

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
      assignedAssociateName: assignedAssociateInput,
      assignedAssociateMobile: assignedAssociateMobileInput,
      assignedAssociateRole: assignedAssociateRoleInput,
    } : {
      respondentLawyer: lawyerNameInput,
      respondentLawyerMobile: lawyerMobileInput,
      respondentClerk: clerkNameInput,
      respondentClerkMobile: clerkMobileInput,
      assignedAssociateName: assignedAssociateInput,
      assignedAssociateMobile: assignedAssociateMobileInput,
      assignedAssociateRole: assignedAssociateRoleInput,
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
    caseData.assignedAssociateName = assignedAssociateInput;
    caseData.assignedAssociateMobile = assignedAssociateMobileInput;
    caseData.assignedAssociateRole = assignedAssociateRoleInput;

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
                          if (caseData.nextDate && caseData.nextDate !== currentStr && !lastDate) {
                            setLastDate(caseData.nextDate);
                          }
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
            if (caseData.nextDate && caseData.nextDate !== todayStr && !lastDate) {
              setLastDate(caseData.nextDate);
            }
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
      const finalStep = step === 'অন্যান্য' ? (customStep || 'অন্যান্য') : step;
      const computedLastDate = lastDate || (caseData.nextDate && caseData.nextDate !== nextDate ? caseData.nextDate : caseData.lastDate);
      onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, computedLastDate, { status: finalStep });
      setAttachedDocs([]);
    }
    setConfirmMsg(msg);
    setShowConfirm(true);
    setShowAd(true);
    setTimeout(() => {
      setShowConfirm(false);
      setShowAd(false);
    }, 4000);
  };

  const handleAllPartiesUpdate = () => {
    if (caseData.isUpdated) {
      handleAction('ধন্যবাদ, আপনার আগেই তথ্য আপলোড করা হয়েছে। আপনি অন্যত্র চেষ্টা করুন।', false);
      return;
    }
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(caseData.caseNumber);
                    setConfirmMsg('মামলা নম্বর কপি করা হয়েছে!');
                    setShowConfirm(true);
                    setTimeout(() => setShowConfirm(false), 2500);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="মামলা নম্বর কপি করুন"
                >
                  <Copy size={15} />
                </button>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">বাদী/আবেদনকারী (Petitioner)</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {caseData.petitionerMobile && (
                      <a 
                        href={`tel:${caseData.petitionerMobile}`} 
                        className="w-7 h-7 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] hover:brightness-105 flex items-center justify-center border-2 border-slate-300 shadow-[0_3px_8px_rgba(34,197,94,0.4)] relative overflow-hidden active:scale-95 transition-all group shrink-0" 
                        title="কল করুন"
                      >
                        {/* Glossy Overlay */}
                        <div className="absolute top-0 inset-x-0 h-[40%] bg-white/35 rounded-t-full pointer-events-none" />
                        <Phone size={11} className="text-white fill-white relative z-10" />
                      </a>
                    )}
                    <p className="font-bold text-slate-800">{caseData.petitioner}</p>
                    {caseData.petitionerMobile && (
                      <div className="flex items-center gap-1.5 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                        <span className="text-[11px] text-slate-600 font-medium font-sans">{caseData.petitionerMobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-slate-300 self-center">VS</span>
              <div className="flex items-center gap-3 text-right justify-end">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">বিবাদী/আসামী (Respondent)</p>
                  <div className="flex flex-wrap items-center justify-end gap-2 mt-1">
                    {caseData.respondentMobile && (
                      <a 
                        href={`tel:${caseData.respondentMobile}`} 
                        className="w-7 h-7 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] hover:brightness-105 flex items-center justify-center border-2 border-slate-300 shadow-[0_3px_8px_rgba(34,197,94,0.4)] relative overflow-hidden active:scale-95 transition-all group shrink-0" 
                        title="কল করুন"
                      >
                        {/* Glossy Overlay */}
                        <div className="absolute top-0 inset-x-0 h-[40%] bg-white/35 rounded-t-full pointer-events-none" />
                        <Phone size={11} className="text-white fill-white relative z-10" />
                      </a>
                    )}
                    <p className="font-bold text-slate-800">
                      {caseData.respondentDetails && caseData.respondentDetails.length > 0 ? (
                        `${caseData.respondentDetails[0].name}${caseData.respondentDetails.length > 1 ? ' গং' : ''}`
                      ) : (
                        caseData.respondent ? (
                          caseData.respondent.split(',').map(s => s.trim()).filter(Boolean).length > 1 ? 
                            `${caseData.respondent.split(',')[0].trim()} গং` : caseData.respondent
                        ) : ''
                      )}
                    </p>
                    {caseData.respondentMobile && (
                      <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        <span className="text-[11px] text-slate-600 font-medium font-sans">{caseData.respondentMobile}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-rose-600" />
                </div>
              </div>
            </div>

            {/* Respondent List & Assignment */}
            {(() => {
              const respondentsList = caseData.respondentDetails && caseData.respondentDetails.length > 0 
                ? caseData.respondentDetails 
                : (caseData.respondent ? caseData.respondent.split(',').map((name, i) => ({
                    name: name.trim(),
                    phone: i === 0 ? (caseData.respondentMobile || '') : '',
                    serial: i + 1,
                    addedByName: '',
                    addedByRole: '',
                    addedByMobile: ''
                  })).filter(r => r.name) : []);

              return (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      👥 {language === 'bn' ? 'বিবাদী/আসামী তালিকা ও দায়িত্বপ্রাপ্ত' : 'Defendants & Assigned Users'}
                      <button 
                        onClick={() => setShowAddRespondentInput(prev => !prev)}
                        className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shrink-0"
                        title={language === 'bn' ? 'নতুন আসামী যুক্ত করুন' : 'Add New Defendant'}
                      >
                        +
                      </button>
                    </p>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                      {respondentsList.length} {language === 'bn' ? 'জন আসামী' : 'Defendants'}
                    </span>
                  </div>

                  {showAddRespondentInput && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-600 uppercase">নতুন আসামী যুক্ত করুন</span>
                        <span className="text-[10px] text-slate-400 font-medium">ক্রমিক অনুযায়ী সেট হবে</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">আসামী ক্রমিক নং</label>
                          <input 
                            type="text"
                            placeholder="যেমন: ১, ৩, ৫, ১৩"
                            value={newRespondentSerial}
                            onChange={(e) => setNewRespondentSerial(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">আসামীর নাম *</label>
                          <input 
                            type="text"
                            placeholder="আসামীর নাম লিখুন"
                            value={newRespondentName}
                            onChange={(e) => setNewRespondentName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">মোবাইল নম্বর (ঐচ্ছিক)</label>
                          <input 
                            type="text"
                            placeholder="০১XXXXXXXXX"
                            value={newRespondentPhone}
                            onChange={(e) => setNewRespondentPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button 
                          onClick={() => {
                            setShowAddRespondentInput(false);
                            setNewRespondentName('');
                            setNewRespondentPhone('');
                            setNewRespondentSerial('');
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          বাতিল
                        </button>
                        <button 
                          onClick={() => {
                            if (!newRespondentName.trim()) return;
                            const updatedList = [...respondentsList];
                            const serialVal = newRespondentSerial.trim() !== '' 
                              ? newRespondentSerial.trim() 
                              : String(updatedList.length + 1);

                            updatedList.push({
                              name: newRespondentName.trim(),
                              phone: newRespondentPhone.trim(),
                              serial: serialVal,
                              addedByMobile: userMobile,
                              addedByName: userType === 'lawyer' ? 'Lawyer' : 'Clerk',
                              addedByRole: userType
                            });

                            const updatedRespondentString = updatedList.map(d => d.name).filter(Boolean).join(', ');
                            const updatedRespondentMobile = updatedList[0]?.phone || '';

                            onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate, {
                              respondentDetails: updatedList,
                              respondent: updatedRespondentString,
                              respondentMobile: updatedRespondentMobile
                            });

                            setNewRespondentName('');
                            setNewRespondentPhone('');
                            setNewRespondentSerial('');
                            setShowAddRespondentInput(false);
                          }}
                          className="px-3 py-1 text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-all shadow-sm"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {respondentsList.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {respondentsList.map((resp, index) => {
                        const normalizeMobileNum = (num?: string) => {
                          if (!num) return '';
                          let cleaned = num.trim().replace(/[^\d]/g, '');
                          if (cleaned.startsWith('880')) cleaned = cleaned.substring(2);
                          else if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
                          return cleaned;
                        };
                        const userNorm = normalizeMobileNum(userMobile);
                        const respAddedNorm = normalizeMobileNum(resp.addedByMobile);
                        const isAssignedToMe = userNorm && respAddedNorm && userNorm === respAddedNorm;
                        
                        const serialNumber = resp.serial !== undefined && resp.serial !== null && String(resp.serial).trim() !== ''
                          ? String(resp.serial).trim()
                          : String(index + 1);
                        
                        return (
                          <div key={index} className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${isAssignedToMe ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span 
                                className={`min-w-7 px-1.5 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 shadow-xs ${
                                  isAssignedToMe ? 'bg-indigo-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}
                                title={`${serialNumber} নং আসামী`}
                              >
                                {serialNumber}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 shrink-0">
                                    {serialNumber} নং আসামী:
                                  </span>
                                  <span className="truncate">{resp.name}</span>
                                  {isAssignedToMe && (
                                    <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                      {language === 'bn' ? 'আমার দায়িত্বে' : 'My Responsibility'}
                                    </span>
                                  )}
                                </p>
                                {resp.phone && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-slate-500 font-medium font-sans">📱 {resp.phone}</span>
                                    <a 
                                      href={`tel:${resp.phone}`} 
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                      title="কল করুন"
                                    >
                                      <Smartphone size={12} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
                              <div className="text-left sm:text-right">
                                {resp.addedByName ? (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1 sm:justify-end">
                                      ⚖️ {resp.addedByName}
                                    </p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">
                                      {resp.addedByRole === 'lawyer' 
                                        ? (language === 'bn' ? 'আইনজীবী' : 'Lawyer') 
                                        : resp.addedByRole === 'clerk' 
                                        ? (language === 'bn' ? 'মুহুরি' : 'Clerk') 
                                        : (language === 'bn' ? 'ইউজার' : 'User')}
                                      {resp.addedByMobile && ` • ${resp.addedByMobile}`}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic">
                                    {language === 'bn' ? 'কোনো নির্দিষ্ট দায়িত্বপ্রাপ্ত নেই' : 'No specific assignment'}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const updatedList = respondentsList.filter((_, idx) => idx !== index);
                                  const updatedRespondentString = updatedList.map(d => d.name).filter(Boolean).join(', ');
                                  const updatedRespondentMobile = updatedList[0]?.phone || '';
                                  onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate, {
                                    respondentDetails: updatedList,
                                    respondent: updatedRespondentString,
                                    respondentMobile: updatedRespondentMobile
                                  });
                                }}
                                className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                                title="এই আসামী মুছুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400">
                      কোনো আসামী তালিকাভুক্ত নেই। উপরে (+) এ ক্লিক করে আসামী যুক্ত করুন।
                    </div>
                  )}
                </div>
              );
            })()}

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
                    ⚖️ চেম্বার টিম, আইনজীবী ও মুহুরি
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAssignAssociateModal(true)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-amber-200"
                    >
                      <Briefcase size={13} className="text-amber-600" />
                      <span>{caseData.assignedAssociateName ? 'অ্যাসোসিয়েট পরিবর্তন' : '+ অ্যাসোসিয়েট অর্পণ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenLawyerModal}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-indigo-100/80"
                    >
                      <UserPlus size={14} className="text-indigo-600" />
                      <span>+ উকিল/মুহুরি</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {currentLawyerName || 'নির্ধারিত নেই'}
                    </p>
                  </div>

                  {/* Assigned Associate Box */}
                  <div className={`p-2.5 rounded-xl border shadow-2xs ${caseData.assignedAssociateName ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-1">
                        <Briefcase size={11} className="text-amber-600" /> দায়িত্বপ্রাপ্ত অ্যাসোসিয়েট
                      </p>
                      {caseData.assignedAssociateMobile && !caseData.assignedAssociateMobile.includes(',') && (
                        <a href={`tel:${caseData.assignedAssociateMobile}`} className="text-amber-700 hover:text-amber-900 flex items-center gap-1 text-[10px] font-bold">
                          <Smartphone size={12} /> {caseData.assignedAssociateMobile}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const assignedAssoc = chamberAssociates.find(a => a.id === caseData.assignedAssociateId || (a.name === caseData.assignedAssociateName && a.mobile === caseData.assignedAssociateMobile));
                        if (assignedAssoc?.photoURL) {
                          return (
                            <img src={assignedAssoc.photoURL} alt={caseData.assignedAssociateName} className="w-6 h-6 rounded-full object-cover border border-amber-200 shadow-xs shrink-0" />
                          );
                        } else if (caseData.assignedAssociateName) {
                          return (
                            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center border border-amber-200 shrink-0 font-mono">
                              {caseData.assignedAssociateName.charAt(0)}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {caseData.assignedAssociateName || 'চেম্বার প্রধানের দায়িত্বে'}
                        </p>
                        {caseData.assignedAssociateRole && (
                          <p className="text-[9px] text-amber-700 font-semibold truncate mt-0.5">
                            {caseData.assignedAssociateRole}
                          </p>
                        )}
                      </div>
                    </div>
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
                    <p className="text-xs font-bold text-slate-800 truncate">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">পদক্ষেপ (Step)</p>
                      <select 
                        value={step}
                        onChange={(e) => setStep(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                      >
                        <option value="হাজিরা">হাজিরা (Attendance)</option>
                        <option value="সময় পিটিশন">সময় পিটিশন (Time Petition)</option>
                        <option value="নথি তলব">নথি তলব (Requisition of Files)</option>
                        <option value="দরখাস্ত পেশ">দরখাস্ত পেশ (Submit Application)</option>
                        <option value="শুনানী">শুনানী (Hearing)</option>
                        <option value="স্বাক্ষী">স্বাক্ষী (Witness)</option>
                        <option value="জেরা">জেরা (Cross Examination)</option>
                        <option value="জবাব দাখিল">জবাব দাখিল (Submission of Reply)</option>
                        <option value="অন্যান্য">অন্যান্য (Others)</option>
                      </select>
                      
                      {step === 'অন্যান্য' && (
                        <input 
                          type="text"
                          value={customStep}
                          onChange={(e) => setCustomStep(e.target.value)}
                          placeholder="পদক্ষেপের নাম লিখুন..."
                          className="w-full mt-2 px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm animate-in slide-in-from-top-1 duration-200"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">আদেশ (Order)</p>
                      <textarea 
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        placeholder="আজকের আদেশ বা প্রয়োজনীয় বিবরণ লিখুন..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-12 md:h-24"
                      />
                    </div>
                  </div>

                  {step === 'নথি তলব' && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-medium text-indigo-700 space-y-1 animate-in fade-in duration-300 mb-4">
                      <p className="font-bold flex items-center gap-1">
                        <span>ℹ️</span> নথি তলব করার আদেশ দেওয়া হয়েছে
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        পূর্বের আগামী তারিখ <span className="font-bold text-indigo-600 font-sans">{caseData.nextDate || 'নির্ধারিত নয়'}</span> বহাল রাখা হয়েছে। নতুন তারিখ ধার্য করা হলে উপরে আগামী তারিখের ঘরে তা পরিবর্তন করে দিতে পারেন।
                      </p>
                    </div>
                  )}
                  
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
              <div className="flex items-center gap-2 relative">
                {caseData.petitionerMobile && (
                  <a 
                    href={`tel:${caseData.petitionerMobile}`}
                    className="p-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
                    title={`বাদী কল করুন: ${caseData.petitioner}`}
                  >
                    <Smartphone size={16} />
                    <span>বাদী</span>
                  </a>
                )}
                
                {(() => {
                  const respondentsToShow: Array<{ name: string; phone?: string; serial?: number | string }> = caseData.respondentDetails && caseData.respondentDetails.length > 0 
                    ? caseData.respondentDetails 
                    : (caseData.respondentMobile ? [{ name: caseData.respondent || '', phone: caseData.respondentMobile, serial: 1 }] : []);
                  const withPhones = respondentsToShow.filter((r): r is { name: string; phone: string; serial?: number | string } => Boolean(r.phone));
                  
                  if (withPhones.length === 0) return null;
                  if (withPhones.length === 1) {
                    return (
                      <a 
                        href={`tel:${withPhones[0].phone}`}
                        className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
                        title={`বিবাদী কল করুন: ${withPhones[0].name}`}
                      >
                        <Smartphone size={16} />
                        <span>বিবাদী</span>
                      </a>
                    );
                  }
                  
                  return (
                    <div className="relative inline-block">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCardRespondentDropdown(prev => !prev);
                        }}
                        className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs"
                        title="বিবাদী তালিকা"
                      >
                        <Smartphone size={16} />
                        <span>বিবাদী ({withPhones.length})</span>
                      </button>
                      
                      {showCardRespondentDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-[140]" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCardRespondentDropdown(false);
                            }}
                          />
                          <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-[150] p-3 text-left">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-100">
                              বিবাদী/আসামী তালিকা
                            </div>
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                              {withPhones.map((resp, rIdx) => {
                                const respSerial = resp.serial !== undefined && resp.serial !== null && String(resp.serial).trim() !== ''
                                  ? String(resp.serial).trim()
                                  : String(rIdx + 1);
                                return (
                                  <a 
                                    key={rIdx} 
                                    href={`tel:${resp.phone}`}
                                    onClick={() => setShowCardRespondentDropdown(false)}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-rose-50/50 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <span className="min-w-5 px-1 h-5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {respSerial}
                                      </span>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-rose-600 transition-colors truncate">
                                          {resp.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-sans font-medium">
                                          {resp.phone}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                      <Smartphone size={12} />
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            <button 
              onClick={() => {
                const textToShare = `মামলা নং: ${caseData.caseNumber}\nআদালত: ${formatCourtNameWithNo(caseData.courtName, caseData.courtNumber)}\nপরবর্তী তারিখ: ${caseData.nextDate || 'N/A'}\nআদেশ/পদক্ষেপ: ${caseData.order || caseData.status || 'N/A'}`;
                if (navigator.share) {
                  navigator.share({
                    title: `মামলার তথ্য: ${caseData.caseNumber}`,
                    text: textToShare,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(textToShare);
                  setConfirmMsg('মামলার বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!');
                  setShowConfirm(true);
                  setTimeout(() => setShowConfirm(false), 3000);
                }
              }}
              className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              title="মামলার বিবরণ শেয়ার / কপি করুন"
            >
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

              {/* Chamber Associate Section in Modal */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-amber-900 block mb-1 flex items-center gap-1">
                  <Briefcase size={13} className="text-amber-600" /> চেম্বারের দায়িত্বপ্রাপ্ত অ্যাসোসিয়েট (Assigned Associate)
                </label>
                {chamberAssociates && chamberAssociates.length > 0 && (
                  <select
                    value={assignedAssociateInput}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (!selectedVal) {
                        setAssignedAssociateInput('');
                        setAssignedAssociateMobileInput('');
                        setAssignedAssociateRoleInput('');
                      } else {
                        const found = chamberAssociates.find(a => a.name === selectedVal);
                        if (found) {
                          setAssignedAssociateInput(found.name);
                          setAssignedAssociateMobileInput(found.mobile);
                          setAssignedAssociateRoleInput(found.role || 'Associate');
                        } else {
                          setAssignedAssociateInput(selectedVal);
                        }
                      }
                    }}
                    className="w-full p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 mb-2"
                  >
                    <option value="">-- চেম্বার প্রধানের প্রত্যক্ষ দায়িত্বে (Lead) --</option>
                    {chamberAssociates.map(a => (
                      <option key={a.id} value={a.name}>{a.name} ({a.role || 'Associate'}) - {a.mobile}</option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    value={assignedAssociateInput} 
                    onChange={(e) => setAssignedAssociateInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="অ্যাসোসিয়েটের নাম"
                  />
                  <input 
                    type="tel" 
                    value={assignedAssociateMobileInput} 
                    onChange={(e) => setAssignedAssociateMobileInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="মোবাইল নম্বর"
                  />
                </div>
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

      {/* Quick Assign Associate Modal */}
      {showAssignAssociateModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Briefcase className="text-amber-600" size={18} />
                <span>মামলার দায়িত্ব অর্পণ (Assign Case)</span>
              </h3>
              <button onClick={() => setShowAssignAssociateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              মামলা নম্বর: <span className="font-bold text-slate-800">{caseData.caseNumber}</span>
              <br />
              কোন সহযোগী বা জুনিয়র আইনজীবীকে এই মামলার দায়িত্ব দিতে চান নির্বাচন করুন:
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {/* Option: Lead Advocate */}
              <button
                type="button"
                onClick={() => {
                  const extraData: Partial<Case> = {
                    assignedAssociateId: '',
                    assignedAssociateName: '',
                    assignedAssociateMobile: '',
                    assignedAssociateRole: '',
                  };
                  caseData.assignedAssociateId = '';
                  caseData.assignedAssociateName = '';
                  caseData.assignedAssociateMobile = '';
                  caseData.assignedAssociateRole = '';
                  setAssignedAssociateInput('');
                  setAssignedAssociateMobileInput('');
                  setAssignedAssociateRoleInput('');
                  onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate, extraData);
                  setShowAssignAssociateModal(false);
                  setConfirmMsg('মামলাটি চেম্বার প্রধানের প্রত্যক্ষ দায়িত্বে রাখা হয়েছে।');
                  setShowConfirm(true);
                  setTimeout(() => setShowConfirm(false), 3000);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  !caseData.assignedAssociateName ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">👑 চেম্বার প্রধান (Lead Advocate)</p>
                  <p className="text-[10px] text-slate-500">প্রধান আইনজীবীর প্রত্যক্ষ তত্ত্বাবধানে</p>
                </div>
                {!caseData.assignedAssociateName && (
                  <CheckCircle2 size={16} className="text-indigo-600" />
                )}
              </button>

              {/* Option: All Chamber Members */}
              {chamberAssociates.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const mobilesList = chamberAssociates.map(a => a.mobile).filter(Boolean).join(', ');
                    const extraData: Partial<Case> = {
                      assignedAssociateId: 'all_associates',
                      assignedAssociateName: 'চেম্বার অ্যাসোসিয়েটস (All Members)',
                      assignedAssociateMobile: mobilesList,
                      assignedAssociateRole: 'Chamber Team',
                    };
                    caseData.assignedAssociateId = 'all_associates';
                    caseData.assignedAssociateName = 'চেম্বার অ্যাসোসিয়েটস (All Members)';
                    caseData.assignedAssociateMobile = mobilesList;
                    caseData.assignedAssociateRole = 'Chamber Team';
                    setAssignedAssociateInput('চেম্বার অ্যাসোসিয়েটস (All Members)');
                    setAssignedAssociateMobileInput(mobilesList);
                    setAssignedAssociateRoleInput('Chamber Team');
                    onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate, extraData);
                    setShowAssignAssociateModal(false);
                    setConfirmMsg('মামলাটিতে চেম্বারের সকল সদস্যকে সফলভাবে যুক্ত করা হয়েছে!');
                    setShowConfirm(true);
                    setTimeout(() => setShowConfirm(false), 3000);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    caseData.assignedAssociateId === 'all_associates' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">👥 চেম্বার অ্যাসোসিয়েটস (All Members)</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">চেম্বারের সকল জুনিয়র ও অ্যাসোসিয়েটকে এক ক্লিকে যুক্ত করুন</p>
                  </div>
                  {caseData.assignedAssociateId === 'all_associates' && (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  )}
                </button>
              )}

              {/* Chamber Associates list */}
              {chamberAssociates.map((assoc) => {
                const isSelected = caseData.assignedAssociateName === assoc.name;
                return (
                  <button
                    key={assoc.id}
                    type="button"
                    onClick={() => {
                      const extraData: Partial<Case> = {
                        assignedAssociateId: assoc.id,
                        assignedAssociateName: assoc.name,
                        assignedAssociateMobile: assoc.mobile,
                        assignedAssociateRole: assoc.role || 'Associate',
                      };
                      caseData.assignedAssociateId = assoc.id;
                      caseData.assignedAssociateName = assoc.name;
                      caseData.assignedAssociateMobile = assoc.mobile;
                      caseData.assignedAssociateRole = assoc.role || 'Associate';
                      setAssignedAssociateInput(assoc.name);
                      setAssignedAssociateMobileInput(assoc.mobile);
                      setAssignedAssociateRoleInput(assoc.role || 'Associate');
                      onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs, lastDate, extraData);
                      setShowAssignAssociateModal(false);
                      setConfirmMsg(`মামলার দায়িত্ব ${assoc.name}-কে দেওয়া হয়েছে!`);
                      setShowConfirm(true);
                      setTimeout(() => setShowConfirm(false), 3000);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{assoc.name}</p>
                      <p className="text-[10px] text-amber-700 font-semibold">{assoc.role || 'Associate'} • {assoc.mobile}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-amber-600" />
                    )}
                  </button>
                );
              })}

              {chamberAssociates.length === 0 && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-center">
                  <p className="text-xs text-amber-800 font-bold">চেম্বারে এখনো কোনো সহযোগী আইনজীবী যোগ করা হয়নি।</p>
                  <p className="text-[10px] text-amber-600 mt-1">ল’ চেম্বার ও অ্যাসোসিয়েট মেন্যু থেকে অ্যাসোসিয়েট যোগ করতে পারবেন।</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAssignAssociateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
