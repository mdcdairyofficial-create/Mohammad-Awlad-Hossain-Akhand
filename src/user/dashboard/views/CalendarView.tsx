import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  FileText,
  CreditCard,
  History,
  Book,
  X,
  ArrowLeft,
  ArrowRight,
  Video,
  Phone,
  PhoneCall,
  Camera,
  Upload,
  CheckCircle,
  RefreshCw,
  Edit2,
  Sparkles,
  Scale,
  User,
  Gavel,
  Users,
  UserCheck,
  Globe,
  Lock,
  ShieldCheck,
  Save,
  Image as ImageIcon,
  Trash2,
  Paperclip,
  Download,
  Eye,
  FileSpreadsheet,
  FileCheck,
  MessageSquare,
  Send,
  Check,
  Briefcase,
  Plus
} from 'lucide-react';
import { Case, CaseHistoryEntry, isCaseOnDate } from '../../../types';
import { updateCase } from '../../../services/user/featureService';
import { uploadFile, getPublicUrl } from '../../../lib/storage';
import { getMagicCaseTrackUrl } from '../../cases/WhatsAppPhoneHelper';

// Helper to auto-crop, resize and compress images for minimal data usage
export const processAndCompressImage = (
  file: File,
  targetFileName: string,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.72
): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Auto-scale to fit within maxWidth / maxHeight preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw with white background to eliminate transparency artifacts
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], targetFileName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

// Helper to compile multiple compressed images into a single compact, high-efficiency PDF
export const createCompressedPdfFromImages = async (
  images: Array<{ previewUrl: string; file: File; compressedSize?: number }>,
  caseNo: string,
  dateStr: string,
  stepTitle: string
): Promise<{ file: File; size: number; previewUrl: string }> => {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  };

  for (let i = 0; i < images.length; i++) {
    if (i > 0) pdf.addPage();
    const item = images[i];
    try {
      const img = await loadImage(item.previewUrl);
      const imgRatio = (img.width || 1) / (img.height || 1);

      // Header at the top of each page
      pdf.setFontSize(8.5);
      pdf.setTextColor(60, 60, 60);
      const headerText = `Case: ${caseNo || 'N/A'}  |  Date: ${dateStr || ''}  |  Step: ${stepTitle || ''}  |  Page ${i + 1} of ${images.length}`;
      pdf.text(headerText, margin, margin + 4);
      pdf.setDrawColor(210, 210, 210);
      pdf.setLineWidth(0.3);
      pdf.line(margin, margin + 6, pageWidth - margin, margin + 6);

      const usableHeight = contentHeight - 12;
      let renderWidth = contentWidth;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > usableHeight) {
        renderHeight = usableHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const x = margin + (contentWidth - renderWidth) / 2;
      const y = margin + 8 + (usableHeight - renderHeight) / 2;

      pdf.addImage(img, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');
    } catch (e) {
      console.warn('Failed adding image to PDF:', e);
    }
  }

  const pdfBlob = pdf.output('blob');
  const sanitizedCaseNo = (caseNo || 'case').replace(/[\/\\?#%*:|"<>\s]/g, '-');
  const sanitizedDate = (dateStr || new Date().toISOString().split('T')[0]).replace(/[/.]/g, '-');
  const pdfName = `${sanitizedCaseNo}_${sanitizedDate}_documents.pdf`;
  const pdfFile = new File([pdfBlob], pdfName, {
    type: 'application/pdf',
    lastModified: Date.now()
  });
  const previewUrl = URL.createObjectURL(pdfBlob);

  return {
    file: pdfFile,
    size: pdfFile.size,
    previewUrl
  };
};

interface CalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  cases: Case[];
  onViewCard: (c: Case) => void;
  onViewHistory: (c: Case) => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
  userType?: string;
  govtHolidays?: string[] | Record<string, string>;
  getBanglaDate?: (date: Date) => string;
  t: (key: any) => string;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  onOpenAiForCase?: (c: Case) => void;
  onWhatsAppShare?: (c: Case, side?: 'petitioner' | 'respondent') => void;
  onAddCaseForDate?: (date: string) => void;
}

// Helper to display only Day and Month (e.g. 02/11), removing the year
export const formatDayMonth = (dateStr?: string): string => {
  if (!dateStr || !dateStr.trim()) return '';
  const s = dateStr.trim();

  // If already DD/MM (2 parts)
  if (/^\d{1,2}[-/.]\d{1,2}$/.test(s)) {
    const [d, m] = s.split(/[-/.]/);
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
  }

  // If YYYY-MM-DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(s)) {
    const [, m, d] = s.split(/[-/.]/);
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
  }

  // If DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(s)) {
    const [d, m] = s.split(/[-/.]/);
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}`;
  }

  // Bengali digits with year: e.g. ১২/০৯/২০২৬ -> ১২/০৯
  const withoutBnYear = s.replace(/[/.-][০-৯]{4}$/, '').replace(/^[০-৯]{4}[/.-]/, '');
  if (withoutBnYear !== s) {
    return withoutBnYear;
  }

  // English 4-digit year at end or beginning
  const withoutEnYear = s.replace(/[/.-]\d{4}$/, '').replace(/^\d{4}[/.-]/, '');
  if (withoutEnYear !== s) {
    const parts = withoutEnYear.split(/[-/.]/);
    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
    }
    return withoutEnYear;
  }

  // If ISO string like 2026-09-24T18:26:41.725Z
  if (s.includes('T') || s.includes('Z')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    }
  }

  return s;
};

// Helper to convert numbers to Bengali digits
export const toBn = (n: number | string): string => {
  const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, d => bnNums[+d] || d);
};

// Helper to format multiple persons: [First Name] গং (count), hiding rest of names
export const formatMultiplePersons = (
  rawName?: string, 
  details?: Array<{ name: string }>, 
  language: string = 'bn'
): { formatted: string; fullNames: string; count: number } => {

  // Case 1: Structured details array with multiple entries
  if (details && Array.isArray(details) && details.length > 0) {
    const validNames = details.map(d => d?.name?.trim()).filter(Boolean);
    if (validNames.length > 1) {
      const cleanFirst = validNames[0]
        .replace(/\s+গং(\s*\([০-৯0-9]+\))?$/g, '')
        .replace(/\s+&\s+others(\s*\([0-9]+\))?$/gi, '')
        .trim();
      const count = validNames.length;
      const countStr = language === 'bn' ? toBn(count) : count;
      const suffix = language === 'bn' ? `গং (${countStr})` : `& others (${countStr})`;
      return {
        formatted: `${cleanFirst} ${suffix}`,
        fullNames: validNames.map((n, i) => `${i + 1}. ${n}`).join('\n'),
        count
      };
    } else if (validNames.length === 1) {
      return {
        formatted: validNames[0],
        fullNames: validNames[0],
        count: 1
      };
    }
  }

  if (!rawName || !rawName.trim()) {
    return { formatted: '', fullNames: '', count: 0 };
  }

  const s = rawName.trim();

  // If already formatted like "নাম গং (৩)" or "নাম গং (3)"
  const alreadyGangWithCount = s.match(/^(.*?)\s+গং\s*\(([০-৯0-9]+)\)$/);
  if (alreadyGangWithCount) {
    const cleanFirst = alreadyGangWithCount[1].trim();
    const countVal = alreadyGangWithCount[2];
    const countStr = language === 'bn' ? toBn(countVal) : countVal;
    return {
      formatted: `${cleanFirst} ${language === 'bn' ? 'গং' : '& others'} (${countStr})`,
      fullNames: s,
      count: parseInt(countVal, 10) || 2
    };
  }

  // Case 2: Comma, semicolon, newline or ' ও ' separated in string
  const splitNames = s
    .split(/[,;\n]+|\s+ও\s+/)
    .map(n => n.trim())
    .filter(Boolean);

  if (splitNames.length > 1) {
    const cleanFirst = splitNames[0]
      .replace(/\s+গং(\s*\([০-৯0-9]+\))?$/g, '')
      .replace(/\s+&\s+others(\s*\([0-9]+\))?$/gi, '')
      .trim();
    const count = splitNames.length;
    const countStr = language === 'bn' ? toBn(count) : count;
    const suffix = language === 'bn' ? `গং (${countStr})` : `& others (${countStr})`;
    return {
      formatted: `${cleanFirst} ${suffix}`,
      fullNames: splitNames.map((n, i) => `${i + 1}. ${n}`).join('\n'),
      count
    };
  }

  // Case 3: Ends with 'গং' without count
  if (/\s+গং$/.test(s)) {
    const cleanFirst = s.replace(/\s+গং$/, '').trim();
    const count = details && details.length > 1 ? details.length : 2;
    const countStr = language === 'bn' ? toBn(count) : count;
    return {
      formatted: `${cleanFirst} ${language === 'bn' ? 'গং' : '& others'} (${countStr})`,
      fullNames: s,
      count
    };
  }

  return { formatted: s, fullNames: s, count: 1 };
};

const MiniCasebook = ({
  c,
  language,
  t,
  buttonLabels,
  onUpdateCaseLocal,
  onViewCard,
  currentDiaryDate,
  onWhatsAppShare,
  userType
}: {
  c: Case;
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: any) => string;
  buttonLabels: any;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  onViewCard: (c: Case) => void;
  currentDiaryDate?: string;
  onWhatsAppShare?: (c: Case, side?: 'petitioner' | 'respondent') => void;
  userType?: string;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [prevDate, setPrevDate] = useState(c.lastDate || '');
  const [caseNumber, setCaseNumber] = useState(c.caseNumber || '');
  const [petitioner, setPetitioner] = useState(c.petitioner || '');
  const [respondent, setRespondent] = useState(c.respondent || '');
  const [petDetails, setPetDetails] = useState<NonNullable<Case['petitionerDetails']>>(c.petitionerDetails || []);
  const [resDetails, setResDetails] = useState<NonNullable<Case['respondentDetails']>>(c.respondentDetails || []);
  const [nextDate, setNextDate] = useState(c.nextDate || '');
  const [order, setOrder] = useState(c.order || 'আদেশ');
  const [clientNotes1, setClientNotes1] = useState(c.petitionerDetails?.[0]?.name || '');
  const [clientNotes2, setClientNotes2] = useState(c.additionalOrder || '');
  const [oppositeNotes, setOppositeNotes] = useState(c.respondentDetails?.[0]?.name || '');
  const [isSavingDirect, setIsSavingDirect] = useState(false);
  const [directSaveSuccess, setDirectSaveSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedPartyAccess, setSelectedPartyAccess] = useState<'our_side' | 'all_sides'>(() => {
    if (c.selectedPartyAccess) return c.selectedPartyAccess;
    return c.visibility === 'public' ? 'all_sides' : 'our_side';
  });
  const [selectedPartyRole, setSelectedPartyRole] = useState<'petitioner' | 'respondent'>(() => {
    if (c.selectedParty === 'respondent' || c.selectedParty === 'accused') return 'respondent';
    if (c.selectedParty === 'petitioner') return 'petitioner';
    if ((c as any).side === 'respondent' || (c as any).side === 'accused') return 'respondent';
    return 'petitioner';
  });
  const [isUpdatedToday, setIsUpdatedToday] = useState<boolean>(() => {
    if (c.isUpdatedToday) return true;
    const today = new Date().toISOString().split('T')[0];
    if (c.lastDate === today || c.lastEditedDate === today) return true;
    return false;
  });
  const [isSavingParty, setIsSavingParty] = useState(false);
  const [partySaveSuccess, setPartySaveSuccess] = useState(false);
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);
  const [confirmUpdateScope, setConfirmUpdateScope] = useState<'private_diary' | 'both_parties' | null>(null);
  const [pendingNextDate, setPendingNextDate] = useState(c.nextDate || '');
  const [pendingOrderText, setPendingOrderText] = useState(c.additionalOrder || c.order || 'আদেশ');
  const [confirmPickerMonth, setConfirmPickerMonth] = useState<Date>(() => new Date());
  const [isSavingConfirm, setIsSavingConfirm] = useState(false);
  const [updateConfirmSuccess, setUpdateConfirmSuccess] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<'criminal' | 'civil'>(() => {
    return (c.caseType?.toLowerCase().includes('civil') || c.caseType?.includes('দেওয়ানী')) ? 'civil' : 'criminal';
  });
  const [selectedStep, setSelectedStep] = useState(order !== 'আদেশ' && order !== 'পদক্ষেপ' ? order : 'হাজিরা');
  const [stepCustomNotes, setStepCustomNotes] = useState('');
  const [stepImages, setStepImages] = useState<Array<{ file: File; previewUrl: string; originalSize: number; compressedSize: number }>>([]);
  const [compiledPdf, setCompiledPdf] = useState<{ file: File; size: number; previewUrl: string } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saveFormat, setSaveFormat] = useState<'pdf' | 'images' | 'both'>('pdf');
  const [selectedUploadFormat, setSelectedUploadFormat] = useState<'image' | 'pdf'>('pdf');
  const [uploadedPdfFile, setUploadedPdfFile] = useState<{ file: File; size: number; previewUrl: string } | null>(null);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isUploadingStep, setIsUploadingStep] = useState(false);
  const [stepUploadSuccess, setStepUploadSuccess] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [pickerMonth, setPickerMonth] = useState<Date>(() => new Date());
  const rowRef = useRef<HTMLDivElement>(null);

  // Track call records for represented party contacts with persistent proof
  const [callLogs, setCallLogs] = useState<Record<string, { timestamp: number; timeFormatted: string; count: number }>>(() => {
    try {
      const saved = localStorage.getItem(`call_logs_case_${c.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activeCallProofToast, setActiveCallProofToast] = useState<{ name: string; phone: string; time: string } | null>(null);

  const handleMakeCall = (name: string, phone: string) => {
    if (!phone) return;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ', ' +
      now.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' });
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const currentRecord = callLogs[cleanPhone] || { count: 0 };
    const updated = {
      ...callLogs,
      [cleanPhone]: {
        timestamp: Date.now(),
        timeFormatted,
        count: (currentRecord.count || 0) + 1
      }
    };
    setCallLogs(updated);
    try {
      localStorage.setItem(`call_logs_case_${c.id}`, JSON.stringify(updated));
    } catch {}

    // Show instant proof feedback toast
    setActiveCallProofToast({ name, phone, time: timeFormatted });
    setTimeout(() => setActiveCallProofToast(null), 3500);
  };

  const [showAddAssociateModal, setShowAddAssociateModal] = useState<'clerk' | 'lawyer' | null>(null);
  const [associateInputName, setAssociateInputName] = useState('');
  const [associateInputPhone, setAssociateInputPhone] = useState('');
  const [isSavingAssociate, setIsSavingAssociate] = useState(false);
  const [showWaPreviewModal, setShowWaPreviewModal] = useState(false);
  const [waPreviewContent, setWaPreviewContent] = useState<{ recipientName: string; recipientPhone: string; message: string; waUrl: string } | null>(null);
  const [multiWaModalData, setMultiWaModalData] = useState<Array<{ clientName: string; phone: string; message: string; waUrl: string }> | null>(null);

  const handleOpenWaPreview = (specificContact?: { name: string; phone: string }) => {
    if (!specificContact && representedContacts.length > 1) {
      const items: Array<{ clientName: string; phone: string; message: string; waUrl: string }> = [];
      representedContacts.forEach(contact => {
        if (!contact.phone) return;
        const cleanDigits = contact.phone.replace(/[^0-9]/g, '');
        const intl = cleanDigits.startsWith('88') ? cleanDigits : (cleanDigits ? `88${cleanDigits}` : '');
        const trackUrl = getMagicCaseTrackUrl({ 
          caseId: c.id, 
          caseNumber: c.caseNumber || caseNumber,
          clientMobile: contact.phone,
          clientName: contact.name
        });
        
        const courtName = c.courtName || (language === 'bn' ? 'আদালত' : 'Court');
        const caseNoStr = c.caseNumber || caseNumber || '-';
        const nextDateStr = nextDate || c.nextDate || (language === 'bn' ? 'নির্ধারিত তারিখ' : 'Scheduled Date');
        const orderStr = order || c.order || clientNotes2 || (language === 'bn' ? 'শুনানি / হাজিরা' : 'Hearing / Attendance');

        const msg = language === 'bn' 
          ? `শ্রদ্ধেয় ${contact.name}, আপনার অবগতির জন্য জানানো যাচ্ছে যে, আগামী ${nextDateStr} তারিখে ${courtName}-এ আপনার মামলা নং ${caseNoStr}-এর শুনানির দিন ধার্য রয়েছে। আদালতের আদেশ/পদক্ষেপ: ${orderStr}। উক্ত তারিখে যথাসময়ে আদালতে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।\n\n🔗 আপনার নিরাপদ লাইভ ট্র্যাকিংয়ের ম্যাজিক লিংক (কোনো পাসওয়ার্ড লাগবে না):\n👉 ${trackUrl}`
          : `Dear ${contact.name}, Please be informed that your case no. ${caseNoStr} in ${courtName} is scheduled for hearing on ${nextDateStr}. Court step: ${orderStr}. You are requested to be present in court on time.\n\n🔗 Your secure Magic Link for live tracking (no password required):\n👉 ${trackUrl}`;

        const waUrl = intl ? `https://wa.me/${intl}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        items.push({
          clientName: contact.name,
          phone: contact.phone,
          message: msg,
          waUrl
        });
      });

      if (items.length > 0) {
        setMultiWaModalData(items);
        return;
      }
    }

    const contactToUse = specificContact || representedContacts[0] || {
      name: selectedPartyRole === 'petitioner' ? (c.petitioner || petitioner) : (c.respondent || respondent),
      phone: c.petitionerMobile || c.respondentMobile || ''
    };
    
    const clientName = contactToUse.name;
    const mobile = contactToUse.phone;
    if (!mobile) {
      alert(language === 'bn' ? 'এই মক্কেলের কোনো মোবাইল নম্বর পাওয়া যায়নি।' : 'No phone number available for this client.');
      return;
    }

    const cleanDigits = mobile.replace(/[^0-9]/g, '');
    const intl = cleanDigits.startsWith('88') ? cleanDigits : (cleanDigits ? `88${cleanDigits}` : '');
    const trackUrl = getMagicCaseTrackUrl({ 
      caseId: c.id, 
      caseNumber: c.caseNumber || caseNumber,
      clientMobile: mobile,
      clientName: clientName
    });
    
    const courtName = c.courtName || (language === 'bn' ? 'আদালত' : 'Court');
    const caseNoStr = c.caseNumber || caseNumber || '-';
    const nextDateStr = nextDate || c.nextDate || (language === 'bn' ? 'নির্ধারিত তারিখ' : 'Scheduled Date');
    const orderStr = order || c.order || clientNotes2 || (language === 'bn' ? 'শুনানি / হাজিরা' : 'Hearing / Attendance');

    const msg = language === 'bn' 
      ? `শ্রদ্ধেয় ${clientName || 'মক্কেল'}, আপনার অবগতির জন্য জানানো যাচ্ছে যে, আগামী ${nextDateStr} তারিখে ${courtName}-এ আপনার মামলা নং ${caseNoStr}-এর শুনানির দিন ধার্য রয়েছে। আদালতের আদেশ/পদক্ষেপ: ${orderStr}। উক্ত তারিখে যথাসময়ে আদালতে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।\n\n🔗 আপনার নিরাপদ লাইভ ট্র্যাকিংয়ের ম্যাজিক লিংক (কোনো পাসওয়ার্ড লাগবে না):\n👉 ${trackUrl}`
      : `Dear ${clientName || 'Client'}, Please be informed that your case no. ${caseNoStr} in ${courtName} is scheduled for hearing on ${nextDateStr}. Court step: ${orderStr}. You are requested to be present in court on time.\n\n🔗 Your secure Magic Link for live tracking (no password required):\n👉 ${trackUrl}`;

    const waUrl = intl ? `https://wa.me/${intl}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    setWaPreviewContent({
      recipientName: clientName || (language === 'bn' ? 'মক্কেল' : 'Client'),
      recipientPhone: mobile || (language === 'bn' ? 'নম্বর সংযোজিত নেই' : 'No phone number'),
      message: msg,
      waUrl
    });
    setShowWaPreviewModal(true);
  };

  const handleSaveAssociateAndCall = async () => {
    if (!associateInputPhone.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন।' : 'Please enter a mobile number.');
      return;
    }
    const cleanPhone = associateInputPhone.trim();
    const name = associateInputName.trim() || (showAddAssociateModal === 'clerk' ? 'মুহুরী' : 'আইনজীবী');
    setIsSavingAssociate(true);

    const isPet = selectedPartyRole === 'petitioner';
    const fieldMobile = showAddAssociateModal === 'clerk' 
      ? (isPet ? 'petitionerClerkMobile' : 'respondentClerkMobile')
      : (isPet ? 'petitionerLawyerMobile' : 'respondentLawyerMobile');
    const fieldName = showAddAssociateModal === 'clerk'
      ? (isPet ? 'petitionerClerk' : 'respondentClerk')
      : (isPet ? 'petitionerLawyer' : 'respondentLawyer');

    const updatePayload = {
      [fieldMobile]: cleanPhone,
      [fieldName]: name
    };

    try {
      if (onUpdateCaseLocal) {
        onUpdateCaseLocal(c.id, updatePayload);
      }
      await updateCase(String(c.id), updatePayload);
    } catch (e) {
      console.warn("Failed to persist associate to Firestore, updated locally:", e);
    } finally {
      setIsSavingAssociate(false);
      setShowAddAssociateModal(null);
      setAssociateInputPhone('');
      setAssociateInputName('');
      
      // Immediately initiate call and record proof
      handleMakeCall(name, cleanPhone);
      window.open(`tel:${cleanPhone}`, '_self');
    }
  };

  const handlePdfFileAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert(language === 'bn' ? 'অনুগ্রহ করে শুধুমাত্র PDF ফাইল নির্বাচন করুন।' : 'Please select a PDF file.');
      return;
    }
    const sanitizedCaseNo = (caseNumber || c.caseNumber || 'case').replace(/[\/\\?#%*:|"<>\s]/g, '-');
    const datePart = (currentDiaryDate || c.lastDate || new Date().toISOString().split('T')[0]).replace(/[/.]/g, '-');
    const autoPdfName = `${sanitizedCaseNo}_${datePart}_document.pdf`;
    const renamedFile = new File([file], autoPdfName, { type: 'application/pdf', lastModified: Date.now() });
    const previewUrl = URL.createObjectURL(file);
    setUploadedPdfFile({
      file: renamedFile,
      size: file.size,
      previewUrl
    });
    setSaveFormat('pdf');
    e.target.value = '';
  };

  const handleFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const rawFiles = Array.from(e.target.files);
    setIsProcessingImages(true);

    try {
      const sanitizedCaseNo = (caseNumber || c.caseNumber || 'case').replace(/[\/\\?#%*:|"<>\s]/g, '-');
      const datePart = (currentDiaryDate || c.lastDate || new Date().toISOString().split('T')[0]).replace(/[/.]/g, '-');
      
      const processed: Array<{ file: File; previewUrl: string; originalSize: number; compressedSize: number }> = [];

      for (let i = 0; i < rawFiles.length; i++) {
        const rawFile = rawFiles[i];
        const idx = stepImages.length + i + 1;
        const autoName = `${sanitizedCaseNo}_${datePart}_doc_${idx}.jpg`;
        
        // Auto-crop & compress using canvas for minimal data usage
        const compressedFile = await processAndCompressImage(rawFile, autoName, 1280, 1280, 0.72);
        const previewUrl = URL.createObjectURL(compressedFile);

        processed.push({
          file: compressedFile,
          previewUrl,
          originalSize: rawFile.size,
          compressedSize: compressedFile.size
        });
      }

      setStepImages(prev => [...prev, ...processed]);
    } catch (err) {
      console.error("Error compressing images:", err);
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setStepImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Automatically compile or update single compressed PDF whenever images change
  useEffect(() => {
    let isCancelled = false;
    if (stepImages.length === 0) {
      setCompiledPdf(null);
      return;
    }

    const generatePdf = async () => {
      setIsGeneratingPdf(true);
      try {
        const diaryDate = currentDiaryDate || c.lastDate || new Date().toISOString().split('T')[0];
        const res = await createCompressedPdfFromImages(
          stepImages,
          caseNumber || c.caseNumber || 'case',
          diaryDate,
          selectedStep
        );
        if (!isCancelled) {
          setCompiledPdf(res);
        }
      } catch (err) {
        console.error("Failed to generate PDF:", err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingPdf(false);
        }
      }
    };

    generatePdf();

    return () => {
      isCancelled = true;
    };
  }, [stepImages, caseNumber, currentDiaryDate, selectedStep, c.caseNumber, c.lastDate]);

  const handleSaveStepAndImages = async () => {
    setIsUploadingStep(true);
    try {
      const diaryDate = currentDiaryDate || c.nextDate || new Date().toISOString().split('T')[0];
      const uploadedDocs: { name: string; type: string; url: string; size?: number; date?: string }[] = [];

      // 1. If direct PDF was uploaded
      if (uploadedPdfFile && selectedUploadFormat === 'pdf') {
        try {
          const snapshot = await uploadFile('documents', uploadedPdfFile.file.name, uploadedPdfFile.file);
          let downloadUrl = '';
          if (snapshot && (snapshot as any).metadata?.downloadUrl) {
            downloadUrl = (snapshot as any).metadata.downloadUrl;
          } else {
            downloadUrl = await getPublicUrl('documents', uploadedPdfFile.file.name);
          }
          uploadedDocs.push({
            name: uploadedPdfFile.file.name,
            type: 'pdf',
            url: downloadUrl,
            size: uploadedPdfFile.size,
            date: diaryDate
          });
        } catch (uploadPdfErr) {
          console.warn("Direct PDF Upload fallback to preview URL:", uploadPdfErr);
          uploadedDocs.push({
            name: uploadedPdfFile.file.name,
            type: 'pdf',
            url: uploadedPdfFile.previewUrl,
            size: uploadedPdfFile.size,
            date: diaryDate
          });
        }
      }

      // 2. If compiled PDF from camera/photos exists and PDF format is selected
      if ((saveFormat === 'pdf' || saveFormat === 'both' || selectedUploadFormat === 'pdf') && compiledPdf && !uploadedPdfFile) {
        try {
          const snapshot = await uploadFile('documents', compiledPdf.file.name, compiledPdf.file);
          let downloadUrl = '';
          if (snapshot && (snapshot as any).metadata?.downloadUrl) {
            downloadUrl = (snapshot as any).metadata.downloadUrl;
          } else {
            downloadUrl = await getPublicUrl('documents', compiledPdf.file.name);
          }
          uploadedDocs.push({
            name: compiledPdf.file.name,
            type: 'pdf',
            url: downloadUrl,
            size: compiledPdf.size,
            date: diaryDate
          });
        } catch (uploadPdfErr) {
          console.warn("PDF Upload fallback to preview URL:", uploadPdfErr);
          uploadedDocs.push({
            name: compiledPdf.file.name,
            type: 'pdf',
            url: compiledPdf.previewUrl,
            size: compiledPdf.size,
            date: diaryDate
          });
        }
      }

      // 3. If saveFormat includes individual images or image format is selected
      if (saveFormat === 'images' || saveFormat === 'both' || (selectedUploadFormat === 'image' && stepImages.length > 0)) {
        for (const item of stepImages) {
          try {
            const snapshot = await uploadFile('documents', item.file.name, item.file);
            let downloadUrl = '';
            if (snapshot && (snapshot as any).metadata?.downloadUrl) {
              downloadUrl = (snapshot as any).metadata.downloadUrl;
            } else {
              downloadUrl = await getPublicUrl('documents', item.file.name);
            }
            uploadedDocs.push({
              name: item.file.name,
              type: 'image',
              url: downloadUrl,
              size: item.compressedSize,
              date: diaryDate
            });
          } catch (uploadErr) {
            console.warn("Image upload fallback to preview URL:", uploadErr);
            uploadedDocs.push({
              name: item.file.name,
              type: 'image',
              url: item.previewUrl,
              size: item.compressedSize,
              date: diaryDate
            });
          }
        }
      }

      // 3. Prepare step text
      const finalStepText = stepCustomNotes ? `${selectedStep} (${stepCustomNotes})` : selectedStep;
      setOrder(selectedStep);
      if (stepCustomNotes) {
        setClientNotes2(stepCustomNotes);
      }

      // 4. Prepare updated case history and documents
      const allDocs = [...(c.documents || []), ...uploadedDocs];
      const newHistoryEntry: CaseHistoryEntry = {
        id: Date.now().toString(),
        date: diaryDate,
        actionBy: 'court',
        description: finalStepText,
        order: selectedStep,
        documents: uploadedDocs
      };
      const updatedHistory = [...(c.history || []), newHistoryEntry];

      const updatedFields: Partial<Case> = {
        order: selectedStep,
        additionalOrder: stepCustomNotes || c.additionalOrder,
        documents: allDocs,
        history: updatedHistory
      };

      // 5. Update local state
      if (onUpdateCaseLocal) {
        onUpdateCaseLocal(c.id, updatedFields);
      }

      // 6. Persist to Firestore
      await updateCase(c.id.toString(), updatedFields);

      setStepUploadSuccess(true);
      setTimeout(() => {
        setStepUploadSuccess(false);
        setShowStepModal(false);
        setStepImages([]);
        setUploadedPdfFile(null);
      }, 1500);

    } catch (err) {
      console.error("Failed to save step and documents:", err);
      alert(language === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to save. Please try again.');
    } finally {
      setIsUploadingStep(false);
    }
  };

  // Synchronize state when c changes
  useEffect(() => {
    setPrevDate(c.lastDate || '');
    setCaseNumber(c.caseNumber || '');
    setPetitioner(c.petitioner || '');
    setRespondent(c.respondent || '');
    setNextDate(c.nextDate || '');
    setOrder(c.order || 'আদেশ');
    setClientNotes1(c.petitionerDetails?.[0]?.name || '');
    setClientNotes2(c.additionalOrder || '');
    setOppositeNotes(c.respondentDetails?.[0]?.name || '');
    setPetDetails(c.petitionerDetails || []);
    setResDetails(c.respondentDetails || []);
  }, [c]);

  const openDatePicker = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (nextDate && /^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      const [y, m] = nextDate.split('-');
      setPickerMonth(new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1));
    } else {
      setPickerMonth(new Date());
    }
    setShowDatePicker(true);
  };

  const handleSave = async () => {
    const updatedPetDetails = [...(c.petitionerDetails || [])];
    if (updatedPetDetails[0]) {
      updatedPetDetails[0] = { ...updatedPetDetails[0], name: clientNotes1 };
    } else if (clientNotes1) {
      updatedPetDetails.push({ name: clientNotes1, phone: '', serial: 1 });
    }

    const updatedResDetails = [...(c.respondentDetails || [])];
    if (updatedResDetails[0]) {
      updatedResDetails[0] = { ...updatedResDetails[0], name: oppositeNotes };
    } else if (oppositeNotes) {
      updatedResDetails.push({ name: oppositeNotes, phone: '', serial: 1 });
    }

    const updatedFields: Partial<Case> = {
      lastDate: prevDate,
      caseNumber,
      petitioner,
      respondent,
      nextDate,
      order,
      additionalOrder: clientNotes2,
      petitionerDetails: updatedPetDetails,
      respondentDetails: updatedResDetails
    };

    if (onUpdateCaseLocal) {
      onUpdateCaseLocal(c.id, updatedFields);
    }

    try {
      await updateCase(c.id.toString(), updatedFields);
    } catch (err) {
      console.error('Failed to save case in database:', err);
    }

    setIsEditMode(false);
  };

  const handleOpenConfirmUpdateModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentNext = nextDate || c.nextDate || '';
    setPendingNextDate(currentNext);
    setPendingOrderText(clientNotes2 || c.additionalOrder || (order !== 'আদেশ' && order !== 'পদক্ষেপ' ? order : '') || 'আদেশ');
    setConfirmUpdateScope(null);
    if (currentNext && /^\d{4}-\d{2}-\d{2}$/.test(currentNext)) {
      const [y, m] = currentNext.split('-');
      setConfirmPickerMonth(new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1));
    } else {
      setConfirmPickerMonth(new Date());
    }
    setShowConfirmUpdateModal(true);
  };

  const handleConfirmUpdateOk = async () => {
    if (!confirmUpdateScope) {
      alert(language === 'bn' ? 'অনুগ্রহ করে ‘নিজ ডায়েরি’ অথবা ‘উভয় পক্ষ’ সিলেক্ট করুন।' : 'Please select either "Own Diary" or "Both Parties".');
      return;
    }
    if (!pendingNextDate) {
      alert(language === 'bn' ? 'অনুগ্রহ করে ক্যালেন্ডার থেকে আগামী তারিখ নির্বাচন করুন।' : 'Please select the next date from the calendar.');
      return;
    }

    setIsSavingConfirm(true);
    try {
      const diaryDate = currentDiaryDate || new Date().toISOString().split('T')[0];
      const prevDateToSet = diaryDate;

      const isBothParties = confirmUpdateScope === 'both_parties';
      const visibilityVal: 'public' | 'private' = isBothParties ? 'public' : 'private';
      const partyAccessVal: 'our_side' | 'all_sides' = isBothParties ? 'all_sides' : 'our_side';

      const updatedPetDetails = [...(petDetails.length > 0 ? petDetails : (c.petitionerDetails || []))];
      if (updatedPetDetails[0]) {
        updatedPetDetails[0] = { ...updatedPetDetails[0], name: clientNotes1 || updatedPetDetails[0].name };
      } else if (clientNotes1) {
        updatedPetDetails.push({ name: clientNotes1, phone: c.petitionerMobile || '', serial: 1 });
      }

      const updatedResDetails = [...(resDetails.length > 0 ? resDetails : (c.respondentDetails || []))];
      if (updatedResDetails[0]) {
        updatedResDetails[0] = { ...updatedResDetails[0], name: oppositeNotes || updatedResDetails[0].name };
      } else if (oppositeNotes) {
        updatedResDetails.push({ name: oppositeNotes, phone: c.respondentMobile || '', serial: 1 });
      }

      const updatedPastDates = Array.from(new Set([
        ...(c.pastDates || []),
        ...(c.lastDate ? [c.lastDate] : []),
        diaryDate
      ]));

      const newHistoryEntry: CaseHistoryEntry = {
        id: Date.now().toString(),
        date: diaryDate,
        actionBy: 'court',
        description: pendingOrderText || (language === 'bn' ? 'আদেশ আপডেট' : 'Order Updated'),
        order: pendingOrderText || order || 'আদেশ'
      };

      const updatedHistory = [...(c.history || []), newHistoryEntry];

      const updatedFields: Partial<Case> = {
        nextDate: pendingNextDate,
        lastDate: prevDateToSet,
        order: pendingOrderText || order || 'আদেশ',
        additionalOrder: pendingOrderText,
        petitionerDetails: updatedPetDetails,
        respondentDetails: updatedResDetails,
        pastDates: updatedPastDates,
        history: updatedHistory,
        visibility: visibilityVal,
        selectedPartyAccess: partyAccessVal,
        clerkCanCall: isBothParties,
        lawyerCanCall: isBothParties,
        isUpdatedToday: true,
        lastEditedDate: new Date().toISOString().split('T')[0]
      };

      if (caseNumber && caseNumber !== c.caseNumber) updatedFields.caseNumber = caseNumber;
      if (petitioner && petitioner !== c.petitioner) updatedFields.petitioner = petitioner;
      if (respondent && respondent !== c.respondent) updatedFields.respondent = respondent;

      // Update local state - Dual color yellow split activates ONLY after clicking update button!
      setNextDate(pendingNextDate);
      setPrevDate(prevDateToSet);
      setClientNotes2(pendingOrderText);
      setOrder(pendingOrderText || 'আদেশ');
      setSelectedPartyAccess(partyAccessVal);
      setIsUpdatedToday(true);

      if (onUpdateCaseLocal) {
        onUpdateCaseLocal(c.id, { ...updatedFields, isUpdatedToday: true });
      }

      try {
        await updateCase(c.id.toString(), { ...updatedFields, isUpdatedToday: true });
      } catch (dbErr) {
        console.warn('Database save warning (local state preserved):', dbErr);
      }

      // If 'উভয় পক্ষ' is selected: send automatic WhatsApp notification to all mobile numbers of own side
      if (isBothParties) {
        const ownSideMobileList = Array.from(new Set([
          (selectedPartyRole === 'petitioner' ? (c.petitionerMobile || updatedPetDetails[0]?.phone) : (c.respondentMobile || updatedResDetails[0]?.phone)) || '',
          ...(selectedPartyRole === 'petitioner' 
              ? updatedPetDetails.map(d => d.phone) 
              : updatedResDetails.map(d => d.phone)
          )
        ])).filter(m => m && m.replace(/[^0-9]/g, '').length >= 6);

        const clientName = selectedPartyRole === 'petitioner' ? (c.petitioner || updatedPetDetails[0]?.name) : (c.respondent || updatedResDetails[0]?.name);
        const primaryPhone = ownSideMobileList[0] || '';
        const trackUrl = getMagicCaseTrackUrl({ 
          caseId: c.id, 
          caseNumber: c.caseNumber,
          clientMobile: primaryPhone,
          clientName: clientName
        });
        const msg = `শ্রদ্ধেয় ${clientName || 'মক্কেল'}, আপনার মামলা নং ${c.caseNumber} এর পরবর্তী শুনানির তারিখ: ${pendingNextDate || 'নির্ধারিত নয়'}। আদালতের পদক্ষেপ: ${pendingOrderText || order || 'আদেশ'}। সরাসরি কোনো পাসওয়ার্ড ছাড়া অটো-লগইন ও লাইভ ট্র্যাকিং করতে নিচের লিংকে ক্লিক করুন:
👉 ${trackUrl}`;

        if (onWhatsAppShare) {
          onWhatsAppShare({
            ...c,
            ...updatedFields,
            nextDate: pendingNextDate,
            order: pendingOrderText || order || 'আদেশ'
          }, selectedPartyRole);
        }

        if (ownSideMobileList.length > 0) {
          const firstMobile = ownSideMobileList[0].replace(/[^0-9]/g, '');
          const intl = firstMobile.startsWith('88') ? firstMobile : `88${firstMobile}`;
          const waUrl = `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        }
      }

      setUpdateConfirmSuccess(true);
      setTimeout(() => {
        setUpdateConfirmSuccess(false);
        setShowConfirmUpdateModal(false);
        setIsEditMode(false);
      }, 700);
    } catch (err) {
      console.error('Failed to update case from confirmation modal:', err);
      alert(language === 'bn' ? 'মামলার তথ্য আপডেট করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to update case. Please try again.');
    } finally {
      setIsSavingConfirm(false);
    }
  };

  const handleDirectSaveEditMode = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSavingDirect(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Format updated petitionerDetails
      const cleanPetitioner = (petitioner || '').trim() || c.petitioner;
      const petNames = cleanPetitioner.split(/[,;\n]+|\s+ও\s+/).map(n => n.trim()).filter(Boolean);
      let updatedPetDetails: NonNullable<Case['petitionerDetails']> = [];
      if (petNames.length > 0) {
        updatedPetDetails = petNames.map((name, idx) => ({
          name,
          phone: c.petitionerDetails?.[idx]?.phone || (idx === 0 ? c.petitionerMobile || '' : ''),
          serial: idx + 1
        }));
      } else if (c.petitionerDetails && c.petitionerDetails.length > 0) {
        updatedPetDetails = [...c.petitionerDetails];
      }

      // Format updated respondentDetails
      const cleanRespondent = (respondent || '').trim() || c.respondent;
      const resNames = cleanRespondent.split(/[,;\n]+|\s+ও\s+/).map(n => n.trim()).filter(Boolean);
      let updatedResDetails: NonNullable<Case['respondentDetails']> = [];
      if (resNames.length > 0) {
        updatedResDetails = resNames.map((name, idx) => ({
          name,
          phone: c.respondentDetails?.[idx]?.phone || (idx === 0 ? c.respondentMobile || '' : ''),
          serial: idx + 1
        }));
      } else if (c.respondentDetails && c.respondentDetails.length > 0) {
        updatedResDetails = [...c.respondentDetails];
      }

      const cleanCaseNo = (caseNumber || '').trim() || c.caseNumber;
      
      // Normalize dates if typed in short DD/MM or DD-MM format
      const normalizeDateInput = (val: string) => {
        const trimmed = (val || '').trim();
        if (!trimmed) return '';
        const matchDM = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})$/);
        if (matchDM) {
          const year = new Date().getFullYear();
          return `${year}-${matchDM[2].padStart(2, '0')}-${matchDM[1].padStart(2, '0')}`;
        }
        return trimmed;
      };

      const cleanNextDate = normalizeDateInput(nextDate) || c.nextDate;
      const cleanPrevDate = normalizeDateInput(prevDate) || c.lastDate;
      const cleanOrder = (order || '').trim() || c.order || 'আদেশ';
      const cleanClientNotes2 = (clientNotes2 || '').trim();

      // Update history for the diary date so BookView and history views immediately reflect changes
      const targetHistoryDate = currentDiaryDate || c.lastDate || today;
      let updatedHistory = c.history ? [...c.history] : [];
      const existingHistIndex = updatedHistory.findIndex(h => h.date === targetHistoryDate);
      if (existingHistIndex >= 0) {
        updatedHistory[existingHistIndex] = {
          ...updatedHistory[existingHistIndex],
          order: cleanOrder,
          description: cleanClientNotes2 || cleanOrder
        };
      } else {
        updatedHistory.unshift({
          id: Date.now().toString(),
          date: targetHistoryDate,
          order: cleanOrder,
          actionBy: 'court',
          description: cleanClientNotes2 || cleanOrder
        });
      }

      const updatedFields: Partial<Case> = {
        caseNumber: cleanCaseNo,
        petitioner: cleanPetitioner,
        respondent: cleanRespondent,
        nextDate: cleanNextDate,
        lastDate: cleanPrevDate,
        order: cleanOrder,
        additionalOrder: cleanClientNotes2 || cleanOrder,
        petitionerDetails: updatedPetDetails,
        respondentDetails: updatedResDetails,
        history: updatedHistory,
        isUpdatedToday: true,
        lastEditedDate: today
      };

      // Update local state values
      setCaseNumber(cleanCaseNo);
      setPetitioner(cleanPetitioner);
      setRespondent(cleanRespondent);
      setNextDate(cleanNextDate);
      setPrevDate(cleanPrevDate);
      setOrder(cleanOrder);
      setClientNotes2(cleanClientNotes2 || cleanOrder);
      setPetDetails(updatedPetDetails);
      setResDetails(updatedResDetails);
      setIsUpdatedToday(true);

      // 1. Immediately reflect in parent local state
      if (onUpdateCaseLocal) {
        onUpdateCaseLocal(c.id, updatedFields);
      }

      // 2. Persist to Firestore database
      try {
        await updateCase(c.id.toString(), updatedFields);
      } catch (dbErr) {
        console.warn('Database save warning (local state preserved):', dbErr);
      }

      // Close edit mode and show success indicator
      setIsEditMode(false);
      setDirectSaveSuccess(true);
      setTimeout(() => {
        setDirectSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save edited case details:', err);
      alert(language === 'bn' ? 'তথ্য সংরক্ষণ করতে ত্রুটি হয়েছে: ' + (err?.message || 'আবার চেষ্টা করুন') : 'Failed to save changes: ' + err?.message);
    } finally {
      setIsSavingDirect(false);
    }
  };

  const handleFinishPartyDetermination = async () => {
    setIsSavingParty(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const visibility = selectedPartyAccess === 'all_sides' ? 'public' : 'private';
      const updatedFields: Partial<Case> = {
        visibility,
        selectedParty: selectedPartyRole,
        selectedPartyAccess,
        isUpdatedToday: true,
        lastEditedDate: today
      };

      setIsUpdatedToday(true);

      if (onUpdateCaseLocal) {
        onUpdateCaseLocal(c.id, updatedFields);
      }

      await updateCase(c.id.toString(), updatedFields);

      setPartySaveSuccess(true);
      setTimeout(() => {
        setPartySaveSuccess(false);
        setShowPartyModal(false);
      }, 700);
    } catch (err) {
      console.error('Failed to update party determination:', err);
      alert(language === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to save party determination.');
    } finally {
      setIsSavingParty(false);
    }
  };

  const handleSelectNextDate = async (newDateStr: string) => {
    // 1. Immediately set the next date in component state
    setNextDate(newDateStr);

    // 2. Determine diary/current hearing date to keep case preserved in current diary session
    const diaryDate = currentDiaryDate || c.nextDate || new Date().toISOString().split('T')[0];
    const prevDateToSet = (c.nextDate && c.nextDate !== newDateStr) ? c.nextDate : (c.lastDate || diaryDate);
    setPrevDate(prevDateToSet);

    const updatedPastDates = Array.from(new Set([
      ...(c.pastDates || []),
      ...(c.lastDate ? [c.lastDate] : []),
      diaryDate
    ]));

    const newHistoryEntry: CaseHistoryEntry = {
      id: Date.now().toString(),
      date: diaryDate,
      actionBy: 'court',
      description: order || (language === 'bn' ? 'পরবর্তী শুনানির তারিখ নির্ধারণ' : 'Next hearing date scheduled'),
      order: order || (language === 'bn' ? 'পরবর্তী শুনানির তারিখ নির্ধারণ' : 'Next hearing date scheduled')
    };

    const updatedHistory = [...(c.history || []), newHistoryEntry];
    const today = new Date().toISOString().split('T')[0];

    const updatedFields: Partial<Case> = {
      nextDate: newDateStr,
      lastDate: prevDateToSet,
      pastDates: updatedPastDates,
      history: updatedHistory,
      isUpdatedToday: true,
      lastEditedDate: today
    };

    // Mark updated immediately in state
    setIsUpdatedToday(true);

    // 3. Immediately update parent UI state
    if (onUpdateCaseLocal) {
      onUpdateCaseLocal(c.id, updatedFields);
    }

    // 4. Persist to Firestore database
    try {
      await updateCase(c.id.toString(), updatedFields);
    } catch (err) {
      console.error('Failed to persist next date to database:', err);
    }

    // 5. Close date picker
    setShowDatePicker(false);
  };

  const monthNamesBn = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const weekDaysShort = language === 'bn'
    ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isPastForCase = c.nextDate !== c.lastDate;

  const petitionerInfo = formatMultiplePersons(petitioner, petDetails, language);
  const respondentInfo = formatMultiplePersons(respondent, resDetails, language);

  // Effective role: lawyer, clerk, etc.
  const activeUserRole = userType || (() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('appUser') : null;
      return u ? JSON.parse(u)?.userType : 'lawyer';
    } catch {
      return 'lawyer';
    }
  })();

  // Professional associates contacts (মুহুরী ও সহকারী / আইনজীবী ও সহকারী)
  const { clerkContacts, lawyerContacts } = (() => {
    const clerks: Array<{ role: 'clerk' | 'assistant'; name: string; phone: string; roleBadge: string }> = [];
    const lawyers: Array<{ role: 'lawyer' | 'assistant'; name: string; phone: string; roleBadge: string }> = [];

    const addPhoneList = (rawPhones: string[] | string | undefined, defaultName: string, role: 'clerk' | 'lawyer' | 'assistant', badge: string, targetArr: any[]) => {
      if (!rawPhones) return;
      const arr = Array.isArray(rawPhones) ? rawPhones : [rawPhones];
      arr.forEach(p => {
        if (p && typeof p === 'string') {
          p.split(/[,;\n]+/).forEach(single => {
            const clean = single.trim();
            if (clean && !targetArr.some(item => item.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, ''))) {
              targetArr.push({
                role,
                name: defaultName,
                phone: clean,
                roleBadge: badge
              });
            }
          });
        }
      });
    };

    if (selectedPartyRole === 'petitioner') {
      // Petitioner Clerk & Assistants
      addPhoneList(c.petitionerClerkMobile, c.petitionerClerk || (language === 'bn' ? 'মুহুরী (বাদী)' : 'Clerk'), 'clerk', language === 'bn' ? 'মুহুরী' : 'Clerk', clerks);
      addPhoneList(c.petitionerAsstClerkMobile, c.petitionerAsstClerk || (language === 'bn' ? 'সহকারী মুহুরী (বাদী)' : 'Asst Clerk'), 'assistant', language === 'bn' ? 'সহকারী' : 'Asst', clerks);
      addPhoneList(c.assignedClerkAssistantMobile, c.assignedClerkAssistantName || (language === 'bn' ? 'সহকারী' : 'Assistant'), 'assistant', language === 'bn' ? 'সহকারী' : 'Asst', clerks);
      addPhoneList((c as any).clerkMobile, (c as any).clerkName || (language === 'bn' ? 'মুহুরী' : 'Clerk'), 'clerk', language === 'bn' ? 'মুহুরী' : 'Clerk', clerks);

      // Petitioner Lawyer & Assistants
      addPhoneList(c.petitionerLawyerMobile, c.petitionerLawyer || (language === 'bn' ? 'বিজ্ঞ আইনজীবী (বাদী)' : 'Lawyer'), 'lawyer', language === 'bn' ? 'আইনজীবী' : 'Lawyer', lawyers);
      addPhoneList(c.petitionerAsstLawyerMobile, (language === 'bn' ? 'সহকারী আইনজীবী (বাদী)' : 'Asst Lawyer'), 'assistant', language === 'bn' ? 'সহকারী' : 'Asst', lawyers);
      addPhoneList(c.assignedAssociateMobile, c.assignedAssociateName || (language === 'bn' ? 'চেম্বার এসোসিয়েট' : 'Associate'), 'assistant', language === 'bn' ? 'এসোসিয়েট' : 'Assoc', lawyers);
      addPhoneList((c as any).lawyerMobile, (c as any).lawyerName || (language === 'bn' ? 'বিজ্ঞ আইনজীবী' : 'Lawyer'), 'lawyer', language === 'bn' ? 'আইনজীবী' : 'Lawyer', lawyers);
    } else {
      // Respondent Clerk & Assistants
      addPhoneList(c.respondentClerkMobile, c.respondentClerk || (language === 'bn' ? 'মুহুরী (বিবাদী)' : 'Clerk'), 'clerk', language === 'bn' ? 'মুহুরী' : 'Clerk', clerks);
      addPhoneList(c.respondentAsstClerkMobile, c.respondentAsstClerk || (language === 'bn' ? 'সহকারী মুহুরী (বিবাদী)' : 'Asst Clerk'), 'assistant', language === 'bn' ? 'সহকারী' : 'Asst', clerks);
      addPhoneList(c.assignedClerkAssistantMobile, c.assignedClerkAssistantName || (language === 'bn' ? 'সহকারী' : 'Assistant'), 'assistant', language === 'bn' ? 'সহকারী' : 'Asst', clerks);
      addPhoneList((c as any).clerkMobile, (c as any).clerkName || (language === 'bn' ? 'মুহুরী' : 'Clerk'), 'clerk', language === 'bn' ? 'মুহুরী' : 'Clerk', clerks);

      // Respondent Lawyer & Assistants
      addPhoneList(c.respondentLawyerMobile, c.respondentLawyer || (language === 'bn' ? 'বিজ্ঞ আইনজীবী (বিবাদী)' : 'Lawyer'), 'lawyer', language === 'bn' ? 'আইনজীবী' : 'Lawyer', lawyers);
      addPhoneList(c.respondentAsstLawyerMobile, (language === 'bn' ? 'সহকারী আইনজীবী (বিবাদী)' : 'Asst Lawyer'), 'assistant', language === 'bn' ? 'সহকারী' : 'Asst', lawyers);
      addPhoneList(c.assignedAssociateMobile, c.assignedAssociateName || (language === 'bn' ? 'চেম্বার এসোসিয়েট' : 'Associate'), 'assistant', language === 'bn' ? 'এসোসিয়েট' : 'Assoc', lawyers);
      addPhoneList((c as any).lawyerMobile, (c as any).lawyerName || (language === 'bn' ? 'বিজ্ঞ আইনজীবী' : 'Lawyer'), 'lawyer', language === 'bn' ? 'আইনজীবী' : 'Lawyer', lawyers);
    }

    return { clerkContacts: clerks, lawyerContacts: lawyers };
  })();

  // Contacts for the currently represented side (বাদী বা বিবাদী পক্ষ)
  const representedContacts = (() => {
    const list: Array<{ name: string; phone: string; serial?: number | string }> = [];
    if (selectedPartyRole === 'petitioner') {
      if (petDetails && petDetails.length > 0) {
        petDetails.forEach((p, idx) => {
          if (p.phone && p.phone.trim()) {
            list.push({
              name: p.name || (language === 'bn' ? `বাদী #${p.serial || idx + 1}` : `Petitioner #${p.serial || idx + 1}`),
              phone: p.phone.trim(),
              serial: p.serial || idx + 1
            });
          }
        });
      }
      if (c.petitionerMobile && c.petitionerMobile.trim() && !list.some(item => item.phone.replace(/[^0-9]/g, '') === c.petitionerMobile?.replace(/[^0-9]/g, ''))) {
        list.push({
          name: c.petitioner || (language === 'bn' ? 'বাদী' : 'Petitioner'),
          phone: c.petitionerMobile.trim(),
          serial: 1
        });
      }
    } else {
      if (resDetails && resDetails.length > 0) {
        resDetails.forEach((r, idx) => {
          if (r.phone && r.phone.trim()) {
            list.push({
              name: r.name || (language === 'bn' ? `বিবাদী #${r.serial || idx + 1}` : `Respondent #${r.serial || idx + 1}`),
              phone: r.phone.trim(),
              serial: r.serial || idx + 1
            });
          }
        });
      }
      if (c.respondentMobile && c.respondentMobile.trim() && !list.some(item => item.phone.replace(/[^0-9]/g, '') === c.respondentMobile?.replace(/[^0-9]/g, ''))) {
        list.push({
          name: c.respondent || (language === 'bn' ? 'বিবাদী / আসামী' : 'Respondent / Accused'),
          phone: c.respondentMobile.trim(),
          serial: 1
        });
      }
    }
    return list;
  })();

  // Permissions & Role-based visibility for call buttons
  // 1. Muhuri Dashboard -> Only Lawyer Call Button
  // 2. Lawyer Dashboard -> Only Muhuri Call Button
  // 3. Client Dashboard -> Muhuri / Lawyer Call buttons based on tracking permissions (clerkCanCall / lawyerCanCall)
  const isLawyerUser = activeUserRole === 'lawyer' || activeUserRole === 'bar_admin' || activeUserRole === 'district_admin';
  const isClerkUser = activeUserRole === 'clerk';
  const isClientUser = activeUserRole === 'client';

  const shouldShowClerkButton = isLawyerUser
    ? true
    : isClerkUser
    ? false
    : isClientUser
    ? (c.clerkCanCall !== false && (clerkContacts.length > 0 || !!c.petitionerClerkMobile || !!c.respondentClerkMobile || !!(c as any).clerkMobile))
    : true;

  const shouldShowLawyerButton = isClerkUser
    ? true
    : isLawyerUser
    ? false
    : isClientUser
    ? (c.lawyerCanCall !== false && (lawyerContacts.length > 0 || !!c.petitionerLawyerMobile || !!c.respondentLawyerMobile || !!(c as any).lawyerMobile))
    : true;

  return (
    <div className={`w-full rounded-lg sm:rounded-xl transition-all duration-300 overflow-hidden p-1 sm:p-1.5 md:p-2 relative ${
      selectedPartyRole === 'petitioner'
        ? (isUpdatedToday
            ? 'bg-[linear-gradient(180deg,#e0f2fe_0%,#e0f2fe_50%,#fef08a_50%,#fef08a_100%)] dark:bg-[linear-gradient(180deg,rgba(8,47,73,0.85)_0%,rgba(8,47,73,0.85)_50%,rgba(120,53,15,0.85)_50%,rgba(120,53,15,0.85)_100%)] border-2 border-sky-400 dark:border-sky-500 shadow-md ring-1 ring-amber-400/80'
            : 'bg-sky-50/95 hover:bg-sky-100/70 dark:bg-sky-950/40 border-2 border-sky-300 dark:border-sky-700/70 shadow-xs hover:shadow-md')
        : (isUpdatedToday
            ? 'bg-[linear-gradient(180deg,#ffe4e6_0%,#ffe4e6_50%,#fef08a_50%,#fef08a_100%)] dark:bg-[linear-gradient(180deg,rgba(76,5,25,0.85)_0%,rgba(76,5,25,0.85)_50%,rgba(120,53,15,0.85)_50%,rgba(120,53,15,0.85)_100%)] border-2 border-rose-400 dark:border-rose-500 shadow-md ring-1 ring-amber-400/80'
            : 'bg-rose-50/95 hover:bg-rose-100/70 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-700/70 shadow-xs hover:shadow-md')
    }`}>
      {/* Floating Call Proof Toast */}
      <AnimatePresence>
        {activeCallProofToast && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="absolute top-1.5 right-1.5 z-40 px-2.5 py-1 bg-emerald-950/95 border border-emerald-400 text-emerald-100 rounded-lg text-[9px] sm:text-[10px] font-black shadow-xl flex items-center gap-1.5"
          >
            <CheckCircle size={12} className="text-emerald-400 shrink-0" />
            <span>কলের প্রমাণ সংরক্ষিত: {activeCallProofToast.name} ({activeCallProofToast.time})</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: ALL BADGES, COMPACT SYMBOL CALL BUTTONS & VIEW CARD IN ONE TOP LINE */}
      <div className={`flex items-center justify-between gap-1 mb-1 pb-1 border-b border-dashed flex-wrap ${
        selectedPartyRole === 'petitioner'
          ? 'border-sky-300/60 dark:border-sky-800'
          : 'border-rose-300/60 dark:border-rose-800'
      }`}>
        {/* 1. বাম পাশ: ID, স্ট্যাটাস ব্যাজ ও বড় সুস্পষ্ট পক্ষ বাটন */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
          <span className="text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
            ID: {c.id}
          </span>
          {isPastForCase && (
            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
              {language === 'bn' ? 'বিগত ধার্য' : 'Past'}
            </span>
          )}
          {/* Yellow Updated Indicator Badge */}
          {isUpdatedToday && (
            <span className="text-[8.5px] sm:text-[9.5px] font-black px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full border border-amber-500 shadow-3xs flex items-center gap-1 animate-in fade-in">
              <Sparkles size={10} className="shrink-0 text-amber-950" />
              <span>{language === 'bn' ? 'আপডেট সম্পন্ন' : 'Updated'}</span>
            </span>
          )}
          {/* Direct Save Success Badge */}
          {directSaveSuccess && (
            <span className="text-[8.5px] sm:text-[9.5px] font-black px-2 py-0.5 bg-emerald-500 text-white rounded-full border border-emerald-600 shadow-sm flex items-center gap-1 animate-in zoom-in duration-150">
              <Check size={10} className="shrink-0 text-white" />
              <span>{language === 'bn' ? 'সংরক্ষিত!' : 'Saved!'}</span>
            </span>
          )}

          {/* পক্ষ বাটন (PARTY BUTTON) - বড় ও সুস্পষ্ট লেখার সাইজ */}
          {selectedPartyRole === 'petitioner' ? (
            <button
              type="button"
              onClick={() => setShowPartyModal(true)}
              className="text-[10px] sm:text-[11.5px] md:text-[12.5px] font-black px-2.5 sm:px-3 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-900 dark:bg-sky-900/70 dark:text-sky-100 rounded-lg border border-sky-300 dark:border-sky-700 shadow-3xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title={language === 'bn' ? 'পক্ষ পরিবর্তন করতে ক্লিক করুন' : 'Click to change party'}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 animate-pulse" />
              <span>{language === 'bn' ? 'বাদী পক্ষ (নীল)' : 'Petitioner (Blue)'}</span>
              <span className="text-[8.5px] sm:text-[9.5px] font-extrabold opacity-85">
                • {selectedPartyAccess === 'all_sides' ? (language === 'bn' ? 'সকল পক্ষ' : 'All') : (language === 'bn' ? 'নিজ পক্ষ' : 'Own')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowPartyModal(true)}
              className="text-[10px] sm:text-[11.5px] md:text-[12.5px] font-black px-2.5 sm:px-3 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 dark:bg-rose-900/70 dark:text-rose-100 rounded-lg border border-rose-300 dark:border-rose-700 shadow-3xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title={language === 'bn' ? 'পক্ষ পরিবর্তন করতে ক্লিক করুন' : 'Click to change party'}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
              <span>{language === 'bn' ? 'আসামী / বিবাদী (লাল)' : 'Defendant (Red)'}</span>
              <span className="text-[8.5px] sm:text-[9.5px] font-extrabold opacity-85">
                • {selectedPartyAccess === 'all_sides' ? (language === 'bn' ? 'সকল পক্ষ' : 'All') : (language === 'bn' ? 'নিজ পক্ষ' : 'Own')}
              </span>
            </button>
          )}
        </div>
        
        {/* 2. ডান পাশ: সিম্বল হিসেবে সংকুচিত কল বাটন ও ভিউ কার্ড বাটন */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto justify-end">
          {/* বাটন ১: মুহুরী / সহকারী কল বাটন */}
          {shouldShowClerkButton && (
            clerkContacts.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowAddAssociateModal('clerk')}
                className="h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md flex items-center justify-center gap-1 border bg-purple-600 hover:bg-purple-700 text-white border-purple-400 shadow-3xs active:scale-95 transition-all shrink-0 cursor-pointer"
                title={language === 'bn' ? 'মুহুরীর নম্বর যুক্ত করে কল দিন' : 'Add Clerk Phone & Call'}
              >
                <UserCheck size={10} className="text-white shrink-0" />
                <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap">
                  + {language === 'bn' ? 'মুহুরী' : 'Clerk'}
                </span>
              </button>
            ) : clerkContacts.length === 1 ? (
              (() => {
                const pro = clerkContacts[0];
                const cleanPhone = pro.phone.replace(/[^0-9]/g, '');
                const callRecord = callLogs[cleanPhone];
                const isCalled = !!callRecord;
                return (
                  <div className="flex items-center gap-0.5">
                    <a
                      href={`tel:${pro.phone}`}
                      onClick={() => handleMakeCall(pro.name, pro.phone)}
                      className={`h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md flex items-center justify-center gap-1 border shadow-3xs active:scale-95 transition-all shrink-0 cursor-pointer ${
                        isCalled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-1 ring-emerald-400/60'
                          : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-400'
                      }`}
                      title={
                        isCalled
                          ? `${pro.name} (${pro.phone}) - কল সম্পন্ন: ${callRecord.timeFormatted}`
                          : `মুহুরী কল (${pro.roleBadge}): ${pro.name} - ${pro.phone}`
                      }
                    >
                      {isCalled ? <PhoneCall size={9} className="text-white shrink-0" /> : <UserCheck size={10} className="text-white shrink-0" />}
                      <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap">
                        {language === 'bn' ? 'মুহুরী' : 'Clerk'}
                      </span>
                    </a>
                    {isCalled && (
                      <span 
                        className="text-[7px] font-black px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 leading-none shadow-3xs flex items-center gap-0.5 whitespace-nowrap cursor-help"
                        title={`কলের প্রমাণ: ${pro.name} (${pro.phone}) - ${callRecord.timeFormatted}`}
                      >
                        <Check size={7} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{callRecord.timeFormatted.split(',')[0]}</span>
                      </span>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="relative inline-flex items-center">
                <div className="h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md flex items-center justify-between gap-1 border shadow-3xs bg-purple-600 hover:bg-purple-700 text-white border-purple-400 cursor-pointer">
                  <UserCheck size={10} className="text-white shrink-0 pointer-events-none" />
                  <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap pointer-events-none">
                    {language === 'bn' ? `মুহুরী (${clerkContacts.length})` : `Clerk (${clerkContacts.length})`}
                  </span>
                  <ChevronDown size={9} className="text-white shrink-0 pointer-events-none" />
                  <select
                    aria-label="মুহুরী বা সহকারী বেছে নিয়ে কল দিন"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900 bg-white font-bold text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const [phone, ...nameParts] = e.target.value.split(':::');
                        const name = nameParts.join(':::');
                        handleMakeCall(name, phone);
                        window.location.href = `tel:${phone}`;
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>
                      {language === 'bn' ? '-- মুহুরী/সহকারী বেছে নিয়ে কল দিন --' : '-- Select Clerk to Call --'}
                    </option>
                    {clerkContacts.map((cItem, cIdx) => (
                      <option key={cIdx} value={`${cItem.phone}:::${cItem.name}`} className="text-slate-900 py-1 font-sans">
                        {cIdx + 1}. {cItem.name} ({cItem.roleBadge}) - {cItem.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          )}

          {/* বাটন ২: আইনজীবী কল বাটন */}
          {shouldShowLawyerButton && (
            lawyerContacts.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowAddAssociateModal('lawyer')}
                className="h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md flex items-center justify-center gap-1 border bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-400 shadow-3xs active:scale-95 transition-all shrink-0 cursor-pointer"
                title={language === 'bn' ? 'আইনজীবীর নম্বর যুক্ত করে কল দিন' : 'Add Lawyer Phone & Call'}
              >
                <Scale size={10} className="text-white shrink-0" />
                <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap">
                  + {language === 'bn' ? 'আইনজীবী' : 'Lawyer'}
                </span>
              </button>
            ) : lawyerContacts.length === 1 ? (
              (() => {
                const pro = lawyerContacts[0];
                const cleanPhone = pro.phone.replace(/[^0-9]/g, '');
                const callRecord = callLogs[cleanPhone];
                const isCalled = !!callRecord;
                return (
                  <div className="flex items-center gap-0.5">
                    <a
                      href={`tel:${pro.phone}`}
                      onClick={() => handleMakeCall(pro.name, pro.phone)}
                      className={`h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md flex items-center justify-center gap-1 border shadow-3xs active:scale-95 transition-all shrink-0 cursor-pointer ${
                        isCalled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-1 ring-emerald-400/60'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-400'
                      }`}
                      title={
                        isCalled
                          ? `${pro.name} (${pro.phone}) - কল সম্পন্ন: ${callRecord.timeFormatted}`
                          : `আইনজীবী কল (${pro.roleBadge}): ${pro.name} - ${pro.phone}`
                      }
                    >
                      {isCalled ? <PhoneCall size={9} className="text-white shrink-0" /> : <Scale size={10} className="text-white shrink-0" />}
                      <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap">
                        {language === 'bn' ? 'আইনজীবী' : 'Lawyer'}
                      </span>
                    </a>
                    {isCalled && (
                      <span 
                        className="text-[7px] font-black px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 leading-none shadow-3xs flex items-center gap-0.5 whitespace-nowrap cursor-help"
                        title={`কলের প্রমাণ: ${pro.name} (${pro.phone}) - ${callRecord.timeFormatted}`}
                      >
                        <Check size={7} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{callRecord.timeFormatted.split(',')[0]}</span>
                      </span>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="relative inline-flex items-center h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md justify-between gap-1 border shadow-3xs bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-400 cursor-pointer">
                <Scale size={10} className="text-white shrink-0 pointer-events-none" />
                <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap pointer-events-none">
                  {language === 'bn' ? `আইনজীবী (${lawyerContacts.length})` : `Lawyer (${lawyerContacts.length})`}
                </span>
                <ChevronDown size={9} className="text-white shrink-0 pointer-events-none" />
                <select
                  aria-label="আইনজীবী বা সহকারী বেছে নিয়ে কল দিন"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900 bg-white font-bold text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const [phone, ...nameParts] = e.target.value.split(':::');
                      const name = nameParts.join(':::');
                      handleMakeCall(name, phone);
                      window.location.href = `tel:${phone}`;
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    {language === 'bn' ? '-- আইনজীবী/সহকারী বেছে নিয়ে কল দিন --' : '-- Select Lawyer to Call --'}
                  </option>
                  {lawyerContacts.map((lItem, lIdx) => (
                    <option key={lIdx} value={`${lItem.phone}:::${lItem.name}`} className="text-slate-900 py-1 font-sans">
                      {lIdx + 1}. {lItem.name} ({lItem.roleBadge}) - {lItem.phone}
                    </option>
                  ))}
                </select>
              </div>
            )
          )}

          {/* মক্কেল / পক্ষগণের কল বাটন (সিম্বল হিসেবে সংকুচিত - ১টি বাটনে সকলের নাম ও ড্রপডাউন সিলেক্ট) */}
          {representedContacts.length > 0 && (
            representedContacts.length === 1 ? (
              (() => {
                const contact = representedContacts[0];
                const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
                const callRecord = callLogs[cleanPhone];
                const isCalled = !!callRecord;
                return (
                  <div className="flex items-center gap-0.5">
                    <a 
                      href={`tel:${contact.phone}`} 
                      onClick={() => handleMakeCall(contact.name, contact.phone)}
                      className={`h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md flex items-center justify-center gap-1 border shadow-3xs active:scale-95 transition-all shrink-0 cursor-pointer ${
                        isCalled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400 ring-1 ring-emerald-400/60'
                          : selectedPartyRole === 'petitioner'
                          ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-400'
                          : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400'
                      }`}
                      title={
                        isCalled
                          ? `${contact.name} (${contact.phone}) - কল সম্পন্ন: ${callRecord.timeFormatted}`
                          : `মক্কেল কল: ${contact.name} - ${contact.phone}`
                      }
                    >
                      {isCalled ? (
                        <PhoneCall size={9} className="text-white shrink-0" />
                      ) : (
                        <Phone size={9} className="text-white fill-white shrink-0" />
                      )}
                      <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap">
                        {language === 'bn' ? 'মক্কেল' : 'Client'}
                      </span>
                    </a>

                    {isCalled && (
                      <span 
                        className="text-[7.5px] font-black px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 leading-none shadow-3xs flex items-center gap-0.5 whitespace-nowrap cursor-help"
                        title={`কলের প্রমাণ: ${contact.name} (${contact.phone}) - ${callRecord.timeFormatted}`}
                      >
                        <Check size={8} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{callRecord.timeFormatted.split(',')[0]}</span>
                      </span>
                    )}
                  </div>
                );
              })()
            ) : (
              <div 
                className={`relative inline-flex items-center h-5 sm:h-5.5 px-1.5 sm:px-2 rounded-md justify-between gap-1 border shadow-3xs transition-all shrink-0 cursor-pointer ${
                  selectedPartyRole === 'petitioner'
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-400'
                    : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400'
                }`}
                title={language === 'bn' ? 'ক্লিক করে যেকোনো মক্কেলকে বেছে নিয়ে কল দিন' : 'Click to select and call any client'}
              >
                <Phone size={9} className="text-white fill-white shrink-0 pointer-events-none" />
                <span className="text-[7.5px] sm:text-[8.5px] font-black leading-none text-white whitespace-nowrap pointer-events-none">
                  {selectedPartyRole === 'petitioner' ? (language === 'bn' ? 'বাদী' : 'Pet') : (language === 'bn' ? 'বিবাদী' : 'Resp')} ({representedContacts.length})
                </span>
                <ChevronDown size={9} className="text-white shrink-0 pointer-events-none" />

                <select
                  aria-label="মক্কেল নির্বাচন করে কল দিন"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900 bg-white font-bold text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (selectedVal) {
                      const [phone, ...nameParts] = selectedVal.split(':::');
                      const name = nameParts.join(':::');
                      handleMakeCall(name, phone);
                      window.location.href = `tel:${phone}`;
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="" disabled>
                    {language === 'bn' ? '-- নাম বেছে নিয়ে সরাসরি কল দিন --' : '-- Select Name to Call Directly --'}
                  </option>
                  {representedContacts.map((contact, idx) => {
                    const clean = contact.phone.replace(/[^0-9]/g, '');
                    const called = !!callLogs[clean];
                    return (
                      <option key={idx} value={`${contact.phone}:::${contact.name}`} className="text-slate-900 py-1 font-sans">
                        {idx + 1}. {contact.name} - {contact.phone} {called ? '✓ (কল সম্পন্ন)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )
          )}

          {/* হোয়াটসঅ্যাপ বাটন */}
          <button
            type="button"
            onClick={() => handleOpenWaPreview()}
            className="h-5 sm:h-5.5 px-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400 transition-all active:scale-95 shrink-0 shadow-3xs flex items-center gap-1 text-[8px] sm:text-[8.5px] font-black cursor-pointer"
            title={language === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান (প্রিভিউ সহ)' : 'WhatsApp (with Preview)'}
          >
            <MessageSquare size={10} className="fill-white text-white shrink-0" />
            <span className="hidden md:inline">WA</span>
          </button>

          {/* ভিউ কার্ড বাটন */}
          <button 
            onClick={() => onViewCard(c)}
            className="h-5 sm:h-5.5 px-1.5 rounded-md bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-700 hover:text-white border border-amber-200 dark:border-slate-700 transition-all active:scale-95 shrink-0 shadow-3xs flex items-center gap-1 text-[8px] sm:text-[8.5px] font-black cursor-pointer"
            title="ভিউ কার্ড"
          >
            <CreditCard size={10} className="shrink-0" />
            <span className="hidden md:inline">{language === 'bn' ? 'কার্ড' : 'Card'}</span>
          </button>
        </div>
      </div>

      {/* RESPONSIVE ULTRA-COMPACT EXPANDABLE PANEL - WORDS DO NOT BREAK, BOXES EXPAND SIDEWAYS */}
      <div className="w-full select-none mt-1 sm:mt-1.5">
        <div className="flex items-stretch gap-0.5 sm:gap-1 w-full">
          
          {/* 1. LEFT ARROW */}
          <button 
            type="button"
            onClick={() => rowRef.current?.scrollBy({ left: -140, behavior: 'smooth' })}
            title={language === 'bn' ? 'বামে স্ক্রোল করুন' : 'Scroll Left'}
            className="shrink-0 w-3.5 sm:w-5 md:w-6 self-stretch rounded sm:rounded-md bg-gradient-to-b from-blue-600 to-indigo-700 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all flex items-center justify-center shadow-3xs z-10"
          >
            <ArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3.5 md:w-3.5 md:h-4" />
          </button>

          {/* HORIZONTALLY SCROLLABLE INNER ROW */}
          <div 
            ref={rowRef}
            className="flex-1 min-w-0 flex flex-nowrap items-stretch gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none py-0.5 scroll-smooth"
          >

            {/* 2. পূর্ববর্তী তারিখ (PREVIOUS DATE) */}
            <div 
              title={language === 'bn' ? 'পূর্ববর্তী তারিখ' : 'Previous Date'}
              className="shrink-0 min-w-fit bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-blue-150/40 dark:border-slate-750 px-2 sm:px-2.5 shadow-3xs flex items-center justify-center min-h-[24px] sm:min-h-[27px] md:min-h-[30px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={prevDate}
                  onChange={(e) => setPrevDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                  placeholder="02/11"
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-blue-300 rounded text-[9.5px] sm:text-[11.5px] md:text-[13px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[50px]"
                />
              ) : (
                <p className="text-[9.5px] sm:text-[11.5px] md:text-[13px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {formatDayMonth(prevDate) || (language === 'bn' ? 'পূর্ব তারিখ' : 'Prev')}
                </p>
              )}
            </div>

            {/* 3. মামলা নং (CASE NUMBER) - LARGE CENTRAL GRADIENT & BOLDER / BIGGER FONT */}
            <div 
              title={language === 'bn' ? 'মামলা নং' : 'Case Number'}
              className="shrink-0 min-w-fit bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 text-white rounded sm:rounded-lg px-3 sm:px-3.5 shadow-2xs flex items-center justify-center min-h-[24px] sm:min-h-[27px] md:min-h-[30px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                  placeholder={language === 'bn' ? 'মামলা নং' : 'Case No'}
                  className="px-1.5 py-0 bg-indigo-900/60 border border-indigo-450 rounded text-[11px] sm:text-[13px] md:text-[14.5px] font-black text-white text-center focus:outline-none whitespace-nowrap min-w-[80px]"
                />
              ) : (
                <p className="text-[11px] sm:text-[13px] md:text-[14.5px] font-black tracking-tight leading-none text-center whitespace-nowrap">
                  {caseNumber || (language === 'bn' ? 'মামলা নং' : 'CASE NO')}
                </p>
              )}
            </div>

            {/* 4. বাদীর নাম (PLAINTIFF) - BOLDER & BIGGER FONT */}
            <div 
              title={petitionerInfo.fullNames ? `${language === 'bn' ? 'বাদী' : 'Plaintiff'}:\n${petitionerInfo.fullNames}` : (language === 'bn' ? 'বাদীর নাম' : 'Plaintiff')}
              className="shrink-0 min-w-fit bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-orange-150/40 dark:border-slate-750 px-3 sm:px-3.5 shadow-3xs flex items-center justify-center min-h-[24px] sm:min-h-[27px] md:min-h-[30px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={petitioner}
                  onChange={(e) => setPetitioner(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                  placeholder={language === 'bn' ? 'বাদী' : 'Plaintiff'}
                  className="px-1.5 py-0 bg-white dark:bg-slate-800 border border-orange-300 rounded text-[10.5px] sm:text-[12.5px] md:text-[13.5px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[80px]"
                />
              ) : (
                <p className="text-[10.5px] sm:text-[12.5px] md:text-[13.5px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {petitionerInfo.formatted || (language === 'bn' ? 'বাদী' : 'Plaintiff')}
                </p>
              )}
            </div>

            {/* 5. V/S (VERSUS) */}
            <div className="shrink-0 px-2 sm:px-2.5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded sm:rounded-md shadow-3xs flex items-center justify-center self-stretch min-h-[24px] sm:min-h-[27px] md:min-h-[30px]">
              <p className="text-[10px] sm:text-[12px] md:text-[13px] font-black tracking-tighter leading-none whitespace-nowrap">
                V/S
              </p>
            </div>

            {/* 6. আসামীর নাম (DEFENDANT) - BOLDER & BIGGER FONT */}
            <div 
              title={respondentInfo.fullNames ? `${language === 'bn' ? 'আসামী' : 'Defendant'}:\n${respondentInfo.fullNames}` : (language === 'bn' ? 'আসামীর নাম' : 'Defendant')}
              className="shrink-0 min-w-fit bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-emerald-150/40 dark:border-slate-750 px-3 sm:px-3.5 shadow-3xs flex items-center justify-center min-h-[24px] sm:min-h-[27px] md:min-h-[30px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                  placeholder={language === 'bn' ? 'আসামী' : 'Defendant'}
                  className="px-1.5 py-0 bg-white dark:bg-slate-800 border border-emerald-300 rounded text-[10.5px] sm:text-[12.5px] md:text-[13.5px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[80px]"
                />
              ) : (
                <p className="text-[10.5px] sm:text-[12.5px] md:text-[13.5px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {respondentInfo.formatted || (language === 'bn' ? 'আসামী' : 'Defendant')}
                </p>
              )}
            </div>

            {/* 7. পরবর্তী তারিখ (NEXT DATE) */}
            <div 
              onClick={() => !isEditMode && openDatePicker()}
              title={language === 'bn' ? 'পরবর্তী তারিখ (ক্যালেন্ডার খুলতে ক্লিক করুন)' : 'Next Date (Click to open calendar)'}
              className="shrink-0 min-w-fit bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-sky-150/40 dark:border-slate-750 px-2 sm:px-2.5 shadow-3xs flex items-center justify-center min-h-[24px] sm:min-h-[27px] md:min-h-[30px] cursor-pointer hover:border-sky-300 dark:hover:border-sky-500 hover:shadow-2xs active:scale-[0.98] transition-all"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={nextDate}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={openDatePicker}
                  onChange={(e) => setNextDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                  placeholder="02/11"
                  title={language === 'bn' ? 'তারিখ লিখুন বা ডাবল-ক্লিক করে ক্যালেন্ডার খুলুন' : 'Type date or double-click to open calendar'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-sky-300 rounded text-[9.5px] sm:text-[11.5px] md:text-[13px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[50px] cursor-text"
                />
              ) : (
                <p className="text-[9.5px] sm:text-[11.5px] md:text-[13px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {formatDayMonth(nextDate) || (language === 'bn' ? 'পর তারিখ' : 'Next')}
                </p>
              )}
            </div>

            {/* 8. ACTION SECTION - উপরে আদেশ ও নিচে পদক্ষেপ */}
            <div className="shrink-0 min-w-fit px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/40 rounded sm:rounded-lg border border-slate-200/50 dark:border-slate-750/50 flex flex-col justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]">
              {isEditMode ? (
                <div className="flex flex-col gap-0.5 h-full justify-center">
                  <input
                    type="text"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                    placeholder={language === 'bn' ? 'আদেশ / পদক্ষেপ' : 'Order / Step'}
                    title={language === 'bn' ? 'আদেশ বা পদক্ষেপ বাটনের লেখা পরিবর্তন করুন' : 'Change Order or Step text'}
                    className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-amber-400 rounded text-[7px] sm:text-[8.5px] md:text-[10px] font-black text-amber-950 dark:text-amber-200 text-center focus:outline-none whitespace-nowrap min-w-[55px]"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 h-full justify-between">
                  {/* উপরে আদেশ */}
                  <button
                    type="button"
                    onClick={() => {
                      setOrder(buttonLabels?.btnOrder || (language === 'bn' ? 'আদেশ' : 'ORDER'));
                      setShowOrderModal(true);
                    }}
                    className={`flex-1 rounded px-1.5 flex items-center justify-center transition-all leading-none cursor-pointer shadow-3xs ${
                      order === (buttonLabels?.btnOrder || 'আদেশ') || order === 'আদেশ'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black' 
                        : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 hover:from-amber-200 hover:to-orange-200 font-bold'
                    }`}
                    title={language === 'bn' ? 'মামলার আদেশ বিবরণ দেখুন (ক্লিক করুন)' : 'View Order Details (Click)'}
                  >
                    <span className="text-[6.5px] sm:text-[8px] md:text-[9.5px] font-black leading-none whitespace-nowrap">
                      {buttonLabels?.btnOrder || (language === 'bn' ? 'আদেশ' : 'ORDER')}
                    </span>
                  </button>

                  {/* নিচে পদক্ষেপ */}
                  <button
                    type="button"
                    onClick={() => {
                      setOrder(buttonLabels?.btnStep || (language === 'bn' ? 'পদক্ষেপ' : 'STEP'));
                      setShowStepModal(true);
                    }}
                    className={`flex-1 rounded px-1.5 flex items-center justify-center transition-all leading-none cursor-pointer shadow-3xs ${
                      order === (buttonLabels?.btnStep || 'পদক্ষেপ') || order === 'পদক্ষেপ'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black' 
                        : 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-900 border border-cyan-300 hover:from-cyan-200 hover:to-blue-200 font-bold'
                    }`}
                    title={language === 'bn' ? 'পদক্ষেপ ও ছবি আপলোড (ক্লিক করুন)' : 'Step & Photo Upload (Click)'}
                  >
                    <span className="text-[6.5px] sm:text-[8px] md:text-[9.5px] font-black leading-none whitespace-nowrap">
                      {buttonLabels?.btnStep || (language === 'bn' ? 'পদক্ষেপ' : 'STEP')}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 9. EDIT / SAVE BUTTON */}
            <button
              type="button"
              onClick={() => {
                if (isEditMode) {
                  handleDirectSaveEditMode();
                } else {
                  setIsEditMode(true);
                }
              }}
              title={isEditMode 
                ? (language === 'bn' ? 'পরিবর্তনসমূহ সংরক্ষণ করুন (ক্লিক করুন)' : 'Save changes (Click)') 
                : (language === 'bn' ? 'তথ্য এডিট করুন' : 'Edit Case Details')}
              className={`shrink-0 w-3.5 sm:w-5 md:w-6 self-stretch rounded sm:rounded-md flex flex-col items-center justify-center cursor-pointer transition-all py-0.5 shadow-xs ${
                isEditMode 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white scale-105 font-black ring-2 ring-emerald-300 dark:ring-emerald-600 shadow-md' 
                  : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white hover:from-violet-500 hover:to-indigo-600 active:scale-95'
              }`}
            >
              {isEditMode ? (
                <>
                  <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white animate-bounce" />
                  <span className="text-[4.5px] sm:text-[5.5px] md:text-[6.5px] font-black mt-0.5 leading-none whitespace-nowrap">SAVE</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                  <span className="text-[4.5px] sm:text-[5.5px] md:text-[6.5px] font-black mt-0.5 leading-none whitespace-nowrap">EDIT</span>
                </>
              )}
            </button>



            {/* 10. PARTY BOXES - 3 separate cards */}
            


            {/* Column B: বিচারকের আদেশ */}
            <div 
              onClick={() => !isEditMode && setShowOrderModal(true)}
              title={language === 'bn' ? 'বিচারকের আদেশ (ক্লিক করে বিস্তারিত দেখুন)' : 'Court Order (Click to view details)'}
              className="shrink-0 min-w-fit px-2 sm:px-2.5 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-orange-150/40 dark:border-slate-750 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px] cursor-pointer hover:border-orange-300 transition-all"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={clientNotes2}
                  onChange={(e) => setClientNotes2(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectSaveEditMode(); }}
                  placeholder={language === 'bn' ? 'আদেশ...' : 'Order...'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-orange-300 rounded text-[7px] sm:text-[8.5px] md:text-[10px] font-bold text-slate-800 dark:text-white outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold text-slate-800 dark:text-slate-200 leading-none text-center whitespace-nowrap">
                  {clientNotes2 || (language === 'bn' ? 'আদেশ' : 'Order')}
                </p>
              )}
            </div>

            {/* 11. UPDATE / SAVE BUTTON */}
            <button
              type="button"
              onClick={isEditMode ? handleDirectSaveEditMode : handleOpenConfirmUpdateModal}
              disabled={isSavingDirect}
              title={isEditMode 
                ? (language === 'bn' ? 'পরিবর্তনসমূহ সেভ করুন (ক্লিক করুন)' : 'Save Changes (Click)') 
                : (language === 'bn' ? 'তারিখ ও আদেশ আপডেট নিশ্চিত করুন' : 'Confirm Next Date & Order Update')}
              className={`shrink-0 px-2 sm:px-3 self-stretch rounded sm:rounded-md flex items-center justify-center gap-1 transition-all py-0.5 shadow-xs cursor-pointer text-white font-black active:scale-95 ${
                isEditMode
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 hover:from-emerald-400 hover:to-green-500 ring-2 ring-emerald-300 dark:ring-emerald-600 shadow-md scale-105'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 scale-[1.02]'
              }`}
            >
              {isSavingDirect ? (
                <RefreshCw className="w-3 h-3 text-white animate-spin" />
              ) : directSaveSuccess ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <Save className="w-3 h-3 text-white" />
              )}
              <span className="text-[9px] sm:text-[10px] font-black leading-none whitespace-nowrap">
                {isSavingDirect 
                  ? (language === 'bn' ? 'সংরক্ষণ...' : 'Saving...')
                  : directSaveSuccess
                    ? (language === 'bn' ? 'সংরক্ষিত!' : 'SAVED!')
                    : isEditMode 
                      ? (language === 'bn' ? 'সেভ' : 'SAVE') 
                      : (language === 'bn' ? 'আপডেট' : 'UPDATE')}
              </span>
            </button>

          </div>

          {/* 12. RIGHT ARROW */}
          <button 
            type="button"
            onClick={() => rowRef.current?.scrollBy({ left: 140, behavior: 'smooth' })}
            title={language === 'bn' ? 'ডানে স্ক্রোল করুন' : 'Scroll Right'}
            className="shrink-0 w-3.5 sm:w-5 md:w-6 self-stretch rounded sm:rounded-md bg-gradient-to-b from-blue-600 to-indigo-700 text-white cursor-pointer hover:from-blue-500 hover:to-indigo-600 active:scale-95 transition-all flex items-center justify-center shadow-3xs z-10"
          >
            <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          </button>

        </div>
      </div>

      {/* 13. Month Calendar Picker Modal - CURRENT MONTH VIEW */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
          onClick={() => setShowDatePicker(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-sky-200 dark:border-slate-750 w-full max-w-[310px] p-4 flex flex-col gap-3 text-slate-800 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title and Close button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <CalendarIcon size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'পরবর্তী তারিখ নির্বাচন' : 'Select Next Date'}
                  </h4>
                  <p className="text-[9.5px] font-bold text-sky-600 dark:text-sky-400">
                    {language === 'bn' ? 'তারিখে ক্লিক করলে পরবর্তী তারিখ হিসেবে সেট হবে' : 'Click any date to set as Next Date'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Month Navigation Row */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                title={language === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous Month'}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="text-center">
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {monthNamesBn[pickerMonth.getMonth()] || pickerMonth.toLocaleString('default', { month: 'long' })}{' '}
                  {language === 'bn' ? toBn(pickerMonth.getFullYear()) : pickerMonth.getFullYear()}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPickerMonth(new Date())}
                  className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-300 hover:bg-sky-100 transition-all border border-sky-150 dark:border-slate-700 cursor-pointer"
                  title={language === 'bn' ? 'চলতি মাস' : 'Current Month'}
                >
                  {language === 'bn' ? 'চলতি মাস' : 'Current'}
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                  title={language === 'bn' ? 'পরবর্তী মাস' : 'Next Month'}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDaysShort.map((dayName, idx) => {
                const isWeekend = idx === 5 || idx === 6; // Friday & Saturday
                return (
                  <span 
                    key={dayName} 
                    className={`text-[9px] font-black uppercase tracking-wider py-1 ${
                      isWeekend ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {dayName}
                  </span>
                );
              })}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank days before 1st of month */}
              {Array.from({ length: new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1).getDay() }, (_, i) => (
                <div key={`blank-${i}`} className="w-full aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from(
                { length: new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0).getDate() },
                (_, i) => i + 1
              ).map(day => {
                const y = pickerMonth.getFullYear();
                const m = String(pickerMonth.getMonth() + 1).padStart(2, '0');
                const d = String(day).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                const dmStr = `${d}/${m}`;

                const todayObj = new Date();
                const isToday = todayObj.getFullYear() === y && todayObj.getMonth() === pickerMonth.getMonth() && todayObj.getDate() === day;
                const isCurrentNextDate = (
                  nextDate === dateStr || 
                  nextDate === dmStr || 
                  formatDayMonth(nextDate) === dmStr
                );
                const dayOfWeek = new Date(y, pickerMonth.getMonth(), day).getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectNextDate(dateStr);
                    }}
                    title={language === 'bn' ? `${toBn(day)} তারিখ পরবর্তী তারিখ হিসেবে সেট করুন` : `Set ${dateStr} as Next Date`}
                    className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all cursor-pointer relative active:scale-95 ${
                      isCurrentNextDate
                        ? 'bg-sky-600 text-white font-black shadow-sm scale-105 z-10'
                        : isToday
                          ? 'border border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-black'
                          : isWeekend
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 font-bold'
                    }`}
                  >
                    <span>{language === 'bn' ? toBn(day) : day}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer with Today quick select and Cancel */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const today = new Date();
                  const y = today.getFullYear();
                  const m = String(today.getMonth() + 1).padStart(2, '0');
                  const d = String(today.getDate()).padStart(2, '0');
                  handleSelectNextDate(`${y}-${m}-${d}`);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer active:scale-95"
              >
                {language === 'bn' ? 'আজকের তারিখ' : 'Today'}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDatePicker(false);
                }}
                className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold transition-all cursor-pointer active:scale-95"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Next Date Calendar Screen Modal */}
      {showConfirmUpdateModal && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
          onClick={() => !isSavingConfirm && setShowConfirmUpdateModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-300 dark:border-slate-700 w-full max-w-[325px] sm:max-w-[360px] max-h-[90vh] flex flex-col text-slate-800 dark:text-white relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Overlay */}
            {updateConfirmSuccess && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                <CheckCircle size={36} className="text-emerald-500 animate-bounce" />
                <p className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300">
                  {language === 'bn' ? 'মামলার তথ্য সফলভাবে আপডেট হয়েছে!' : 'Case successfully updated!'}
                </p>
              </div>
            )}

            {/* Header - Fixed at Top */}
            <div className="shrink-0 flex items-center justify-between p-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarIcon size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'তারিখ ও আদেশ নিশ্চিতকরণ' : 'Confirm Date & Order'}
                  </h4>
                  <p className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400">
                    {language === 'bn' ? `মামলা নং: ${caseNumber || c.caseNumber}` : `Case No: ${caseNumber || c.caseNumber}`}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowConfirmUpdateModal(false)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {/* Next Date Selected Banner */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/60 py-1.5 px-2.5 rounded-xl border border-sky-150 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    {language === 'bn' ? 'নির্ধারিত আগামী তারিখ' : 'Selected Next Date'}
                  </span>
                  <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {formatDayMonth(pendingNextDate) || pendingNextDate || (language === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Select Date')}
                  </p>
                </div>
                <span className="text-[9.5px] font-extrabold bg-sky-500 text-white px-2 py-0.5 rounded-md shadow-2xs">
                  {pendingNextDate ? formatDayMonth(pendingNextDate) : (language === 'bn' ? 'অপেক্ষমান' : 'Pending')}
                </span>
              </div>

              {/* Compact Calendar View for Next Date */}
              <div className="bg-slate-50/80 dark:bg-slate-850 p-2 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                {/* Month Header Navigation */}
                <div className="flex items-center justify-between px-0.5">
                  <button
                    type="button"
                    onClick={() => setConfirmPickerMonth(new Date(confirmPickerMonth.getFullYear(), confirmPickerMonth.getMonth() - 1, 1))}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-all cursor-pointer"
                    title={language === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous Month'}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  <span className="text-[11px] font-black text-slate-800 dark:text-white">
                    {monthNamesBn[confirmPickerMonth.getMonth()] || confirmPickerMonth.toLocaleString('default', { month: 'long' })}{' '}
                    {language === 'bn' ? toBn(confirmPickerMonth.getFullYear()) : confirmPickerMonth.getFullYear()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setConfirmPickerMonth(new Date())}
                      className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-sky-50"
                    >
                      {language === 'bn' ? 'চলতি মাস' : 'Current'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPickerMonth(new Date(confirmPickerMonth.getFullYear(), confirmPickerMonth.getMonth() + 1, 1))}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-all cursor-pointer"
                      title={language === 'bn' ? 'পরবর্তী মাস' : 'Next Month'}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {weekDaysShort.map((dayName, idx) => (
                    <span 
                      key={dayName} 
                      className={`text-[7.5px] font-black uppercase py-0.2 ${
                        idx === 5 || idx === 6 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {dayName}
                    </span>
                  ))}
                </div>

                {/* Days Grid - Ultra Compact */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: new Date(confirmPickerMonth.getFullYear(), confirmPickerMonth.getMonth(), 1).getDay() }, (_, i) => (
                    <div key={`blank-confirm-${i}`} className="w-full h-6 sm:h-6.5" />
                  ))}

                  {Array.from(
                    { length: new Date(confirmPickerMonth.getFullYear(), confirmPickerMonth.getMonth() + 1, 0).getDate() },
                    (_, i) => i + 1
                  ).map(day => {
                    const y = confirmPickerMonth.getFullYear();
                    const m = String(confirmPickerMonth.getMonth() + 1).padStart(2, '0');
                    const d = String(day).padStart(2, '0');
                    const dateStr = `${y}-${m}-${d}`;
                    const dmStr = `${d}/${m}`;

                    const isSelected = (
                      pendingNextDate === dateStr || 
                      pendingNextDate === dmStr || 
                      formatDayMonth(pendingNextDate) === dmStr
                    );

                    const todayObj = new Date();
                    const isToday = todayObj.getFullYear() === y && todayObj.getMonth() === confirmPickerMonth.getMonth() && todayObj.getDate() === day;
                    const dayOfWeek = new Date(y, confirmPickerMonth.getMonth(), day).getDay();
                    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                    return (
                      <button
                        key={`conf-day-${day}`}
                        type="button"
                        onClick={() => setPendingNextDate(dateStr)}
                        className={`w-full h-6 sm:h-6.5 rounded flex items-center justify-center text-[9.5px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black shadow-xs scale-105 z-10'
                            : isToday
                              ? 'border border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                              : isWeekend
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 font-bold'
                        }`}
                      >
                        {language === 'bn' ? toBn(day) : day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Field for Next Date (আদেশ এর ঘর) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[9.5px] font-black text-slate-700 dark:text-slate-200">
                    {language === 'bn' ? 'আগামী তারিখের আদেশ / পদক্ষেপ:' : 'Order for Next Date:'}
                  </label>
                  <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    {language === 'bn' ? 'সম্পাদনযোগ্য' : 'Editable'}
                  </span>
                </div>
                <input
                  type="text"
                  value={pendingOrderText}
                  onChange={(e) => setPendingOrderText(e.target.value)}
                  placeholder={language === 'bn' ? 'আদেশের বিবরণ লিখুন...' : 'Enter order description...'}
                  className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-white"
                />

                {/* Quick suggestion tags */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {['হাজিরা', 'সমন', 'স্বাক্ষী', 'জেরা', 'যুক্তি', 'রায়', 'সময় প্রার্থনা'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPendingOrderText(chip)}
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded border transition-all cursor-pointer ${
                        pendingOrderText === chip
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Access Scope Buttons: নিজ ডায়েরি এবং উভয় পক্ষ */}
              <div className="space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                    <span>🔒</span>
                    <span>{language === 'bn' ? 'আপডেটের পরিধি নির্বাচন করুন:' : 'Select Update Scope:'}</span>
                  </label>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border ${
                    !confirmUpdateScope 
                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 animate-pulse'
                      : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {!confirmUpdateScope ? (language === 'bn' ? 'বাটন নির্বাচন আবশ্যক *' : 'Selection Required *') : (language === 'bn' ? 'নির্বাচিত' : 'Selected')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* বাটন ১: নিজ ডায়েরি */}
                  <button
                    type="button"
                    onClick={() => setConfirmUpdateScope('private_diary')}
                    className={`py-2 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      confirmUpdateScope === 'private_diary'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300 dark:ring-amber-500 scale-[1.02] font-black'
                        : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-650 hover:bg-amber-50/60 hover:border-amber-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Lock size={12} className={confirmUpdateScope === 'private_diary' ? 'text-white' : 'text-amber-600'} />
                      <span className="text-[10.5px] sm:text-[11.5px] font-black leading-tight whitespace-nowrap">
                        {language === 'bn' ? 'নিজ ডায়েরি' : 'Own Diary'}
                      </span>
                    </div>
                    <span className={`text-[7.5px] leading-tight ${confirmUpdateScope === 'private_diary' ? 'text-amber-100 font-bold' : 'text-slate-400 font-medium'}`}>
                      {language === 'bn' ? 'শুধুমাত্র নিজের অ্যাপে' : 'Private to own app'}
                    </span>
                  </button>

                  {/* বাটন ২: উভয় পক্ষ */}
                  <button
                    type="button"
                    onClick={() => setConfirmUpdateScope('both_parties')}
                    className={`py-2 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      confirmUpdateScope === 'both_parties'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 dark:ring-emerald-500 scale-[1.02] font-black'
                        : 'bg-white dark:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-650 hover:bg-emerald-50/60 hover:border-emerald-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Users size={12} className={confirmUpdateScope === 'both_parties' ? 'text-white' : 'text-emerald-600'} />
                      <span className="text-[10.5px] sm:text-[11.5px] font-black leading-tight whitespace-nowrap">
                        {language === 'bn' ? 'উভয় পক্ষ' : 'Both Parties'}
                      </span>
                    </div>
                    <span className={`text-[7.5px] leading-tight ${confirmUpdateScope === 'both_parties' ? 'text-emerald-100 font-bold' : 'text-slate-400 font-medium'}`}>
                      {language === 'bn' ? 'মক্কেল + হোয়াটসঅ্যাপ' : 'Client + WhatsApp'}
                    </span>
                  </button>
                </div>

                {confirmUpdateScope === 'both_parties' && (
                  <p className="text-[8px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-200/60 leading-tight">
                    {language === 'bn' 
                      ? '✓ উভয় পক্ষ ক্লায়েন্ট ড্যাশবোর্ডে আপডেট দেখতে পাবে এবং নিজ পক্ষের মোবাইলে স্বয়ংক্রিয় হোয়াটসঅ্যাপ বার্তা চলে যাবে।' 
                      : '✓ Both parties can view update on client dashboard & WhatsApp auto-message will be sent.'}
                  </p>
                )}

                {confirmUpdateScope === 'private_diary' && (
                  <p className="text-[8px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200/60 leading-tight">
                    {language === 'bn' 
                      ? '✓ শুধুমাত্র নিজের অ্যাপেই আপডেট থাকবে। বিজ্ঞ আইনজীবী/মুহুরি, নিজ পক্ষ বা অপর পক্ষ কেউ তা দেখতে পাবে না।' 
                      : '✓ Visible only in your app. Hidden from lawyers, clerks, own party and opposite side.'}
                  </p>
                )}
              </div>

              {/* Last Update Summary Note */}
              <div className="py-1 px-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 text-[9px] font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span>
                  {language === 'bn' ? 'লাস্ট আপডেট ধার্য তারিখ:' : 'Last Updated Date:'}
                </span>
                <span className="font-black text-amber-950 dark:text-amber-200">
                  {currentDiaryDate || prevDate || c.lastDate || 'আজকের তারিখ'}
                </span>
              </div>
            </div>

            {/* Action Buttons: Cancel & OK (Confirm) - Sticky at Bottom */}
            <div className="shrink-0 flex items-center gap-2 p-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/90 backdrop-blur-xs z-10">
              <button
                type="button"
                onClick={() => setShowConfirmUpdateModal(false)}
                disabled={isSavingConfirm}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmUpdateOk}
                disabled={isSavingConfirm || !confirmUpdateScope || !pendingNextDate}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  !confirmUpdateScope || !pendingNextDate
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-95'
                }`}
                title={!confirmUpdateScope ? (language === 'bn' ? 'আগে ‘নিজ ডায়েরি’ অথবা ‘উভয় পক্ষ’ সিলেক্ট করুন' : 'Select either Own Diary or Both Parties first') : ''}
              >
                {isSavingConfirm ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <CheckCircle size={13} />
                )}
                <span>{language === 'bn' ? 'আপডেট নিশ্চিত করুন' : 'Confirm Update'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13.5 PARTY DETERMINATION SEPARATE WINDOW / MODAL */}
      {showPartyModal && (
        <div 
          className="fixed inset-0 z-[255] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
          onClick={() => !isSavingParty && setShowPartyModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-600 w-full max-w-[340px] sm:max-w-[390px] flex flex-col text-slate-800 dark:text-white relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Overlay */}
            {partySaveSuccess && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 flex flex-col items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                <CheckCircle size={40} className="text-amber-500 animate-bounce" />
                <p className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300 text-center px-4">
                  {language === 'bn' 
                    ? 'পক্ষ নির্ধারণ ও মামলার তথ্য আপডেট সম্পন্ন! বক্সের উচ্চতায় ৫০% হলদেটে হয়ে দুই কালার ধারণ করেছে।' 
                    : 'Party determined & case updated! Box turned dual-color with 50% yellow.'}
                </p>
              </div>
            )}

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-850 dark:to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'পক্ষ নির্ধারণ ও আপডেট প্রাপক' : 'Party Determination'}
                  </h4>
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {language === 'bn' ? `মামলা নং: ${caseNumber || c.caseNumber}` : `Case: ${caseNumber || c.caseNumber}`}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPartyModal(false)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 sm:p-4 space-y-3.5 max-h-[75vh] overflow-y-auto scrollbar-thin">
              {/* Section 1: Red and Blue Formula (আগের লাল ও নীল ফর্মুলা) */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'bn' ? '১. আপনার প্রতিনিধিত্বকারী পক্ষ (সম্পূর্ণ ঘর নীল বা লাল রঙ হবে):' : '1. Representing Party (Full box changes color):'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* নীল - বাদী পক্ষ */}
                  <button
                    type="button"
                    onClick={() => setSelectedPartyRole('petitioner')}
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      selectedPartyRole === 'petitioner'
                        ? 'border-sky-500 bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 ring-2 ring-sky-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-sky-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs text-sky-600 dark:text-sky-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" />
                      <span>{language === 'bn' ? 'বাদী পক্ষ (নীল)' : 'Petitioner (Blue)'}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                      {petitionerInfo.formatted || (language === 'bn' ? '১ম পক্ষ' : '1st Party')}
                    </span>
                  </button>

                  {/* লাল - আসামী / বিবাদী পক্ষ */}
                  <button
                    type="button"
                    onClick={() => setSelectedPartyRole('respondent')}
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      selectedPartyRole === 'respondent'
                        ? 'border-rose-500 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-2 ring-rose-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs text-rose-600 dark:text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                      <span>{language === 'bn' ? 'আসামী / বিবাদী (লাল)' : 'Accused / Respondent (Red)'}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                      {respondentInfo.formatted || (language === 'bn' ? '২য় পক্ষ' : '2nd Party')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Section 2: নিজ পক্ষ ও সকল পক্ষ বাটন (পরবর্তী আপডেট কারা দেখতে পাবে) */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'bn' ? '২. মামলার পরবর্তী আপডেট কারা দেখতে পাবে?' : '2. Who will see next updates?'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* নিজ পক্ষ বাটন */}
                  <button
                    type="button"
                    onClick={() => setSelectedPartyAccess('our_side')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      selectedPartyAccess === 'our_side'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                      <Lock size={14} />
                    </div>
                    <span className="font-black text-xs">
                      {language === 'bn' ? 'নিজ পক্ষ' : 'Own Party'}
                    </span>
                    <span className="text-[8px] font-bold text-purple-600 dark:text-purple-400">
                      {language === 'bn' ? 'শুধুমাত্র নিজ মক্কেল' : 'Only your client'}
                    </span>
                  </button>

                  {/* সকল পক্ষ বাটন */}
                  <button
                    type="button"
                    onClick={() => setSelectedPartyAccess('all_sides')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                      selectedPartyAccess === 'all_sides'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <Globe size={14} />
                    </div>
                    <span className="font-black text-xs">
                      {language === 'bn' ? 'সকল পক্ষ' : 'All Parties'}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'bn' ? 'উভয় পক্ষের সবাই' : 'Both sides'}
                    </span>
                  </button>
                </div>

                {/* Explanation Banner depending on selection */}
                <div className={`mt-2 p-2 rounded-lg border text-[9px] font-bold flex items-center gap-1.5 ${
                  selectedPartyAccess === 'all_sides'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-purple-50/80 border-purple-200 text-purple-800 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300'
                }`}>
                  <ShieldCheck size={13} className="shrink-0" />
                  <span>
                    {selectedPartyAccess === 'all_sides'
                      ? (language === 'bn' ? 'আপনার অনুরোধ অনুযায়ী মামলার উভয় পক্ষ (বাদী ও বিবাদী সকল মক্কেল) মামলার পরবর্তী আপডেট দেখতে পাবে।' : 'Both parties will be able to see the next updates according to your request.')
                      : (language === 'bn' ? 'আপনার অনুরোধ অনুযায়ী শুধুমাত্র আপনার নিজ পক্ষ (মক্কেল) মামলার পরবর্তী আপডেট দেখতে পাবে।' : 'Only your own side / client will be able to see the next updates according to your request.')}
                  </span>
                </div>
              </div>

              {/* Yellow Notice Card */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-[9px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-tight">
                  {language === 'bn'
                    ? 'পক্ষ নির্ধারণ বা তারিখ আপডেট সম্পন্ন হলে মামলার বক্সের ৫০% উচ্চতা হলদেটে হয়ে দুই কালার ধারণ করবে, যাতে স্পষ্টভাবে বোঝা যায় এই মামলার তারিখ আপডেট করা হয়েছে।'
                    : 'When party determination or date is updated, 50% of the case box height will turn yellowish holding two colors to indicate date update.'}
                </p>
              </div>
            </div>

            {/* Footer with Finish & Cancel Buttons */}
            <div className="shrink-0 p-3 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPartyModal(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleFinishPartyDetermination}
                disabled={isSavingParty}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSavingParty ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                <span>{language === 'bn' ? 'ফিনিশ ও নিশ্চিত করুন' : 'Finish & Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ASSOCIATE / LAWYER / CLERK MODAL */}
      {showAddAssociateModal && (
        <div 
          className="fixed inset-0 z-[256] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
          onClick={() => !isSavingAssociate && setShowAddAssociateModal(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-purple-300 dark:border-purple-600 w-full max-w-[340px] sm:max-w-[390px] flex flex-col text-slate-800 dark:text-white relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between p-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-850 dark:to-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  {showAddAssociateModal === 'clerk' ? <UserCheck size={16} /> : <Scale size={16} />}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {showAddAssociateModal === 'clerk'
                      ? (language === 'bn' ? 'মুহুরী / সহকারীর নম্বর যুক্ত করুন' : 'Add Clerk / Assistant')
                      : (language === 'bn' ? 'বিজ্ঞ আইনজীবীর নম্বর যুক্ত করুন' : 'Add Lawyer Phone')}
                  </h4>
                  <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400">
                    {language === 'bn' ? `মামলা নং: ${caseNumber || c.caseNumber}` : `Case: ${caseNumber || c.caseNumber}`}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddAssociateModal(null)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {showAddAssociateModal === 'clerk'
                    ? (language === 'bn' ? 'মুহুরীর মোবাইল নম্বর (আবশ্যক):' : 'Clerk Mobile (Required):')
                    : (language === 'bn' ? 'আইনজীবীর মোবাইল নম্বর (আবশ্যক):' : 'Lawyer Mobile (Required):')}
                </label>
                <input
                  type="tel"
                  value={associateInputPhone}
                  onChange={(e) => setAssociateInputPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {showAddAssociateModal === 'clerk'
                    ? (language === 'bn' ? 'মুহুরীর নাম (ঐচ্ছিক):' : 'Clerk Name (Optional):')
                    : (language === 'bn' ? 'আইনজীবীর নাম (ঐচ্ছিক):' : 'Lawyer Name (Optional):')}
                </label>
                <input
                  type="text"
                  value={associateInputName}
                  onChange={(e) => setAssociateInputName(e.target.value)}
                  placeholder={showAddAssociateModal === 'clerk' ? 'যেমন: রহিম মুহুরী' : 'যেমন: অ্যাডভোকেট করিম'}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssociateModal(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isSavingAssociate || !associateInputPhone.trim()}
                  onClick={handleSaveAssociateAndCall}
                  className="flex-1 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PhoneCall size={12} />
                  <span>{isSavingAssociate ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ ও কল দিন' : 'Save & Call')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showOrderModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
          onClick={() => setShowOrderModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-200 dark:border-slate-750 w-full max-w-[390px] sm:max-w-[440px] p-4 sm:p-5 flex flex-col gap-3 text-slate-800 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Gavel size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'মামলার আদেশ বিবরণী' : 'Case Order Details'}
                  </h4>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {language === 'bn' ? 'গত ধার্য তারিখের আদেশ' : 'Previous Hearing Order'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Case Info Ribbon */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-indigo-600 text-white font-black text-[10px] rounded-md">
                  {caseNumber || c.caseNumber || (language === 'bn' ? 'মামলা নং' : 'Case No')}
                </span>
                <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400">
                  {c.courtName || (language === 'bn' ? 'আদালত' : 'Court')}
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                <span>{petitionerInfo.formatted || petitioner || (language === 'bn' ? 'বাদী' : 'Petitioner')}</span>
                <span className="text-purple-600 mx-1 font-black">VS</span>
                <span>{respondentInfo.formatted || respondent || (language === 'bn' ? 'আসামী' : 'Respondent')}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <span>
                  {language === 'bn' ? 'গত তারিখ: ' : 'Prev Date: '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatDayMonth(prevDate || c.lastDate) || prevDate || c.lastDate || (language === 'bn' ? 'নির্ধারিত নয়' : 'None')}
                  </strong>
                </span>
                <span>
                  {language === 'bn' ? 'পরবর্তী তারিখ: ' : 'Next Date: '}
                  <strong className="text-sky-600 dark:text-sky-400">
                    {formatDayMonth(nextDate || c.nextDate) || nextDate || c.nextDate || (language === 'bn' ? 'নির্ধারিত নয়' : 'None')}
                  </strong>
                </span>
              </div>
            </div>

            {/* Core Section: গত তারিখের আদেশ */}
            {(() => {
              const lastDateStr = prevDate || c.lastDate;
              const lastDateHistory = (c.history || []).find(h => h && (h.date === lastDateStr || h.date === c.lastDate));
              const mostRecentHistory = (c.history || []).slice().reverse().find(h => h && h.date !== nextDate);
              const previousOrder = lastDateHistory?.order || mostRecentHistory?.order || c.order || order || (language === 'bn' ? 'আদেশ' : 'Order');
              const previousOrderDetails = lastDateHistory?.description || mostRecentHistory?.description || clientNotes2 || c.additionalOrder || '';

              return (
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/40 dark:to-slate-850 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                      ⚖️ {language === 'bn' ? 'গত তারিখের আদেশ' : 'Previous Date Order'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-3xs">
                      {previousOrder}
                    </span>
                  </div>

                  {previousOrderDetails ? (
                    <div className="bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60 shadow-3xs">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                        {previousOrderDetails}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/80 dark:bg-slate-850/80 p-2.5 rounded-lg border border-emerald-150 dark:border-emerald-900/40 text-center">
                      <p className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">
                        {language === 'bn' 
                          ? `গত তারিখে "${previousOrder}" আদেশ হিসেবে সিলেক্ট করা ছিল।` 
                          : `"${previousOrder}" was selected as the order on the previous date.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Quick Order Selection Buttons */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                {language === 'bn' ? 'আদেশ নির্বাচন / পরিবর্তন করুন' : 'Select / Change Order'}
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { name: 'আদেশ', color: 'bg-emerald-600' },
                  { name: 'হাজিরা', color: 'bg-blue-600' },
                  { name: 'চার্জ', color: 'bg-amber-600' },
                  { name: 'সাক্ষী', color: 'bg-teal-600' },
                  { name: 'জেরা', color: 'bg-indigo-600' },
                  { name: 'যুক্তিতর্ক', color: 'bg-purple-600' },
                  { name: 'পদক্ষেপ', color: 'bg-cyan-600' },
                  { name: 'সময়ের আবেদন', color: 'bg-rose-600' }
                ].map(item => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setOrder(item.name);
                      if (onUpdateCaseLocal) {
                        onUpdateCaseLocal(c.id, { order: item.name });
                      }
                      updateCase(c.id.toString(), { order: item.name }).catch(() => {});
                    }}
                    className={`py-1 px-1 rounded-md text-[9px] font-bold text-center transition-all cursor-pointer ${
                      order === item.name 
                        ? `${item.color} text-white shadow-3xs scale-102 font-black` 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Past orders list if available in history */}
            {c.history && c.history.length > 0 && (
              <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto pr-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {language === 'bn' ? 'বিগত তারিখসমূহের আদেশের রেকর্ড' : 'Past Order Records'}
                </span>
                {c.history.slice(-3).reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[9px] bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-500">{formatDayMonth(h.date) || h.date}</span>
                    <span className="font-black text-slate-700 dark:text-slate-200">{h.order || h.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Attached Documents / PDFs */}
            {c.documents && c.documents.length > 0 && (
              <div className="flex flex-col gap-1 max-h-[95px] overflow-y-auto pr-1">
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                  <Paperclip size={10} />
                  {language === 'bn' ? 'সংযুক্ত নথিপত্র ও পিডিএফ' : 'Attached Documents & PDFs'}
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {c.documents.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-[9px]"
                    >
                      <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                        {doc.type === 'pdf' || doc.name.endsWith('.pdf') ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-black text-[8px] flex items-center gap-0.5 shrink-0">
                            📄 PDF
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-black text-[8px] flex items-center gap-0.5 shrink-0">
                            🖼️ IMG
                          </span>
                        )}
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[8.5px] flex items-center gap-1 shrink-0"
                      >
                        <Eye size={9} />
                        <span>{language === 'bn' ? 'দেখুন' : 'View'}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  const lastDateStr = prevDate || c.lastDate;
                  const lastDateHistory = (c.history || []).find(h => h && (h.date === lastDateStr || h.date === c.lastDate));
                  const mostRecentHistory = (c.history || []).slice().reverse().find(h => h && h.date !== nextDate);
                  const pOrder = lastDateHistory?.order || mostRecentHistory?.order || c.order || order || 'আদেশ';
                  const pDesc = lastDateHistory?.description || mostRecentHistory?.description || clientNotes2 || c.additionalOrder || '';
                  const copyText = `${caseNumber || c.caseNumber} - ${language === 'bn' ? 'গত তারিখের আদেশ' : 'Previous Order'}: ${pOrder} ${pDesc ? `(${pDesc})` : ''}`;
                  navigator.clipboard.writeText(copyText);
                  setCopiedOrder(true);
                  setTimeout(() => setCopiedOrder(false), 2000);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                {copiedOrder ? (
                  <>
                    <CheckCircle size={11} className="text-emerald-500" />
                    <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <FileText size={11} />
                    <span>{language === 'bn' ? 'আদেশ কপি করুন' : 'Copy Order'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="px-3.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-3xs active:scale-95"
              >
                {language === 'bn' ? 'ঠিক আছে' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. Case Step & Photo Upload Modal - আলাদা ভিউ যাতে ২টি বক্স রয়েছে */}
      {showStepModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
          onClick={() => setShowStepModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-cyan-200 dark:border-slate-750 w-full max-w-[440px] sm:max-w-[480px] p-4 sm:p-5 flex flex-col gap-3.5 text-slate-800 dark:text-white max-h-[92vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hidden Camera, Gallery & PDF File Inputs */}
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFilesAdded} 
            />
            <input 
              ref={galleryInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              onChange={handleFilesAdded} 
            />
            <input 
              ref={pdfFileInputRef}
              type="file" 
              accept="application/pdf,.pdf" 
              className="hidden" 
              onChange={handlePdfFileAdded} 
            />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Camera size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'মামলার পদক্ষেপ ও ছবি আপলোড' : 'Case Step & Photo Upload'}
                  </h4>
                  <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                    {language === 'bn' ? 'পদক্ষেপ নির্বাচন এবং স্বয়ংক্রিয় রি-সাইজ ছবি আপলোড' : 'Select Step & Upload Optimized Photos'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowStepModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Case Info Ribbon - ৩টি লাইনে বিন্যাস */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 flex flex-col gap-1.5 text-[10px]">
              {/* ১ম লাইন: মামলা নং এবং আদালত */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-indigo-600 text-white font-black rounded-md text-[10px]">
                  {caseNumber || c.caseNumber || 'মামলা নং'}
                </span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                  🏛️ {c.courtName || 'আদালত'}
                </span>
              </div>

              {/* ২য় লাইন: মামলার ধরন ও পক্ষ */}
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold inline-block leading-tight ${
                  c.caseType?.toLowerCase().includes('civil') || c.caseType?.includes('দেওয়ানী')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {c.caseType || (selectedStepType === 'civil' ? 'Civil' : 'Criminal')}
                </span>
                {selectedPartyRole === 'petitioner' ? (
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 rounded border border-sky-300 leading-tight">
                    {language === 'bn' ? 'বাদী পক্ষ' : 'Petitioner'}
                  </span>
                ) : (
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 rounded border border-rose-300 leading-tight">
                    {language === 'bn' ? 'আসামী / বিবাদী' : 'Respondent'}
                  </span>
                )}
              </div>

              {/* ৩য় লাইন: বাদী VS বিবাদী */}
              <div className="font-semibold text-slate-700 dark:text-slate-300 truncate pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <span>{petitionerInfo.formatted || petitioner || 'বাদী'}</span>
                <span className="text-purple-600 mx-1 font-black">VS</span>
                <span>{respondentInfo.formatted || respondent || 'বিবাদী'}</span>
              </div>
            </div>

            {/* ১ম বক্স: কি পদক্ষেপ নেওয়া হয়েছে তা নির্বাচন (BOX 1: STEP SELECTION) */}
            <div className="p-3 bg-gradient-to-br from-cyan-50/70 to-blue-50/40 dark:from-cyan-950/30 dark:to-slate-850 rounded-2xl border border-cyan-200 dark:border-cyan-800/60 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-cyan-900 dark:text-cyan-300 flex items-center gap-1">
                  📌 {language === 'bn' ? '১ম বক্স: পদক্ষেপ নির্বাচন করুন' : 'Box 1: Select Step Taken'}
                </span>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-cyan-600 text-white">
                  {selectedStep}
                </span>
              </div>

              {/* Case Type Toggle (ফৌজদারি / দেওয়ানী) */}
              <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800 p-1 rounded-xl border border-cyan-150 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedStepType('criminal')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[9.5px] font-black transition-all cursor-pointer text-center ${
                    selectedStepType === 'criminal'
                      ? 'bg-rose-600 text-white shadow-3xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  ⚖️ {language === 'bn' ? 'ফৌজদারি পদক্ষেপ' : 'Criminal Steps'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStepType('civil')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[9.5px] font-black transition-all cursor-pointer text-center ${
                    selectedStepType === 'civil'
                      ? 'bg-blue-600 text-white shadow-3xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📜 {language === 'bn' ? 'দেওয়ানী পদক্ষেপ' : 'Civil Steps'}
                </button>
              </div>

              {/* Step Chips Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 max-h-[140px] overflow-y-auto pr-0.5 custom-scrollbar">
                {(selectedStepType === 'criminal' ? [
                  'হাজিরা',
                  'সময় প্রার্থনা',
                  'জামিন দরখাস্ত',
                  'আত্মসমর্পণ ও জামিন',
                  'চার্জ শুনানি',
                  'চার্জ গঠন',
                  'সাক্ষ্য গ্রহণ (PW)',
                  'সাক্ষীর জেরা',
                  '৩৪২ পরীক্ষা',
                  'সাফাই সাক্ষী (DW)',
                  'যুক্তিতর্ক',
                  'রায়',
                  'আপিল / রিভিশন',
                  'ওয়ারেন্ট প্রত্যাহার',
                  'নারাজি দরখাস্ত'
                ] : [
                  'সমন জারি / ফেরত',
                  'লিখিত জবাব (WS)',
                  'আপোষ মীমাংসা (ADR)',
                  'বিচার্য বিষয় (ইস্যু)',
                  'দালিলিক প্রমাণ (SD)',
                  'চূড়ান্ত শুনানি (PH)',
                  'বাদীর সাক্ষ্য (PW)',
                  'জেরা',
                  'বিবাদীর সাক্ষ্য (DW)',
                  'যুক্তিতর্ক',
                  'রায় ও ডিক্রি',
                  'অস্থায়ী নিষেধাজ্ঞা',
                  'তদন্ত / কমিশনার',
                  'রিভিউ / আপিল',
                  'সময় প্রার্থনা'
                ]).map(stepName => (
                  <button
                    key={stepName}
                    type="button"
                    onClick={() => setSelectedStep(stepName)}
                    className={`py-1 px-1 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer truncate ${
                      selectedStep === stepName
                        ? `${selectedStepType === 'criminal' ? 'bg-rose-600' : 'bg-blue-600'} text-white shadow-3xs font-black scale-102`
                        : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-cyan-50'
                    }`}
                    title={stepName}
                  >
                    {stepName}
                  </button>
                ))}
              </div>

              {/* Custom step note or detail input */}
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={stepCustomNotes}
                  onChange={(e) => setStepCustomNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'পদক্ষেপের অতিরিক্ত বিবরণ লিখুন (যেমন: ৫ দিন সময় মঞ্জুর)...' : 'Additional step notes (e.g., granted 5 days)...'}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* ২য় বক্স: ছবি ও পিডিএফ আপলোড (BOX 2: PHOTO & PDF DOCUMENT UPLOAD) */}
            <div className="p-3 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/30 dark:to-slate-850 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  📁 {language === 'bn' ? '২য় বক্স: ফাইল ও ডকুমেন্ট আপলোড' : 'Box 2: File & Document Upload'}
                </span>
                <span className="text-[8.5px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ⚡ {language === 'bn' ? 'স্টোরেজ অপ্টিমাইজেশন' : 'Storage Optimization'}
                </span>
              </div>

              {/* USER-FRIENDLY FORMAT TOGGLE: Image (Camera) vs PDF (Document Upload) */}
              <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-amber-100/60 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    ⚖️ {language === 'bn' ? 'সংরক্ষণ ফরম্যাট পছন্দ করুন:' : 'Select Format to Optimize Storage:'}
                  </span>
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                    selectedUploadFormat === 'pdf' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {selectedUploadFormat === 'pdf' 
                      ? (language === 'bn' ? '🚀 PDF: ৭০-৯০% ডেটা সাশ্রয়ী' : '🚀 PDF: 70-90% Space Saved') 
                      : (language === 'bn' ? '📷 ক্যামেরা ছবি ফরম্যাট' : '📷 Camera Photo Format')
                    }
                  </span>
                </div>

                {/* Segmented Control Toggle Buttons */}
                <div className="grid grid-cols-2 p-1 bg-white/90 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-750 shadow-inner">
                  {/* Toggle 1: Image (Camera) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUploadFormat('image');
                      setSaveFormat('images');
                    }}
                    className={`py-2 px-2.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedUploadFormat === 'image'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <Camera size={14} className={selectedUploadFormat === 'image' ? 'text-white' : 'text-blue-600'} />
                    <span>{language === 'bn' ? 'ছবি (ক্যামেরা)' : 'Image (Camera)'}</span>
                  </button>

                  {/* Toggle 2: PDF (Document Upload) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUploadFormat('pdf');
                      setSaveFormat('pdf');
                    }}
                    className={`py-2 px-2.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                      selectedUploadFormat === 'pdf'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <FileText size={14} className={selectedUploadFormat === 'pdf' ? 'text-white' : 'text-emerald-600'} />
                    <span>{language === 'bn' ? 'পিডিএফ (ডকুমেন্ট আপলোড)' : 'PDF (Document Upload)'}</span>
                    <span className={`text-[7px] font-black px-1.5 py-0.2 rounded-full uppercase leading-none ${
                      selectedUploadFormat === 'pdf' 
                        ? 'bg-white text-emerald-700' 
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {language === 'bn' ? 'কম জায়গা' : 'Min Space'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic View based on User's Toggle Selection */}
              {selectedUploadFormat === 'pdf' ? (
                /* PDF DOCUMENT UPLOAD VIEW (SPACE OPTIMIZED) */
                <div className="flex flex-col gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-[9px] text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold flex items-center gap-1">
                      💡 {language === 'bn' 
                        ? 'পিডিএফ ফরম্যাটে সর্বনিম্ন স্টোরেজ খরচ হয় এবং সমস্ত পৃষ্ঠা এক ফাইলে সুশৃঙ্খল থাকে।' 
                        : 'PDF format consumes minimal storage and keeps all pages in a single file.'}
                    </span>
                  </div>

                  {/* PDF Upload and Camera Scan Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => pdfFileInputRef.current?.click()}
                      className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{language === 'bn' ? 'সরাসরি PDF ফাইল দিন' : 'Upload PDF File'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 hover:bg-emerald-50 text-slate-800 dark:text-slate-200 font-black text-[10px] flex items-center justify-center gap-1.5 shadow-3xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera size={13} className="text-emerald-600" />
                      <span>{language === 'bn' ? 'ক্যামেরা দিয়ে তুলে PDF' : 'Scan to PDF'}</span>
                    </button>
                  </div>

                  {/* Direct Uploaded PDF File Card */}
                  {uploadedPdfFile && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 shadow-3xs flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate max-w-[240px]">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="truncate">
                          <p className="text-[9.5px] font-bold text-slate-800 dark:text-slate-200 truncate" title={uploadedPdfFile.file.name}>
                            {uploadedPdfFile.file.name}
                          </p>
                          <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                            {Math.round(uploadedPdfFile.size / 1024)} KB • {language === 'bn' ? 'স্টোরেজ অপ্টিমাইজড PDF প্রস্তুত' : 'Optimized PDF Ready'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowPdfPreviewModal(true)}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all cursor-pointer"
                          title={language === 'bn' ? 'দেখুন' : 'View'}
                        >
                          <Eye size={12} />
                        </button>
                        <a
                          href={uploadedPdfFile.previewUrl}
                          download={uploadedPdfFile.file.name}
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer"
                          title={language === 'bn' ? 'ডাউনলোড' : 'Download'}
                        >
                          <Download size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setUploadedPdfFile(null)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-700 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                          title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scanned Pages from Camera for PDF Mode */}
                  {stepImages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 dark:text-slate-300">
                        <span>{language === 'bn' ? `ক্যামেরা স্ক্যানকৃত পৃষ্ঠা (${stepImages.length} টি):` : `Scanned Pages (${stepImages.length}):`}</span>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          + {language === 'bn' ? 'আরও পৃষ্ঠা তুলুন' : 'Add More Pages'}
                        </button>
                      </div>

                      {/* Scanned Thumbnails */}
                      <div className="grid grid-cols-3 gap-1.5 max-h-[110px] overflow-y-auto pr-0.5 custom-scrollbar">
                        {stepImages.map((imgItem, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 aspect-[3/4]">
                            <img src={imgItem.previewUrl} alt={imgItem.file.name} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[7px] font-bold px-1 rounded">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded cursor-pointer"
                            >
                              <Trash2 size={9} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Compiled PDF ready card */}
                      {compiledPdf && (
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-850 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate max-w-[220px]">
                            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                              <FileText size={16} />
                            </div>
                            <div className="truncate">
                              <p className="text-[9.5px] font-black text-slate-800 dark:text-slate-100 truncate">
                                {compiledPdf.file.name}
                              </p>
                              <p className="text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                                {Math.round(compiledPdf.size / 1024)} KB ({stepImages.length} {language === 'bn' ? 'পৃষ্ঠা সংকলন' : 'pages combined'})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowPdfPreviewModal(true)}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[8.5px] flex items-center gap-1 shadow-3xs cursor-pointer"
                            >
                              <Eye size={10} />
                              <span>{language === 'bn' ? 'প্রিভিউ' : 'Preview'}</span>
                            </button>
                            <a
                              href={compiledPdf.previewUrl}
                              download={compiledPdf.file.name}
                              className="p-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 font-bold text-[8.5px]"
                              title={language === 'bn' ? 'ডাউনলোড' : 'Download'}
                            >
                              <Download size={11} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!uploadedPdfFile && stepImages.length === 0 && (
                    <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border border-dashed border-emerald-300 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-1 text-slate-500">
                      <FileText size={22} className="text-emerald-600/80" />
                      <p className="text-[9.5px] font-bold text-slate-700 dark:text-slate-300">
                        {language === 'bn' ? 'কোনো PDF ডকুমেন্ট যুক্ত করা হয়নি' : 'No PDF document selected'}
                      </p>
                      <p className="text-[8px] text-slate-400">
                        {language === 'bn' ? 'সরাসরি PDF ফাইল আপলোড করুন অথবা ক্যামেরা দিয়ে তুলে PDF বানান' : 'Upload a PDF directly or capture pages via camera'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* IMAGE (CAMERA) UPLOAD VIEW */
                <div className="flex flex-col gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-[9px] text-blue-900 dark:text-blue-200 font-bold">
                    <span>{language === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুললে তা অটো ক্রপ ও কম্প্রেস করে ডেটা খরচ কমিয়ে সেভ করা হবে।' : 'Photos captured via camera will be auto-cropped and compressed to reduce data usage.'}</span>
                  </div>

                  {/* Upload Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-[10px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Camera size={13} />
                      <span>{language === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুলুন' : 'Camera Capture'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-slate-700 hover:bg-amber-50 text-slate-800 dark:text-slate-200 font-black text-[10px] flex items-center justify-center gap-1.5 shadow-3xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Upload size={13} className="text-amber-600" />
                      <span>{language === 'bn' ? 'ফাইল / গ্যালারি' : 'Upload Files'}</span>
                    </button>
                  </div>

                  {/* Compression in progress indicator */}
                  {isProcessingImages && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-white/80 dark:bg-slate-800 rounded-xl border border-amber-200 text-amber-700 text-[10px] font-bold">
                      <RefreshCw size={12} className="animate-spin text-amber-600" />
                      <span>{language === 'bn' ? 'ছবি অটো ক্রপ ও রি-সাইজ করা হচ্ছে (সর্বনিম্ন ডেটা খরচ)...' : 'Auto-cropping & resizing for minimal data...'}</span>
                    </div>
                  )}

                  {/* Selected / Compressed Image Thumbnails */}
                  {stepImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
                      {stepImages.map((imgItem, idx) => {
                        const originalKb = Math.round(imgItem.originalSize / 1024);
                        const compressedKb = Math.round(imgItem.compressedSize / 1024);
                        const savedPct = imgItem.originalSize > imgItem.compressedSize 
                          ? Math.round((1 - imgItem.compressedSize / imgItem.originalSize) * 100) 
                          : 0;

                        return (
                          <div 
                            key={idx} 
                            className="relative group bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-slate-700 p-1.5 flex flex-col gap-1 shadow-3xs"
                          >
                            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                              <img 
                                src={imgItem.previewUrl} 
                                alt={imgItem.file.name} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs transition-all cursor-pointer active:scale-95"
                                title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                              >
                                <Trash2 size={10} />
                              </button>
                              <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[7.5px] font-bold px-1.5 py-0.2 rounded">
                                #{idx + 1}
                              </span>
                            </div>
                            <p className="text-[8.5px] font-bold text-slate-800 dark:text-slate-200 truncate" title={imgItem.file.name}>
                              {imgItem.file.name}
                            </p>
                            <div className="flex items-center justify-between text-[7.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded">
                              <span>{compressedKb} KB</span>
                              {savedPct > 0 && <span>{language === 'bn' ? `${toBn(savedPct)}% সাশ্রয়ী` : `${savedPct}% saved`}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border border-dashed border-blue-300 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-1 text-slate-500">
                      <ImageIcon size={20} className="text-blue-500/80" />
                      <p className="text-[9.5px] font-bold">
                        {language === 'bn' ? 'কোনো ছবি যুক্ত করা হয়নি' : 'No photos selected'}
                      </p>
                      <p className="text-[8px] text-slate-400">
                        {language === 'bn' ? 'ক্যামেরা আইকনে চাপ দিয়ে সরাসরি ছবি তুলুন' : 'Tap camera icon to capture directly'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Success Animation Banner */}
            {stepUploadSuccess && (
              <div className="p-2.5 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-black shadow-sm animate-in zoom-in duration-150">
                <CheckCircle size={15} />
                <span>
                  {saveFormat === 'pdf' 
                    ? (language === 'bn' ? 'কম্প্রেসড PDF সফলভাবে ডাটাবেইজে সংরক্ষিত হয়েছে!' : 'Compressed PDF saved to database!')
                    : (language === 'bn' ? 'পদক্ষেপ ও ছবি সফলভাবে ডাটাবেইজে সংরক্ষিত হয়েছে!' : 'Step & photos successfully saved to database!')
                  }
                </span>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setShowStepModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold transition-all cursor-pointer active:scale-95"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSaveStepAndImages}
                disabled={isUploadingStep || isProcessingImages}
                className={`px-4 py-1.5 rounded-xl font-black text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 ${
                  isUploadingStep 
                    ? 'bg-cyan-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                }`}
              >
                {isUploadingStep ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>{language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={12} />
                    <span>
                      {saveFormat === 'pdf'
                        ? (language === 'bn' ? 'কম্প্রেসড PDF হিসেবে সংরক্ষণ' : 'Save as PDF')
                        : saveFormat === 'both'
                        ? (language === 'bn' ? 'PDF ও ছবি উভয় সংরক্ষণ' : 'Save PDF & Photos')
                        : (language === 'bn' ? 'ছবি হিসেবে সংরক্ষণ করুন' : 'Save as Photos')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 16. PDF Preview & Viewer Modal */}
      {showPdfPreviewModal && (uploadedPdfFile || compiledPdf) && (() => {
        const activePdf = uploadedPdfFile || compiledPdf;
        if (!activePdf) return null;
        return (
          <div 
            className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-[3px] animate-in fade-in duration-150 select-none"
            onClick={() => setShowPdfPreviewModal(false)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-indigo-200 dark:border-slate-750 w-full max-w-[560px] h-[85vh] p-4 flex flex-col gap-3 text-slate-800 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xs">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {language === 'bn' ? 'কম্প্রেসড পিডিএফ প্রিভিউ' : 'Compressed PDF Preview'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 truncate max-w-[280px]">
                      {activePdf.file.name} ({Math.round(activePdf.size / 1024)} KB)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a 
                    href={activePdf.previewUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] hover:bg-indigo-100 transition-all flex items-center gap-1"
                  >
                    <Eye size={11} />
                    <span>{language === 'bn' ? 'নতুন ট্যাবে খুলুন' : 'Open in Tab'}</span>
                  </a>
                  <a 
                    href={activePdf.previewUrl} 
                    download={activePdf.file.name}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-3xs"
                  >
                    <Download size={11} />
                    <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                  </a>
                  <button 
                    type="button"
                    onClick={() => setShowPdfPreviewModal(false)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Embedded PDF iframe / viewer */}
              <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative">
                <iframe
                  src={`${activePdf.previewUrl}#toolbar=0`}
                  title="PDF Document Preview"
                  className="w-full h-full border-none"
                />
              </div>

              {/* Footer info note */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[9.5px] font-bold text-slate-500">
                <span>
                  {stepImages.length > 0 
                    ? (language === 'bn' ? `পৃষ্ঠা সংখ্যা: ${toBn(stepImages.length)} টি` : `Total Pages: ${stepImages.length}`)
                    : (language === 'bn' ? 'সরাসরি আপলোডকৃত PDF' : 'Direct Uploaded PDF')
                  }
                </span>
                <span className="text-emerald-600 font-black">
                  {language === 'bn' ? 'স্বয়ংক্রিয় তারিখ ও মামলা নং সম্বলিত সুশৃঙ্খল PDF' : 'Clean PDF with date & case number'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* WhatsApp Preview Modal */}
      {showWaPreviewModal && waPreviewContent && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setShowWaPreviewModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-slate-750 w-full max-w-sm p-4 flex flex-col gap-3 text-slate-800 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'হোয়াটসঅ্যাপ ম্যাসেজ প্রিভিউ' : 'WhatsApp Message Preview'}
                  </h4>
                  <p className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400">
                    {language === 'bn' ? `প্রাপক: ${waPreviewContent.recipientName} (${waPreviewContent.recipientPhone})` : `Recipient: ${waPreviewContent.recipientName}`}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowWaPreviewModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-medium leading-relaxed whitespace-pre-wrap max-h-[180px] overflow-y-auto custom-scrollbar">
              {waPreviewContent.message}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowWaPreviewModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(waPreviewContent.waUrl, '_blank');
                  setShowWaPreviewModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={13} className="fill-white" />
                <span>{language === 'bn' ? 'কনফার্ম করুন ও পাঠান' : 'Confirm & Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Client WhatsApp Preview Modal */}
      {multiWaModalData && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none"
          onClick={() => setMultiWaModalData(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-slate-750 w-full max-w-2xl p-4 flex flex-col gap-3 text-slate-800 dark:text-white max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {language === 'bn' ? 'নিজ পক্ষের সকল মক্কেলের পৃথক WhatsApp ম্যাসেজ প্রিভিউ' : 'All Clients WhatsApp Messages Preview'}
                  </h4>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {language === 'bn' ? 'প্রত্যেকে আলাদাভাবে নিজ মামলা নং, তারিখ, আদেশ, ম্যাজিক লিংক ও উপস্থিত থাকার অনুরোধ সহ মেসেজ পাবে' : 'Each person gets their own case info, magic link & presence request'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setMultiWaModalData(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {multiWaModalData.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {idx + 1}. {item.clientName} ({item.phone})
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px]">
                      {language === 'bn' ? 'উপস্থিত থাকার অনুরোধ সহ' : 'Presence requested'}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 text-[11px] font-medium leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                    {item.message}
                  </div>
                  <div className="flex justify-end pt-1">
                    <a
                      href={item.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={13} className="fill-white" />
                      <span>{language === 'bn' ? 'এই মক্কেলকে পাঠান' : 'Send to this client'}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500">
                {language === 'bn' ? `মোট ${multiWaModalData.length} জন মক্কেলের জন্য প্রস্তুত` : `Total ${multiWaModalData.length} clients ready`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMultiWaModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    multiWaModalData.forEach((item, index) => {
                      setTimeout(() => {
                        window.open(item.waUrl, '_blank');
                      }, index * 400);
                    });
                    setMultiWaModalData(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{language === 'bn' ? 'সবার কাছে প্রিভিউ সহ পাঠান' : 'Send to All'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BookView = ({ 
  date, 
  cases, 
  onClose, 
  onPrev, 
  onNext, 
  onViewCard, 
  t,
  buttonLabels,
  onUpdateCaseLocal,
  language,
  onWhatsAppShare,
  userType,
  onAddCaseForDate
}: { 
  date: string; 
  cases: Case[]; 
  onClose: () => void; 
  onPrev: () => void; 
  onNext: () => void; 
  onViewCard: (c: Case) => void;
  t: (key: any) => string;
  buttonLabels: any;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
  onWhatsAppShare?: (c: Case, side?: 'petitioner' | 'respondent') => void;
  userType?: string;
  onAddCaseForDate?: (date: string) => void;
}) => {
  const [courtWaModalData, setCourtWaModalData] = useState<{
    courtTitle: string;
    messages: Array<{
      clientName: string;
      phone: string;
      caseNumber: string;
      message: string;
      waUrl: string;
    }>;
  } | null>(null);

  const handleCourtWhatsAppBroadcast = (courtTitle: string, courtCases: Case[]) => {
    const messages: Array<{ clientName: string; phone: string; caseNumber: string; message: string; waUrl: string }> = [];

    courtCases.forEach(c => {
      const mobile = c.petitionerMobile || c.petitionerDetails?.[0]?.phone || c.respondentMobile || c.respondentDetails?.[0]?.phone || '';
      const clientName = c.petitioner || c.petitionerDetails?.[0]?.name || c.respondent || c.respondentDetails?.[0]?.name || (language === 'bn' ? 'মক্কেল' : 'Client');
      
      if (!mobile) return;

      const cleanDigits = mobile.replace(/[^0-9]/g, '');
      const intl = cleanDigits.startsWith('88') ? cleanDigits : (cleanDigits ? `88${cleanDigits}` : '');
      const trackUrl = getMagicCaseTrackUrl({ 
        caseId: c.id, 
        caseNumber: c.caseNumber,
        clientMobile: mobile,
        clientName: clientName
      });

      const hist = c.history?.find(h => h.date === date);
      const orderText = hist?.order || c.order || (language === 'bn' ? 'শুনানি / হাজিরা' : 'Hearing / Attendance');
      const nextDateStr = c.nextDate || date;

      const msg = language === 'bn'
        ? `শ্রদ্ধেয় ${clientName}, আপনার অবগতির জন্য জানানো যাচ্ছে যে, আগামী ${nextDateStr} তারিখে ${courtTitle}-এ আপনার মামলা নং ${c.caseNumber}-এর শুনানির দিন ধার্য রয়েছে। আদালতের আদেশ/পদক্ষেপ: ${orderText}। উক্ত তারিখে যথাসময়ে আদালতে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।\n\n🔗 আপনার নিরাপদ লাইভ ট্র্যাকিংয়ের ম্যাজিক লিংক (কোনো পাসওয়ার্ড লাগবে না):\n👉 ${trackUrl}`
        : `Dear ${clientName}, Please be informed that your case no. ${c.caseNumber} in ${courtTitle} is scheduled for hearing on ${nextDateStr}. Court step: ${orderText}. You are requested to be present in court on time.\n\n🔗 Your secure Magic Link for live tracking (no password required):\n👉 ${trackUrl}`;

      const waUrl = intl ? `https://wa.me/${intl}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;

      messages.push({
        clientName,
        phone: mobile,
        caseNumber: c.caseNumber,
        message: msg,
        waUrl
      });
    });

    if (messages.length === 0) {
      alert(language === 'bn' ? 'এই আদালতের মামলাগুলোর জন্য কোনো মক্কেলের মোবাইল নম্বর পাওয়া যায়নি।' : 'No client phone numbers found for cases in this court.');
      return;
    }

    setCourtWaModalData({
      courtTitle,
      messages
    });
  };

  const groupedByCourt = cases.reduce((acc, c) => {
    if (!acc[c.courtName]) acc[c.courtName] = [];
    acc[c.courtName].push(c);
    return acc;
  }, {} as Record<string, Case[]>);

  const steps = [
    buttonLabels.stepSummons || "সমন",
    buttonLabels.stepWitness || "স্বাক্ষী",
    buttonLabels.stepCross || "জেরা",
    buttonLabels.stepArgument || "যক্তিতর্ক",
    buttonLabels.stepJudgment || "রায়"
  ];
  
  const getGroupedByStep = (courtCases: Case[]) => {
    return courtCases.reduce((acc, c) => {
      const histForDate = c.history?.find(h => h.date === date);
      const stepText = histForDate?.order || c.order || c.status;
      const step = steps.find(s => stepText?.includes(s)) || "অন্যান্য";
      if (!acc[step]) acc[step] = [];
      acc[step].push(c);
      return acc;
    }, {} as Record<string, Case[]>);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6"
    >
      <motion.div 
        initial={{ rotateY: -90, originX: 0 }}
        animate={{ rotateY: 0 }}
        exit={{ rotateY: -90 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-[#fdfaf3] w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden border-[12px] sm:border-[16px] border-[#4a2e1b] ring-4 ring-[#8c5a3c]/30"
      >
        {/* Book Header */}
        <div className="p-4 sm:p-5 border-b border-amber-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#fbf8ee] gap-4 z-10 shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-800 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 border border-amber-950/20">
              <Book size={20} className="sm:w-5 sm:h-5 text-amber-100" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate flex items-center gap-2">
                📖 {t('date_diary')}
              </h3>
              <p className="text-amber-800 font-extrabold text-xs sm:text-sm mt-0.5">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (onAddCaseForDate) {
                  onAddCaseForDate(date);
                }
              }}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={language === 'bn' ? 'এই তারিখে নতুন মামলা যোগ করুন' : 'Add new case for this date'}
            >
              <Plus size={15} />
              <span>{language === 'bn' ? '+ নতুন মামলা' : '+ Add Case'}</span>
            </button>
            <button onClick={onPrev} className="p-2 sm:p-2.5 hover:bg-white rounded-xl transition-all border border-amber-200/60 text-amber-900 bg-amber-50/55 shadow-3xs active:scale-95">
              <ArrowLeft size={16} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={onNext} className="p-2 sm:p-2.5 hover:bg-white rounded-xl transition-all border border-amber-200/60 text-amber-900 bg-amber-50/55 shadow-3xs active:scale-95">
              <ArrowRight size={16} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={onClose} className="p-2 sm:p-2.5 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all border border-rose-200 text-rose-500 bg-rose-50/55 shadow-3xs ml-2 sm:ml-4 active:scale-95">
              <X size={16} className="sm:w-4 sm:h-4 font-black" />
            </button>
          </div>
        </div>

        {/* Book Content */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#fdfaf3] relative"
          style={{
            backgroundImage: `
              linear-gradient(to right, transparent 50px, #ff8a8a 50px, #ff8a8a 52px, transparent 52px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 94%, rgba(99, 102, 241, 0.12) 100%)
            `,
            backgroundSize: '100% 100%, 100% 2.4rem',
          }}
        >
          {/* Lined Notebook Pages Layout */}
          <div className="relative z-10 pl-2 sm:pl-6 md:pl-10 pr-1 sm:pr-2">
            {cases.length > 0 ? (
              <div className="space-y-4 sm:space-y-5">
                {Object.entries(groupedByCourt).map(([court, courtCases]) => (
                  <div key={court} className="space-y-2 sm:space-y-2.5">
                    <div className="flex items-center justify-between border-b-2 border-amber-200 pb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-amber-700 rounded-full"></div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">🏛️ {court}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCourtWhatsAppBroadcast(court, courtCases)}
                        className="h-5 px-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] flex items-center gap-1 shadow-3xs cursor-pointer"
                        title={language === 'bn' ? 'এই আদালতের মক্কেলদের নিজ নিজ মামলার তথ্য ও ম্যাজিক লিংক সহ পৃথক মেসেজ প্রিভিউ ও পাঠান' : 'Preview & send individual WhatsApp messages for this court'}
                      >
                        <MessageSquare size={10} className="fill-white" />
                        <span>WA</span>
                      </button>
                    </div>

                    <div className="flex flex-col space-y-2 w-full">
                      {Object.entries(getGroupedByStep(courtCases)).map(([step, stepCases]) => (
                        <div key={step} className="space-y-1">
                          <h5 className="text-[10px] sm:text-xs font-black text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-md inline-block tracking-wider uppercase">
                            {step === 'সমন' || step === buttonLabels.stepSummons ? buttonLabels.stepSummons || t('action_summons') : 
                             step === 'স্বাক্ষী' || step === buttonLabels.stepWitness ? buttonLabels.stepWitness || t('action_witness') : 
                             step === 'জেরা' || step === buttonLabels.stepCross ? buttonLabels.stepCross || t('action_cross_exam') : 
                             step === 'যক্তিতর্ক' || step === buttonLabels.stepArgument ? buttonLabels.stepArgument || t('action_argument') : 
                             step === 'রায়' || step === buttonLabels.stepJudgment ? buttonLabels.stepJudgment || t('action_judgment') : 
                             t('other_label')}
                          </h5>
                          <div className="space-y-1 sm:space-y-1.5">
                            {stepCases.map(c => (
                              <MiniCasebook
                                key={c.id}
                                c={c}
                                language={language}
                                t={t}
                                buttonLabels={buttonLabels}
                                onUpdateCaseLocal={onUpdateCaseLocal}
                                onViewCard={onViewCard}
                                currentDiaryDate={date}
                                onWhatsAppShare={onWhatsAppShare}
                                userType={userType}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full py-16 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <CalendarIcon size={56} className="text-slate-400" />
                <p className="text-lg font-black text-slate-600">{t('no_case_on_date')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Court WhatsApp Broadcast Preview Modal */}
        {courtWaModalData && (
          <div 
            className="fixed inset-0 z-[250] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none"
            onClick={() => setCourtWaModalData(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-slate-750 w-full max-w-2xl p-4 flex flex-col gap-3 text-slate-800 dark:text-white max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {language === 'bn' ? `আদালতের পৃথক WhatsApp ম্যাসেজ প্রিভিউ (${courtWaModalData.courtTitle})` : `Court WhatsApp Messages Preview (${courtWaModalData.courtTitle})`}
                    </h4>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {language === 'bn' ? 'প্রত্যেকে শুধুমাত্র তার নিজ মামলার তথ্য ও ম্যাজিক লিংক পাবে' : 'Everyone receives only their own case info'}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setCourtWaModalData(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {courtWaModalData.messages.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {idx + 1}. {item.clientName} ({item.phone})
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded text-[10px]">
                        মামলা নং: {item.caseNumber}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 text-[11px] font-medium leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                      {item.message}
                    </div>
                    <div className="flex justify-end pt-1">
                      <a
                        href={item.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare size={13} className="fill-white" />
                        <span>{language === 'bn' ? 'এই মক্কেলকে পাঠান' : 'Send to this client'}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500">
                  {language === 'bn' ? `মোট ${courtWaModalData.messages.length} জন মক্কেল প্রস্তুত` : `Total ${courtWaModalData.messages.length} clients ready`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCourtWaModalData(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      courtWaModalData.messages.forEach((item, index) => {
                        setTimeout(() => {
                          window.open(item.waUrl, '_blank');
                        }, index * 400);
                      });
                      setCourtWaModalData(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{language === 'bn' ? 'সবার কাছে প্রিভিউ সহ পাঠান' : 'Send to All'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const CalendarView = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  cases,
  onViewCard,
  onViewHistory,
  language,
  userType,
  govtHolidays = [],
  getBanglaDate,
  t,
  onUpdateCaseLocal,
  onOpenAiForCase,
  onWhatsAppShare,
  onAddCaseForDate
}: CalendarViewProps) => {
  const [showBookView, setShowBookView] = useState(false);
  const [hoveredHolidayReason, setHoveredHolidayReason] = useState<string | null>(null);
  const [focusedCaseId, setFocusedCaseId] = useState<string | number | null>(null);

  // Dynamic Button Customizer States
  const [buttonLabels, setButtonLabels] = useState(() => {
    const saved = localStorage.getItem('custom_button_labels');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      btnDocuments: language === 'bn' ? 'ডকুমেন্টস' : 'Documents',
      btnFaceToFace: language === 'bn' ? 'সামনাসামনি হতে চাই' : 'Face to Face',
      btnAskAi: language === 'bn' ? 'এআই সহায়ক' : 'Ask AI',
      btnEditInfo: language === 'bn' ? 'তথ্য সংশোধন' : 'Edit Info',
      btnViewCard: language === 'bn' ? 'কার্ড দেখুন' : 'View Card',
      btnViewHistory: language === 'bn' ? 'ইতিহাস দেখুন' : 'View History',
      btnConfirmFinalize: language === 'bn' ? 'চুড়ান্ত আদেশ ও পরবর্তী তারিখ আপডেট করুন' : 'Confirm Finalize & Update',
      btnDraftNotes: language === 'bn' ? 'কোর্ট সেশন খসড়া নোট' : 'Court Session Draft Notes',
      sectionAttendance: language === 'bn' ? '📂 হাজিরা বা সময়' : '📂 Attendance / Time',
      sectionCharge: language === 'bn' ? '⚡ চার্জ / শুনানি / জবাব' : '⚡ Charge / Argument / WS',
      sectionWitness: language === 'bn' ? '📝 সাক্ষী / জেরা / PH' : '📝 Witness / Cross / PH',
      sectionWarrant: language === 'bn' ? '🚨 W/A (ওয়ারেন্ট)' : '🚨 W/A (Warrant)',
      stepSummons: language === 'bn' ? 'সমন' : 'Summons',
      stepWitness: language === 'bn' ? 'স্বাক্ষী' : 'Witness',
      stepCross: language === 'bn' ? 'জেরা' : 'Cross Exam',
      stepArgument: language === 'bn' ? 'যক্তিতর্ক' : 'Argument',
      stepJudgment: language === 'bn' ? 'রায়' : 'Judgment',
      btnOrder: language === 'bn' ? 'আদেশ' : 'ORDER',
      btnStep: language === 'bn' ? 'পদক্ষেপ' : 'STEP'
    };
  });
  const [showButtonCustomizer, setShowButtonCustomizer] = useState(false);

  // Court Session Draft and Finalize States
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [finalizeDate, setFinalizeDate] = useState<string>('');
  const [finalizeOrder, setFinalizeOrder] = useState<string>('');
  const [finalizeFile, setFinalizeFile] = useState<File | null>(null);
  const [finalizeFilePreview, setFinalizeFilePreview] = useState<string | null>(null);
  const [isSavingFinal, setIsSavingFinal] = useState<boolean>(false);
  const [saveSuccessAnim, setSaveSuccessAnim] = useState<boolean>(false);

  // Multiple Parties Popup State
  const [activePartyModal, setActivePartyModal] = useState<{
    caseId: string | number;
    side: 'petitioner' | 'respondent';
    parties: { name: string; phone: string; serial: string | number }[];
  } | null>(null);

  // Case Editing Form State
  const [editingCaseData, setEditingCaseData] = useState<Case | null>(null);
  const [editCaseNumber, setEditCaseNumber] = useState('');
  const [editCourtName, setEditCourtName] = useState('');
  const [editCaseType, setEditCaseType] = useState('Civil');
  const [editPetitioner, setEditPetitioner] = useState('');
  const [editPetitionerMobile, setEditPetitionerMobile] = useState('');
  const [editRespondent, setEditRespondent] = useState('');
  const [editRespondentMobile, setEditRespondentMobile] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);

  // Sync edit form fields when editingCaseData changes
  useEffect(() => {
    if (editingCaseData) {
      setEditCaseNumber(editingCaseData.caseNumber || '');
      setEditCourtName(editingCaseData.courtName || '');
      setEditCaseType(editingCaseData.caseType || 'Civil');
      setEditPetitioner(editingCaseData.petitioner || '');
      setEditPetitionerMobile(editingCaseData.petitionerMobile || '');
      setEditRespondent(editingCaseData.respondent || '');
      setEditRespondentMobile(editingCaseData.respondentMobile || '');
      setEditStatus(editingCaseData.status || '');
    }
  }, [editingCaseData]);

  const handleEditCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaseData) return;
    setIsUpdatingCase(true);
    try {
      const newPetitionerNames = editPetitioner.split(',').map(n => n.trim()).filter(Boolean);
      const newPetitionerMobiles = editPetitionerMobile.split(',').map(m => m.trim()).filter(Boolean);
      const newPetitionerDetails = newPetitionerNames.map((name, idx) => ({
        name,
        phone: newPetitionerMobiles[idx] || newPetitionerMobiles[0] || editPetitionerMobile || '',
        serial: idx + 1
      }));

      const newRespondentNames = editRespondent.split(',').map(n => n.trim()).filter(Boolean);
      const newRespondentMobiles = editRespondentMobile.split(',').map(m => m.trim()).filter(Boolean);
      const newRespondentDetails = newRespondentNames.map((name, idx) => ({
        name,
        phone: newRespondentMobiles[idx] || newRespondentMobiles[0] || editRespondentMobile || '',
        serial: idx + 1
      }));

      const updatedFields: Partial<Case> = {
        caseNumber: editCaseNumber,
        courtName: editCourtName,
        caseType: editCaseType,
        petitioner: editPetitioner,
        petitionerMobile: editPetitionerMobile,
        petitionerDetails: newPetitionerDetails,
        respondent: editRespondent,
        respondentMobile: editRespondentMobile,
        respondentDetails: newRespondentDetails,
        status: editStatus
      };

      await updateCase(editingCaseData.id.toString(), updatedFields);
      onUpdateCaseLocal?.(editingCaseData.id, updatedFields);
      setEditingCaseData(null);
      
      setSaveSuccessAnim(true);
      setTimeout(() => setSaveSuccessAnim(false), 2500);
    } catch (err) {
      console.error("Failed to update case details:", err);
      alert(language === 'bn' ? 'তথ্য আপডেট করতে সমস্যা হয়েছে।' : 'Failed to update case details.');
    } finally {
      setIsUpdatingCase(false);
    }
  };

  const getPetitionersList = (c: Case) => {
    if (c.petitionerDetails && c.petitionerDetails.length > 0) {
      return c.petitionerDetails;
    }
    if (!c.petitioner) return [];
    const names = c.petitioner.split(',').map(n => n.trim()).filter(Boolean);
    const mobiles = c.petitionerMobile ? c.petitionerMobile.split(',').map(m => m.trim()).filter(Boolean) : [];
    return names.map((name, idx) => ({
      name,
      phone: mobiles[idx] || mobiles[0] || c.petitionerMobile || '',
      serial: idx + 1
    }));
  };

  const getRespondentsList = (c: Case) => {
    if (c.respondentDetails && c.respondentDetails.length > 0) {
      return c.respondentDetails;
    }
    if (!c.respondent) return [];
    const names = c.respondent.split(',').map(n => n.trim()).filter(Boolean);
    const mobiles = c.respondentMobile ? c.respondentMobile.split(',').map(m => m.trim()).filter(Boolean) : [];
    return names.map((name, idx) => ({
      name,
      phone: mobiles[idx] || mobiles[0] || c.respondentMobile || '',
      serial: idx + 1
    }));
  };

  useEffect(() => {
    if (focusedCaseId) {
      const saved = localStorage.getItem(`draft_notes_${focusedCaseId}`);
      setDraftNotes(saved || '');
      setFinalizeOrder(saved || '');
      // Find case
      const c = cases.find(item => item.id === focusedCaseId);
      if (c) {
        setFinalizeDate(c.nextDate || '');
      }
    } else {
      setDraftNotes('');
      setFinalizeDate('');
      setFinalizeOrder('');
      setFinalizeFile(null);
      setFinalizeFilePreview(null);
    }
  }, [focusedCaseId, cases]);

  const handleDraftNotesChange = (val: string) => {
    setDraftNotes(val);
    setFinalizeOrder(val); // Sync to finalize box automatically for convenience!
    if (focusedCaseId) {
      localStorage.setItem(`draft_notes_${focusedCaseId}`, val);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFinalizeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFinalizeFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalizeSave = async (c: Case) => {
    if (!finalizeDate) {
      alert(language === 'bn' ? 'অনুগ্রহ করে পরবর্তী শুনানির তারিখ সিলেক্ট করুন।' : 'Please select the next hearing date.');
      return;
    }

    setIsSavingFinal(true);
    try {
      let uploadedUrl = '';
      if (finalizeFile) {
        const fileExt = finalizeFile.name.split('.').pop() || 'jpg';
        const fileName = `order_${c.id}_${Date.now()}.${fileExt}`;
        const uploadResult = await uploadFile('documents', fileName, finalizeFile);
        if (uploadResult && (uploadResult as any).metadata?.downloadUrl) {
          uploadedUrl = (uploadResult as any).metadata.downloadUrl;
        } else {
          uploadedUrl = await getPublicUrl('documents', fileName);
        }
      }

      // Add to case history
      const currentFormattedDate = selectedDate || new Date().toISOString().split('T')[0];
      const newHistoryEntry: CaseHistoryEntry = {
        id: Date.now().toString(),
        date: currentFormattedDate,
        actionBy: 'court',
        description: finalizeOrder || draftNotes || (language === 'bn' ? 'হাজিরা / শুনানির আদেশ' : 'Attendance / Hearing Order'),
        order: finalizeOrder || draftNotes || (language === 'bn' ? 'হাজিরা / শুনানির আদেশ' : 'Attendance / Hearing Order'),
        documents: uploadedUrl ? [{ name: 'Order Sheet', type: 'image', url: uploadedUrl }] : []
      };

      const updatedHistory = [...(c.history || []), newHistoryEntry];
      const updatedFields: Partial<Case> = {
        nextDate: finalizeDate,
        order: finalizeOrder || draftNotes || (language === 'bn' ? 'হাজিরা / শুনানির আদেশ' : 'Attendance / Hearing Order'),
        history: updatedHistory
      };

      await updateCase(c.id.toString(), updatedFields);
      onUpdateCaseLocal?.(c.id, updatedFields);

      // Clear local storage draft
      if (focusedCaseId) {
        localStorage.removeItem(`draft_notes_${focusedCaseId}`);
      }

      setDraftNotes('');
      setFinalizeOrder('');
      setFinalizeFile(null);
      setFinalizeFilePreview(null);
      
      setSaveSuccessAnim(true);
      setTimeout(() => {
        setSaveSuccessAnim(false);
      }, 3000);

    } catch (err) {
      console.error("Failed to finalize case:", err);
      alert(language === 'bn' ? 'আপডেট করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to finalize. Please try again.');
    } finally {
      setIsSavingFinal(false);
    }
  };

  const getHolidayReason = (dateStr: string, dayOfWeek: number) => {
    if (govtHolidays) {
      if (Array.isArray(govtHolidays)) {
        if (govtHolidays.includes(dateStr)) return language === 'bn' ? 'সরকারি ছুটি' : 'Govt Holiday';
      } else {
        if (govtHolidays[dateStr]) return govtHolidays[dateStr];
      }
    }
    if (dayOfWeek === 5) return language === 'bn' ? 'সাপ্তাহিক ছুটি (শুক্রবার)' : 'Weekly Holiday (Friday)';
    if (dayOfWeek === 6) return language === 'bn' ? 'সাপ্তাহিক ছুটি (শনিবার)' : 'Weekly Holiday (Saturday)';
    return '';
  };
  const [bookDate, setBookDate] = useState<string | null>(null);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  const monthNames = language === 'bn' 
    ? ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const weekDays = language === 'bn'
    ? ["রবি", "সোম", "মংগল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getCasesForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return cases.filter(c => isCaseOnDate(c, dateStr));
  };

  const selectedDateCases = selectedDate ? cases.filter(c => isCaseOnDate(c, selectedDate)) : [];

  const groupedAndCategorizedCases = (() => {
    const groups: {
      [courtName: string]: {
        attendance: Case[];
        charge: Case[];
        witness: Case[];
        wa: Case[];
      }
    } = {};

    selectedDateCases.forEach(c => {
      const court = c.courtName || (language === 'bn' ? 'অন্যান্য আদালত' : 'Other Court');
      if (!groups[court]) {
        groups[court] = { attendance: [], charge: [], witness: [], wa: [] };
      }

      const histEntry = selectedDate ? c.history?.find(h => h.date === selectedDate) : null;
      const orderStr = (histEntry?.order || c.order || '').toLowerCase();
      const detailsStr = (c.details || '').toLowerCase();
      const combinedStr = `${orderStr} ${detailsStr}`;

      const isWa = combinedStr.includes('w/a') || 
                   combinedStr.includes('w.a.') || 
                   combinedStr.includes('wa') || 
                   combinedStr.includes('warrant') || 
                   combinedStr.includes('গ্রেপ্তারি') || 
                   combinedStr.includes('ওয়ারেন্ট') || 
                   combinedStr.includes('ওয়ারেন্ট');

      const isWitness = combinedStr.includes('সাক্ষী') || 
                        combinedStr.includes('সাক্ষ্য') || 
                        combinedStr.includes('witness') || 
                        combinedStr.includes('pw') || 
                        combinedStr.includes('p.w.') || 
                        combinedStr.includes('ph') || 
                        combinedStr.includes('evidence') ||
                        combinedStr.includes('জেরা');

      const isCharge = combinedStr.includes('চার্জ') || 
                       combinedStr.includes('গঠন') || 
                       combinedStr.includes('শুনানি') || 
                       combinedStr.includes('charge') || 
                       combinedStr.includes('frame') || 
                       combinedStr.includes('argument') || 
                       combinedStr.includes('তর্ক') ||
                       combinedStr.includes('জবাব') ||
                       combinedStr.includes('ws') ||
                       combinedStr.includes('w.s.') ||
                       combinedStr.includes('statement');

      if (isWa) {
        groups[court].wa.push(c);
      } else if (isWitness) {
        groups[court].witness.push(c);
      } else if (isCharge) {
        groups[court].charge.push(c);
      } else {
        groups[court].attendance.push(c);
      }
    });

    return groups;
  })();

  const renderSubgroupSection = (title: string, casesList: Case[], badgeColorClass: string) => {
    return (
      <div className="space-y-1">
        <div className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md inline-flex items-center gap-1 border ${badgeColorClass}`}>
          {title} ({language === 'bn' ? casesList.length.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('') : casesList.length})
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse bg-white/40 rounded-xl overflow-hidden border border-[#e3dcc4]/30">
            <thead>
              <tr className="border-b border-[#e3dcc4]/40 text-[8px] font-black text-[#6e6347] uppercase tracking-wider bg-[#f3efe0]/30">
                <th className="py-1 px-1.5 w-8 text-center">{language === 'bn' ? 'ক্র. নং' : 'SL'}</th>
                <th className="py-1 px-1.5">{language === 'bn' ? 'মামলা নম্বর' : 'Case No'}</th>
                <th className="py-1 px-1.5">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</th>
                <th className="py-1 px-1.5">{language === 'bn' ? 'পদক্ষেপ' : 'Step'}</th>
                <th className="py-1 px-1 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dcc4]/20">
              {casesList.map((c, sIdx) => {
                const slNo = language === 'bn' 
                  ? (sIdx + 1).toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                  : (sIdx + 1);
                const histEntry = selectedDate ? c.history?.find(h => h.date === selectedDate) : null;
                const displayOrder = histEntry?.order || c.order;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setFocusedCaseId(c.id)}
                    className={`group transition-colors cursor-pointer text-[10px] ${
                      c.selectedParty === 'petitioner'
                        ? 'bg-[#f0faf2]/90 hover:bg-[#def5e4]'
                        : c.selectedParty === 'respondent' || c.selectedParty === 'accused'
                          ? 'bg-[#fff5f6]/90 hover:bg-[#ffe6e8]'
                          : 'hover:bg-[#f3efe0]/40'
                    }`}
                  >
                    <td className="py-1.5 px-1.5 text-center font-bold text-[#756a4e] border-r border-[#e3dcc4]/10">{slNo}</td>
                    <td className="py-1.5 px-1.5 font-extrabold text-slate-950 border-r border-[#e3dcc4]/10 align-top">
                      <div className="flex flex-col gap-0.5">
                        {/* Line 1: Case Number */}
                        <span className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-tight">
                          {c.caseNumber}
                        </span>

                        {/* Line 2: Party Badge removed */}

                        {/* Case Type box removed */}
                      </div>
                    </td>
                    <td className="py-1.5 px-1.5 border-r border-[#e3dcc4]/10 max-w-[100px] truncate">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 leading-tight">{c.petitioner}</span>
                        <span className="text-[7px] text-[#b3a886] font-bold leading-none my-0.5">VS</span>
                        <span className="font-semibold text-slate-800 leading-tight">
                          {c.respondentDetails && c.respondentDetails.length > 0 ? c.respondentDetails[0].name : c.respondent}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-1.5 border-r border-[#e3dcc4]/10">
                      <p className="text-[9px] text-slate-700 line-clamp-1" title={displayOrder}>
                        {displayOrder || <span className="text-slate-400 italic">{language === 'bn' ? 'পদক্ষেপ নেই' : 'No steps'}</span>}
                      </p>
                    </td>
                     <td className="py-1.5 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-0.5">
                        {onOpenAiForCase && (
                          <button 
                            onClick={() => onOpenAiForCase(c)}
                            className="p-0.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-all"
                            title={language === 'bn' ? 'এআই সহায়ক' : 'Ask AI'}
                          >
                            <Sparkles size={9} className="animate-pulse" />
                          </button>
                        )}
                        {userType !== 'client' && (
                          <button 
                            onClick={() => setEditingCaseData(c)}
                            className="p-0.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-600 hover:text-white transition-all"
                            title={language === 'bn' ? 'তথ্য সংশোধন করুন' : 'Edit Info'}
                          >
                            <Edit2 size={9} />
                          </button>
                        )}
                        <button 
                          onClick={() => onViewCard(c)}
                          className="p-0.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-all"
                          title={language === 'bn' ? 'কার্ড দেখুন' : 'View Card'}
                        >
                          <CreditCard size={9} />
                        </button>
                        <button 
                          onClick={() => onViewHistory(c)}
                          className="p-0.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-600 hover:text-white transition-all"
                          title={language === 'bn' ? 'ইতিহাস দেখুন' : 'View History'}
                        >
                          <History size={9} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setBookDate(dateStr);
    setFocusedCaseId(null);
    setShowBookView(true); // Always auto-open the skeuomorphic open book Daily Hearing Diary!
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!bookDate) return;
    const current = new Date(bookDate);
    const next = new Date(current);
    next.setDate(current.getDate() + (direction === 'next' ? 1 : -1));
    const nextStr = next.toISOString().split('T')[0];
    setBookDate(nextStr);
    setSelectedDate(nextStr);
    
    // Update current month if needed
    if (next.getMonth() !== currentMonth.getMonth() || next.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const getBanglaMonthYear = (date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    
    const firstMonthIdx = (month + 8) % 12;
    const secondMonthIdx = (month + 9) % 12;
    
    const firstMonthName = bnMonths[firstMonthIdx];
    const secondMonthName = bnMonths[secondMonthIdx];
    
    let bnYear1 = year - 593;
    if (month < 3) bnYear1 = year - 594;
    
    let bnYear2 = bnYear1;
    if (month === 3) {
      bnYear1 = year - 594;
      bnYear2 = year - 593;
    }
    
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBnNum = (n: number) => n.toString().split('').map(d => bnNums[parseInt(d)]).join('');
    
    if (bnYear1 === bnYear2) {
      return `${firstMonthName} - ${secondMonthName} ${toBnNum(bnYear1)}`;
    } else {
      return `${firstMonthName} ${toBnNum(bnYear1)} - ${secondMonthName} ${toBnNum(bnYear2)}`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:h-[calc(100vh-115px)] lg:min-h-[500px] max-w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AnimatePresence>
        {hoveredHolidayReason && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[200] px-5 py-2.5 bg-rose-600 text-white rounded-2xl shadow-2xl font-bold flex items-center gap-2.5 backdrop-blur-md border border-white/20 text-xs"
          >
            <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <CalendarIcon size={16} />
            </div>
            <span className="whitespace-nowrap">{hoveredHolidayReason}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBookView && bookDate && (
          <BookView 
            date={bookDate}
            cases={cases.filter(c => isCaseOnDate(c, bookDate))}
            onClose={() => setShowBookView(false)}
            onPrev={() => navigateDate('prev')}
            onNext={() => navigateDate('next')}
            onViewCard={onViewCard}
            t={t}
            buttonLabels={buttonLabels}
            onUpdateCaseLocal={onUpdateCaseLocal}
            language={language}
            onWhatsAppShare={onWhatsAppShare}
            userType={userType}
            onAddCaseForDate={onAddCaseForDate}
          />
        )}
      </AnimatePresence>

      {/* Calendar Section */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-3.5 sm:p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <p className="text-indigo-600 font-bold text-[9.5px] sm:text-[11px] mt-0.5">
                {getBanglaMonthYear(currentMonth)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onAddCaseForDate && (
              <button 
                type="button"
                onClick={() => {
                  const targetDate = selectedDate || new Date().toISOString().split('T')[0];
                  onAddCaseForDate(targetDate);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9.5px] sm:text-[11px] font-black transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer mr-1"
                title={language === 'bn' ? 'নতুন মামলা যোগ করুন' : 'Add Case'}
              >
                <Plus size={13} />
                <span>{language === 'bn' ? '+ নতুন মামলা' : '+ Add Case'}</span>
              </button>
            )}
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-1.5 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9.5px] sm:text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-3xs"
            >
              {t('today')}
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-1.5 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
            {weekDays.map((day, idx) => {
              const isHoliday = idx === 5 || idx === 6; // Fri and Sat in Sun-Sat week
              return (
                <div key={day} className={`text-center text-[10px] sm:text-xs font-black uppercase tracking-wider ${isHoliday ? 'text-rose-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {prevMonthDays.map(i => (
              <div key={`prev-${i}`} className="aspect-square rounded-xl sm:rounded-2xl bg-slate-50/30 border border-transparent opacity-20" />
            ))}
            {days.map(day => {
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayCases = getCasesForDate(day);
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toDateString() === dateObj.toDateString();
              
              const dayOfWeek = dateObj.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
              const isGovtHoliday = Array.isArray(govtHolidays) ? govtHolidays.includes(dateStr) : !!govtHolidays?.[dateStr];
              const isHoliday = dayOfWeek === 5 || dayOfWeek === 6 || isGovtHoliday;
              const reason = getHolidayReason(dateStr, dayOfWeek);
              
              const bnDate = getBanglaDate ? getBanglaDate(dateObj) : '';
              
              const isLawyerOrClerk = userType === 'lawyer' || userType === 'clerk';
              const todayStr = new Date().toISOString().split('T')[0];
              const isPast = dateStr < todayStr;
              const hasPendingOverdue = dayCases.some(c => !c.isUpdated && c.nextDate === dateStr);
              const shouldBlink = isLawyerOrClerk && isPast && hasPendingOverdue;
              const isPastOrToday = dateStr <= todayStr;
              const shouldHighlightPending = isLawyerOrClerk && isPastOrToday && hasPendingOverdue;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  onMouseEnter={() => isHoliday && setHoveredHolidayReason(reason)}
                  onMouseLeave={() => setHoveredHolidayReason(null)}
                  onTouchStart={() => isHoliday && setHoveredHolidayReason(reason)}
                  onTouchEnd={() => setHoveredHolidayReason(null)}
                  className={`
                    aspect-square rounded-xl sm:rounded-2xl border transition-all duration-300 relative group p-1 sm:p-1.5 flex flex-col justify-between
                    ${isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10' 
                      : isToday
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                        : isHoliday
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }
                    ${shouldBlink ? 'animate-blink border-rose-500 shadow-rose-200 shadow-md' : ''}
                  `}
                >
                  {shouldHighlightPending && (
                    <div className="absolute inset-1.5 rounded-full bg-rose-500/20 animate-ping" />
                  )}
                  {shouldHighlightPending && (
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-rose-500/10 animate-pulse border-2 border-rose-500/30" />
                  )}
                  <div className="flex justify-start w-full relative z-10">
                    <span className={`text-base sm:text-lg leading-none font-black ${isSelected || isToday ? 'text-white' : isHoliday ? 'text-rose-600' : 'text-slate-700'}`}>
                      {day}
                    </span>
                  </div>
                  
                  {bnDate && (
                    <div className="flex justify-end w-full mt-auto relative z-10">
                      <span className={`text-[8px] sm:text-[9px] font-bold leading-none ${isSelected || isToday ? 'text-white/90' : 'text-indigo-600'}`}>
                        {bnDate}
                      </span>
                    </div>
                  )}

                  {isHoliday && !isSelected && !isToday && (
                    <span className="absolute top-1 right-1.5 text-[7px] font-black text-rose-400 uppercase tracking-tighter">
                      {language === 'bn' ? 'বন্ধ' : 'Closed'}
                    </span>
                  )}

                  {dayCases.length > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 flex gap-0.5">
                      {dayCases.slice(0, 3).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 h-1 rounded-full ${isSelected || isToday ? 'bg-white' : 'bg-indigo-400'}`} 
                        />
                      ))}
                    </div>
                  )}
                  {dayCases.length > 0 && !isSelected && !isToday && (
                    <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-0 group-hover:scale-100 transition-transform">
                      {dayCases.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 h-full flex flex-col">
        <div className="relative bg-[#fdfbf7] p-3.5 sm:p-4 rounded-3xl border-2 border-[#e3dcc4] shadow-md h-full flex flex-col overflow-hidden">
          {/* Notebook Spiral Ring Binder Effect */}
          <div className="absolute left-2 top-0 bottom-0 w-4.5 flex flex-col justify-around items-center pointer-events-none z-20 opacity-80">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1 -my-1">
                {/* Spiral binder hole */}
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800/20 border border-slate-900/30 shadow-inner" />
                {/* Silver Metal Ring Hook */}
                <div className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-sm -ml-1.5 border border-slate-300" />
              </div>
            ))}
          </div>

          {/* Red Notebook Margin Line */}
          <div className="absolute left-8 sm:left-9 top-0 bottom-0 w-[2px] bg-rose-400/45 z-10 pointer-events-none" />

          {/* Diary Header */}
          <div className="pl-6 sm:pl-7 flex items-center justify-between mb-3 border-b border-[#e3dcc4] pb-2 z-10">
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#524933] flex items-center gap-1.5">
                📖 {language === 'bn' ? 'দৈনিক শুনানি ডায়েরী' : 'Daily Hearing Diary'}
              </h3>
              <p className="text-[9.5px] text-indigo-600 font-bold mt-0.5 bg-indigo-50/75 px-2 py-0.5 rounded-full inline-block border border-indigo-100/70">
                {selectedDate ? `${language === 'bn' ? 'তারিখ:' : 'Date:'} ${selectedDate}` : t('today_schedule')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {onAddCaseForDate && (
                <button
                  type="button"
                  onClick={() => {
                    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
                    onAddCaseForDate(targetDate);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] sm:text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                  title={language === 'bn' ? 'এই তারিখে নতুন মামলা যোগ করুন' : 'Add new case for this date'}
                >
                  <Plus size={12} />
                  <span>{language === 'bn' ? '+ মামলা' : '+ Case'}</span>
                </button>
              )}
              <button
                onClick={() => setShowButtonCustomizer(true)}
                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer"
                title={language === 'bn' ? 'বাটন এডিট করুন' : 'Edit Buttons'}
              >
                📝 {language === 'bn' ? 'বাটন এডিট' : 'Edit Buttons'}
              </button>
              <span className="text-[9px] font-bold bg-[#e3dcc4]/50 text-[#524933] px-2.5 py-0.5 rounded-full border border-[#d2c9ab]">
                {language === 'bn' ? 'মোট: ' : 'Total: '}
                {language === 'bn' 
                  ? selectedDateCases.length.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                  : selectedDateCases.length
                }
              </span>
            </div>
          </div>

          {/* Lined Notebook Paper Case Table */}
          <div className="pl-7 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-[220px] z-10 bg-[linear-gradient(rgba(0,0,0,0)_94%,rgba(99,102,241,0.06)_6%)] bg-[length:100%_2.4rem]">
            <AnimatePresence mode="wait">
              {focusedCaseId ? (
                (() => {
                  const c = selectedDateCases.find(caseItem => caseItem.id === focusedCaseId);
                  if (!c) {
                    setFocusedCaseId(null);
                    return null;
                  }
                  const histEntry = selectedDate ? c.history?.find(h => h.date === selectedDate) : null;
                  const displayOrder = histEntry?.order || c.order;
                  const petitionersList = getPetitionersList(c);
                  const respondentsList = getRespondentsList(c);

                  return (
                    <motion.div
                      key={`focused-${c.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 space-y-3"
                    >
                      {/* Back to list button */}
                      <button
                        onClick={() => setFocusedCaseId(null)}
                        className="mb-2 px-2.5 py-1 bg-[#f3efe0] border border-[#d2c9ab] hover:bg-[#e3dcc4] text-[#524933] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-3xs"
                      >
                        <ChevronLeft size={12} />
                        {language === 'bn' ? 'সকল মামলা' : 'All Cases'}
                      </button>

                      {/* Hand-written styled details layout for specific case */}
                      <div className={`space-y-3 text-slate-800 p-3 rounded-2xl border ${
                        c.selectedParty === 'petitioner'
                          ? 'bg-[#ecfbf3] border-[#b0e8c2]'
                          : c.selectedParty === 'respondent' || c.selectedParty === 'accused'
                            ? 'bg-[#fff5f6] border-[#ffd0d3]'
                            : 'bg-[#fbf9f2]/80 border-[#e3dcc4]/50'
                      }`}>
                         <div className="flex items-start justify-between gap-2 border-b border-[#e3dcc4]/30 pb-2 mb-2">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {language === 'bn' ? 'মামলা নম্বর' : 'Case Number'}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-base font-black text-slate-900 leading-none">
                                {c.caseNumber}
                              </p>
                              {/* Client party badge removed */}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {onOpenAiForCase && (
                              <button
                                type="button"
                                onClick={() => onOpenAiForCase(c)}
                                className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all select-none flex items-center gap-1 cursor-pointer font-bold text-[9px]"
                                title={language === 'bn' ? 'এআই কে এই মামলা সম্পর্কে প্রশ্ন করুন' : 'Ask AI about this case'}
                              >
                                <Sparkles size={11} className="text-indigo-600 animate-pulse" />
                                <span>{language === 'bn' ? 'এআই সহায়ক' : 'Ask AI'}</span>
                              </button>
                            )}
                            {userType !== 'client' && (
                              <button
                                type="button"
                                onClick={() => setEditingCaseData(c)}
                                className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all select-none flex items-center gap-1 cursor-pointer font-bold text-[9px]"
                                title={language === 'bn' ? 'মামলার তথ্য সংশোধন করুন' : 'Edit Case Details'}
                              >
                                <Edit2 size={11} />
                                <span>{language === 'bn' ? 'তথ্য সংশোধন' : 'Edit Info'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {language === 'bn' ? 'মামলার ধরন' : 'Case Type'}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-block ${c.caseType === 'Civil' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                              {c.caseType}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {language === 'bn' ? 'পরবর্তী শুনানির তারিখ' : 'Next Date'}
                            </span>
                            <p className="text-xs font-bold text-slate-900 leading-none mt-0.5">
                              {c.nextDate || (language === 'bn' ? 'নির্ধারিত নয়' : 'Not Scheduled')}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                            {language === 'bn' ? 'আদালতের নাম' : 'Court Name'}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            {c.courtName}
                          </p>
                        </div>

                        <div className="border-t border-[#e3dcc4]/50 my-1 pt-1.5" />

                        {/* Parties & Calling Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white/60 p-2 rounded-xl border border-[#e3dcc4]/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600">
                                {language === 'bn' ? 'বাদী / প্রথম পক্ষ' : 'Petitioner'}
                              </span>
                              {petitionersList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActivePartyModal({
                                    caseId: c.id,
                                    side: 'petitioner',
                                    parties: petitionersList
                                  })}
                                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 px-1.5 py-0.2 rounded-md transition-all select-none flex items-center gap-0.5 cursor-pointer"
                                  title={language === 'bn' ? 'সকল বাদী দেখুন' : 'Show all petitioners'}
                                >
                                  ( {petitionersList.length} )
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-black text-slate-900 leading-none">
                                {petitionersList.length > 0 ? (
                                  `${petitionersList[0].name}${petitionersList.length > 1 ? ' গং' : ''}`
                                ) : (
                                  c.petitioner || ''
                                )}
                              </span>
                              {petitionersList.length > 1 ? (
                                <div className="relative inline-flex items-center">
                                  <div className="px-2 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs cursor-pointer">
                                    <Phone size={8} className="text-white fill-white" />
                                    <span>{language === 'bn' ? `বাদীগণ (${petitionersList.length} জন) ▾` : `Call (${petitionersList.length}) ▾`}</span>
                                    <select
                                      aria-label="বাদী নির্বাচন করে কল দিন"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900 bg-white font-bold text-xs"
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          window.location.href = `tel:${e.target.value}`;
                                          e.target.value = "";
                                        }
                                      }}
                                    >
                                      <option value="" disabled>-- বাদী নির্বাচন করুন --</option>
                                      {petitionersList.map((p, pI) => p.phone && (
                                        <option key={pI} value={p.phone} className="text-slate-900">
                                          {pI + 1}. {p.name} - {p.phone}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : c.petitionerMobile ? (
                                <a 
                                  href={`tel:${c.petitionerMobile}`} 
                                  className="px-2 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs active:scale-95 transition-all"
                                  title={`বাদী কল: ${c.petitionerMobile}`}
                                >
                                  <Phone size={8} className="text-white fill-white" />
                                  <span>{language === 'bn' ? 'কল দিন' : 'Call'}</span>
                                </a>
                              ) : null}
                            </div>
                            {c.petitionerMobile && petitionersList.length <= 1 && (
                              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{c.petitionerMobile}</p>
                            )}
                          </div>

                          <div className="bg-white/60 p-2 rounded-xl border border-[#e3dcc4]/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[8px] font-black uppercase tracking-wider text-[#b3a886]">
                                {language === 'bn' ? 'বিবাদী / দ্বিতীয় পক্ষ' : 'Respondent'}
                              </span>
                              {respondentsList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActivePartyModal({
                                    caseId: c.id,
                                    side: 'respondent',
                                    parties: respondentsList
                                  })}
                                  className="text-[10px] font-black text-[#8c7e53] hover:text-[#736539] bg-amber-50 hover:bg-amber-100 border border-[#e3dcc4] px-1.5 py-0.2 rounded-md transition-all select-none flex items-center gap-0.5 cursor-pointer"
                                  title={language === 'bn' ? 'সকল বিবাদী দেখুন' : 'Show all respondents'}
                                >
                                  ( {respondentsList.length} )
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-black text-slate-900 leading-none">
                                {respondentsList.length > 0 ? (
                                  `${respondentsList[0].name}${respondentsList.length > 1 ? ' গং' : ''}`
                                ) : (
                                  c.respondent || ''
                                )}
                              </span>
                              {respondentsList.length > 1 ? (
                                <div className="relative inline-flex items-center">
                                  <div className="px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs cursor-pointer">
                                    <Phone size={8} className="text-white fill-white" />
                                    <span>{language === 'bn' ? `বিবাদীগণ (${respondentsList.length} জন) ▾` : `Call (${respondentsList.length}) ▾`}</span>
                                    <select
                                      aria-label="বিবাদী নির্বাচন করে কল দিন"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900 bg-white font-bold text-xs"
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          window.location.href = `tel:${e.target.value}`;
                                          e.target.value = "";
                                        }
                                      }}
                                    >
                                      <option value="" disabled>-- বিবাদী নির্বাচন করুন --</option>
                                      {respondentsList.map((r, rI) => r.phone && (
                                        <option key={rI} value={r.phone} className="text-slate-900">
                                          {rI + 1}. {r.name} - {r.phone}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : c.respondentMobile ? (
                                <a 
                                  href={`tel:${c.respondentMobile}`} 
                                  className="px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs active:scale-95 transition-all"
                                  title={`বিবাদী কল: ${c.respondentMobile}`}
                                >
                                  <Phone size={8} className="text-white fill-white" />
                                  <span>{language === 'bn' ? 'কল দিন' : 'Call'}</span>
                                </a>
                              ) : null}
                            </div>
                            {c.respondentMobile && respondentsList.length <= 1 && (
                              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{c.respondentMobile}</p>
                            )}
                          </div>
                        </div>

                        {/* Professional Team Calling Badges (আইনজীবী ও মুহুরী - ভূমিকা অনুযায়ী) */}
                        <div className="p-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                              {language === 'bn' ? 'টিম কল:' : 'Team Call:'}
                            </span>
                            {/* মুহুরী কল: আইনজীবী ড্যাশবোর্ডে দৃশ্যমান, মুহুরী ড্যাশবোর্ডে লুকানো, ক্লায়েন্টে অনুমতিক্রমে */}
                            {(userType !== 'clerk' && (userType !== 'client' || c.clerkCanCall !== false)) && (c.petitionerClerkMobile || c.respondentClerkMobile || (c as any).clerkMobile) ? (
                              <a
                                href={`tel:${c.petitionerClerkMobile || c.respondentClerkMobile || (c as any).clerkMobile}`}
                                className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs transition-all active:scale-95"
                                title={`মুহুরী কল: ${c.petitionerClerkMobile || c.respondentClerkMobile || (c as any).clerkMobile}`}
                              >
                                <UserCheck size={9} className="text-white" />
                                <span>{language === 'bn' ? 'মুহুরী কল' : 'Clerk Call'}</span>
                              </a>
                            ) : null}

                            {/* আইনজীবী কল: মুহুরী ড্যাশবোর্ডে দৃশ্যমান, আইনজীবী ড্যাশবোর্ডে লুকানো, ক্লায়েন্টে অনুমতিক্রমে */}
                            {(userType !== 'lawyer' && (userType !== 'client' || c.lawyerCanCall !== false)) && (c.petitionerLawyerMobile || c.respondentLawyerMobile || (c as any).lawyerMobile) ? (
                              <a
                                href={`tel:${c.petitionerLawyerMobile || c.respondentLawyerMobile || (c as any).lawyerMobile}`}
                                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs transition-all active:scale-95"
                                title={`আইনজীবী কল: ${c.petitionerLawyerMobile || c.respondentLawyerMobile || (c as any).lawyerMobile}`}
                              >
                                <Scale size={9} className="text-white" />
                                <span>{language === 'bn' ? 'আইনজীবী কল' : 'Lawyer Call'}</span>
                              </a>
                            ) : null}

                            {/* চেম্বার অ্যাসোসিয়েট */}
                            {c.assignedAssociateMobile && (
                              <a
                                href={`tel:${c.assignedAssociateMobile}`}
                                className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] flex items-center gap-1 shadow-3xs transition-all active:scale-95"
                                title={`অ্যাসোসিয়েট কল: ${c.assignedAssociateMobile}`}
                              >
                                <Briefcase size={9} className="text-white" />
                                <span>{c.assignedAssociateName || (language === 'bn' ? 'এসোসিয়েট' : 'Associate')}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Order & Steps */}
                        <div className="bg-amber-50/45 border border-[#e3dcc4]/55 p-2.5 rounded-xl">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                            {language === 'bn' ? 'আদেশ / শুনানির পদক্ষেপ' : 'Order / Hearing Steps'}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 leading-relaxed">
                            {displayOrder || (language === 'bn' ? 'কোনো পদক্ষেপের বিবরণ নেই' : 'No steps or orders recorded')}
                          </p>
                        </div>

                        {/* COURT SESSION DRAFT NOTES - TEMPORARY STORAGE */}
                        <div className="bg-yellow-50/60 border border-yellow-200/80 p-3 rounded-xl space-y-2 relative shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                              📝 {language === 'bn' ? 'কোর্ট সেশন খসড়া নোট' : 'Court Session Draft Notes'}
                            </span>
                            <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              {language === 'bn' ? 'সাময়িক সংরক্ষণ' : 'Temp Saved'}
                            </span>
                          </div>
                          
                          <p className="text-[8px] text-[#8c7a51] font-bold leading-tight">
                            {language === 'bn' 
                              ? '*কোর্ট চলাকালীন এখানে যা টাইপ করবেন তা সাময়িকভাবে ব্রাউজারে সুরক্ষিত থাকবে। পরবর্তী তারিখ ফাইনাল এন্ট্রি করা মাত্রই এটি সার্ভারে স্থায়ীভাবে সেট হয়ে যাবে।' 
                              : '*Any notes typed here during court sessions are safely stored locally. Finalizing the next date commits everything permanently.'
                            }
                          </p>

                          <textarea
                            className="w-full text-[11px] font-bold text-slate-800 bg-[#fefcf3] border border-yellow-300/60 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-slate-400/80"
                            rows={3}
                            value={draftNotes}
                            onChange={(e) => handleDraftNotesChange(e.target.value)}
                            placeholder={language === 'bn' ? 'শুনানির খসড়া আদেশ বা গুরুত্বপূর্ন তথ্য এখানে লিখুন...' : 'Write draft hearing notes or session highlights...'}
                          />
                        </div>

                        {/* FINALIZE UPDATE: ORDER, NEXT DATE, IMAGE */}
                        <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl space-y-3 shadow-2xs">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block">
                            🏛️ {language === 'bn' ? 'মূল আদেশ ও পরবর্তী শুনানির তারিখ সেট করুন' : 'Update Final Order & Next Date'}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black text-indigo-700 block mb-1">
                                {language === 'bn' ? 'পরবর্তী শুনানির তারিখ *' : 'Next Hearing Date *'}
                              </label>
                              <input
                                type="date"
                                className="w-full text-xs font-bold text-slate-800 bg-white border border-indigo-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={finalizeDate}
                                onChange={(e) => setFinalizeDate(e.target.value)}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-black text-indigo-700 block mb-1">
                                {language === 'bn' ? 'আদেশপত্রের ছবি (ঐচ্ছিক)' : 'Order Sheet Photo (Optional)'}
                              </label>
                              <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer bg-white border border-indigo-200 rounded-lg p-2 flex items-center justify-center gap-1 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition-all border-dashed">
                                  <Camera size={12} />
                                  <span>{finalizeFile ? (language === 'bn' ? 'ছবি নির্বাচন করা হয়েছে' : 'Selected') : (language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo')}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                  />
                                </label>
                                {finalizeFilePreview && (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-200 relative shrink-0">
                                    <img src={finalizeFilePreview} alt="preview" className="w-full h-full object-cover" />
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setFinalizeFile(null);
                                        setFinalizeFilePreview(null);
                                      }}
                                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-black text-indigo-700 block mb-1">
                              {language === 'bn' ? 'চুড়ান্ত আদেশ বা পদক্ষেপের সারসংক্ষেপ' : 'Final Order / Summary of Step'}
                            </label>
                            <textarea
                              className="w-full text-xs font-bold text-slate-800 bg-white border border-indigo-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                              rows={2}
                              value={finalizeOrder}
                              onChange={(e) => setFinalizeOrder(e.target.value)}
                              placeholder={language === 'bn' ? 'আদালতের দেওয়া চুড়ান্ত আদেশ বা পরবর্তী পদক্ষেপ...' : 'The final order given by the court or next legal step...'}
                            />
                          </div>

                          {saveSuccessAnim && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2 text-[10px] font-black flex items-center gap-1.5"
                            >
                              <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                              <span>{language === 'bn' ? 'সার্ভারে সফলভাবে ইতিহাস ও চুড়ান্ত তারিখ সংরক্ষিত হয়েছে!' : 'Successfully saved permanent history & next date to the server!'}</span>
                            </motion.div>
                          )}

                          <button
                            onClick={() => handleFinalizeSave(c)}
                            disabled={isSavingFinal}
                            className={`w-full py-2 rounded-xl text-white font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                              isSavingFinal 
                                ? 'bg-indigo-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-700 to-indigo-800 hover:brightness-105 active:scale-[0.99]'
                            }`}
                          >
                            {isSavingFinal ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                <span>{language === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                              </>
                            ) : (
                              <>
                                <Upload size={12} />
                                <span>{language === 'bn' ? 'চুড়ান্ত আদেশ ও পরবর্তী তারিখ আপডেট করুন' : 'Confirm Finalize & Update'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button 
                            onClick={() => onViewCard(c)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-3xs"
                          >
                            <CreditCard size={11} />
                            {language === 'bn' ? 'কার্ড' : 'Card'}
                          </button>
                          <button 
                            onClick={() => onViewHistory(c)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-600 hover:text-white text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-3xs"
                          >
                            <History size={11} />
                            {language === 'bn' ? 'ইতিহাস' : 'History'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()
              ) : selectedDateCases.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedAndCategorizedCases).map(([courtName, categories]) => {
                    const totalCourtCases = categories.attendance.length + categories.charge.length + categories.witness.length + categories.wa.length;
                    if (totalCourtCases === 0) return null;
                    return (
                      <div key={courtName} className="bg-white/40 border border-[#e3dcc4]/50 rounded-2xl p-2.5 space-y-3 shadow-3xs relative overflow-hidden">
                        {/* Court Title Bar */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#e3dcc4]/30">
                          <span className="text-[10px] sm:text-[11px] font-black text-[#524933] flex items-center gap-1.5">
                            🏛️ {courtName}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-bold bg-[#e3dcc4]/45 text-[#524933] px-2 py-0.5 rounded-full border border-[#d2c9ab]/40">
                            {language === 'bn' ? 'মোট: ' : 'Total: '}
                            {language === 'bn'
                              ? totalCourtCases.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('')
                              : totalCourtCases
                            }
                          </span>
                        </div>

                        {/* Categorized sub-sections (Chronological order) */}
                        <div className="space-y-3 pl-1">
                          {categories.attendance.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionAttendance || (language === 'bn' ? '📂 হাজিরা বা সময়' : '📂 Attendance / Time'), 
                            categories.attendance, 
                            'bg-slate-50 text-slate-700 border-slate-200'
                          )}
                          {categories.charge.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionCharge || (language === 'bn' ? '⚡ চার্জ / শুনানি / জবাব' : '⚡ Charge / Argument / WS'), 
                            categories.charge, 
                            'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                          {categories.witness.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionWitness || (language === 'bn' ? '📝 সাক্ষী / জেরা / PH' : '📝 Witness / Cross / PH'), 
                            categories.witness, 
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                          {categories.wa.length > 0 && renderSubgroupSection(
                            buttonLabels.sectionWarrant || (language === 'bn' ? '🚨 W/A (ওয়ারেন্ট)' : '🚨 W/A (Warrant)'), 
                            categories.wa, 
                            'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-16"
                >
                  <CalendarIcon size={44} className="text-[#c2baa0]/50 mb-2" />
                  <p className="text-xs font-black text-[#756a4e]">
                    {language === 'bn' ? 'এই তারিখে কোনো মামলা তালিকাভুক্ত নেই' : 'No cases listed for this date'}
                  </p>
                  <p className="text-[10px] text-[#9c9172] mt-0.5">
                    {language === 'bn' ? 'ক্যালেন্ডার থেকে যেকোনো তারিখ সিলেক্ট করুন' : 'Select any date from the calendar to view its diary entry'}
                  </p>
                  {onAddCaseForDate && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
                        onAddCaseForDate(targetDate);
                      }}
                      className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      title={language === 'bn' ? 'নতুন মামলা যোগ করুন' : 'Add New Case'}
                    >
                      <Plus size={14} />
                      <span>{language === 'bn' ? '+ নতুন মামলা যোগ করুন' : '+ Add New Case'}</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedDateCases.length > 0 && (
            <div className="mt-4 p-3 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-100/50 z-10 flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-wider opacity-80">{t('total_cases')}</p>
                <h4 className="text-sm font-black mt-0.5 leading-none">
                  {language === 'bn' 
                    ? selectedDateCases.length.toString().split('').map(d => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][parseInt(d)] || d).join('') + ' টি মামলা'
                    : `${selectedDateCases.length} Cases`
                  }
                </h4>
              </div>
              <p className="text-[9px] font-bold text-indigo-100 bg-indigo-700/60 px-2.5 py-1 rounded-lg text-right">
                {t('finish_all_preparation')}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {activePartyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePartyModal(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {activePartyModal.side === 'petitioner' ? '⚖️' : '👤'}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">
                    {activePartyModal.side === 'petitioner'
                      ? (language === 'bn' ? `বাদী / প্রথম পক্ষ (${activePartyModal.parties.length} জন)` : `Petitioners (${activePartyModal.parties.length})`)
                      : (language === 'bn' ? `বিবাদী / দ্বিতীয় পক্ষ (${activePartyModal.parties.length} জন)` : `Respondents (${activePartyModal.parties.length})`)
                    }
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePartyModal(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {activePartyModal.parties.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {language === 'bn' ? 'কোনো তথ্য পাওয়া যায়নি' : 'No details found'}
                  </p>
                ) : (
                  activePartyModal.parties.map((p, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/50 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#e3dcc4] text-[#7a6f4d] flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-black text-slate-800">{p.name}</p>
                          {p.phone && (
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{p.phone}</p>
                          )}
                        </div>
                      </div>

                      {p.phone && (
                        <a 
                          href={`tel:${p.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-[10px] sm:text-[11px] shadow-sm shadow-emerald-100 hover:brightness-105 active:scale-[0.98] transition-all shrink-0"
                        >
                          <Phone size={10} className="fill-white text-white" />
                          <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setActivePartyModal(null)}
                className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-slate-700 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCaseData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📝</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    {language === 'bn' ? 'মামলার তথ্য সংশোধন করুন' : 'Edit Case Details'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCaseData(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleEditCaseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'মামলা নম্বর *' : 'Case Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCaseNumber}
                      onChange={(e) => setEditCaseNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'আদালতের নাম *' : 'Court Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCourtName}
                      onChange={(e) => setEditCourtName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'মামলার ধরন' : 'Case Type'}
                    </label>
                    <select
                      value={editCaseType}
                      onChange={(e) => setEditCaseType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Civil">{language === 'bn' ? 'দেওয়ানি (Civil)' : 'Civil'}</option>
                      <option value="Criminal">{language === 'bn' ? 'ফৌজদারি (Criminal)' : 'Criminal'}</option>
                      <option value="Other">{language === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'মামলার বর্তমান অবস্থা' : 'Current Status'}
                    </label>
                    <input
                      type="text"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      placeholder="e.g. শুনানি / জবাব দাখিল"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2 border-t border-slate-100 my-1" />

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বাদী / প্রথম পক্ষ (একাধিক হলে কমা দিয়ে লিখুন)' : 'Petitioner Name(s)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editPetitioner}
                      onChange={(e) => setEditPetitioner(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বাদীর মোবাইল (একাধিক হলে কমা দিয়ে লিখুন)' : 'Petitioner Mobile(s)'}
                    </label>
                    <input
                      type="text"
                      value={editPetitionerMobile}
                      onChange={(e) => setEditPetitionerMobile(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বিবাদী / দ্বিতীয় পক্ষ (একাধিক হলে কমা দিয়ে লিখুন)' : 'Respondent Name(s)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editRespondent}
                      onChange={(e) => setEditRespondent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 block">
                      {language === 'bn' ? 'বিবাদীর মোবাইল (একাধিক হলে কমা দিয়ে লিখুন)' : 'Respondent Mobile(s)'}
                    </label>
                    <input
                      type="text"
                      value={editRespondentMobile}
                      onChange={(e) => setEditRespondentMobile(e.target.value)}
                      placeholder="e.g. 01800000000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCaseData(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCase}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingCase ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      '💾'
                    )}
                    <span>{language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Customizer Modal */}
      <AnimatePresence>
        {showButtonCustomizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowButtonCustomizer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fdfaf3] rounded-3xl w-full max-w-2xl overflow-hidden border-[6px] border-[#4a2e1b] shadow-2xl p-6 space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    {language === 'bn' ? 'বাটন এবং ক্যাটাগরি লেবেল কাস্টমাইজ করুন' : 'Customize Button & Category Labels'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowButtonCustomizer(false)}
                  className="p-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-all cursor-pointer border border-amber-300"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                {/* Documents button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'ডকুমেন্টস বাটন লেবেল' : 'Documents Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnDocuments}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnDocuments: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Face-to-face button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'সামনাসামনি বাটন লেবেল' : 'Face to Face Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnFaceToFace}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnFaceToFace: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Ask AI button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'এআই সহায়ক বাটন লেবেল' : 'Ask AI Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnAskAi}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnAskAi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Edit info button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'তথ্য সংশোধন বাটন লেবেল' : 'Edit Info Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnEditInfo}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnEditInfo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Order button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'আদেশ বাটন লেবেল' : 'Order Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnOrder || (language === 'bn' ? 'আদেশ' : 'ORDER')}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnOrder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Step button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'পদক্ষেপ বাটন লেবেল' : 'Step Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnStep || (language === 'bn' ? 'পদক্ষেপ' : 'STEP')}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnStep: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* View card button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'কার্ড দেখুন বাটন লেবেল' : 'View Card Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnViewCard}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnViewCard: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* View history button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'ইতিহাস দেখুন বাটন লেবেল' : 'View History Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnViewHistory}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnViewHistory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Confirm finalize button label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'পরবর্তী তারিখ আপডেট বাটন লেবেল' : 'Confirm Update Button Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnConfirmFinalize}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnConfirmFinalize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Draft notes label */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'কোর্ট সেশন খসড়া নোট লেবেল' : 'Draft Notes Title Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.btnDraftNotes}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, btnDraftNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-amber-200 my-1 pt-2">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                    📂 {language === 'bn' ? 'ডায়েরী ক্যাটাগরি লেবেল' : 'Diary Category Labels'}
                  </span>
                </div>

                {/* Section attendance */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'হাজিরা বা সময় ক্যাটাগরি' : 'Attendance Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionAttendance}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionAttendance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Section charge */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'চার্জ / শুনানি / জবাব ক্যাটাগরি' : 'Charge Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionCharge}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionCharge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Section witness */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'সাক্ষী / জেরা / PH ক্যাটাগরি' : 'Witness Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionWitness}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionWitness: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Section warrant */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'W/A (ওয়ারেন্ট) ক্যাটাগরি' : 'Warrant Category Label'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.sectionWarrant}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, sectionWarrant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-amber-200 my-1 pt-2">
                  <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                    ⚖️ {language === 'bn' ? 'ডায়েরী বুক স্টেপ সমূহ' : 'Diary Book Steps'}
                  </span>
                </div>

                {/* step Summons */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'সমন স্টেপ' : 'Summons Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepSummons}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepSummons: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Witness */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'স্বাক্ষী স্টেপ' : 'Witness Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepWitness}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepWitness: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Cross */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'জেরা স্টেপ' : 'Cross Exam Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepCross}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepCross: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Argument */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'যক্তিতর্ক স্টেপ' : 'Argument Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepArgument}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepArgument: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* step Judgment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-amber-900 block">
                    {language === 'bn' ? 'রায় স্টেপ' : 'Judgment Step'}
                  </label>
                  <input
                    type="text"
                    value={buttonLabels.stepJudgment}
                    onChange={(e) => setButtonLabels({ ...buttonLabels, stepJudgment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => {
                    const defaults = {
                      btnDocuments: language === 'bn' ? 'ডকুমেন্টস' : 'Documents',
                      btnFaceToFace: language === 'bn' ? 'সামনাসামনি হতে চাই' : 'Face to Face',
                      btnAskAi: language === 'bn' ? 'এআই সহায়ক' : 'Ask AI',
                      btnEditInfo: language === 'bn' ? 'তথ্য সংশোধন' : 'Edit Info',
                      btnViewCard: language === 'bn' ? 'কার্ড দেখুন' : 'View Card',
                      btnViewHistory: language === 'bn' ? 'ইতিহাস দেখুন' : 'View History',
                      btnConfirmFinalize: language === 'bn' ? 'চুড়ান্ত আদেশ ও পরবর্তী তারিখ আপডেট করুন' : 'Confirm Finalize & Update',
                      btnDraftNotes: language === 'bn' ? 'কোর্ট সেশন খসড়া নোট' : 'Court Session Draft Notes',
                      sectionAttendance: language === 'bn' ? '📂 হাজিরা বা সময়' : '📂 Attendance / Time',
                      sectionCharge: language === 'bn' ? '⚡ চার্জ / শুনানি / জবাব' : '⚡ Charge / Argument / WS',
                      sectionWitness: language === 'bn' ? '📝 সাক্ষী / জেরা / PH' : '📝 Witness / Cross / PH',
                      sectionWarrant: language === 'bn' ? '🚨 W/A (ওয়ারেন্ট)' : '🚨 W/A (Warrant)',
                      stepSummons: language === 'bn' ? 'সমন' : 'Summons',
                      stepWitness: language === 'bn' ? 'স্বাক্ষী' : 'Witness',
                      stepCross: language === 'bn' ? 'জেরা' : 'Cross Exam',
                      stepArgument: language === 'bn' ? 'যক্তিতর্ক' : 'Argument',
                      stepJudgment: language === 'bn' ? 'রায়' : 'Judgment',
                      btnOrder: language === 'bn' ? 'আদেশ' : 'ORDER',
                      btnStep: language === 'bn' ? 'পদক্ষেপ' : 'STEP'
                    };
                    setButtonLabels(defaults);
                    localStorage.setItem('custom_button_labels', JSON.stringify(defaults));
                  }}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'রিসেট' : 'Reset to Defaults'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('custom_button_labels', JSON.stringify(buttonLabels));
                    setShowButtonCustomizer(false);
                  }}
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm text-center"
                >
                  {language === 'bn' ? 'পরিবর্তনসমূহ সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckCircle2 = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
