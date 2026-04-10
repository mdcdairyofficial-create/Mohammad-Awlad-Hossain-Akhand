import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { uploadFile, getPublicUrl } from '../../lib/storage';

interface FileUploaderProps {
  bucket?: string;
  onUploadSuccess?: (url: string, fileName: string) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
  caseNumber?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function FileUploader({ 
  bucket = 'documents', 
  onUploadSuccess, 
  allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  maxSizeMB = 10,
  caseNumber,
  className = '',
  style
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const fileExt = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedTypes.includes(fileExt)) {
      setError(`অনুমোদিত ফাইল টাইপ: ${allowedTypes.join(', ')}`);
      return;
    }

    // Check file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`ফাইল সাইজ ${maxSizeMB}MB এর বেশি হতে পারবে না`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!isConfigured) {
      setError('স্টোরেজ কনফিগারেশন অনুপস্থিত। দয়া করে এডমিনকে জানান।');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const timestamp = Date.now();
      // Sanitize file name: remove special characters and spaces
      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${timestamp}-${sanitizedOriginalName}`;
      
      // Sanitize case number for path
      const sanitizedCaseNumber = caseNumber ? caseNumber.replace(/[\/\s]/g, '_') : null;
      
      const path = sanitizedCaseNumber 
        ? `${sanitizedCaseNumber}/${dateStr}/${fileName}` 
        : `general/${dateStr}/${fileName}`;
      
      await uploadFile(bucket, path, file);
      const url = await getPublicUrl(bucket, path);
      
      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(url, file.name);
      }
      setFile(null);
    } catch (err: any) {
      console.error('Upload error details:', err);
      let errorMessage = err.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে।';
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করুন।';
      } else if (errorMessage.includes('bucket_not_found')) {
        errorMessage = 'স্টোরেজ বাকেট পাওয়া যায়নি। দয়া করে এডমিনকে জানান।';
      } else if (errorMessage.includes('permission_denied')) {
        errorMessage = 'ফাইল আপলোড করার অনুমতি নেই।';
      }
      
      setError(`${errorMessage}। দয়া করে আবার চেষ্টা করুন।`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:border-indigo-300 transition-colors ${className}`} style={style}>
      {!isConfigured && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-xs font-bold text-amber-800">স্টোরেজ কনফিগারেশন অনুপস্থিত</p>
            <p className="text-[10px] text-amber-700 mt-1">দয়া করে এনভায়রনমেন্ট ভেরিয়েবল (VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY) সেট করুন।</p>
          </div>
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={allowedTypes.join(',')}
      />
      
      {!file && !success && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-6 cursor-pointer"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
            <Upload size={24} />
          </div>
          <p className="text-sm font-bold text-slate-700">ফাইল নির্বাচন করুন</p>
          <p className="text-xs text-slate-500 mt-1">সর্বোচ্চ ১০ এমবি (PDF, Image, Doc)</p>
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
              <File size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!uploading && (
              <>
                <button 
                  onClick={handleUpload}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  আপলোড
                </button>
                <button 
                  onClick={() => setFile(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </>
            )}
            {uploading && (
              <Loader2 size={20} className="text-indigo-600 animate-spin" />
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="flex flex-col items-center justify-center py-4">
          <CheckCircle size={32} className="text-emerald-500 mb-2" />
          <p className="text-sm font-bold text-slate-800">সফলভাবে আপলোড হয়েছে!</p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
          >
            আরেকটি ফাইল আপলোড করুন
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
          <AlertCircle size={16} />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
