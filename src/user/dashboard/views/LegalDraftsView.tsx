import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Download, 
  Copy, 
  ChevronRight,
  Scale,
  Plus,
  X,
  Lock,
  Award,
  Gift,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star
} from 'lucide-react';
import { db, storage, handleFirestoreError, OperationType } from '../../../firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { jsPDF } from 'jspdf';

interface Template {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  categoryBn: string;
  content: string;
  createdBy?: string;
  price?: number;
  pdfUrl?: string;
  totalRating?: number;
  ratingCount?: number;
  userRatings?: Record<string, number>;
}

const STATIC_TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Vakalatnama (Power of Attorney)',
    titleBn: 'ওকালতনামা (পাওয়ার অফ অ্যাটর্নি)',
    category: 'General',
    categoryBn: 'সাধারণ',
    content: `IN THE COURT OF... \nCase No... of 2024 \n\nPetitioner: ... \nRespondent: ... \n\nKNOW ALL MEN BY THESE PRESENTS that I/We... do hereby appoint... Advocate to be my/our Advocate in the above-mentioned case...`
  },
  {
    id: '2',
    title: 'Civil Suit - Money Recovery',
    titleBn: 'দেওয়ানী মামলা - অর্থ উদ্ধার',
    category: 'Civil',
    categoryBn: 'দেওয়ানী',
    content: `IN THE COURT OF THE JOINT DISTRICT JUDGE, ... \n\nMoney Suit No... of 2024 \n\nPlaintiff: ... \nDefendant: ... \n\nPLINTIFF'S CLAIM FOR RECOVERY OF BDT... \n\nThe Plaintiff most respectfully states: \n1. That the defendant borrowed...`
  },
  {
    id: '3',
    title: 'Criminal Revision - 439 CrPC',
    titleBn: 'ফৌজদারি রিভিশন - ৪৩৯ সিআরপিসি',
    category: 'Criminal',
    categoryBn: 'ফৌজদারি',
    content: `IN THE HIGH COURT DIVISION OF THE SUPREME COURT OF BANGLADESH... \n\nCriminal Revision No... of 2024 \n\nPetitioner: ... \nOpposite Party: ... \n\nIn the matter of an application under Section 439 of the CrPC...`
  }
];

export const LegalDraftsView = ({ language, userPoints, onUpdateProfile, userId }: { language: 'bn' | 'en' | 'hi' | 'ur', userPoints: number, onUpdateProfile: (data: any) => void, userId: string }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>(STATIC_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [purchasedDrafts, setPurchasedDrafts] = useState<string[]>([]);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingPromptTemplateId, setRatingPromptTemplateId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    titleBn: '',
    category: '',
    categoryBn: '',
    content: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTemplates = templates.filter(t => {
    const q = searchQuery.toLowerCase();
    return (t.title && t.title.toLowerCase().includes(q)) || 
           (t.titleBn && t.titleBn.toLowerCase().includes(q)) ||
           (t.category && t.category.toLowerCase().includes(q)) ||
           (t.categoryBn && t.categoryBn.toLowerCase().includes(q));
  });

  useEffect(() => {
    const fetchDrafts = async () => {
      // 1. Try to load from localStorage cache first to enable offline and save reads
      const cachedDraftsJson = localStorage.getItem('legalDraftsCache');
      if (cachedDraftsJson) {
        try {
          const parsedCache = JSON.parse(cachedDraftsJson);
          setTemplates(prev => {
            const staticIds = new Set(prev.map(t => t.id));
            const newDrafts = parsedCache.filter((d: any) => !staticIds.has(d.id));
            return [...prev.filter(t => staticIds.has(t.id)), ...newDrafts];
          });
          setLoading(false);
          
          // Optional: Only fetch server data if it hasn't been updated in the last 24h
          const cacheTime = localStorage.getItem('legalDraftsCacheTime');
          if (cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
            return;
          }
        } catch (e) {
          console.error("Error parsing cache", e);
        }
      }

      if (!navigator.onLine) {
        setLoading(false);
        return; // Already loaded offline cache
      }

      try {
        const querySnapshot = await getDocs(collection(db, 'legalDrafts'));
        if (!querySnapshot.empty) {
          const fetchedDrafts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Template[];
          setTemplates(prev => {
            const staticIds = new Set(prev.map(t => t.id));
            const newDrafts = fetchedDrafts.filter(d => !staticIds.has(d.id));
            return [...prev.filter(t => staticIds.has(t.id)), ...newDrafts];
          });
          
          // Update cache
          localStorage.setItem('legalDraftsCache', JSON.stringify(fetchedDrafts));
          localStorage.setItem('legalDraftsCacheTime', Date.now().toString());
        }
      } catch (error) {
        console.error("Error fetching legal drafts:", error);
        handleFirestoreError(error, OperationType.GET, 'legalDrafts');
      } finally {
        setLoading(false);
      }
    };
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchPurchases = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setPurchasedDrafts(userDoc.data().purchasedDrafts || []);
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      }
    };
    fetchPurchases();
  }, [userId]);

  useEffect(() => {
    // Generate preview URLs when selected images change
    const urls = selectedImages.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedImages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const processImagesToPdf = async (): Promise<Blob | null> => {
    if (selectedImages.length === 0) return null;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    for (let i = 0; i < selectedImages.length; i++) {
      const file = selectedImages[i];
      const imageUrl = imagePreviewUrls[i];
      
      if (i > 0) pdf.addPage();
      
      const imgProps = pdf.getImageProperties(imageUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imageUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    return pdf.output('blob');
  };

  const handleUpload = async () => {
    if (!newTemplate.title || (!newTemplate.content && selectedImages.length === 0)) return;
    setIsUploading(true);
    try {
      let pdfDownloadUrl = '';
      
      // If images are selected, create and upload PDF
      if (selectedImages.length > 0) {
        const pdfBlob = await processImagesToPdf();
        if (pdfBlob) {
          const fileRef = ref(storage, `legalDrafts/${userId}_${Date.now()}.pdf`);
          await uploadBytes(fileRef, pdfBlob);
          pdfDownloadUrl = await getDownloadURL(fileRef);
        }
      }

      const templateData = {
        ...newTemplate,
        createdBy: userId,
        price: 50,
        pdfUrl: pdfDownloadUrl || undefined,
        createdAt: serverTimestamp()
      };
      
      // Clean up undefined fields
      if (!templateData.pdfUrl) delete templateData.pdfUrl;

      const docRef = await addDoc(collection(db, 'legalDrafts'), templateData);
      setTemplates(prev => [...prev, { id: docRef.id, ...templateData } as Template]);
      setIsUploadModalOpen(false);
      setNewTemplate({ title: '', titleBn: '', category: '', categoryBn: '', content: '' });
      setSelectedImages([]);
    } catch (error) {
      console.error("Error uploading template:", error);
      handleFirestoreError(error, OperationType.WRITE, 'legalDrafts');
    } finally {
      setIsUploading(false);
    }
  };

  const hasAccess = (template: Template) => {
    return true; // Point system temporarily disabled
    /*
    if (!template.createdBy) return false; // Static templates cost points too
    if (template.createdBy === userId) return true; // Owner has access
    if (purchasedDrafts.includes(template.id)) return true; // Purchased
    return false; // Needs purchase
    */
  };

  const handlePurchase = async (template: Template) => {
    const cost = 50;
    if (userPoints < cost) {
      alert(language === 'bn' ? 'যথেষ্ট পয়েন্ট নেই!' : 'Not enough points!');
      return;
    }

    try {
      // Deduct points locally and via parent
      onUpdateProfile({ points: userPoints - cost, purchasedDrafts: arrayUnion(template.id) });
      
      // Update in DB
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          points: userPoints - cost,
          purchasedDrafts: arrayUnion(template.id)
        });
      }
      
      setPurchasedDrafts(prev => [...prev, template.id]);
    } catch (error) {
      console.error("Error purchasing template:", error);
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
  };

  const handleRating = async (templateId: string, rating: number) => {
    if (!userId) {
      alert(language === 'bn' ? 'রেটিং দিতে লগইন করুন' : 'Please login to rate');
      return;
    }

    try {
      const templateRef = doc(db, 'legalDrafts', templateId);
      const templateDoc = await getDoc(templateRef);
      const data = templateDoc.exists() ? templateDoc.data() : {};
      const userRatings = data.userRatings || {};
      const oldRating = userRatings[userId] || 0;
      
      const newRatingCount = oldRating === 0 ? (data.ratingCount || 0) + 1 : data.ratingCount;
      const newTotalRating = (data.totalRating || 0) - oldRating + rating;
      
      userRatings[userId] = rating;
      
      await setDoc(templateRef, {
        userRatings,
        ratingCount: newRatingCount,
        totalRating: newTotalRating
      }, { merge: true });
      
      // Update local state
      setTemplates(prev => prev.map(t => {
        if (t.id === templateId) {
          return {
            ...t,
            userRatings,
            ratingCount: newRatingCount,
            totalRating: newTotalRating
          };
        }
        return t;
      }));
      
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate({
          ...selectedTemplate,
          userRatings,
          ratingCount: newRatingCount,
          totalRating: newTotalRating
        });
      }
    } catch (error) {
       console.error("Error rating template:", error);
       handleFirestoreError(error, OperationType.WRITE, `legalDrafts/${templateId}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">
            {language === 'bn' ? 'আইনি খসড়া ও ফরম' : 'Legal Drafts & Formats'}
          </h2>
          <p className="text-indigo-100 font-medium opacity-90 max-w-lg leading-relaxed mb-6">
            {language === 'bn' 
              ? 'আইনি কাজের জন্য প্রয়োজনীয় সকল প্রকার খসড়া এবং ফরম্যাট এখানে পাবেন যা আপনি সরাসরি কপি বা ডাউনলোড করতে পারবেন।' 
              : 'Find all necessary legal drafts and formats here that you can copy or download directly.'}
          </p>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            <Plus size={20} />
            {language === 'bn' ? 'টেমপ্লেট আপলোড করুন' : 'Upload Template'}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>

      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-100 flex items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0 w-fit">
            <Gift size={32} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">
              {language === 'bn' ? 'আকর্ষণীয় পুরস্কার জেতার সুযোগ!' : 'Win Exciting Rewards!'}
            </h3>
            <p className="text-orange-50 font-medium text-sm md:text-base leading-relaxed">
              {language === 'bn' 
                ? 'সারা বছর জুড়ে যে ব্যবহারকারী সবচেয়ে বেশি প্রয়োজনীয় ও সঠিক লিগ্যাল টেমপ্লেট বা খসড়া আপলোড করবেন, তাকে বছর শেষে অ্যাপের পক্ষ থেকে আকর্ষণীয় উপহার দেওয়া হবে।' 
                : 'The user who uploads the most useful and accurate legal templates throughout the year will receive an exciting reward from the app at the end of the year.'}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={language === 'bn' ? 'খসড়া খুঁজুন...' : 'Search templates...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="space-y-3">
            {filteredTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-6 rounded-3xl transition-all border relative ${
                  selectedTemplate?.id === t.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2' 
                    : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'
                }`}
              >
                {!hasAccess(t) && (
                  <div className="absolute top-4 right-4 text-amber-500">
                    <Lock size={16} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-1 pr-6">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${selectedTemplate?.id === t.id ? 'text-indigo-200' : 'text-indigo-600'}`}>
                      {language === 'bn' ? t.categoryBn : t.category}
                    </p>
                    <h4 className="font-bold">{language === 'bn' ? t.titleBn : t.title}</h4>
                    
                    {/* Rating display */}
                    {!STATIC_TEMPLATES.some(staticT => staticT.id === t.id) && (t.ratingCount || 0) > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className={selectedTemplate?.id === t.id ? "text-amber-300 fill-amber-300" : "text-amber-400 fill-amber-400"} />
                        <span className={`text-xs font-medium ${selectedTemplate?.id === t.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {((t.totalRating || 0) / (t.ratingCount || 1)).toFixed(1)} ({t.ratingCount})
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor/Viewer */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <motion.div 
              key={selectedTemplate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden h-full flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{language === 'bn' ? selectedTemplate.titleBn : selectedTemplate.title}</h3>
                    <p className="text-slate-500 text-sm font-medium">{language === 'bn' ? selectedTemplate.categoryBn : selectedTemplate.category}</p>
                  </div>
                </div>
                {hasAccess(selectedTemplate) && (
                  <div className="flex items-center gap-3">
                    {!selectedTemplate.pdfUrl && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTemplate.content);
                          setRatingPromptTemplateId(selectedTemplate.id);
                          setShowRatingPrompt(true);
                        }}
                        className="flex items-center gap-2 p-3 bg-white border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <Copy size={20} />
                        <span className="text-sm font-bold">{language === 'bn' ? 'কপি' : 'Copy'}</span>
                      </button>
                    )}
                    <a 
                      href={selectedTemplate.pdfUrl ? selectedTemplate.pdfUrl : `data:text/plain;charset=utf-8,${encodeURIComponent(selectedTemplate.content)}`}
                      download={`${selectedTemplate.title}.${selectedTemplate.pdfUrl ? 'pdf' : 'txt'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setRatingPromptTemplateId(selectedTemplate.id);
                        setShowRatingPrompt(true);
                      }}
                      className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center cursor-pointer"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                {hasAccess(selectedTemplate) ? (
                  <>
                    {!STATIC_TEMPLATES.some(t => t.id === selectedTemplate.id) && (
                      <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-100 p-3 rounded-2xl">
                        <span className="text-sm font-medium text-amber-800">
                          {language === 'bn' ? 'টেমপ্লেটটির মান কেমন? পয়েন্ট দিন:' : 'Rate the quality of this template:'}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const userRating = selectedTemplate.userRatings?.[userId] || 0;
                            return (
                              <button
                                key={star}
                                onClick={() => handleRating(selectedTemplate.id, star)}
                                className={`p-1 transition-transform hover:scale-110 ${star <= userRating ? 'text-amber-500' : 'text-amber-200'}`}
                              >
                                <Star size={20} className={star <= userRating ? 'fill-amber-500' : ''} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedTemplate.pdfUrl ? (
                      <div className="w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                          <span className="font-medium text-slate-600">
                            {language === 'bn' ? 'পিডিএফ ডকুমেন্ট' : 'PDF Document'}
                          </span>
                          <a 
                            href={selectedTemplate.pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-colors"
                          >
                            {language === 'bn' ? 'বড় করে দেখুন / ডাউনলোড' : 'View Full / Download'}
                          </a>
                        </div>
                        <iframe 
                          src={`${selectedTemplate.pdfUrl}#toolbar=0`} 
                          className="w-full flex-1 min-h-[500px] border-none"
                          title={selectedTemplate.title}
                        />
                      </div>
                    ) : (
                      <textarea 
                        value={selectedTemplate.content}
                        readOnly
                        className="w-full h-full min-h-[400px] p-6 bg-slate-50 border-none rounded-3xl font-mono text-sm leading-relaxed text-slate-700 focus:ring-0 outline-none resize-none"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-50 rounded-3xl border border-slate-100 p-10 relative overflow-hidden">
                    <Lock size={64} className="text-slate-300 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      {language === 'bn' ? 'টেমপ্লেটটি লক করা আছে' : 'Template is Locked'}
                    </h3>
                    <p className="text-slate-500 font-medium max-w-md mb-8">
                      {language === 'bn' 
                        ? 'এই টেমপ্লেটটি প্রিভিউ এবং ডাউনলোড করতে ৫০ পয়েন্ট প্রয়োজন। আপনার বর্তমান পয়েন্ট: '
                        : 'Previewing and downloading this template requires 50 points. Your current points: '}
                      <span className="text-indigo-600 font-bold">{userPoints}</span>
                    </p>
                    
                    <button 
                      onClick={() => handlePurchase(selectedTemplate)}
                      className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all ${
                        userPoints >= 50 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-200' 
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Award size={24} />
                      {language === 'bn' ? '৫০ পয়েন্ট দিয়ে খুলুন' : 'Unlock for 50 Points'}
                    </button>
                    
                    {userPoints < 50 && (
                      <p className="text-red-500 text-sm mt-4 font-medium">
                        {language === 'bn' ? 'আপনার পর্যাপ্ত পয়েন্ট নেই। পয়েন্ট মেনু থেকে পয়েন্ট সংগ্রহ করুন।' : 'You do not have enough points. Please get more points from the Points menu.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Scale size={48} className="text-slate-200" />
              </div>
              <h4 className="text-xl font-bold text-slate-400 mb-2">
                {language === 'bn' ? 'খসড়া নির্বাচন করুন' : 'Select a Template'}
              </h4>
              <p className="text-slate-400 font-medium max-w-xs">
                {language === 'bn' 
                  ? 'বামিকের তালিকা থেকে একটি খসড়া নির্বাচন করে তার বিস্তারিত ফরম্যাট দেখতে পারবেন।' 
                  : 'Select a template from the list to view its full format.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-6">
                {language === 'bn' ? 'নতুন টেমপ্লেট যোগ করুন' : 'Upload New Template'}
              </h3>
              
              <div className="space-y-5 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title (English)</label>
                    <input 
                      type="text" 
                      value={newTemplate.title}
                      onChange={e => setNewTemplate({...newTemplate, title: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">শিরোনাম (বাংলা)</label>
                    <input 
                      type="text" 
                      value={newTemplate.titleBn}
                      onChange={e => setNewTemplate({...newTemplate, titleBn: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category (English)</label>
                    <input 
                      type="text" 
                      value={newTemplate.category}
                      onChange={e => setNewTemplate({...newTemplate, category: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ক্যাটাগরি (বাংলা)</label>
                    <input 
                      type="text" 
                      value={newTemplate.categoryBn}
                      onChange={e => setNewTemplate({...newTemplate, categoryBn: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {language === 'bn' ? 'টেমপ্লেট কন্টেন্ট' : 'Template Content'}
                  </label>
                  <textarea 
                    value={newTemplate.content}
                    onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none font-mono text-sm"
                    placeholder={language === 'bn' ? 'এখানে টেক্সট লিখুন অথবা নিচের অপশন থেকে ছবি আপলোড করুন...' : 'Write text here or upload images below...'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {language === 'bn' ? 'ছবি যুক্ত করুন (পিডিএফ হিসেবে সেভ হবে)' : 'Add Images (Will be saved as PDF)'}
                  </label>
                  
                  <div className="flex flex-col gap-4">
                    <input 
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                    >
                      <ImageIcon size={20} />
                      {language === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select Images'}
                    </button>
                    
                    {imagePreviewUrls.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        {imagePreviewUrls.map((url, i) => (
                          <div key={i} className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => removeImage(i)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={isUploading || (!newTemplate.title && !newTemplate.titleBn) || (!newTemplate.content && selectedImages.length === 0)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      {language === 'bn' ? 'আপলোড করুন' : 'Upload Template'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRatingPrompt && ratingPromptTemplateId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border-t-8 border-indigo-600 animate-in zoom-in-95 duration-200"
            >
              <button 
                onClick={() => setShowRatingPrompt(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                
                <div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight">
                    {language === 'bn' ? 'সাফল্যের সাথে সম্পন্ন!' : 'Completed Successfully!'}
                  </h4>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    {language === 'bn' 
                      ? 'খসড়াটি কপি/ডাউনলোড করা হয়েছে। টেম্পলেটটি কেমন লেগেছে? অনুগ্রহ করে গুণগত মানের জন্য একটি পয়েন্ট বা রেটিং দিন যাতে অন্য ব্যবহারকারীরা বুঝতে পারেন।' 
                      : 'The draft has been copied/downloaded successfully. Please rate its quality (1 to 5 stars) to help other users.'}
                  </p>
                </div>
                
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentTemplate = templates.find(t => t.id === ratingPromptTemplateId) || selectedTemplate;
                    const userRating = currentTemplate?.userRatings?.[userId || ''] || 0;
                    return (
                      <button 
                        key={star}
                        onClick={async () => {
                          await handleRating(ratingPromptTemplateId, star);
                          setShowRatingPrompt(false);
                        }}
                        className="p-2 transition-transform hover:scale-125 text-slate-200 hover:text-amber-500"
                      >
                        <Star size={32} className={star <= userRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'} />
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setShowRatingPrompt(false)}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm transition-all mt-2"
                >
                  {language === 'bn' ? 'পরে দেব' : 'Maybe Later'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

