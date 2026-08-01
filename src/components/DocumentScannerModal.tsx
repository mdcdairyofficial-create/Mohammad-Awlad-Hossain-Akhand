import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Trash2,
  FileText,
  Check,
  Plus,
  Loader2,
  Sparkles,
  Upload,
  Layers,
  Zap,
  ZapOff,
  Sun,
  Eye,
  FileCheck,
  Maximize2,
  Crop,
  Sliders,
  Scissors,
  RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { uploadFile, getPublicUrl } from '../lib/storage';

interface CropBounds {
  topPct: number;    // 0 to 40
  bottomPct: number; // 0 to 40
  leftPct: number;   // 0 to 40
  rightPct: number;  // 0 to 40
}

interface ScannedPage {
  id: string;
  dataUrl: string;       // Original uncropped image
  croppedUrl: string;    // Image after crop bounds applied
  filteredUrl: string;   // Image after crop + filter applied
  filterMode: 'color' | 'grayscale' | 'document';
  rotation: number;
  cropBounds: CropBounds;
}

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string;
  onDocumentScanned: (document: { name: string; type: string; url: string }) => void;
  language?: 'bn' | 'en';
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  caseNumber = 'General',
  onDocumentScanned,
  language = 'bn'
}) => {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [docName, setDocName] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'color' | 'grayscale' | 'document'>('document');
  const [autoCropEnabled, setAutoCropEnabled] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Manual Crop Editor State for a specific page
  const [editingCropIndex, setEditingCropIndex] = useState<number | null>(null);
  const [tempCropBounds, setTempCropBounds] = useState<CropBounds>({ topPct: 0, bottomPct: 0, leftPct: 0, rightPct: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultName = `মামলার_নথি_${caseNumber}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
      setDocName(defaultName);
      startCamera();
    } else {
      stopCamera();
      setPages([]);
      setEditingCropIndex(null);
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities?.() as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } catch (err: any) {
      console.warn("Camera start failed, fallback to file upload:", err);
      setIsCameraActive(false);
      setCameraError(
        language === 'bn'
          ? 'ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে নিচে ফটো গ্যালারি বা ফাইল থেকে ছবি সিলেক্ট করুন।'
          : 'Unable to start camera stream. Please upload or capture images via file picker below.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.error("Torch error", e);
      }
    }
  };

  /**
   * Automatic edge detection to compute bounding percentages for paper documents.
   * Scans pixel rows/cols for brightness contrast or non-background paper boundary.
   */
  const detectAutoCropBounds = (imgElement: HTMLImageElement): CropBounds => {
    try {
      const canvas = document.createElement('canvas');
      const w = Math.min(600, imgElement.width || 600);
      const h = Math.min(800, imgElement.height || 800);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { topPct: 3, bottomPct: 3, leftPct: 3, rightPct: 3 };

      ctx.drawImage(imgElement, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Calculate row luminance & column luminance
      let topRow = 0;
      let bottomRow = h - 1;
      let leftCol = 0;
      let rightCol = w - 1;

      const getLuma = (x: number, y: number) => {
        const idx = (y * w + x) * 4;
        return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      };

      // Top search
      for (let y = 0; y < Math.floor(h * 0.35); y++) {
        let paperPixels = 0;
        for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x += 4) {
          if (getLuma(x, y) > 110) paperPixels++;
        }
        if (paperPixels > (w * 0.6) / 4) {
          topRow = Math.max(0, y - 2);
          break;
        }
      }

      // Bottom search
      for (let y = h - 1; y > Math.floor(h * 0.65); y--) {
        let paperPixels = 0;
        for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x += 4) {
          if (getLuma(x, y) > 110) paperPixels++;
        }
        if (paperPixels > (w * 0.6) / 4) {
          bottomRow = Math.min(h - 1, y + 2);
          break;
        }
      }

      // Left search
      for (let x = 0; x < Math.floor(w * 0.35); x++) {
        let paperPixels = 0;
        for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y += 4) {
          if (getLuma(x, y) > 110) paperPixels++;
        }
        if (paperPixels > (h * 0.6) / 4) {
          leftCol = Math.max(0, x - 2);
          break;
        }
      }

      // Right search
      for (let x = w - 1; x > Math.floor(w * 0.65); x--) {
        let paperPixels = 0;
        for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y += 4) {
          if (getLuma(x, y) > 110) paperPixels++;
        }
        if (paperPixels > (h * 0.6) / 4) {
          rightCol = Math.min(w - 1, x + 2);
          break;
        }
      }

      const topPct = Math.round((topRow / h) * 100);
      const bottomPct = Math.round(((h - 1 - bottomRow) / h) * 100);
      const leftPct = Math.round((leftCol / w) * 100);
      const rightPct = Math.round(((w - 1 - rightCol) / w) * 100);

      // Sanity checks
      return {
        topPct: Math.min(30, Math.max(0, topPct)),
        bottomPct: Math.min(30, Math.max(0, bottomPct)),
        leftPct: Math.min(30, Math.max(0, leftPct)),
        rightPct: Math.min(30, Math.max(0, rightPct))
      };
    } catch (e) {
      console.warn("Auto crop error:", e);
      return { topPct: 2, bottomPct: 2, leftPct: 2, rightPct: 2 };
    }
  };

  /**
   * Crop an image canvas based on topPct, bottomPct, leftPct, rightPct
   */
  const cropImageData = (dataUrl: string, bounds: CropBounds): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { topPct, bottomPct, leftPct, rightPct } = bounds;
        const cropX = Math.round((img.width * leftPct) / 100);
        const cropY = Math.round((img.height * topPct) / 100);
        const cropW = Math.max(10, img.width - cropX - Math.round((img.width * rightPct) / 100));
        const cropH = Math.max(10, img.height - cropY - Math.round((img.height * bottomPct) / 100));

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = dataUrl;
    });
  };

  /**
   * Apply Filter Mode (Color, Grayscale, High Contrast Document)
   */
  const processFilterData = (
    croppedDataUrl: string,
    mode: 'color' | 'grayscale' | 'document'
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(croppedDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);

        if (mode === 'color') {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luminance
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (mode === 'document') {
            // High contrast boost for legal documents & text clarity
            if (gray > 135) {
              gray = Math.min(255, gray * 1.18);
            } else {
              gray = Math.max(0, gray * 0.65);
            }
          }

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = croppedDataUrl;
    });
  };

  /**
   * Helper to build a complete ScannedPage from raw data URL
   */
  const createScannedPage = async (
    rawDataUrl: string,
    useAutoCrop: boolean,
    currentFilter: 'color' | 'grayscale' | 'document'
  ): Promise<ScannedPage> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        let bounds: CropBounds = { topPct: 0, bottomPct: 0, leftPct: 0, rightPct: 0 };
        if (useAutoCrop) {
          bounds = detectAutoCropBounds(img);
        }

        const croppedUrl = await cropImageData(rawDataUrl, bounds);
        const filteredUrl = await processFilterData(croppedUrl, currentFilter);

        resolve({
          id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          dataUrl: rawDataUrl,
          croppedUrl,
          filteredUrl,
          filterMode: currentFilter,
          rotation: 0,
          cropBounds: bounds
        });
      };
      img.src = rawDataUrl;
    });
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    // Trigger visual flash effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const newPage = await createScannedPage(rawDataUrl, autoCropEnabled, filterMode);
    setPages((prev) => [...prev, newPage]);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async (event) => {
          const rawDataUrl = event.target?.result as string;
          const newPage = await createScannedPage(rawDataUrl, autoCropEnabled, filterMode);
          setPages((prev) => [...prev, newPage]);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const updatePageFilter = async (index: number, newMode: 'color' | 'grayscale' | 'document') => {
    const target = pages[index];
    if (!target) return;
    const updatedFiltered = await processFilterData(target.croppedUrl, newMode);
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, filterMode: newMode, filteredUrl: updatedFiltered } : p))
    );
  };

  const openCropEditor = (index: number) => {
    const target = pages[index];
    if (!target) return;
    setEditingCropIndex(index);
    setTempCropBounds({ ...target.cropBounds });
  };

  const applyCropChanges = async () => {
    if (editingCropIndex === null) return;
    const target = pages[editingCropIndex];
    if (!target) return;

    const newCroppedUrl = await cropImageData(target.dataUrl, tempCropBounds);
    const newFilteredUrl = await processFilterData(newCroppedUrl, target.filterMode);

    setPages((prev) =>
      prev.map((p, idx) =>
        idx === editingCropIndex
          ? {
              ...p,
              cropBounds: { ...tempCropBounds },
              croppedUrl: newCroppedUrl,
              filteredUrl: newFilteredUrl
            }
          : p
      )
    );

    setEditingCropIndex(null);
  };

  const autoDetectCurrentCropInEditor = () => {
    if (editingCropIndex === null) return;
    const target = pages[editingCropIndex];
    if (!target) return;

    const img = new Image();
    img.onload = () => {
      const bounds = detectAutoCropBounds(img);
      setTempCropBounds(bounds);
    };
    img.src = target.dataUrl;
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => {
        if (idx !== index) return p;
        const nextRotation = (p.rotation + 90) % 360;

        const img = new Image();
        img.src = p.filteredUrl;
        const canvas = document.createElement('canvas');
        if (nextRotation === 90 || nextRotation === 270) {
          canvas.width = img.height || 1000;
          canvas.height = img.width || 800;
        } else {
          canvas.width = img.width || 800;
          canvas.height = img.height || 1000;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((nextRotation * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
        }

        return {
          ...p,
          rotation: nextRotation,
          filteredUrl: canvas.toDataURL('image/jpeg', 0.92)
        };
      })
    );
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== index));
    if (editingCropIndex === index) {
      setEditingCropIndex(null);
    }
  };

  const handleSaveAndUpload = async () => {
    if (pages.length === 0) return;
    setIsUploading(true);

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (i > 0) doc.addPage();
        doc.addImage(p.filteredUrl, 'JPEG', 5, 5, 200, 287);
      }

      const pdfBlob = doc.output('blob');
      const cleanFileName =
        (docName.trim() || 'Scanned_Document').replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_') + '.pdf';
      const path = `cases/${caseNumber}/scanned/${Date.now()}_${cleanFileName}`;

      const file = new File([pdfBlob], cleanFileName, { type: 'application/pdf' });
      await uploadFile('documents', path, file);
      const publicUrl = await getPublicUrl('documents', path);

      onDocumentScanned({
        name: cleanFileName,
        type: 'pdf',
        url: publicUrl
      });

      onClose();
    } catch (err) {
      console.error('Error generating or uploading scanned PDF:', err);
      alert(language === 'bn' ? 'নথি ফাইলটি সেভ করতে সমস্যা হয়েছে।' : 'Failed to upload scanned document.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden text-white font-sans">
      {/* Flash overlay */}
      {flashEffect && <div className="absolute inset-0 bg-white z-[500] animate-out fade-out duration-200 pointer-events-none" />}

      {/* Top Bar Header */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
            <Camera size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              {language === 'bn' ? 'মোবাইল ক্যামেরা স্ক্যানার' : 'Mobile Document Scanner'}
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black rounded-full border border-indigo-500/30 uppercase">
                HD Scan + Auto Crop
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              {language === 'bn' ? 'মামলার নথিপত্র স্বয়ংক্রিয় ক্রপ (Auto Edge Trim) করে PDF তৈরি করুন' : 'Scan & auto-crop legal document pages'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && isCameraActive && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border transition-all ${
                torchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="টর্চ লাইট"
            >
              {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-2.5 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
              title="ক্যামেরা ফ্লিপ"
            >
              <RotateCw size={18} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Scanner Body */}
      <div className="relative flex-1 bg-black flex flex-col md:flex-row overflow-hidden">
        {/* Left/Center: Camera Feed or Viewfinder */}
        <div className="relative flex-1 flex items-center justify-center bg-slate-950 overflow-hidden min-h-[300px]">
          {isCameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-contain max-h-[75vh]"
              />

              {/* Viewfinder Bounding Box Grid */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-indigo-400/80 rounded-2xl pointer-events-none shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col justify-between p-4">
                {/* Corner Markers */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                </div>
                <div className="text-center bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-indigo-200 border border-indigo-500/30 self-center">
                  📄 {language === 'bn' ? 'নথিপত্র ফ্রেমের ভেতরে রাখুন (অটো ক্রপ অন)' : 'Keep document inside frame (Auto Crop ON)'}
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-16 h-16 mx-auto bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center border border-slate-700">
                <Camera size={32} />
              </div>
              <p className="text-sm font-medium text-slate-300">
                {cameraError || (language === 'bn' ? 'ক্যামেরা চালু করা সম্ভব হয়নি।' : 'Camera unavailable.')}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mx-auto"
              >
                <Upload size={18} />
                {language === 'bn' ? 'গ্যালারি/ফাইল থেকে ফটো সিলেক্ট করুন' : 'Select images from gallery'}
              </button>
            </div>
          )}

          {/* Filter & Auto Crop Controls Bar Overlay */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-center gap-2 z-10">
            <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1 shadow-2xl items-center">
              {/* Auto Crop Toggle */}
              <button
                onClick={() => setAutoCropEnabled(!autoCropEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  autoCropEnabled
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700'
                }`}
                title="অটোমেটিক বাড়তি বর্ডার বাদ দেয়া"
              >
                <Crop size={14} className={autoCropEnabled ? 'text-emerald-400' : ''} />
                {language === 'bn'
                  ? `অটো ক্রপ: ${autoCropEnabled ? 'চালু (ON)' : 'বন্ধ (OFF)'}`
                  : `Auto Crop: ${autoCropEnabled ? 'ON' : 'OFF'}`}
              </button>

              <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

              {/* Filter Buttons */}
              <button
                onClick={() => setFilterMode('document')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === 'document' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} />
                {language === 'bn' ? 'হাই কনট্রাস্ট' : 'B&W Doc'}
              </button>
              <button
                onClick={() => setFilterMode('grayscale')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === 'grayscale' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun size={14} />
                {language === 'bn' ? 'গ্রে-স্কেল' : 'Grayscale'}
              </button>
              <button
                onClick={() => setFilterMode('color')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === 'color' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye size={14} />
                {language === 'bn' ? 'মূল কালার' : 'Original'}
              </button>
            </div>
          </div>
        </div>

        {/* Right/Bottom Panel: Pages List & PDF Naming */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-200">
                  {language === 'bn' ? 'স্ক্যান করা পেজসমূহ' : 'Scanned Pages'} ({pages.length})
                </h3>
              </div>

              {pages.length > 0 && (
                <button
                  onClick={() => setPages([])}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {language === 'bn' ? 'সব মুছুন' : 'Clear All'}
                </button>
              )}
            </div>

            {/* Document Title Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {language === 'bn' ? 'নথির নাম (Document Title)' : 'Document Name'}
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                placeholder="যেমন: আরজি_কপি_১৫০৭২"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {['আরজি', 'ওকালতনামা', 'রায়_আদেশ', 'আবেদন', 'সমমন', 'প্রমাণ্য_দলিল'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setDocName(`${tag}_${caseNumber}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700/80 transition-all"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail Grid */}
            {pages.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                <FileText size={28} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'bn'
                    ? 'এখনো কোনো পেজ স্ক্যান করা হয়নি। নিচে ক্যামেরা বা গ্যালারি বাটন চাপুন।'
                    : 'No pages scanned yet. Use camera or upload button.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto p-1 pr-2">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="relative group bg-slate-950 rounded-xl border border-slate-800 p-1.5 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={p.filteredUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />

                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900/80 backdrop-blur-md rounded text-[10px] font-black text-indigo-300">
                        P{idx + 1}
                      </div>

                      <div className="absolute bottom-1 right-1 flex gap-1">
                        <button
                          onClick={() => openCropEditor(idx)}
                          className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-all"
                          title="সাইজ/ক্রপ এডিট করুন"
                        >
                          <Crop size={12} />
                        </button>
                        <button
                          onClick={() => setPreviewImage(p.filteredUrl)}
                          className="p-1 bg-slate-900/80 text-slate-200 rounded hover:bg-indigo-600 hover:text-white transition-all"
                          title="একটু বড় করে দেখুন"
                        >
                          <Maximize2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 px-0.5">
                      <button
                        onClick={() => rotatePage(idx)}
                        className="p-1 bg-slate-800 text-slate-300 hover:text-white rounded hover:bg-slate-700 text-[10px] font-bold flex items-center gap-1"
                        title="ঘুরান"
                      >
                        <RotateCw size={11} />
                      </button>

                      <div className="flex gap-1">
                        <button
                          onClick={() => openCropEditor(idx)}
                          className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded text-[9px] font-bold border border-indigo-500/30"
                          title="মার্জিন ও ক্রপ এডজাস্টমেন্ট"
                        >
                          ক্রপ
                        </button>

                        <button
                          onClick={() => updatePageFilter(idx, p.filterMode === 'document' ? 'color' : 'document')}
                          className="px-1.5 py-0.5 bg-slate-800 text-slate-300 hover:text-indigo-300 rounded text-[9px] font-bold"
                          title="ফিল্টার পরিবর্তন"
                        >
                          {p.filterMode === 'document' ? 'B&W' : 'Color'}
                        </button>

                        <button
                          onClick={() => removePage(idx)}
                          className="p-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-all"
                          title="মুছুন"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Upload Actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2 mt-2">
            {pages.length > 0 && (
              <button
                onClick={handleSaveAndUpload}
                disabled={isUploading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {language === 'bn' ? 'PDF তৈরি ও আপলোড হচ্ছে...' : 'Generating & Uploading PDF...'}
                  </>
                ) : (
                  <>
                    <FileCheck size={18} />
                    {language === 'bn'
                      ? `সবকটি (${pages.length}টি) পেজ PDF হিসেবে অ্যাপে আপলোড করুন`
                      : `Upload All (${pages.length}) Pages as PDF`}
                  </>
                )}
              </button>
            )}

            <div className="flex gap-2">
              {isCameraActive && (
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 border border-indigo-400/30"
                >
                  <Camera size={18} />
                  {language === 'bn' ? 'ছবি তুলুন (Snap Page)' : 'Snap Page'}
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 flex items-center gap-1.5"
                title="গ্যালারি ফাইল"
              >
                <Plus size={16} />
                {language === 'bn' ? 'গ্যালারি' : 'Gallery'}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleGalleryUpload}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manual Interactive Page Crop Editor Modal */}
      {editingCropIndex !== null && pages[editingCropIndex] && (
        <div className="fixed inset-0 z-[550] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Crop size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'bn' ? 'পেজ ক্রপ ও বর্ডার ট্রিম এডিটর' : 'Page Crop & Border Trimming'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'bn' ? 'অতিরিক্ত অংশ বাদ দিয়ে কেবল মামলার লেখা যুক্ত রাখুন' : 'Trim outer background'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={autoDetectCurrentCropInEditor}
                className="px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles size={14} />
                {language === 'bn' ? 'অটো সাইজ ডিটেক্ট' : 'Auto Detect Size'}
              </button>
              <button
                onClick={() => setTempCropBounds({ topPct: 0, bottomPct: 0, leftPct: 0, rightPct: 0 })}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <RefreshCw size={12} />
                {language === 'bn' ? 'রিসেট' : 'Reset'}
              </button>
              <button
                onClick={() => setEditingCropIndex(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Crop Canvas View */}
          <div className="relative flex-1 my-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden p-2">
            <div className="relative max-h-[55vh] max-w-full flex items-center justify-center">
              <img
                src={pages[editingCropIndex].dataUrl}
                alt="Original Page to Crop"
                className="max-h-[55vh] object-contain rounded-lg border border-slate-700"
              />

              {/* Crop Box Overlay Mask */}
              <div
                className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/10 transition-all pointer-events-none rounded"
                style={{
                  top: `${tempCropBounds.topPct}%`,
                  bottom: `${tempCropBounds.bottomPct}%`,
                  left: `${tempCropBounds.leftPct}%`,
                  right: `${tempCropBounds.rightPct}%`
                }}
              >
                <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                  CROP FRAME
                </div>
              </div>
            </div>
          </div>

          {/* Sliders for Top, Bottom, Left, Right Trimming */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-300">
              <div>
                <div className="flex justify-between mb-1">
                  <span>{language === 'bn' ? 'উপরের বর্ডার (Top)' : 'Top Trim'}</span>
                  <span className="text-indigo-400">{tempCropBounds.topPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={tempCropBounds.topPct}
                  onChange={(e) => setTempCropBounds((prev) => ({ ...prev, topPct: Number(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{language === 'bn' ? 'নিচের বর্ডার (Bottom)' : 'Bottom Trim'}</span>
                  <span className="text-indigo-400">{tempCropBounds.bottomPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={tempCropBounds.bottomPct}
                  onChange={(e) => setTempCropBounds((prev) => ({ ...prev, bottomPct: Number(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{language === 'bn' ? 'বাম বর্ডার (Left)' : 'Left Trim'}</span>
                  <span className="text-indigo-400">{tempCropBounds.leftPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={tempCropBounds.leftPct}
                  onChange={(e) => setTempCropBounds((prev) => ({ ...prev, leftPct: Number(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>{language === 'bn' ? 'ডান বর্ডার (Right)' : 'Right Trim'}</span>
                  <span className="text-indigo-400">{tempCropBounds.rightPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={tempCropBounds.rightPct}
                  onChange={(e) => setTempCropBounds((prev) => ({ ...prev, rightPct: Number(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingCropIndex(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={applyCropChanges}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check size={16} />
                {language === 'bn' ? 'ক্রপ সেভ করুন' : 'Apply Crop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full max-h-[85vh] bg-slate-900 rounded-3xl p-4 overflow-hidden border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-300">পেজ প্রিভিউ (Page Preview)</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center">
              <img src={previewImage} alt="Full Preview" className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
