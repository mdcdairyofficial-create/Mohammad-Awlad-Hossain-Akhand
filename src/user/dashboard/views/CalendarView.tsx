import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { 
  ChevronLeft, 
  ChevronRight, 
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
  Save,
  Image as ImageIcon,
  Trash2,
  Paperclip,
  Download,
  Eye,
  FileSpreadsheet,
  FileCheck,
  MessageSquare,
  Send
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
  onWhatsAppShare
}: {
  c: Case;
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: any) => string;
  buttonLabels: any;
  onUpdateCaseLocal?: (caseId: string | number, updatedFields: Partial<Case>) => void;
  onViewCard: (c: Case) => void;
  currentDiaryDate?: string;
  onWhatsAppShare?: (c: Case, side?: 'petitioner' | 'respondent') => void;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [prevDate, setPrevDate] = useState(c.lastDate || '');
  const [caseNumber, setCaseNumber] = useState(c.caseNumber || '');
  const [petitioner, setPetitioner] = useState(c.petitioner || '');
  const [respondent, setRespondent] = useState(c.respondent || '');
  const [nextDate, setNextDate] = useState(c.nextDate || '');
  const [order, setOrder] = useState(c.order || 'আদেশ');
  const [clientNotes1, setClientNotes1] = useState(c.petitionerDetails?.[0]?.name || '');
  const [clientNotes2, setClientNotes2] = useState(c.additionalOrder || '');
  const [oppositeNotes, setOppositeNotes] = useState(c.respondentDetails?.[0]?.name || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
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

    const updatedFields: Partial<Case> = {
      nextDate: newDateStr,
      lastDate: prevDateToSet,
      pastDates: updatedPastDates,
      history: updatedHistory
    };

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

  const petitionerInfo = formatMultiplePersons(petitioner, c.petitionerDetails, language);
  const respondentInfo = formatMultiplePersons(respondent, c.respondentDetails, language);

  return (
    <div className="w-full bg-white/95 dark:bg-slate-850 rounded-xl sm:rounded-2xl border border-amber-200/50 dark:border-slate-800 p-1.5 sm:p-2.5 md:p-3 shadow-xs hover:shadow-md transition-all overflow-hidden">
      {/* Small top header with original action buttons */}
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-dashed border-amber-200/40 dark:border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
            ID: {c.id}
          </span>
          {isPastForCase && (
            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
              {language === 'bn' ? 'বিগত ধার্য তারিখ' : 'Past Date'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          {c.petitionerMobile && (
            <a 
              href={`tel:${c.petitionerMobile}`} 
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 hover:brightness-105 flex items-center justify-center border border-slate-200 shadow-3xs active:scale-95 transition-all shrink-0" 
              title={`কল করুন (বাদী): ${c.petitionerMobile}`}
            >
              <Phone size={9} className="text-white fill-white" />
            </a>
          )}
          {c.respondentMobile && (
            <a 
              href={`tel:${c.respondentMobile}`} 
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 hover:brightness-105 flex items-center justify-center border border-slate-200 shadow-3xs active:scale-95 transition-all shrink-0" 
              title={`কল করুন (বিবাদী): ${c.respondentMobile}`}
            >
              <Phone size={9} className="text-white fill-white" />
            </a>
          )}
          <button 
            onClick={() => onViewCard(c)}
            className="p-0.5 sm:p-1 bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-700 hover:text-white border border-amber-200 dark:border-slate-700 transition-all active:scale-95 shrink-0 shadow-3xs"
            title="ভিউ কার্ড"
          >
            <CreditCard size={10} />
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
              className="shrink-0 min-w-fit bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-blue-150/40 dark:border-slate-750 px-2 sm:px-2.5 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={prevDate}
                  onChange={(e) => setPrevDate(e.target.value)}
                  placeholder="02/11"
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-blue-300 rounded text-[8px] sm:text-[10px] md:text-[12px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[50px]"
                />
              ) : (
                <p className="text-[8px] sm:text-[10px] md:text-[12px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {formatDayMonth(prevDate) || (language === 'bn' ? 'পূর্ব তারিখ' : 'Prev')}
                </p>
              )}
            </div>

            {/* 3. মামলা নং (CASE NUMBER) - LARGE CENTRAL GRADIENT */}
            <div 
              title={language === 'bn' ? 'মামলা নং' : 'Case Number'}
              className="shrink-0 min-w-fit bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 text-white rounded sm:rounded-lg px-2.5 sm:px-3 shadow-2xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder={language === 'bn' ? 'মামলা নং' : 'Case No'}
                  className="px-1 py-0 bg-indigo-900/60 border border-indigo-450 rounded text-[8.5px] sm:text-[10.5px] md:text-[12.5px] font-black text-white text-center focus:outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[8.5px] sm:text-[10.5px] md:text-[12.5px] font-black tracking-tight leading-none text-center whitespace-nowrap">
                  {caseNumber || (language === 'bn' ? 'মামলা নং' : 'CASE NO')}
                </p>
              )}
            </div>

            {/* 4. বাদীর নাম (PLAINTIFF) */}
            <div 
              title={petitionerInfo.fullNames ? `${language === 'bn' ? 'বাদী' : 'Plaintiff'}:\n${petitionerInfo.fullNames}` : (language === 'bn' ? 'বাদীর নাম' : 'Plaintiff')}
              className="shrink-0 min-w-fit bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-orange-150/40 dark:border-slate-750 px-2.5 sm:px-3 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={petitioner}
                  onChange={(e) => setPetitioner(e.target.value)}
                  placeholder={language === 'bn' ? 'বাদী' : 'Plaintiff'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-orange-300 rounded text-[8px] sm:text-[9.5px] md:text-[11.5px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[8px] sm:text-[9.5px] md:text-[11.5px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {petitionerInfo.formatted || (language === 'bn' ? 'বাদী' : 'Plaintiff')}
                </p>
              )}
            </div>

            {/* 5. V/S (VERSUS) */}
            <div className="shrink-0 px-1.5 sm:px-2 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded sm:rounded-md shadow-3xs flex items-center justify-center self-stretch">
              <p className="text-[8.5px] sm:text-[10px] md:text-[12px] font-black tracking-tighter leading-none whitespace-nowrap">
                V/S
              </p>
            </div>

            {/* 6. আসামীর নাম (DEFENDANT) */}
            <div 
              title={respondentInfo.fullNames ? `${language === 'bn' ? 'আসামী' : 'Defendant'}:\n${respondentInfo.fullNames}` : (language === 'bn' ? 'আসামীর নাম' : 'Defendant')}
              className="shrink-0 min-w-fit bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-emerald-150/40 dark:border-slate-750 px-2.5 sm:px-3 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={respondent}
                  onChange={(e) => setRespondent(e.target.value)}
                  placeholder={language === 'bn' ? 'আসামী' : 'Defendant'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-emerald-300 rounded text-[8px] sm:text-[9.5px] md:text-[11.5px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[8px] sm:text-[9.5px] md:text-[11.5px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {respondentInfo.formatted || (language === 'bn' ? 'আসামী' : 'Defendant')}
                </p>
              )}
            </div>

            {/* 7. পরবর্তী তারিখ (NEXT DATE) */}
            <div 
              onClick={openDatePicker}
              title={language === 'bn' ? 'পরবর্তী তারিখ (ক্যালেন্ডার খুলতে ক্লিক করুন)' : 'Next Date (Click to open calendar)'}
              className="shrink-0 min-w-fit bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-sky-150/40 dark:border-slate-750 px-2 sm:px-2.5 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px] cursor-pointer hover:border-sky-300 dark:hover:border-sky-500 hover:shadow-2xs active:scale-[0.98] transition-all"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={formatDayMonth(nextDate) || nextDate}
                  onClick={openDatePicker}
                  onChange={(e) => setNextDate(e.target.value)}
                  placeholder="02/11"
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-sky-300 rounded text-[8px] sm:text-[10px] md:text-[12px] font-black text-slate-800 dark:text-white text-center focus:outline-none whitespace-nowrap min-w-[50px] cursor-pointer"
                />
              ) : (
                <p className="text-[8px] sm:text-[10px] md:text-[12px] font-black text-slate-800 dark:text-white leading-none text-center whitespace-nowrap">
                  {formatDayMonth(nextDate) || (language === 'bn' ? 'পর তারিখ' : 'Next')}
                </p>
              )}
            </div>

            {/* 8. ACTION SECTION - উপরে আদেশ ও নিচে পদক্ষেপ */}
            <div className="shrink-0 min-w-fit px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/40 rounded sm:rounded-lg border border-slate-200/50 dark:border-slate-750/50 flex flex-col justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]">
              <div className="flex flex-col gap-0.5 h-full justify-between">
                
                {/* উপরে আদেশ */}
                <button
                  type="button"
                  onClick={() => {
                    setOrder('আদেশ');
                    setShowOrderModal(true);
                  }}
                  className={`flex-1 rounded px-1.5 flex items-center justify-center transition-all leading-none cursor-pointer ${
                    order === 'আদেশ' 
                      ? 'bg-emerald-600 text-white shadow-3xs' 
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-emerald-50'
                  }`}
                  title={language === 'bn' ? 'মামলার আদেশ বিবরণ দেখুন (ক্লিক করুন)' : 'View Order Details (Click)'}
                >
                  <span className="text-[6.5px] sm:text-[8px] md:text-[9.5px] font-black leading-none whitespace-nowrap">
                    {language === 'bn' ? 'আদেশ' : 'ORDER'}
                  </span>
                </button>

                {/* নিচে পদক্ষেপ */}
                <button
                  type="button"
                  onClick={() => {
                    setOrder('পদক্ষেপ');
                    setShowStepModal(true);
                  }}
                  className={`flex-1 rounded px-1.5 flex items-center justify-center transition-all leading-none cursor-pointer ${
                    order === 'পদক্ষেপ' 
                      ? 'bg-cyan-600 text-white shadow-3xs' 
                      : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-cyan-50'
                  }`}
                  title={language === 'bn' ? 'পদক্ষেপ ও ছবি আপলোড (ক্লিক করুন)' : 'Step & Photo Upload (Click)'}
                >
                  <span className="text-[6.5px] sm:text-[8px] md:text-[9.5px] font-black leading-none whitespace-nowrap">
                    {language === 'bn' ? 'পদক্ষেপ' : 'STEP'}
                  </span>
                </button>

              </div>
            </div>

            {/* 9. EDIT BUTTON */}
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`shrink-0 w-3.5 sm:w-5 md:w-6 self-stretch rounded sm:rounded-md flex flex-col items-center justify-center cursor-pointer transition-all py-0.5 shadow-3xs ${
                isEditMode 
                  ? 'bg-amber-500 text-slate-900 scale-[1.02]' 
                  : 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600 active:scale-95'
              }`}
            >
              <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              <span className="text-[4.5px] sm:text-[5.5px] md:text-[6.5px] font-black mt-0.5 leading-none whitespace-nowrap">EDIT</span>
            </button>

            {/* 9.1 WHATSAPP NOTIFY BUTTON */}
            <button
              type="button"
              onClick={() => {
                if (onWhatsAppShare) {
                  onWhatsAppShare({
                    ...c,
                    nextDate: nextDate || c.nextDate,
                    order: order || c.order
                  }, 'petitioner');
                } else {
                  const mobile = c.petitionerMobile || c.respondentMobile || '';
                  const cleanDigits = mobile.replace(/[^0-9]/g, '');
                  const intl = cleanDigits.startsWith('88') ? cleanDigits : (cleanDigits ? `88${cleanDigits}` : '');
                  const trackUrl = getMagicCaseTrackUrl({ caseId: c.id, caseNumber: c.caseNumber });
                  const msg = `শ্রদ্ধেয় মক্কেল, আপনার মামলা নং ${c.caseNumber} এর পরবর্তী শুনানির তারিখ: ${nextDate || c.nextDate || 'নির্ধারিত নয়'}। আদালতের পদক্ষেপ: ${order || c.order || 'আদেশ'}। সরাসরি মামলার বিবরণ ও ১-ট্যাপে অটো নোটিফিকেশন পেতে লিংকে প্রবেশ করুন: ${trackUrl}`;
                  const waUrl = intl ? `https://wa.me/${intl}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                  window.open(waUrl, '_blank');
                }
              }}
              title={language === 'bn' ? 'মক্কেলকে হোয়াটসঅ্যাপে তারিখ ও ম্যাজিক ট্র্যাকিং লিংক পাঠান' : 'Send Date & Magic Link to Client via WhatsApp'}
              className="shrink-0 w-3.5 sm:w-5 md:w-6 self-stretch rounded sm:rounded-md bg-[#25D366] hover:bg-[#1fb355] text-white flex flex-col items-center justify-center cursor-pointer transition-all py-0.5 shadow-3xs active:scale-95"
            >
              <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              <span className="text-[4px] sm:text-[5px] md:text-[6px] font-black mt-0.5 leading-none whitespace-nowrap">WA</span>
            </button>

            {/* 10. PARTY BOXES - 3 separate cards */}
            
            {/* Column A: নিজ পক্ষ */}
            <div 
              title={language === 'bn' ? 'নিজ পক্ষ' : 'Our Side'}
              className="shrink-0 min-w-fit px-2 sm:px-2.5 bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-purple-150/40 dark:border-slate-750 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={clientNotes1}
                  onChange={(e) => setClientNotes1(e.target.value)}
                  placeholder={language === 'bn' ? 'নিজ পক্ষ' : 'Our side'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-purple-300 rounded text-[7px] sm:text-[8.5px] md:text-[10px] font-bold text-slate-800 dark:text-white outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold text-slate-800 dark:text-slate-200 leading-none text-center whitespace-nowrap">
                  {clientNotes1 || (language === 'bn' ? 'নিজ পক্ষ' : 'Our side')}
                </p>
              )}
            </div>

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
                  placeholder={language === 'bn' ? 'আদেশ...' : 'Order...'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-orange-300 rounded text-[7px] sm:text-[8.5px] md:text-[10px] font-bold text-slate-800 dark:text-white outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold text-slate-800 dark:text-slate-200 leading-none text-center whitespace-nowrap">
                  {clientNotes2 || (language === 'bn' ? 'আদেশ' : 'Order')}
                </p>
              )}
            </div>

            {/* 11. SAVE BUTTON */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isEditMode}
              className={`shrink-0 w-3.5 sm:w-5 md:w-6 self-stretch rounded sm:rounded-md flex flex-col items-center justify-center transition-all py-0.5 shadow-3xs ${
                isEditMode 
                  ? 'bg-gradient-to-b from-teal-500 to-emerald-600 text-white scale-[1.02]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
              }`}
            >
              <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
              <span className="text-[4.5px] sm:text-[5.5px] md:text-[6.5px] font-black mt-0.5 leading-none whitespace-nowrap">SAVE</span>
            </button>

            {/* Column C: উত্তর পক্ষ */}
            <div 
              title={language === 'bn' ? 'উত্তর পক্ষ' : 'Opposite Side'}
              className="shrink-0 min-w-fit px-2 sm:px-2.5 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-850 rounded sm:rounded-lg border border-emerald-150/40 dark:border-slate-750 shadow-3xs flex items-center justify-center min-h-[20px] sm:min-h-[23px] md:min-h-[26px]"
            >
              {isEditMode ? (
                <input
                  type="text"
                  value={oppositeNotes}
                  onChange={(e) => setOppositeNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'উত্তর পক্ষ' : 'Opposite'}
                  className="px-1 py-0 bg-white dark:bg-slate-800 border border-emerald-300 rounded text-[7px] sm:text-[8.5px] md:text-[10px] font-bold text-slate-800 dark:text-white outline-none whitespace-nowrap min-w-[75px]"
                />
              ) : (
                <p className="text-[7.5px] sm:text-[9px] md:text-[10.5px] font-bold text-slate-800 dark:text-slate-200 leading-none text-center whitespace-nowrap">
                  {oppositeNotes || (language === 'bn' ? 'উত্তর পক্ষ' : 'Opposite')}
                </p>
              )}
            </div>

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

      {/* 14. Case Order Details Screen / Modal */}
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

            {/* Case Info Ribbon */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700 flex flex-col gap-1 text-[10px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white font-black rounded-md">
                    {caseNumber || c.caseNumber || 'মামলা নং'}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                    c.caseType?.toLowerCase().includes('civil') || c.caseType?.includes('দেওয়ানী')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  }`}>
                    {c.caseType || (selectedStepType === 'civil' ? 'Civil' : 'Criminal')}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 truncate max-w-[150px]">
                  {c.courtName || 'আদালত'}
                </span>
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 truncate">
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
  onWhatsAppShare
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
}) => {
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
              <div className="space-y-10">
                {Object.entries(groupedByCourt).map(([court, courtCases]) => (
                  <div key={court} className="space-y-6">
                    <div className="flex items-center gap-3 border-b-2 border-amber-200 pb-1.5">
                      <div className="w-2 h-6 bg-amber-700 rounded-full"></div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">🏛️ {court}</h4>
                    </div>

                    <div className="flex flex-col space-y-6 w-full">
                      {Object.entries(getGroupedByStep(courtCases)).map(([step, stepCases]) => (
                        <div key={step} className="space-y-3">
                          <h5 className="text-xs font-black text-amber-800 bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-lg inline-block tracking-wider uppercase">
                            {step === 'সমন' || step === buttonLabels.stepSummons ? buttonLabels.stepSummons || t('action_summons') : 
                             step === 'স্বাক্ষী' || step === buttonLabels.stepWitness ? buttonLabels.stepWitness || t('action_witness') : 
                             step === 'জেরা' || step === buttonLabels.stepCross ? buttonLabels.stepCross || t('action_cross_exam') : 
                             step === 'যক্তিতর্ক' || step === buttonLabels.stepArgument ? buttonLabels.stepArgument || t('action_argument') : 
                             step === 'রায়' || step === buttonLabels.stepJudgment ? buttonLabels.stepJudgment || t('action_judgment') : 
                             t('other_label')}
                          </h5>
                          <div className="space-y-4">
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

        {/* Book Footer */}
        <div className="p-3 bg-[#fbf8ee] border-t border-amber-200/50 text-center z-10">
          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest">© {t('digital_diary')} - {date}</p>
        </div>
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
  onWhatsAppShare
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
      stepJudgment: language === 'bn' ? 'রায়' : 'Judgment'
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
                    <td className="py-1.5 px-1.5 font-extrabold text-slate-950 border-r border-[#e3dcc4]/10">
                      <div>
                        <span>{c.caseNumber}</span>
                        <div className="flex gap-0.5 mt-0.5">
                          <span className={`text-[6px] font-extrabold px-1 py-0.2 rounded ${c.caseType === 'Civil' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                            {c.caseType}
                          </span>
                          {c.selectedParty === 'petitioner' ? (
                            <span className="text-[6px] font-black px-1 py-0.2 bg-emerald-600 text-white rounded">
                              {language === 'bn' ? 'বাদী' : 'Pet'}
                            </span>
                          ) : c.selectedParty === 'respondent' || c.selectedParty === 'accused' ? (
                            <span className="text-[6px] font-black px-1 py-0.2 bg-rose-600 text-white rounded">
                              {language === 'bn' ? 'আসামী' : 'Acc'}
                            </span>
                          ) : null}
                        </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-140px)] lg:min-h-[580px] max-w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AnimatePresence>
        {hoveredHolidayReason && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[200] px-6 py-3 bg-rose-600 text-white rounded-2xl shadow-2xl font-bold flex items-center gap-3 backdrop-blur-md border border-white/20"
          >
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <CalendarIcon size={18} />
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
          />
        )}
      </AnimatePresence>

      {/* Calendar Section */}
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <p className="text-indigo-600 font-bold text-[10px] sm:text-xs mt-0.5">
                {getBanglaMonthYear(currentMonth)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-3xs"
            >
              {t('today')}
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day, idx) => {
              const isHoliday = idx === 5 || idx === 6; // Fri and Sat in Sun-Sat week
              return (
                <div key={day} className={`text-center text-xs font-black uppercase tracking-widest ${isHoliday ? 'text-rose-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {prevMonthDays.map(i => (
              <div key={`prev-${i}`} className="aspect-square rounded-2xl bg-slate-50/30 border border-transparent opacity-20" />
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
                    aspect-square rounded-2xl border transition-all duration-300 relative group p-1.5 flex flex-col justify-between
                    ${isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 z-10' 
                      : isToday
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                        : isHoliday
                          ? 'bg-rose-50 border-rose-100 text-rose-600'
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }
                    ${shouldBlink ? 'animate-blink border-rose-500 shadow-rose-200 shadow-md' : ''}
                  `}
                >
                  {shouldHighlightPending && (
                    <div className="absolute inset-2 rounded-full bg-rose-500/20 animate-ping" />
                  )}
                  {shouldHighlightPending && (
                    <div className="absolute inset-0 rounded-2xl bg-rose-500/10 animate-pulse border-2 border-rose-500/30" />
                  )}
                  <div className="flex justify-start w-full relative z-10">
                    <span className={`text-lg sm:text-xl leading-none font-black ${isSelected || isToday ? 'text-white' : isHoliday ? 'text-rose-600' : 'text-slate-700'}`}>
                      {day}
                    </span>
                  </div>
                  
                  {bnDate && (
                    <div className="flex justify-end w-full mt-auto relative z-10">
                      <span className={`text-[9px] sm:text-[10px] font-bold leading-none ${isSelected || isToday ? 'text-white/90' : 'text-indigo-600'}`}>
                        {bnDate}
                      </span>
                    </div>
                  )}

                  {isHoliday && !isSelected && !isToday && (
                    <span className="absolute top-1 right-2 text-[8px] font-black text-rose-400 uppercase tracking-tighter">
                      {language === 'bn' ? 'বন্ধ' : 'Closed'}
                    </span>
                  )}

                  {dayCases.length > 0 && (
                    <div className="absolute bottom-2 left-2 flex gap-0.5">
                      {dayCases.slice(0, 3).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1 h-1 rounded-full ${isSelected || isToday ? 'bg-white' : 'bg-indigo-400'}`} 
                        />
                      ))}
                    </div>
                  )}
                  {dayCases.length > 0 && !isSelected && !isToday && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-0 group-hover:scale-100 transition-transform">
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
      <div className="space-y-4 h-full flex flex-col">
        <div className="relative bg-[#fdfbf7] p-5 rounded-[2.5rem] border-2 border-[#e3dcc4] shadow-md h-full flex flex-col overflow-hidden">
          {/* Notebook Spiral Ring Binder Effect */}
          <div className="absolute left-2.5 top-0 bottom-0 w-5 flex flex-col justify-around items-center pointer-events-none z-20 opacity-80">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5 -my-1">
                {/* Spiral binder hole */}
                <div className="w-2 h-2 rounded-full bg-slate-800/20 border border-slate-900/30 shadow-inner" />
                {/* Silver Metal Ring Hook */}
                <div className="w-4 h-1.5 rounded-full bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-sm -ml-2 border border-slate-300" />
              </div>
            ))}
          </div>

          {/* Red Notebook Margin Line */}
          <div className="absolute left-10 top-0 bottom-0 w-[2px] bg-rose-400/45 z-10 pointer-events-none" />

          {/* Diary Header */}
          <div className="pl-7 flex items-center justify-between mb-4 border-b border-[#e3dcc4] pb-3 z-10">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#524933] flex items-center gap-1.5">
                📖 {language === 'bn' ? 'দৈনিক শুনানি ডায়েরী' : 'Daily Hearing Diary'}
              </h3>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5 bg-indigo-50/75 px-2 py-0.5 rounded-full inline-block border border-indigo-100/70">
                {selectedDate ? `${language === 'bn' ? 'তারিখ:' : 'Date:'} ${selectedDate}` : t('today_schedule')}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                              {c.selectedParty === 'petitioner' ? (
                                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 bg-emerald-600 text-white rounded-full">
                                  {language === 'bn' ? 'আমার মক্কেল: বাদী পক্ষ' : 'Client: Petitioner'}
                                </span>
                              ) : c.selectedParty === 'respondent' || c.selectedParty === 'accused' ? (
                                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 bg-rose-600 text-white rounded-full">
                                  {language === 'bn' ? 'আমার মক্কেল: আসামী পক্ষ' : 'Client: Defendant/Accused'}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {onOpenAiForCase && (
                              <button
                                type="button"
                                onClick={() => onOpenAiForCase(c)}
                                className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all select-none flex items-center gap-1 cursor-pointer font-bold text-[10px]"
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
                                className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all select-none flex items-center gap-1 cursor-pointer font-bold text-[10px]"
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

                        {/* Parties Section */}
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
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-black text-slate-900 leading-none">
                                {petitionersList.length > 0 ? (
                                  `${petitionersList[0].name}${petitionersList.length > 1 ? ' গং' : ''}`
                                ) : (
                                  c.petitioner || ''
                                )}
                              </span>
                              {c.petitionerMobile && (
                                <a 
                                  href={`tel:${c.petitionerMobile}`} 
                                  className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] flex items-center justify-center border border-slate-300 shadow-3xs"
                                >
                                  <Phone size={5} className="text-white fill-white" />
                                </a>
                              )}
                            </div>
                            {c.petitionerMobile && (
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
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-black text-slate-900 leading-none">
                                {respondentsList.length > 0 ? (
                                  `${respondentsList[0].name}${respondentsList.length > 1 ? ' গং' : ''}`
                                ) : (
                                  c.respondent || ''
                                )}
                              </span>
                              {c.respondentMobile && (
                                <a 
                                  href={`tel:${c.respondentMobile}`} 
                                  className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-[#22c55e] to-[#15803d] flex items-center justify-center border border-slate-300 shadow-3xs"
                                >
                                  <Phone size={5} className="text-white fill-white" />
                                </a>
                              )}
                            </div>
                            {c.respondentMobile && (
                              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{c.respondentMobile}</p>
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
                      stepJudgment: language === 'bn' ? 'রায়' : 'Judgment'
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
