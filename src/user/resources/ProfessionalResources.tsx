import React, { useState, useEffect } from 'react';
import { FileText, Users, BookOpen, Download, Search, Plus, X, ExternalLink, Coins, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFile, getPublicUrl } from '../../lib/storage';

interface ProfessionalResourcesProps {
  user: any;
}

interface Template {
  id: number;
  title: string;
  description: string;
  file_url: string;
  uploaded_by: number;
  uploader_name: string;
  uploader_type: string;
  created_at: string;
}

export default function ProfessionalResources({ user }: ProfessionalResourcesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [watchingAd, setWatchingAd] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    uploader_name: user?.name || user?.fullName || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/users/${user.id}/points`);
      const data = await res.json();
      if (data.success) {
        setPoints(data.points);
      }
    } catch (error) {
      console.error("Failed to fetch points", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  const watchAd = async () => {
    if (!user?.id) {
      alert('বিজ্ঞাপন দেখতে লগইন করুন');
      return;
    }
    
    setShowAdModal(true);
    setAdCountdown(10);
    setWatchingAd(true);
    
    let timeLeft = 10;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setAdCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        completeAdWatch();
      }
    }, 1000);
  };

  const completeAdWatch = async () => {
    try {
      const res = await fetch('/api/ads/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setPoints(data.points);
        alert('বিজ্ঞাপন দেখা সম্পন্ন হয়েছে! আপনি ১০ পয়েন্ট পেয়েছেন।');
      }
    } catch (error) {
      console.error("Failed to watch ad", error);
      alert('বিজ্ঞাপন দেখতে সমস্যা হয়েছে।');
    } finally {
      setWatchingAd(false);
      setShowAdModal(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('ফাইলের সাইজ ১০ মেগাবাইটের বেশি হতে পারবে না।');
      e.target.value = ''; // Reset input
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('দয়া করে একটি ফাইল নির্বাচন করুন');
      return;
    }
    
    setUploading(true);
    try {
      // 1. Upload to Supabase
      const bucket = 'documents';
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const path = `templates/${fileName}`;
      
      await uploadFile(bucket, path, selectedFile);
      const fileUrl = await getPublicUrl(bucket, path);

      // 2. Save to backend
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          file_url: fileUrl,
          uploaded_by: user.id
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'সার্ভার এরর: আপলোড ব্যর্থ হয়েছে');
      }

      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setFormData({ title: '', description: '', uploader_name: user?.name || user?.fullName || '' });
        setSelectedFile(null);
        fetchTemplates();
        alert('সফলভাবে আপলোড হয়েছে!');
      } else {
        alert(data.error || 'আপলোড ব্যর্থ হয়েছে');
      }
    } catch (error: any) {
      console.error("Failed to upload template", error);
      alert(error.message || 'আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (template: Template) => {
    if (!user?.id) {
      alert('ডাউনলোড করতে লগইন করুন');
      return;
    }

    try {
      // Process download transaction
      const txRes = await fetch(`/api/templates/${template.id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      
      const txData = await txRes.json();
      
      if (!txData.success) {
        alert(txData.error || 'ডাউনলোড ব্যর্থ হয়েছে।');
        return;
      }
      
      // Update points after successful deduction
      fetchPoints();

      const fileUrl = txData.file_url;

      if (fileUrl.startsWith('data:')) {
        const res = await fetch(fileUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        const mime = blob.type;
        let extension = '';
        if (mime === 'application/pdf') extension = '.pdf';
        else if (mime === 'application/msword') extension = '.doc';
        else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') extension = '.docx';
        else if (mime === 'text/plain') extension = '.txt';
        
        let filename = template.title;
        if (extension && !filename.toLowerCase().endsWith(extension)) {
          filename += extension;
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = template.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("ডাউনলোড ফেইল হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    }
  };

  return (
    <div className="space-y-8">
      {/* Ad Modal */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlayCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">বিজ্ঞাপন চলছে...</h3>
              <p className="text-slate-600 mb-8">
                দয়া করে অপেক্ষা করুন। বিজ্ঞাপনটি শেষ হলে আপনি ১০ পয়েন্ট পাবেন।
              </p>
              
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    className="stroke-amber-500 transition-all duration-1000 linear"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * (10 - adCountdown)) / 10}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-slate-800">{adCountdown}</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-500">
                দয়া করে পেজটি বন্ধ করবেন না
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">পেশাদার সেবা ও রিসোর্স</h2>
          <p className="text-slate-500">আপনার আইনি কাজের গতি বাড়াতে প্রয়োজনীয় সব টুলস ও রিসোর্স এখানে পাবেন।</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold">
            <Coins size={20} />
            <span>{points} পয়েন্ট</span>
          </div>
          {(user?.userType === 'lawyer' || user?.userType === 'clerk') && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shrink-0"
            >
              <Plus size={20} />
              টেমপ্লেট আপলোড করুন
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Legal Forms & Templates - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-2xl">
                <FileText className="text-indigo-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">আইনি ফর্ম ও টেমপ্লেট</h3>
                <p className="text-sm text-slate-500">প্রতি ডাউনলোডে ১০ পয়েন্ট কাটা হবে</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">লোড হচ্ছে...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>এখনো কোনো টেমপ্লেট আপলোড করা হয়নি।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{template.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                      <span className="bg-white px-2 py-1 rounded-md border border-slate-200">
                        আপলোড: {template.uploader_name || 'অজানা'} {template.uploader_type ? `(${template.uploader_type === 'lawyer' ? 'উকিল' : 'মুহুরি'})` : ''}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(template)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
                  >
                    <Download size={18} />
                    ডাউনলোড (১০ পয়েন্ট)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Earn Points Section */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 shadow-sm text-white">
            <div className="bg-white/20 p-4 rounded-2xl w-fit mb-4">
              <PlayCircle className="text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">পয়েন্ট অর্জন করুন</h3>
            <p className="text-white/80 mb-6">বিজ্ঞাপন দেখে পয়েন্ট অর্জন করুন এবং টেমপ্লেট ডাউনলোড করুন। প্রতি বিজ্ঞাপনে ১০ পয়েন্ট।</p>
            <button 
              onClick={watchAd}
              disabled={watchingAd}
              className="w-full py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {watchingAd ? (
                <span className="animate-pulse">বিজ্ঞাপন চলছে...</span>
              ) : (
                <>
                  <PlayCircle size={20} />
                  বিজ্ঞাপন দেখুন
                </>
              )}
            </button>
          </div>

          {/* Professional Directory */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="bg-emerald-100 p-4 rounded-2xl w-fit mb-4">
              <Users className="text-emerald-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">পেশাদার ডিরেক্টরি</h3>
            <p className="text-slate-500 mb-6">অন্যান্য উকিল বা মুহুরিদের সাথে নেটওয়ার্কিং করুন।</p>
            <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <Search size={20} />
              খুঁজুন
            </button>
          </div>

          {/* Legal Tips */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="bg-amber-100 p-4 rounded-2xl w-fit mb-4">
              <BookOpen className="text-amber-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">আইনি টিপস ও গাইড</h3>
            <p className="text-slate-500 mb-6">নতুন আইন ও আদালতের নিয়ম সম্পর্কে জানুন।</p>
            <button className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
              <BookOpen size={20} />
              পড়ুন
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">নতুন টেমপ্লেট আপলোড</h3>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">টেমপ্লেটের নাম</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="যেমন: জামিনের আবেদনপত্র"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">আপলোডকারীর নাম</label>
                  <input
                    type="text"
                    required
                    value={formData.uploader_name}
                    onChange={e => setFormData({...formData, uploader_name: e.target.value})}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">বিবরণ</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="টেমপ্লেটটি কী কাজে লাগবে তার সংক্ষিপ্ত বিবরণ..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">ফাইল আপলোড করুন</label>
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    * আপনার কম্পিউটার বা মোবাইল থেকে PDF, DOC, DOCX অথবা TXT ফাইল নির্বাচন করুন।
                  </p>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'আপলোড হচ্ছে...' : 'আপলোড করুন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
