import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import Library from '../resources/Library';
import { uploadFile, getPublicUrl } from '../../lib/storage';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Bot, 
  TrendingUp, 
  Newspaper, 
  MonitorPlay, 
  AlertCircle, 
  MousePointer2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Lock,
  Bell,
  BellOff,
  Search,
  Plus,
  Video,
  Camera,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  ExternalLink,
  BookOpen,
  BookOpenText,
  Send,
  PhoneCall,
  MapPin,
  Building2,
  Flame,
  Stethoscope,
  CreditCard,
  Languages,
  Moon,
  Sun,
  ShoppingCart,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
  DollarSign,
  Share2,
  Copy,
  Briefcase,
  ChevronDown,
  Shield,
  FolderOpen,
  Facebook,
  Linkedin,
  History,
  Trash2,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import Markdown from 'react-markdown';
import { emergencyData } from '../../data/emergencyData';
import CaseTimeline from '../cases/CaseTimeline';
import { getPoliceStations, getCourtsForDistrict, BANGLADESH_DISTRICTS, INDIA_DISTRICTS, PAKISTAN_DISTRICTS } from '../../constants';
import MediGen from '../ai/MediGen';
import ProfessionalResources from '../resources/ProfessionalResources';
import AffiliateZone from '../resources/AffiliateZone';
import BarAdminDashboard from '../../admin/BarAdminDashboard';
import Media from '../resources/Media';
import PaymentGateway from '../recharge/PaymentGateway';
import Recharge from '../recharge/Recharge';
import AdminPanel from '../../admin/AdminPanel';
import DocumentManager from '../cases/DocumentManager';
import LawyerDirectory from '../profile/LawyerDirectory';
import ArchiveCaseHistory from '../cases/ArchiveCaseHistory';
import SupportChat from './SupportChat';
import { Case, Notification, UserMemory, ChatMessage, Task, ArchiveCase } from '../../types';
import CaseForm from '../cases/CaseForm';
import JoinCaseForm from '../cases/JoinCaseForm';
import NotificationPanel from './NotificationPanel';
import { translations } from '../../translations';
import { AdBanner } from './AdBanner';
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  subscribeToGlobalNotifications,
  subscribeToTasks, 
  createTask,
  getLawyers,
  searchArchiveCases
} from '../../services/user/featureService';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar 
} from 'recharts';

import { CaseCardPro } from './CaseCardPro';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { HomeView } from './views/HomeView';
import { CasesView } from './views/CasesView';
import { CalendarView } from './views/CalendarView';
import { TasksView } from './views/TasksView';
import { NewsView } from './views/NewsView';
import { EmergencyView } from './views/EmergencyView';
import { ProfileView } from './views/ProfileView';

const CaseHistoryModal = ({ isOpen, onClose, caseData, language }: { isOpen: boolean, onClose: () => void, caseData: Case | null, language: 'bn' | 'en' | 'hi' | 'ur' }) => {
  if (!caseData) return null;
  const t = (key: keyof typeof translations.bn) => translations[language]?.[key] || translations.bn[key] || key;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-900 text-white">
              <div>
                <h3 className="text-xl font-bold">{t('case_history_title')}</h3>
                <p className="text-indigo-200 text-sm">{caseData.caseNumber}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {caseData.history && caseData.history.length > 0 ? (
                <div className="relative border-l-2 border-indigo-100 ml-4 pl-8 space-y-8">
                  {caseData.history.map((entry, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm"></div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-indigo-600 uppercase">{entry.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            entry.actionBy === 'court' ? 'bg-amber-100 text-amber-700' : 
                            entry.actionBy === 'petitioner' || entry.actionBy === 'lawyer' ? 'bg-emerald-100 text-emerald-700' : 
                            entry.actionBy === 'clerk' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {entry.actionBy === 'court' ? t('court_label') : 
                             entry.actionBy === 'petitioner' ? t('petitioner_label') : 
                             entry.actionBy === 'lawyer' ? t('lawyer_label') :
                             entry.actionBy === 'clerk' ? t('clerk_label') :
                             entry.actionBy === 'respondent' ? t('respondent_label') :
                             entry.actionBy === 'accused' ? t('accused_label') :
                             entry.actionBy === 'admin' ? t('admin_label') : t('client_label')}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm font-medium leading-relaxed">{entry.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-bold">{t('no_history_found')}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};





interface DashboardProps {
  userId?: number;
  userType: string;
  userName: string;
  userEmail?: string;
  userMobile?: string;
  userDistrict?: string;
  userCountry?: string;
  referralCode?: string;
  subscriptionEndDate?: string;
  subscriptionPackage?: string;
  profilePicture?: string;
  aiQuestionsCount?: number;
  lastAiResetDate?: string;
  points?: number;
  onLogout: () => void;
  onUpdateProfile?: (updatedProfile: any) => void;
}

export default function Dashboard({ 
  userId, 
  userType, 
  userName, 
  userEmail,
  userMobile, 
  userDistrict, 
  userCountry, 
  referralCode, 
  subscriptionEndDate, 
  subscriptionPackage, 
  profilePicture, 
  aiQuestionsCount,
  lastAiResetDate,
  points,
  onLogout, 
  onUpdateProfile 
}: DashboardProps) {
  if (userType === 'bar_admin') {
    return <BarAdminDashboard userId={userId} userName={userName} />;
  }
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentViewMode, setCurrentViewMode] = useState<string>(['admin', 'super_admin', 'country_manager'].includes(userType) ? 'lawyer' : userType);
  const isSubscribed = subscriptionPackage && subscriptionPackage !== 'free';
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [subscriptionTarget, setSubscriptionTarget] = useState<'self' | 'clerk'>('self');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'cases' | 'news' | 'library' | 'resources' | 'profile' | 'affiliate' | 'bar-admin' | 'media' | 'recharge' | 'admin' | 'documents' | 'tasks' | 'case_history_20y' | 'professional_services' | 'medigen' | 'lawyers' | 'affiliate_zone' | 'emergency' | 'subscription' | 'settings' | 'admin_panel' | 'case_timeline' | 'notifications' | 'support_chat' | 'lawyer_directory'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 1, 
      title: 'ওকালতনামা জমা দেওয়া', 
      description: 'মামলা নং ১২৩/২০২৪ এর ওকালতনামা আগামীকাল জমা দিতে হবে।', 
      dueDate: new Date().toISOString().split('T')[0], 
      status: 'pending', 
      priority: 'high', 
      category: 'filing',
      caseNumber: '১২৩/২০২৪',
      courtName: 'জেলা জজ আদালত',
      assignedTo: 'self',
      assignedBy: 'lawyer',
      created_at: new Date().toISOString() 
    },
    { 
      id: 2, 
      title: 'সাক্ষীর সাথে কথা বলা', 
      description: 'বাদী পক্ষের সাক্ষীর সাথে মামলার বিষয়ে আলোচনা করা।', 
      dueDate: '2025-03-22', 
      status: 'pending', 
      priority: 'medium', 
      category: 'other',
      caseNumber: '৪৫৬/২০২৩',
      courtName: 'ম্যাজিস্ট্রেট কোর্ট-২',
      assignedTo: 'clerk',
      assignedBy: 'lawyer',
      created_at: new Date().toISOString() 
    },
    { 
      id: 3, 
      title: 'নথি সংগ্রহ', 
      description: 'আদালত থেকে পূর্ববর্তী আদেশের কপি সংগ্রহ করা।', 
      dueDate: '2025-03-20', 
      status: 'completed', 
      priority: 'low', 
      category: 'copy',
      caseNumber: '৭৮৯/২০২২',
      courtName: 'হাইকোর্ট বিভাগ',
      assignedTo: 'self',
      assignedBy: 'clerk',
      created_at: new Date().toISOString() 
    },
  ]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>('self');
  const [taskCaseNumber, setTaskCaseNumber] = useState('');
  const [taskCategory, setTaskCategory] = useState<'attendance' | 'filing' | 'copy' | 'fee' | 'other'>('other');
  const [taskCourtName, setTaskCourtName] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [profilePic, setProfilePic] = useState(profilePicture || '');

  useEffect(() => {
    if (profilePicture) setProfilePic(profilePicture);
  }, [profilePicture]);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(t('image_size_error'));
        return;
      }
      
      try {
        console.log("Uploading profile picture for user:", userId);
        
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `profile_${userId}_${timestamp}.${fileExt}`;
        const path = `profiles/${userId}/${fileName}`;
        
        console.log("Uploading to path:", path);
        await uploadFile('documents', path, file);
        const url = await getPublicUrl('documents', path);
        console.log("Uploaded URL:", url.substring(0, 50) + "...");
        
        setProfilePic(url);
        
        console.log("Updating profile picture in database for user:", userId);
        const response = await fetch(`/api/users/${userId}/profile-picture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: url })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update profile picture in database: ${response.statusText}`);
        }
        
        try {
          console.log("Updating profile picture in Firestore for user:", userId);
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { profile_picture: url });
          console.log("Profile picture updated in Firestore");
        } catch (firestoreErr) {
          console.error("Failed to update profile picture in Firestore:", firestoreErr);
          // We don't throw here because the SQLite update succeeded and we want to continue
        }
        
        console.log("Profile picture updated in database");
        
        if (onUpdateProfile) {
          onUpdateProfile({ profilePicture: url });
        }
      } catch (err: any) {
        console.error("Failed to upload profile picture", err);
        alert(`${t('profile_pic_upload_error')}: ${err.message || 'Unknown error'}`);
      }
    }
  };
  
  const isExpired = currentViewMode === 'client' ? false : (subscriptionEndDate ? new Date(subscriptionEndDate) < new Date() : true);
  const isAdmin = currentViewMode === 'admin';
  const [isCaseFormOpen, setIsCaseFormOpen] = useState(false);
  const [isJoinFormOpen, setIsJoinFormOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCaseSearchOpen, setIsCaseSearchOpen] = useState(false);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [policeStationSearchQuery, setPoliceStationSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [doneCases, setDoneCases] = useState<Record<number, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'আগামীকাল শুনানি',
      message: 'মামলা নং ১২৩/২০২৪ এর শুনানি আগামীকাল জেলা জজ আদালতে অনুষ্ঠিত হবে।',
      time: '১০ মিনিট আগে',
      type: 'hearing',
      isRead: false
    },
    {
      id: 2,
      title: 'নতুন মামলার আপডেট',
      message: 'মামলা নং ৪৫৬/২০২৪ এ নতুন আদেশ যুক্ত করা হয়েছে।',
      time: '২ ঘণ্টা আগে',
      type: 'update',
      isRead: false
    },
    {
      id: 3,
      title: 'অ্যাসাইন করা কাজ',
      message: 'নতুন মামলার নথিগুলো যাচাই করার কাজ আপনাকে দেওয়া হয়েছে।',
      time: '৫ ঘণ্টা আগে',
      type: 'task',
      isRead: true
    }
  ]);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [selectedCaseForTimeline, setSelectedCaseForTimeline] = useState<Case | null>(null);
  const [selectedCaseForHistory, setSelectedCaseForHistory] = useState<Case | null>(null);
  const [selectedCaseForCard, setSelectedCaseForCard] = useState<Case | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [language, setLanguage] = useState<'bn' | 'en' | 'hi' | 'ur'>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved as any) || 'bn';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('appTheme');
    return (saved as any) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  const [referralHistory, setReferralHistory] = useState<any[]>([]);
  const [lawyers, setLawyersList] = useState<any[]>([]);
  const [archiveCases, setArchiveCases] = useState<ArchiveCase[]>([]);
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [caseFilter, setCaseFilter] = useState<'all' | 'Civil' | 'Criminal' | 'High Court' | 'Supreme Court' | 'Other'>('all');
  const [caseStatusFilter, setCaseStatusFilter] = useState<'all' | 'running' | 'disposed' | 'stayed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEmergencyContactFormOpen, setIsEmergencyContactFormOpen] = useState(false);
  const [isJoinCaseOpen, setIsJoinCaseOpen] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !isAuthReady) return;

    const unsubNotifications = subscribeToNotifications(userId.toString(), (data) => {
      setNotifications(prev => {
        const globalOnes = prev.filter(n => n.isGlobal);
        const merged = [...data, ...globalOnes];
        return merged.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      });
    });

    const unsubGlobal = subscribeToGlobalNotifications((data) => {
      setNotifications(prev => {
        const personalOnes = prev.filter(n => !n.isGlobal);
        const merged = [...personalOnes, ...data];
        return merged.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      });
    });

    const unsubTasks = subscribeToTasks(userId.toString(), (data) => {
      setTasks(data);
    });

    return () => {
      unsubNotifications();
      unsubGlobal();
      unsubTasks();
    };
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'lawyers') {
      getLawyers().then(setLawyersList);
    }
  }, [activeTab]);

  const handleSearchArchive = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingArchive(true);
    try {
      const results = await searchArchiveCases(query);
      setArchiveCases(results);
    } catch (err) {
      console.error("Error searching archive:", err);
    } finally {
      setIsSearchingArchive(false);
    }
  };

  // Lawyer Specific Profile State
  const [chamberAddress, setChamberAddress] = useState('সুপ্রিম কোর্ট বার অ্যাসোসিয়েশন ভবন, ঢাকা');
  const [officeHours, setOfficeHours] = useState('সকাল ১০:০০ - বিকাল ৫:০০');
  const [barAssociation, setBarAssociation] = useState('ঢাকা আইনজীবী সমিতি');
  const [membershipId, setMembershipId] = useState('L-12345');
  const [mapLink, setMapLink] = useState('https://maps.google.com');
  const [certificates, setCertificates] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    linkedin: '',
    twitter: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editMobile, setEditMobile] = useState(userMobile || '');
  const [editDistrict, setEditDistrict] = useState(userDistrict || '');

  const districts = userCountry === 'India' ? INDIA_DISTRICTS : 
                    userCountry === 'Pakistan' ? PAKISTAN_DISTRICTS : 
                    BANGLADESH_DISTRICTS;

  useEffect(() => {
    setEditName(userName);
    setEditMobile(userMobile || '');
    setEditDistrict(userDistrict || '');
  }, [userName, userMobile, userDistrict]);

  useEffect(() => {
    if (referralCode) {
      fetch(`/api/user-network?referralCode=${referralCode}`)
        .then(async res => {
          if (!res.ok) throw new Error(`Network response was not ok, status: ${res.status}`);
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return res.json();
          } else {
            const text = await res.text();
            console.error('Expected JSON for referrals, but received:', contentType, 'Response:', text.substring(0, 100));
            return [];
          }
        })
        .then(data => setReferralHistory(data))
        .catch(err => console.error("Error fetching referrals:", err));
    }
  }, [referralCode]);

  // AI Chat State
  const [showSubscriptionPayment, setShowSubscriptionPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; duration: string } | null>(null);
  const [isSubmittingSubscription, setIsSubmittingSubscription] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [isOnlinePaymentLoading, setIsOnlinePaymentLoading] = useState(false);

  const initiateOnlinePayment = async (amount: number, purpose: string) => {
    setIsOnlinePaymentLoading(true);
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          purpose: `Subscription|${selectedPlan?.name}|${selectedPlan?.duration}|${subscriptionTarget}`,
          orderId: `SUB_${Date.now()}_${userId}`
        })
      });
      const data = await response.json();
      if (data.success && data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        alert(data.error || t('payment_gateway_error'));
      }
    } catch (error) {
      console.error("Online payment error:", error);
      alert(t('payment_initiate_error'));
    } finally {
      setIsOnlinePaymentLoading(false);
    }
  };

  const handleSubscriptionPayment = (plan: { name: string; price: number; duration: string }) => {
    setSelectedPlan(plan);
    setShowSubscriptionPayment(true);
  };

  const submitSubscriptionRequest = async (paymentMethod: string, transactionId: string) => {
    if (!selectedPlan || !transactionId) return;
    
    setIsSubmittingSubscription(true);
    try {
      const response = await fetch('/api/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: userMobile,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          duration: selectedPlan.duration,
          paymentMethod,
          transactionId,
          targetType: subscriptionTarget // 'lawyer' or 'clerk'
        })
      });

      if (response.ok) {
        setSubscriptionSuccess(true);
        setTimeout(() => {
          setShowSubscriptionPayment(false);
          setSubscriptionSuccess(false);
          setSelectedPlan(null);
        }, 3000);
      } else {
        alert(t('subscription_request_error'));
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert(t('server_error'));
    } finally {
      setIsSubmittingSubscription(false);
    }
  };

  const [isLegalAIOpen, setIsLegalAIOpen] = useState(false);
  const [aiButtonSide, setAiButtonSide] = useState<'left' | 'right'>('right');
  const [aiQuery, setAiQuery] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 20 Years Case History State
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [memoryChatMessages, setMemoryChatMessages] = useState<ChatMessage[]>([]);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [memoryAiQuery, setMemoryAiQuery] = useState('');
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isQueryingMemoryAI, setIsQueryingMemoryAI] = useState(false);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`/api/memories/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error("Error fetching memories:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'case_history_20y') {
      fetchMemories();
    }
  }, [activeTab, userId]);

  const handleSaveMemory = async () => {
    if (!newMemoryContent.trim()) return;
    setIsSavingMemory(true);
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content: newMemoryContent })
      });
      if (res.ok) {
        setNewMemoryContent('');
        fetchMemories();
      }
    } catch (err) {
      console.error("Error saving memory:", err);
    } finally {
      setIsSavingMemory(false);
    }
  };

  const handleAskMemoryAI = async () => {
    if (!memoryAiQuery.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: memoryAiQuery };
    setMemoryChatMessages(prev => [...prev, userMsg]);
    const currentQuery = memoryAiQuery;
    setMemoryAiQuery('');
    setIsQueryingMemoryAI(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Context from memories
      const context = Array.isArray(memories) ? memories.map(m => `[${new Date(m.created_at).toLocaleDateString()}] ${m.content}`).join('\n') : '';
      
      const prompt = `
        You are an AI assistant for a legal professional. 
        The user is asking about their case history and memories stored over the last 20 years.
        Here is the context of their stored memories:
        ${context}

        User Question: ${currentQuery}
        
        Please provide a helpful response in Bengali. If the information is not in the memories, politely say you don't have that specific information but can help with what is available.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const aiMsg: ChatMessage = { role: 'model', text: result.text || t('no_answer_found') };
      setMemoryChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Error querying AI:", err);
      setMemoryChatMessages(prev => [...prev, { role: 'model', text: t('ai_connection_error') }]);
    } finally {
      setIsQueryingMemoryAI(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [aiMessages, isAiLoading, isLegalAIOpen]);

  // Emergency State
  const [selectedDist, setSelectedDist] = useState<string>('');
  const [selectedThana, setSelectedThana] = useState<string>('');

  const [cases, setCases] = useState<Case[]>(() => {
    const savedCases = localStorage.getItem('appCases');
    if (savedCases) {
      try {
        return JSON.parse(savedCases);
      } catch (e) {
        console.error('Failed to parse cases from localStorage', e);
      }
    }
    return [
      { 
        id: 1, 
        caseNumber: 'জি.আর-১২৩/২০২৪(রমনা)', 
        courtName: 'জেলা জজ আদালত', 
        nextDate: new Date().toISOString().split('T')[0], 
        status: 'শুনানি',
        caseType: 'Civil',
        petitioner: 'করিম উদ্দিন',
        respondent: 'রহিম মিয়া',
        isUpdated: false,
        order: '',
        petitionerMobile: '01700000000',
        respondentMobile: '01800000000',
        history: [
          { date: '2024-01-10', actionBy: 'petitioner', description: 'আরজি দাখিল করা হয়েছে।' },
          { date: '2024-02-15', actionBy: 'court', description: 'বিবাদীর প্রতি সমন জারির আদেশ।' },
          { date: '2024-03-20', actionBy: 'respondent', description: 'বিবাদী হাজির হয়ে সময়ের আবেদন করেছেন।' },
          { date: '2024-04-25', actionBy: 'court', description: 'জবাব দাখিলের জন্য দিন ধার্য।' }
        ]
      },
      { 
        id: 2, 
        caseNumber: 'সি.আর-৪৫৬/২০২৪(শাহবাগ)', 
        courtName: 'ম্যাজিস্ট্রেট আদালত', 
        nextDate: new Date().toISOString().split('T')[0], 
        status: 'সাক্ষ্য',
        caseType: 'Criminal',
        petitioner: 'রাষ্ট্র',
        respondent: 'আবুল হোসেন',
        isUpdated: true,
        order: 'সাক্ষ্য গ্রহণ সম্পন্ন',
        respondentMobile: '01700000000'
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('appCases', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    if (taskCaseNumber && !editingTask && isTaskFormOpen) {
      const relatedCase = cases.find(c => c.caseNumber === taskCaseNumber);
      if (relatedCase) {
        if (currentViewMode === 'clerk') {
          const lawyerName = relatedCase.petitionerLawyer || relatedCase.respondentLawyer;
          if (lawyerName) setTaskAssignedTo(lawyerName);
        } else if (currentViewMode === 'lawyer') {
          const clerkName = relatedCase.petitionerClerk || relatedCase.respondentClerk;
          if (clerkName) setTaskAssignedTo(clerkName);
        }
      }
    }
  }, [taskCaseNumber, currentViewMode, cases, editingTask, isTaskFormOpen]);

  useEffect(() => {
    const fetchCases = async () => {
      if (navigator.onLine && userId) {
        try {
          const res = await fetch(`/api/cases?userId=${userId}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const serverCases = await res.json();
              // Merge server cases with local cases (prefer server cases)
              setCases(prev => {
                const merged = [...serverCases];
                // Add local cases that are not in server cases (e.g. created offline)
                prev.forEach(pc => {
                  if (!merged.find(sc => sc.id === pc.id)) {
                    merged.push(pc);
                  }
                });
                return merged;
              });
            } else {
              const text = await res.text();
              console.error('Expected JSON for cases, but received:', contentType, 'Response:', text.substring(0, 100));
            }
          } else {
            console.error('Failed to fetch cases from server, status:', res.status);
          }
        } catch (e) {
          console.error('Failed to fetch cases from server', e);
        }
      }
    };
    fetchCases();
  }, [userId]);

  const normalizeMobile = (m?: string | null) => {
    if (!m) return '';
    let clean = m.trim();
    if (clean.startsWith('+88')) clean = clean.substring(3);
    if (clean.startsWith('88')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };

  const normalizedUserMobile = normalizeMobile(userMobile);

  const visibleCases = currentViewMode !== 'admin' && userMobile
    ? cases.filter(c => {
        const pMobile = normalizeMobile(c.petitionerMobile);
        const rMobile = normalizeMobile(c.respondentMobile);
        
        const checkArray = (arr?: string | string[] | null) => {
          if (!arr) return false;
          if (Array.isArray(arr)) {
            return arr.some(m => normalizeMobile(m) === normalizedUserMobile);
          }
          return normalizeMobile(arr) === normalizedUserMobile;
        };

        return pMobile === normalizedUserMobile || 
               rMobile === normalizedUserMobile ||
               checkArray(c.petitionerLawyerMobile) ||
               checkArray(c.respondentLawyerMobile) ||
               checkArray(c.petitionerClerkMobile) ||
               checkArray(c.respondentClerkMobile) ||
               checkArray(c.petitionerAsstLawyerMobile) ||
               checkArray(c.respondentAsstLawyerMobile) ||
               checkArray(c.petitionerAsstClerkMobile) ||
               checkArray(c.respondentAsstClerkMobile);
      })
    : cases;

  const [lastDeletedCase, setLastDeletedCase] = useState<Case | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  const handleDeleteCase = (id: number) => {
    const caseToDelete = cases.find(c => c.id === id);
    if (caseToDelete) {
      setLastDeletedCase(caseToDelete);
      setCases(prev => prev.filter(c => c.id !== id));
      setShowUndoToast(true);
      // Auto-hide toast after 10 seconds
      setTimeout(() => setShowUndoToast(false), 10000);
    }
  };

  const handleUndoDelete = () => {
    if (lastDeletedCase) {
      setCases(prev => [...prev, lastDeletedCase]);
      setLastDeletedCase(null);
      setShowUndoToast(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const t = (key: keyof typeof translations['bn']) => translations[language][key] || key;

  const menuGroups = [
    {
      title: t('case_management'),
      items: [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'cases', label: currentViewMode === 'client' ? t('my_cases') : t('cases'), icon: FileText },
        { id: 'calendar', label: t('calendar'), icon: Calendar },
        ...(currentViewMode !== 'client' ? [
          { id: 'tasks', label: t('task_management'), icon: CheckCircle2 },
        ] : []),
        { id: 'case_timeline', label: t('case_timeline'), icon: History },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'support_chat', label: t('support_chat'), icon: MessageSquare },
      ]
    },
    ...(currentViewMode !== 'client' ? [
      {
        title: t('professional_tools'),
        items: [
          { id: 'documents', label: t('documents'), icon: FolderOpen },
          { id: 'professional_services', label: t('professional_services'), icon: Briefcase },
          { id: 'medigen', label: t('medigen'), icon: Stethoscope },
          { id: 'lawyer_directory', label: t('lawyer_directory'), icon: Users },
          { id: 'lawyers', label: t('my_profile'), icon: User },
        ]
      }
    ] : [
      {
        title: t('search'),
        items: [
          { id: 'lawyer_directory', label: t('find_lawyer'), icon: Users },
        ]
      }
    ]),
    {
      title: t('library'),
      items: [
        { id: 'library', label: t('library'), icon: BookOpen },
        { id: 'resources', label: t('resources'), icon: BookOpenText },
        { id: 'case_history_20y', label: t('history_20y'), icon: History },
      ]
    },
    {
      title: t('income_offers'),
      items: [
        { id: 'affiliate_zone', label: t('affiliate_zone'), icon: ShoppingCart },
        { id: 'news', label: t('news'), icon: Newspaper },
        { id: 'media', label: t('media'), icon: MonitorPlay },
      ]
    },
    {
      title: t('support_account'),
      items: [
        { id: 'emergency', label: t('emergency'), icon: AlertCircle },
        ...(currentViewMode !== 'client' ? [
          { id: 'recharge', label: t('recharge'), icon: Smartphone },
          { id: 'subscription', label: t('subscription'), icon: CreditCard },
        ] : []),
      ]
    },
    {
      title: t('settings'),
      items: [
        { id: 'profile', label: t('profile'), icon: User },
        { id: 'settings', label: t('settings'), icon: Settings },
        ...((userType === 'admin' || userType === 'super_admin' || userType === 'country_manager') ? [{ id: 'admin_panel', label: t('admin_panel'), icon: Shield }] : []),
      ]
    }
  ];

  const menuItems = menuGroups.flatMap(g => g.items);

  const [showAd, setShowAd] = useState(false);
  const [adAction, setAdAction] = useState<(() => void) | null>(null);

  const handleTabChange = (tab: string) => {
    if (tab === 'calendar' && currentViewMode === 'client') {
      setShowAd(true);
      setAdAction(() => () => setActiveTab(tab as any));
    } else {
      setActiveTab(tab as any);
    }
  };

  const handleViewCardWithAd = (c: Case) => {
    if (currentViewMode === 'client' && visibleCases.length > 1) {
      setShowAd(true);
      setAdAction(() => () => setSelectedCaseForCard(c));
    } else {
      setSelectedCaseForCard(c);
    }
  };

  const handleRequestMeeting = (c: Case) => {
    // Placeholder for meeting request logic
    alert(t('meeting_request_sent'));
  };

  const handleUpdateCaseOrder = (caseId: string | number, nextDate: string, order: string) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (targetCase && nextDate) {
      // Auto-generate attendance task
      const autoTask: Task = {
        id: Date.now(),
        title: `হাজিরা: ${targetCase.caseNumber}`,
        description: `${targetCase.courtName} - এ হাজিরা দিতে হবে।`,
        dueDate: nextDate,
        status: 'pending',
        priority: 'high',
        category: 'attendance',
        caseNumber: targetCase.caseNumber,
        courtName: targetCase.courtName,
        assignedTo: currentViewMode === 'lawyer' ? 'clerk' : 'self',
        assignedBy: currentViewMode === 'lawyer' ? 'lawyer' : 'clerk',
        created_at: new Date().toISOString()
      };
      setTasks(prev => [autoTask, ...prev]);
    }
    setCases(cases.map(c => c.id === caseId ? { ...c, nextDate, order, isUpdated: true } : c));
  };

  const handleAddDocument = (caseId: string | number, document: { name: string; type: string; url: string }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCases(cases.map(c => {
      if (c.id === caseId) {
        let actionBy: 'petitioner' | 'respondent' | 'court' | 'accused' | 'lawyer' | 'clerk' | 'admin' | 'client' = (currentViewMode === 'bar_admin' ? 'admin' : currentViewMode) as any;
        
        // If client, try to be more specific
        if (currentViewMode === 'client' && userMobile) {
          if (c.petitionerMobile === userMobile) actionBy = 'petitioner';
          else if (c.respondentMobile === userMobile) actionBy = 'respondent';
        }

        return { 
          ...c, 
          documents: [...(c.documents || []), document],
          history: [
            ...(c.history || []),
            {
              date: todayStr,
              actionBy,
              description: `ডকুমেন্ট আপলোড: ${document.name}`
            }
          ]
        };
      }
      return c;
    }));
  };

  const handleUpdateSelectedParty = (caseId: string | number, selectedParty: 'petitioner' | 'respondent' | 'accused') => {
    setCases(cases.map(c => c.id === caseId ? { ...c, selectedParty } : c));
  };

  const handleLookupAndAssign = () => {
    if (!lookupId) {
      alert(t('serial_no_required'));
      return;
    }
    const task = tasks.find(t => t.id.toString() === lookupId);
    if (task) {
      setEditingTask(null);
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
      setTaskDueDate(task.dueDate || '');
      setTaskPriority(task.priority);
      
      // Smart Assignment logic based on Case Number
      let targetAssignee = currentViewMode === 'lawyer' ? 'clerk' : 'lawyer';
      if (task.caseNumber) {
        const relatedCase = cases.find(c => c.caseNumber === task.caseNumber);
        if (relatedCase) {
          if (currentViewMode === 'clerk') {
            targetAssignee = relatedCase.petitionerLawyer || relatedCase.respondentLawyer || 'lawyer';
          } else if (currentViewMode === 'lawyer') {
            targetAssignee = relatedCase.petitionerClerk || relatedCase.respondentClerk || 'clerk';
          }
        }
      }
      
      setTaskAssignedTo(targetAssignee);
      setTaskCaseNumber(task.caseNumber || '');
      setTaskCategory(task.category || 'other');
      setTaskCourtName(task.courtName || '');
      setIsTaskFormOpen(true);
      setLookupId('');
    } else {
      alert(t('correct_serial_no'));
    }
  };

  const getBanglaDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    let bnDay = 0;

    // Start dates of Bengali months in Gregorian months (0-indexed)
    // Jan: 15, Feb: 14, Mar: 15, Apr: 14, May: 15, Jun: 15, 
    // Jul: 16, Aug: 16, Sep: 16, Oct: 17, Nov: 16, Dec: 16
    const startDates = [15, 14, 15, 14, 15, 15, 16, 16, 16, 17, 16, 16];

    // Days in previous Bengali month (ending in current Gregorian month)
    // Jan (Poush): 30, Feb (Magh): 30, Mar (Falgun): 29/30, Apr (Chaitra): 30,
    // May (Baishakh): 31, Jun (Jaistha): 31, Jul (Ashar): 31, Aug (Srabon): 31,
    // Sep (Bhadro): 31, Oct (Ashwin): 31, Nov (Kartik): 30, Dec (Agrahayan): 30
    const prevMonthDays = [30, 30, isLeapYear ? 30 : 29, 30, 31, 31, 31, 31, 31, 31, 30, 30];

    if (day < startDates[month]) {
      // It's the previous Bengali month
      bnDay = prevMonthDays[month] - startDates[month] + 1 + day;
    } else {
      // It's the new Bengali month
      bnDay = day - startDates[month] + 1;
    }

    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBnNum = (n: number) => n.toString().split('').map(d => bnNums[parseInt(d)]).join('');
    
    return toBnNum(bnDay);
  };

  const getBanglaMonthRange = (month: number) => {
    const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    // Simplified mapping for 2026
    // Jan: Poush - Magh
    // Feb: Magh - Falgun
    // Mar: Falgun - Chaitra
    // Apr: Chaitra - Boishakh
    const mapping: { [key: number]: string } = {
      0: "পৌষ - মাঘ",
      1: "মাঘ - ফাল্গুন",
      2: "ফাল্গুন - চৈত্র",
      3: "চৈত্র - বৈশাখ",
      4: "বৈশাখ - জ্যৈষ্ঠ",
      5: "জ্যৈষ্ঠ - আষাঢ়",
      6: "আষাঢ় - শ্রাবণ",
      7: "শ্রাবণ - ভাদ্র",
      8: "ভাদ্র - আশ্বিন",
      9: "আশ্বিন - কার্তিক",
      10: "কার্তিক - অগ্রহায়ণ",
      11: "অগ্রহায়ণ - পৌষ"
    };
    return mapping[month] || "";
  };

  const govtHolidays = [
    '2026-02-21', // Shaheed Day
    '2026-03-17', // Sheikh Mujibur Rahman's Birthday
    '2026-03-20', // Eid-ul-Fitr (approx)
    '2026-03-21', // Eid-ul-Fitr (approx)
    '2026-03-22', // Eid-ul-Fitr (approx)
    '2026-03-26', // Independence Day
    '2026-04-14', // Pohela Boishakh
    '2026-05-01', // May Day
    '2026-05-27', // Eid-ul-Adha (approx)
    '2026-05-28', // Eid-ul-Adha (approx)
    '2026-05-29', // Eid-ul-Adha (approx)
    '2026-08-15', // National Mourning Day
    '2026-08-26', // Janmashtami (approx)
    '2026-10-20', // Durga Puja (approx)
    '2026-12-16', // Victory Day
    '2026-12-25', // Christmas Day
  ];

  const currentMonth = currentCalendarDate.getMonth();
  const currentYear = currentCalendarDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  
  // No adjustment needed since getDay() returns 0 for Sunday, which matches our new layout

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    // Use local date string to avoid timezone issues
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    
    const dayOfWeek = date.getDay(); // 0: Sunday, 5: Friday, 6: Saturday
    
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const isGovtHoliday = govtHolidays.includes(dateStr);
    const isHoliday = isWeekend || isGovtHoliday;

    const dayCases = visibleCases.filter(c => c.nextDate === dateStr);
    const hasPending = dayCases.length > 0 && dayCases.some(c => !c.isUpdated);
    
    // Check if today using local date
    const todayYearStr = today.getFullYear();
    const todayMonthStr = String(today.getMonth() + 1).padStart(2, '0');
    const todayDayStr = String(today.getDate()).padStart(2, '0');
    const localTodayStr = `${todayYearStr}-${todayMonthStr}-${todayDayStr}`;
    
    const isHighlighted = calendarSearchQuery.trim() !== '' && (
      dateStr.includes(calendarSearchQuery) ||
      dayStr === calendarSearchQuery ||
      dayCases.some(c => c.caseNumber.includes(calendarSearchQuery) || c.courtName.includes(calendarSearchQuery))
    );
    
    return {
      day: i + 1,
      dateStr,
      hasCases: dayCases.length > 0,
      hasPending,
      isToday: dateStr === localTodayStr,
      isHoliday,
      isHighlighted,
      banglaDay: getBanglaDate(date)
    };
  });

  const isUserPetitioner = (c: Case) => {
    if (!userMobile) return false;
    return c.petitionerMobile === userMobile ||
      (Array.isArray(c.petitionerLawyerMobile) ? c.petitionerLawyerMobile.includes(userMobile) : c.petitionerLawyerMobile === userMobile) ||
      (Array.isArray(c.petitionerAsstLawyerMobile) ? c.petitionerAsstLawyerMobile.includes(userMobile) : c.petitionerAsstLawyerMobile === userMobile) ||
      (Array.isArray(c.petitionerClerkMobile) ? c.petitionerClerkMobile.includes(userMobile) : c.petitionerClerkMobile === userMobile) ||
      (Array.isArray(c.petitionerAsstClerkMobile) ? c.petitionerAsstClerkMobile.includes(userMobile) : c.petitionerAsstClerkMobile === userMobile);
  };

  const isUserRespondent = (c: Case) => {
    if (!userMobile) return false;
    return c.respondentMobile === userMobile ||
      (Array.isArray(c.respondentLawyerMobile) ? c.respondentLawyerMobile.includes(userMobile) : c.respondentLawyerMobile === userMobile) ||
      (Array.isArray(c.respondentAsstLawyerMobile) ? c.respondentAsstLawyerMobile.includes(userMobile) : c.respondentAsstLawyerMobile === userMobile) ||
      (Array.isArray(c.respondentClerkMobile) ? c.respondentClerkMobile.includes(userMobile) : c.respondentClerkMobile === userMobile) ||
      (Array.isArray(c.respondentAsstClerkMobile) ? c.respondentAsstClerkMobile.includes(userMobile) : c.respondentAsstClerkMobile === userMobile);
  };

  const handleReportError = (caseId: string | number, side: 'petitioner' | 'respondent') => {
    setCases(cases.map(c => c.id === caseId ? { ...c, reportedErrorBySide: side } : c));
    alert(t('error_reported'));
  };

  const handleSaveCase = async (caseData: Partial<Case>) => {
    // Check online status if visibility is not private (own diary)
    if (caseData.visibility !== 'private' && !navigator.onLine) {
      alert(t('online_required_sync'));
      return;
    }

    const isPetitioner = isUserPetitioner(caseData as Case);
    const isRespondent = isUserRespondent(caseData as Case);
    const currentSide = isPetitioner ? 'petitioner' : isRespondent ? 'respondent' : undefined;

    let finalCaseData = { ...caseData, user_id: userId };

    if (editingCase) {
      if (currentSide && editingCase.reportedErrorBySide && editingCase.reportedErrorBySide !== currentSide) {
        alert(language === 'bn' ? 'আপনার দেওয়া পূর্বের তথ্য ভুল ছিল বলে রিপোর্ট করা হয়েছিল। এটি সংশোধন করার কারণে আপনার সাবস্ক্রিপশন ৩ দিনের জন্য স্থগিত করা হলো।' : 'Your previous data was reported as incorrect. Due to this correction, your subscription is suspended for 3 days.');
        finalCaseData.reportedErrorBySide = undefined;
      }
      finalCaseData.lastEditedBySide = currentSide;
      
      // Save to server if online
      if (navigator.onLine) {
        try {
          await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...editingCase, ...finalCaseData })
          });
        } catch (e) {
          console.error('Failed to save case to server', e);
        }
      }

      setCases(cases.map(c => c.id === editingCase.id ? { ...c, ...finalCaseData } as Case : c));
      setSuccessMessage(t('success_update'));
    } else {
      const newCase = {
        ...finalCaseData,
        id: Date.now(), // Temporary ID for offline
        lastEditedBySide: currentSide
      } as Case;

      // Save to server if online
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCase)
          });
          if (res.ok) {
            const data = await res.json();
            newCase.id = data.id; // Use server ID
          }
        } catch (e) {
          console.error('Failed to save case to server', e);
        }
      }

      setCases([newCase, ...cases]);
      setSuccessMessage(t('success_add'));
    }
    setIsCaseFormOpen(false);
    setEditingCase(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditCase = (c: Case) => {
    setSelectedCaseForTimeline(c);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskStatus('pending');
    setTaskPriority('medium');
    setTaskAssignedTo('self');
    setTaskCaseNumber('');
    setTaskCategory('other');
    setTaskCourtName('');
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskDueDate(task.dueDate || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignedTo(task.assignedTo || 'self');
    setTaskCaseNumber(task.caseNumber || '');
    setTaskCategory(task.category || 'other');
    setTaskCourtName(task.courtName || '');
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (id: number | string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleTask = (id: number | string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'pending' ? 'in-progress' : t.status === 'in-progress' ? 'completed' : 'pending';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleCaseSearch = () => {
    // Search is handled by filtering in view components
  };

  const handleJoinCase = (
    caseNumber: string, 
    side: 'petitioner' | 'respondent', 
    respondents?: {name: string, serial: string, phone: string}[], 
    totalRespondents?: string, 
    order?: string, 
    additionalOrder?: string,
    lawyerInfo?: {name: string, phone: string},
    clerkInfo?: {name: string, phone: string},
    nextDate?: string,
    caseSection?: string
  ) => {
    // Find the case
    const targetCase = cases.find(c => c.caseNumber === caseNumber || c.rawCaseNumber === caseNumber);
    
    if (targetCase) {
      let updatedCase = { ...targetCase };
      
      if (caseSection) updatedCase.caseSection = caseSection;
      
      if (side === 'respondent') {
        if (respondents && respondents.length > 0) {
          const currentDetails = targetCase.respondentDetails || [];
          
          // If there was no respondentDetails but there was a respondent string, we should initialize it
          if (currentDetails.length === 0 && targetCase.respondent) {
            currentDetails.unshift({
              name: targetCase.respondent,
              phone: targetCase.respondentMobile || '',
              serial: 1
            });
          }
          
          const updatedDetails = [
            ...currentDetails,
            ...respondents
          ];
          
          updatedCase = {
            ...updatedCase,
            respondentDetails: updatedDetails,
            respondent: updatedDetails.map(d => d.name).join(', '),
            totalRespondents: totalRespondents || targetCase.totalRespondents || ''
          };
        }
      }
      
      // Add lawyer and clerk info if provided (for both sides)
      if (lawyerInfo?.name) {
        if (side === 'respondent') {
          updatedCase.respondentLawyer = lawyerInfo.name;
          if (lawyerInfo.phone) {
            const currentMobiles = Array.isArray(targetCase.respondentLawyerMobile) 
              ? targetCase.respondentLawyerMobile 
              : (targetCase.respondentLawyerMobile ? [targetCase.respondentLawyerMobile] : []);
            if (!currentMobiles.includes(lawyerInfo.phone)) {
              updatedCase.respondentLawyerMobile = [...currentMobiles, lawyerInfo.phone];
            }
          }
        } else {
          updatedCase.petitionerLawyer = lawyerInfo.name;
          if (lawyerInfo.phone) {
            const currentMobiles = Array.isArray(targetCase.petitionerLawyerMobile) 
              ? targetCase.petitionerLawyerMobile 
              : (targetCase.petitionerLawyerMobile ? [targetCase.petitionerLawyerMobile] : []);
            if (!currentMobiles.includes(lawyerInfo.phone)) {
              updatedCase.petitionerLawyerMobile = [...currentMobiles, lawyerInfo.phone];
            }
          }
        }
      }

      if (clerkInfo?.name) {
        if (side === 'respondent') {
          updatedCase.respondentClerk = clerkInfo.name;
          if (clerkInfo.phone) {
            const currentMobiles = Array.isArray(targetCase.respondentClerkMobile) 
              ? targetCase.respondentClerkMobile 
              : (targetCase.respondentClerkMobile ? [targetCase.respondentClerkMobile] : []);
            if (!currentMobiles.includes(clerkInfo.phone)) {
              updatedCase.respondentClerkMobile = [...currentMobiles, clerkInfo.phone];
            }
          }
        } else {
          updatedCase.petitionerClerk = clerkInfo.name;
          if (clerkInfo.phone) {
            const currentMobiles = Array.isArray(targetCase.petitionerClerkMobile) 
              ? targetCase.petitionerClerkMobile 
              : (targetCase.petitionerClerkMobile ? [targetCase.petitionerClerkMobile] : []);
            if (!currentMobiles.includes(clerkInfo.phone)) {
              updatedCase.petitionerClerkMobile = [...currentMobiles, clerkInfo.phone];
            }
          }
        }
      }
      
      if (order) updatedCase.order = order;
      if (additionalOrder) updatedCase.additionalOrder = additionalOrder;
      if (nextDate) updatedCase.nextDate = nextDate;
      
      setCases(cases.map(c => c.id === targetCase.id ? updatedCase : c));
      
      setSuccessMessage(t('success_join').replace('{caseNumber}', caseNumber));
    } else {
      setSuccessMessage(t('success_join').replace('{caseNumber}', caseNumber));
    }
    
    setIsJoinFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCalendarSearch = () => {
    if (!calendarSearchQuery.trim()) return;
    
    // Check if it's a date format (YYYY-MM-DD or DD)
    const dateMatch = calendarDays.find(d => 
      d.dateStr.includes(calendarSearchQuery) || 
      d.day.toString() === calendarSearchQuery
    );
    
    if (dateMatch) {
      setSelectedDate(dateMatch.dateStr);
      return;
    }
    
    // Check if it's a case number or court name
    const caseMatch = visibleCases.find(c => 
      c.caseNumber.includes(calendarSearchQuery) || 
      c.courtName.includes(calendarSearchQuery)
    );
    
    if (caseMatch) {
      // Find the date for this case
      const caseDate = new Date(caseMatch.nextDate);
      // Update calendar month to show this case
      setCurrentCalendarDate(new Date(caseDate.getFullYear(), caseDate.getMonth(), 1));
      // Open the diary view for this date
      setSelectedDate(caseMatch.nextDate);
    } else {
      alert('কোনো তথ্য পাওয়া যায়নি। দয়া করে সঠিক তারিখ বা মামলা নম্বর দিন।');
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleMarkAsRead = async (id: string | number) => {
    if (typeof id === 'string') {
      try {
        await markNotificationAsRead(id);
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    } else {
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      if (typeof n.id === 'string') {
        await markNotificationAsRead(n.id);
      }
    }
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const affiliates = [
    { id: 1, name: 'martnix.com', url: 'https://martnix.com/customer/register?ref=1012' , logo: 'https://martnix.com/favicon.ico', description: 'শপিং করুন আর পান আকর্ষণীয় কমিশন', color: 'bg-orange-50 text-orange-600' },
  ];

  const newspapers = [
    { id: 1, name: 'প্রথম আলো', url: 'https://www.prothomalo.com/', domain: 'prothomalo.com', logo: 'https://www.prothomalo.com/favicon.ico' },
    { id: 2, name: 'কালের কণ্ঠ', url: 'https://www.kalerkantho.com/', domain: 'kalerkantho.com', logo: 'https://www.kalerkantho.com/favicon.ico' },
    { id: 3, name: 'যুগান্তর', url: 'https://www.jugantor.com/', domain: 'jugantor.com', logo: 'https://www.jugantor.com/favicon.ico' },
    { id: 4, name: 'ইত্তেফাক', url: 'https://www.ittefaq.com.bd/', domain: 'ittefaq.com.bd', logo: 'https://www.ittefaq.com.bd/favicon.ico' },
    { id: 5, name: 'ডেইলি স্টার', url: 'https://www.thedailystar.net/bangla', domain: 'thedailystar.net', logo: 'https://www.thedailystar.net/favicon.ico' },
    { id: 6, name: 'সমকাল', url: 'https://www.samakal.com/', domain: 'samakal.com', logo: 'https://www.samakal.com/favicon.ico' },
    { id: 7, name: 'নয়া দিগন্ত', url: 'https://www.dailynayadiganta.com/', domain: 'dailynayadiganta.com', logo: 'https://www.dailynayadiganta.com/favicon.ico' },
    { id: 8, name: 'বাংলাদেশ প্রতিদিন', url: 'https://www.bd-pratidin.com/', domain: 'bd-pratidin.com', logo: 'https://www.bd-pratidin.com/favicon.ico' },
    { id: 9, name: 'বিডিনিউজ ২৪', url: 'https://bangla.bdnews24.com/', domain: 'bdnews24.com', logo: 'https://bangla.bdnews24.com/favicon.ico' },
    { id: 10, name: 'বাংলানিউজ ২৪', url: 'https://www.banglanews24.com/', domain: 'banglanews24.com', logo: 'https://www.banglanews24.com/favicon.ico' },
    { id: 11, name: 'জাগো নিউজ', url: 'https://www.jagonews24.com/', domain: 'jagonews24.com', logo: 'https://www.jagonews24.com/favicon.ico' },
    { id: 12, name: 'ঢাকা পোস্ট', url: 'https://www.dhakapost.com/', domain: 'dhakapost.com', logo: 'https://www.dhakapost.com/favicon.ico' },
    { id: 13, name: 'ইনকিলাব', url: 'https://www.dailyinqilab.com/', domain: 'dailyinqilab.com', logo: 'https://www.dailyinqilab.com/favicon.ico' },
    { id: 14, name: 'মানবজমিন', url: 'https://mzamin.com/', domain: 'mzamin.com', logo: 'https://mzamin.com/favicon.ico' },
    { id: 15, name: 'আমাদের সময়', url: 'https://www.dainikamadershomoy.com/', domain: 'dainikamadershomoy.com', logo: 'https://www.dainikamadershomoy.com/favicon.ico' },
    { id: 16, name: 'ভোরের কাগজ', url: 'https://www.bhorerkagoj.com/', domain: 'bhorerkagoj.com', logo: 'https://www.bhorerkagoj.com/favicon.ico' },
  ];

  const lawBooks = [
    { id: 1, name: 'দণ্ডবিধি, ১৮৬০ (The Penal Code, 1860)', url: 'http://bdlaws.minlaw.gov.bd/act-11.html', country: 'Bangladesh' },
    { id: 2, name: 'ফৌজদারী কার্যবিধি, ১৮৯৮ (The Code of Criminal Procedure, 1898)', url: 'http://bdlaws.minlaw.gov.bd/act-75.html', country: 'Bangladesh' },
    { id: 3, name: 'দেওয়ানী কার্যবিধি, ১৯০৮ (The Code of Civil Procedure, 1908)', url: 'http://bdlaws.minlaw.gov.bd/act-86.html', country: 'Bangladesh' },
    { id: 4, name: 'সাক্ষ্য আইন, ১৮৭২ (The Evidence Act, 1872)', url: 'http://bdlaws.minlaw.gov.bd/act-24.html', country: 'Bangladesh' },
    { id: 5, name: 'নারী ও শিশু নির্যাতন দমন আইন, ২০০০ (Prevention of Oppression Against Women and Children Act, 2000)', url: 'http://bdlaws.minlaw.gov.bd/act-214.html', country: 'Bangladesh' },
    { id: 6, name: 'সুনির্দিষ্ট প্রতিকার আইন, ১৮৭৭ (The Specific Relief Act, 1877)', url: 'http://bdlaws.minlaw.gov.bd/act-26.html', country: 'Bangladesh' },
    { id: 7, name: 'তামাদি আইন, ১৯০৮ (The Limitation Act, 1908)', url: 'http://bdlaws.minlaw.gov.bd/act-87.html', country: 'Bangladesh' },
    { id: 8, name: 'মাদকদ্রব্য নিয়ন্ত্রণ আইন, ২০১৮ (Narcotics Control Act, 2018)', url: 'http://bdlaws.minlaw.gov.bd/act-1268.html', country: 'Bangladesh' },
    { id: 9, name: 'পারিবারিক আদালত অধ্যাদেশ, ১৯৮৫ (The Family Courts Ordinance, 1985)', url: 'http://bdlaws.minlaw.gov.bd/act-675.html', country: 'Bangladesh' },
    { id: 10, name: 'যৌতুক নিরোধ আইন, ২০১৮ (Dowry Prohibition Act, 2018)', url: 'http://bdlaws.minlaw.gov.bd/act-1258.html', country: 'Bangladesh' },
    { id: 11, name: 'ডিজিটাল নিরাপত্তা আইন, ২০১৮ (Digital Security Act, 2018)', url: 'http://bdlaws.minlaw.gov.bd/act-1262.html', country: 'Bangladesh' },
    { id: 12, name: 'শ্রম আইন, ২০০৬ (The Labour Act, 2006)', url: 'http://bdlaws.minlaw.gov.bd/act-952.html', country: 'Bangladesh' },
    { id: 13, name: 'সম্পত্তি হস্তান্তর আইন, ১৮৮২ (The Transfer of Property Act, 1882)', url: 'http://bdlaws.minlaw.gov.bd/act-48.html', country: 'Bangladesh' },
    { id: 14, name: 'চুক্তি আইন, ১৮৭২ (The Contract Act, 1872)', url: 'http://bdlaws.minlaw.gov.bd/act-25.html', country: 'Bangladesh' },
    { id: 15, name: 'Indian Penal Code, 1860', url: 'https://www.indiacode.nic.in/handle/123456789/2263', country: 'India' },
    { id: 16, name: 'Code of Criminal Procedure, 1973', url: 'https://www.indiacode.nic.in/handle/123456789/1594', country: 'India' },
    { id: 17, name: 'Code of Civil Procedure, 1908', url: 'https://www.indiacode.nic.in/handle/123456789/2191', country: 'India' },
    { id: 18, name: 'Pakistan Penal Code, 1860', url: 'https://pakistanlawsite.com/Law/Details/363', country: 'Pakistan' },
    { id: 19, name: 'Code of Criminal Procedure, 1898', url: 'https://pakistanlawsite.com/Law/Details/364', country: 'Pakistan' },
    { id: 20, name: 'Code of Civil Procedure, 1908', url: 'https://pakistanlawsite.com/Law/Details/365', country: 'Pakistan' },
  ];

  const motivationalBooks = [
    { id: 1, name: 'অটমিক হ্যাবিটস (Atomic Habits)', url: '#' },
    { id: 2, name: 'দ্য পাওয়ার অফ নাউ (The Power of Now)', url: '#' },
    { id: 3, name: 'থিংক অ্যান্ড গ্রো রিচ (Think and Grow Rich)', url: '#' },
  ];

  const [religiousBooks, setReligiousBooks] = useState([
    { id: 1, name: 'পবিত্র আল-কোরআন (বাংলা অর্থসহ)', url: 'https://www.quraanshareef.org/' },
    { id: 2, name: 'শ্রীমদ্ভগবদ্গীতা', url: '#' },
    { id: 3, name: 'পবিত্র বাইবেল', url: '#' },
    { id: 4, name: 'ত্রিপিটক', url: '#' },
  ]);

  const handleReligiousBookUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const path = `religious-books/${id}/${file.name}`;
      await uploadFile('documents', path, file);
      const url = await getPublicUrl('documents', path);
      setReligiousBooks(prev => prev.map(b => b.id === id ? { ...b, url } : b));
      alert("ফাইল সফলভাবে আপলোড হয়েছে।");
    } catch (err: any) {
      console.error("Failed to upload religious book", err);
      alert(`ফাইল আপলোড করতে সমস্যা হয়েছে: ${err.message || 'অজানা ত্রুটি'}`);
    }
  };

  const filteredLawBooks = lawBooks.filter(book => book.country === userCountry);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userMessage = aiQuery;
    const newMessages = [...aiMessages, { role: 'user' as const, text: userMessage }];
    setAiMessages(newMessages);
    setAiQuery('');
    setIsAiLoading(true);

    // AI Limit Check
    let deductPoints = false;
    if (userType !== 'super_admin') {
      const now = new Date();
      const lastReset = lastAiResetDate ? new Date(lastAiResetDate) : now;
      const isNewMonth = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
      
      const currentCount = isNewMonth ? 0 : (aiQuestionsCount || 0);
      
      let limit = 10; // Default for free users
      if (userType === 'admin') {
        limit = 50;
      } else if (isSubscribed) {
        limit = Infinity; // Unlimited for paid subscribers
      }
      
      if (currentCount >= limit) {
        if ((points || 0) >= 10) {
          deductPoints = true;
        } else {
          setAiMessages([...newMessages, { role: 'model', text: t('ai_limit_reached').replace('{limit}', limit.toString()).replace('{points}', (points || 0).toString()) }]);
          setIsAiLoading(false);
          return;
        }
      }
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const contents = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: `আপনি একজন বাংলাদেশী লিগ্যাল অ্যাসিস্ট্যান্ট এবং এই "MDC Diary" অ্যাপের গাইড। আপনি বাংলাদেশের আইন, ধারা, সাজা, সাক্ষ্য গ্রহণের টেকনিক, জেরা করার টেকনিক, যুক্তিতর্ক, এবং দরখাস্ত লেখার নিয়ম সম্পর্কে উকিল ও মুহুরিদের সাহায্য করবেন। 

বর্তমান ব্যবহারকারীর ধরণ: ${currentViewMode === 'lawyer' ? 'উকিল' : currentViewMode === 'clerk' ? 'মুহুরি' : currentViewMode === 'client' ? 'ক্লায়েন্ট' : 'অ্যাডমিন'}। আপনি ব্যবহারকারীর ধরণ অনুযায়ী আরও প্রাসঙ্গিক পরামর্শ দিন।

পাশাপাশি আপনি এই অ্যাপের প্রতিটি মেনু, বাটন এবং প্রসেস সম্পর্কেও তথ্য দেবেন। অ্যাপের প্রধান ফিচারগুলো হলো:
১. ড্যাশবোর্ড: মামলার সারসংক্ষেপ এবং দ্রুত অ্যাকশন বাটন।
২. ক্যালেন্ডার: প্রতিদিনের শুনানির তারিখ এবং ডায়েরি।
৩. মামলার তালিকা: মামলা যোগ করা, এডিট করা এবং জয়েন করা।
৪. রিচার্জ: সাবস্ক্রিপশন প্যাকেজ কেনা।
৫. নোটিফিকেশন: মামলার আপডেট এবং কাজের তথ্য।
৬. আইন লাইব্রেরি: বাংলাদেশ, ভারত ও পাকিস্তানের আইনের রেফারেন্স।
৭. প্রফেশনাল রিসোর্স: আইনি টেমপ্লেট আপলোড ও ডাউনলোড।
৮. অ্যাফিলিয়েট জোন: অ্যাপ শেয়ার করে পয়েন্ট অর্জন।
৯. এমার্জেন্সি: জরুরি যোগাযোগ।
১০. সেটিংস: থিম, ভাষা এবং প্রোফাইল পরিবর্তন।
১১. ডকুমেন্টস: মামলার ফাইল সেভ করে রাখা (সাবস্ক্রিপশন প্রয়োজন)।
১২. ২০ বছরের মেমোরি: আপনার মামলার আজীবন ইতিহাস।
১৩. টাস্ক ম্যানেজমেন্ট: আপনার এবং টিমের কাজের তালিকা।

ব্যবহারকারী অ্যাপের কোনো বাটন বা প্রসেস সম্পর্কে জানতে চাইলে সহজভাবে বুঝিয়ে বলুন। বাংলায় উত্তর দিন।`,
        }
      });

      setAiMessages([...newMessages, { role: 'model', text: response.text || '' }]);
      
      // Increment AI usage in background
      fetch('/api/users/increment-ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deductPoints })
      }).then(() => {
        if (deductPoints && onUpdateProfile) {
          onUpdateProfile({ points: (points || 0) - 10 });
        } else if (!deductPoints && onUpdateProfile) {
          onUpdateProfile({ aiQuestionsCount: (aiQuestionsCount || 0) + 1 });
        }
      }).catch(err => console.error("Failed to increment AI usage:", err));

    } catch (error) {
      console.error(error);
      setAiMessages([...newMessages, { role: 'model', text: t('ai_connection_error') }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div ref={containerRef} className={`min-h-screen flex transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar for Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-800' : 'bg-[#262dc9]'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <FileText className="text-indigo-200" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight">MDC Diary</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden text-white/70 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Profile Section in Sidebar */}
          <div className="px-6 py-4 flex flex-col items-center border-b border-white/10 mb-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-white/40" size={40} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full border-2 border-indigo-900 cursor-pointer hover:bg-indigo-500 transition-colors shadow-lg">
                <Camera size={14} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
              </label>
            </div>
            <div className="mt-3 text-center">
              <p className="text-white font-bold text-sm truncate max-w-[180px]">{userName}</p>
              <p className="text-indigo-200/60 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                {currentViewMode === 'lawyer' ? t('role_lawyer') : 
                 currentViewMode === 'clerk' ? t('role_clerk') : 
                 currentViewMode === 'admin' ? t('role_admin') : 
                 currentViewMode === 'super_admin' ? t('role_super_admin') :
                 currentViewMode === 'country_manager' ? t('role_country_manager') :
                 t('role_client')}
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-4 text-[10px] font-bold text-indigo-200/40 uppercase tracking-widest">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((item: any) => {
                    if (item.hidden) return null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.requiresSubscription && !isSubscribed) {
                            setShowSubscriptionPrompt(true);
                            return;
                          }
                          handleTabChange(item.id);
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                          ${activeTab === item.id 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-indigo-100/70 hover:bg-white/5 hover:text-white'}
                          ${item.requiresSubscription && !isSubscribed ? 'opacity-60 grayscale-[0.5]' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} />
                          <span className="text-[12px] leading-[18px] text-[#f7f5ff]">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.requiresSubscription && !isSubscribed && (
                            <Lock size={12} className="text-indigo-300" />
                          )}
                          {item.id === 'affiliate_zone' && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                              সাবস্ক্রিপশন ফ্রি
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all"
            >
              <LogOut size={20} />
              {t('logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`border-b h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            {activeTab !== 'dashboard' && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-all"
                title={t('back')}
              >
                <ChevronRight className="rotate-180" size={20} />
                <span className="text-sm font-bold hidden sm:inline">{t('back')}</span>
              </button>
            )}
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight hidden sm:block">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Admin View Mode Selector */}
            {(userType === 'admin' || userType === 'super_admin' || userType === 'country_manager') && (
              <div className="hidden md:flex items-center gap-2 mr-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Shield size={14} className="text-indigo-600 ml-1" />
                <select
                  value={currentViewMode}
                  onChange={(e) => setCurrentViewMode(e.target.value as any)}
                  className="text-[10px] bg-transparent border-none outline-none font-bold text-slate-600 px-1 cursor-pointer uppercase"
                >
                  <option value="lawyer">Lawyer</option>
                  <option value="clerk">Clerk</option>
                  <option value="client">Client</option>
                </select>
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              currentViewMode === 'lawyer' ? 'bg-blue-100 text-blue-700' : 
              currentViewMode === 'clerk' ? 'bg-indigo-100 text-indigo-700' : 
              currentViewMode === 'client' ? 'bg-emerald-100 text-emerald-700' : 
              'bg-orange-100 text-orange-700'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                currentViewMode === 'lawyer' ? 'bg-blue-500' : currentViewMode === 'clerk' ? 'bg-indigo-500' : currentViewMode === 'client' ? 'bg-emerald-500' : 'bg-orange-500'
              }`}></span>
              {currentViewMode === 'lawyer' ? t('role_lawyer') : 
               currentViewMode === 'clerk' ? t('role_clerk') : 
               currentViewMode === 'client' ? t('role_client') : 
               currentViewMode === 'admin' ? (language === 'bn' ? 'অ্যাডমিন' : language === 'hi' ? 'व्यवस्थापक' : 'Admin') :
               currentViewMode === 'super_admin' ? (language === 'bn' ? 'সুপার অ্যাডমিন' : language === 'hi' ? 'सुपर व्यवस्थापक' : 'Super Admin') :
               currentViewMode === 'country_manager' ? (language === 'bn' ? 'কান্ট্রি ম্যানেজার' : language === 'hi' ? 'देश प्रबंधक' : 'Country Manager') :
               t('role_general_user')}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative p-2 rounded-full transition-all ${isNotificationOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-200">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationOpen && (
                  <NotificationPanel 
                    notifications={notifications}
                    onClose={() => setIsNotificationOpen(false)}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none mb-1">{userName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t('active')}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 shadow-sm ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 border-slate-700' : 'bg-indigo-100 text-indigo-600 border-white'}`}>
                {userName.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8 bg-[#87e9ab]">
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 font-bold text-center shadow-sm"
            >
              {successMessage}
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {selectedCaseForTimeline ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <CaseTimeline 
                  caseInfo={{
                    caseNumber: selectedCaseForTimeline.caseNumber,
                    courtName: selectedCaseForTimeline.courtName,
                    petitioner: selectedCaseForTimeline.petitioner,
                    respondent: selectedCaseForTimeline.respondent,
                    status: selectedCaseForTimeline.status,
                  }}
                  currentUserRole={(currentViewMode === 'bar_admin' ? 'admin' : currentViewMode) as any}
                  currentUserSide={currentViewMode === 'client' ? 'petitioner' : 'respondent'}
                  onBack={() => setSelectedCaseForTimeline(null)}
                  theme={theme}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                    {activeTab === 'case_timeline' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">মামলার টাইমলাইন</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cases.map(c => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedCaseForTimeline(c)}
                        className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
                      >
                        <h3 className="font-bold">{c.caseNumber}</h3>
                        <p className="text-sm text-slate-500">{c.courtName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">নোটিফিকেশন</h2>
                  <NotificationPanel 
                    notifications={notifications} 
                    onClose={() => setActiveTab('dashboard')}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />
                </div>
              )}
              {activeTab === 'support_chat' && (
                <div className="h-[calc(100vh-12rem)]">
                  <SupportChat userId={userId.toString()} userName={userName} />
                </div>
              )}
              {activeTab === 'lawyer_directory' && (
                <LawyerDirectory />
              )}
              {activeTab === 'case_history_20y' && (
                <ArchiveCaseHistory />
              )}
              {activeTab === 'dashboard' && (
                <HomeView 
                  userName={userName}
                  userType={currentViewMode}
                  cases={visibleCases}
                  tasks={tasks}
                  language={language}
                  theme={theme}
                  setActiveTab={setActiveTab}
                  t={t}
                  isPremium={subscriptionPackage === 'premium'}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView 
                  currentMonth={currentCalendarDate}
                  setCurrentMonth={setCurrentCalendarDate}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  cases={visibleCases}
                  onViewCard={handleViewCardWithAd}
                  onViewHistory={setSelectedCaseForHistory}
                  language={language}
                  userType={currentViewMode}
                  govtHolidays={govtHolidays}
                  getBanglaDate={getBanglaDate}
                />
              )}
              {activeTab === 'cases' && (
                <CasesView 
                  cases={visibleCases}
                  caseSearchQuery={caseSearchQuery}
                  setCaseSearchQuery={setCaseSearchQuery}
                  caseFilter={caseFilter}
                  setCaseFilter={setCaseFilter}
                  caseStatusFilter={caseStatusFilter}
                  setCaseStatusFilter={setCaseStatusFilter}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onAddCase={() => setIsCaseFormOpen(true)}
                  onJoinCase={() => setIsJoinFormOpen(true)}
                  onEditCase={handleEditCase}
                  onDeleteCase={handleDeleteCase}
                  onViewHistory={setSelectedCaseForHistory}
                  onViewCard={setSelectedCaseForCard}
                  t={t}
                  language={language}
                  isPremium={subscriptionPackage === 'premium'}
                />
              )}
              {activeTab === 'news' && (
                <NewsView 
                  language={language}
                  t={t}
                />
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{t('task_management')}</h3>
                        <p className="text-slate-500 text-sm font-medium">{t('task_list_desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text"
                          value={taskSearchQuery}
                          onChange={(e) => setTaskSearchQuery(e.target.value)}
                          placeholder={t('search_tasks')}
                          className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-48 font-medium"
                        />
                      </div>
                      <button 
                        onClick={() => {
                        setEditingTask(null);
                        setTaskTitle('');
                        setTaskDescription('');
                        setTaskDueDate('');
                        setTaskPriority('medium');
                        setTaskAssignedTo('self');
                        setTaskCaseNumber('');
                        setTaskCategory('other');
                        setTaskCourtName('');
                        setIsTaskFormOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <Plus size={18} />
                      {t('new_task')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pending Tasks */}
                    <div className="space-y-4 md:col-span-2">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="font-bold text-slate-500 flex items-center gap-2">
                          <Clock size={16} /> {t('ongoing_tasks')}
                        </h4>
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                          {t('total_label')}: {tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length}
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Pending & In-Progress Tasks */}
                        {Object.entries(
                          tasks
                            .filter(t => t.status === 'pending' || t.status === 'in-progress')
                            .filter(t => 
                              t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) || 
                              t.description?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                              t.caseNumber?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                              t.id.toString().includes(taskSearchQuery)
                            )
                            .reduce((acc, task) => {
                            const court = task.courtName || t('other_courts');
                            if (!acc[court]) acc[court] = [];
                            acc[court].push(task);
                            return acc;
                          }, {} as Record<string, Task[]>)
                        ).map(([court, courtTasks]) => (
                          <div key={court} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                              <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{court}</h5>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {courtTasks.map(task => {
                                const isUrgent = task.dueDate === new Date().toISOString().split('T')[0];
                                return (
                                  <div 
                                    key={task.id} 
                                    className={`bg-white p-4 rounded-2xl border transition-all group relative overflow-hidden ${
                                      isUrgent ? 'border-rose-200 shadow-rose-50 shadow-lg' : 'border-slate-100 shadow-sm hover:shadow-md'
                                    }`}
                                  >
                                    {isUrgent && (
                                      <div className="absolute top-0 right-0">
                                        <div className="bg-rose-500 text-white text-[8px] font-black px-3 py-1 rotate-45 translate-x-3 -translate-y-1 shadow-sm">
                                          URGENT
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                          {task.category && (
                                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded uppercase">
                                              {task.category === 'attendance' ? t('attendance_label') : 
                                               task.category === 'filing' ? t('filing_label') : 
                                               task.category === 'copy' ? t('copy_label') : 
                                               task.category === 'fee' ? t('fee_label') : t('other_label')}
                                            </span>
                                          )}
                                          <div className="flex items-center gap-1 bg-indigo-50/50 px-1.5 py-0.5 rounded group/sn">
                                            <span className="text-[9px] font-bold text-indigo-400">{t('serial_no_label')}: {task.id}</span>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(task.id.toString());
                                                // Optional: Show a brief toast or feedback
                                              }}
                                              className="text-indigo-300 hover:text-indigo-600 transition-colors"
                                              title={t('copy_sn_label')}
                                            >
                                              <Copy size={10} />
                                            </button>
                                          </div>
                                          {task.caseNumber && (
                                            <span className="text-[10px] font-bold text-slate-400">#{task.caseNumber}</span>
                                          )}
                                        </div>
                                        <h5 className="font-bold text-slate-800 leading-tight">{task.title}</h5>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                        task.priority === 'high' ? 'bg-rose-100 text-rose-600' : 
                                        task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    </div>
                                    
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2rem]">{task.description}</p>
                                    
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                          <Calendar size={12} className={isUrgent ? 'text-rose-500' : 'text-slate-400'} />
                                          <span className={`text-[10px] font-bold ${isUrgent ? 'text-rose-600' : 'text-slate-400'}`}>
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' }) : t('no_date_label')}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                          <Users size={12} />
                                          <span className="text-[10px] font-bold">
                                            {task.assignedTo === 'self' ? t('self') : 
                                             task.assignedTo === 'clerk' ? t('clerk') :
                                             task.assignedTo === 'lawyer' ? t('lawyer') :
                                             task.assignedTo}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => {
                                            setEditingTask(task);
                                            setTaskTitle(task.title);
                                            setTaskDescription(task.description || '');
                                            setTaskDueDate(task.dueDate || '');
                                            setTaskPriority(task.priority);
                                            setTaskStatus(task.status);
                                            setTaskAssignedTo(task.assignedTo);
                                            setTaskCaseNumber(task.caseNumber || '');
                                            setTaskCategory(task.category || 'other');
                                            setTaskCourtName(task.courtName || '');
                                            setIsTaskFormOpen(true);
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                          <Settings size={14} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setTasks(prev => prev.filter(t => t.id !== task.id));
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const nextStatus = task.status === 'pending' ? 'in-progress' : task.status === 'in-progress' ? 'completed' : 'pending';
                                            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
                                          }}
                                          className={`p-1.5 rounded-lg transition-colors ${
                                            task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                                            task.status === 'in-progress' ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'
                                          }`}
                                        >
                                          <CheckCircle2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {tasks.filter(t => t.status === 'pending').length === 0 && (
                          <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                              <CheckCircle2 className="text-slate-200" size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-400">{t('all_tasks_completed')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed Tasks */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-emerald-500 flex items-center gap-2 px-2">
                        <CheckCircle2 size={16} /> {t('completed_label')}
                      </h4>
                      <div className="space-y-3">
                        {tasks
                          .filter(t => t.status === 'completed')
                          .filter(t => 
                            t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) || 
                            t.description?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                            t.caseNumber?.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                            t.id.toString().includes(taskSearchQuery)
                          )
                          .map(task => (
                          <div key={task.id} className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm opacity-75">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded group/sn">
                                <span className="text-[9px] font-bold text-slate-400">{t('serial_no_label')}: {task.id}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(task.id.toString());
                                  }}
                                  className="text-slate-300 hover:text-slate-600 transition-colors"
                                  title={t('copy_sn_label')}
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                              {task.caseNumber && (
                                <span className="text-[10px] font-bold text-slate-300">#{task.caseNumber}</span>
                              )}
                            </div>
                            <h5 className="font-bold text-slate-500 line-through">{task.title}</h5>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-slate-400">{task.description}</p>
                              <div className="flex items-center gap-1 text-slate-300">
                                <Users size={10} />
                                <span className="text-[9px] font-bold">
                                  {task.assignedTo === 'self' ? t('self') : 
                                   task.assignedTo === 'clerk' ? t('clerk') :
                                   task.assignedTo === 'lawyer' ? t('lawyer') :
                                   task.assignedTo}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Tasks (if Lawyer or Clerk) */}
                    {(currentViewMode === 'lawyer' || currentViewMode === 'clerk') && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-indigo-500 flex items-center gap-2 px-2">
                          <Users size={16} /> {t(currentViewMode === 'lawyer' ? 'clerk_tasks' : 'lawyer_tasks')}
                        </h4>
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 text-center">
                          <p className="text-xs text-indigo-600 font-medium mb-4">{t(currentViewMode === 'lawyer' ? 'assign_task_clerk' : 'assign_task_lawyer')}</p>
                          <div className="flex gap-2 mb-3">
                            <input 
                              type="text" 
                              value={lookupId}
                              onChange={(e) => setLookupId(e.target.value)}
                              placeholder={t('serial_no_label')}
                              className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                            />
                            <button 
                              onClick={handleLookupAndAssign}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 whitespace-nowrap"
                            >
                              {t('assign_label')}
                            </button>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-indigo-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                              <span className="bg-indigo-50/50 px-2 text-indigo-300 font-bold">{t('or_label')}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setEditingTask(null);
                              setTaskTitle('');
                              setTaskDescription('');
                              setTaskDueDate('');
                              setTaskPriority('medium');
                              setTaskAssignedTo(currentViewMode === 'lawyer' ? 'clerk' : 'lawyer');
                              setTaskCaseNumber('');
                              setTaskCategory('other');
                              setTaskCourtName('');
                              setIsTaskFormOpen(true);
                            }}
                            className="w-full mt-3 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all"
                          >
                            {t('write_new')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'library' && (
                <Library language={language} />
              )}

              {activeTab === 'professional_services' && (
                <div className="space-y-6 max-w-4xl mx-auto pb-20">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <ProfessionalResources user={{ id: userId, userType: currentViewMode, name: userName }} />
                </div>
              )}

              {activeTab === 'lawyers' && (
                <div className="space-y-6 max-w-4xl mx-auto pb-20">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <LawyerDirectory />
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-6 max-w-4xl mx-auto pb-20">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <Media />
                </div>
              )}

              {activeTab === 'emergency' && (
                <div className="space-y-6 max-w-4xl mx-auto pb-20">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <div className="bg-red-600 p-8 rounded-3xl text-white text-center shadow-lg shadow-red-200">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <PhoneCall size={40} className="animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black mb-2">{t('emergency_service_999')}</h2>
                    <p className="text-red-100 font-medium mb-6">{t('emergency_desc')}</p>
                    <a 
                      href="tel:999"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-600 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-xl"
                    >
                      <PhoneCall size={24} />
                      {t('call_now_999')}
                    </a>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                      <MapPin className="text-indigo-600" />
                      {t('emergency_numbers_title')}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t('select_district_label')}</label>
                        <select 
                          value={selectedDist}
                          onChange={(e) => {
                            setSelectedDist(e.target.value);
                            setSelectedThana('');
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                          <option value="">{t('district_placeholder')}</option>
                          {Object.keys(emergencyData).map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t('select_thana_label')}</label>
                        <select 
                          value={selectedThana}
                          onChange={(e) => setSelectedThana(e.target.value)}
                          disabled={!selectedDist}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50"
                        >
                          <option value="">{t('thana_placeholder')}</option>
                          {selectedDist && Object.keys(emergencyData[selectedDist]).map(thana => (
                            <option key={thana} value={thana}>{thana}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="min-h-[300px]">
                      {selectedDist && selectedThana ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                          <a href={`tel:${emergencyData[selectedDist][selectedThana].oc}`} className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Building2 size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-900">{t('thana_oc_label')}</p>
                              <p className="text-lg font-black text-blue-700">{emergencyData[selectedDist][selectedThana].oc}</p>
                            </div>
                          </a>
                          
                          <a href={`tel:${emergencyData[selectedDist][selectedThana].fire}`} className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 hover:bg-orange-100 transition-colors group">
                            <div className="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Flame size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-orange-900">{t('fire_service_label')}</p>
                              <p className="text-lg font-black text-orange-700">{emergencyData[selectedDist][selectedThana].fire}</p>
                            </div>
                          </a>
                          
                          <a href={`tel:${emergencyData[selectedDist][selectedThana].hospital}`} className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                            <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Stethoscope size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-900">{t('hospital_label')}</p>
                              <p className="text-lg font-black text-emerald-700">{emergencyData[selectedDist][selectedThana].hospital}</p>
                            </div>
                          </a>
                          
                          <a href={`tel:${emergencyData[selectedDist][selectedThana].circuitHouse}`} className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100 transition-colors group">
                            <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Building2 size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-purple-900">{t('circuit_house_label')}</p>
                              <p className="text-lg font-black text-purple-700">{emergencyData[selectedDist][selectedThana].circuitHouse}</p>
                            </div>
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full pt-12 opacity-50">
                          <p className="text-slate-500 font-medium text-center">{t('select_to_see_numbers')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <AdBanner theme={theme} isPremium={subscriptionPackage === 'premium'} />
                  <div className={`p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden flex items-center justify-center">
                          {profilePic ? (
                            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-slate-300" size={64} />
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl border-4 border-white dark:border-slate-900 cursor-pointer hover:bg-indigo-500 transition-all shadow-lg hover:scale-110">
                          <Camera size={20} className="text-white" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                        </label>
                      </div>
                      <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{userName}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <span className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold uppercase tracking-wider">
                            {currentViewMode === 'lawyer' ? t('role_lawyer') : 
                             currentViewMode === 'clerk' ? t('role_clerk') : 
                             currentViewMode === 'admin' ? t('role_admin') : 
                             currentViewMode === 'super_admin' ? t('role_super_admin') :
                             currentViewMode === 'country_manager' ? t('role_country_manager') :
                             t('role_client')}
                          </span>
                          <span className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold">
                            {userDistrict}, {userCountry}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">ব্যক্তিগত তথ্য</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">নাম</span>
                            {isEditingProfile ? (
                              <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)}
                                className="p-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              />
                            ) : (
                              <span className="font-bold text-slate-900 dark:text-white">{userName}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">মোবাইল</span>
                            {isEditingProfile ? (
                              <input 
                                type="text" 
                                value={editMobile} 
                                onChange={(e) => setEditMobile(e.target.value)}
                                className="p-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              />
                            ) : (
                              <span className="font-bold text-slate-900 dark:text-white">{userMobile}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">জেলা</span>
                            {isEditingProfile ? (
                              <select 
                                value={editDistrict} 
                                onChange={(e) => setEditDistrict(e.target.value)}
                                className="p-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              >
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            ) : (
                              <span className="font-bold text-slate-900 dark:text-white">{userDistrict}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">দেশ</span>
                            <span className="font-bold text-slate-900 dark:text-white">{userCountry}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">অ্যাকাউন্ট তথ্য</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">ইউজার টাইপ</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">{currentViewMode}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">রেফারেল কোড</span>
                            <span className="font-bold text-slate-900 dark:text-white">{referralCode || 'নেই'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">সাবস্ক্রিপশন মেয়াদ</span>
                            <span className={`font-bold ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('bn-BD') : 'নেই'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">প্যাকেজ</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                              {subscriptionPackage === 'diamond' ? 'ডায়মন্ড' : 
                               subscriptionPackage === 'platinum' ? 'প্লাটিনাম' :
                               subscriptionPackage === 'gold' ? 'গোল্ড' :
                               subscriptionPackage === 'silver' ? 'সিলভার' : 'ফ্রি'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">অ্যাকাউন্ট আইডি</span>
                            <span className="font-bold text-slate-900 dark:text-white">#{userId}</span>
                          </div>
                        </div>
                      </div>

                      {(currentViewMode === 'lawyer' || currentViewMode === 'clerk') && (
                        <>
                          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">চেম্বার ও অফিস তথ্য</p>
                              <Building2 size={16} className="text-indigo-500" />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">চেম্বারের ঠিকানা</label>
                                {isEditingProfile ? (
                                  <input 
                                    type="text" 
                                    value={chamberAddress} 
                                    onChange={(e) => setChamberAddress(e.target.value)}
                                    className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                ) : (
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{chamberAddress}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <label className="text-xs text-slate-500 block mb-1">অফিস সময়</label>
                                  {isEditingProfile ? (
                                    <input 
                                      type="text" 
                                      value={officeHours} 
                                      onChange={(e) => setOfficeHours(e.target.value)}
                                      className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  ) : (
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{officeHours}</p>
                                  )}
                                </div>
                                <a href={mapLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-110 transition-transform">
                                  <MapPin size={20} />
                                </a>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-slate-500 block mb-1">বার অ্যাসোসিয়েশন</label>
                                  {isEditingProfile ? (
                                    <input 
                                      type="text" 
                                      value={barAssociation} 
                                      onChange={(e) => setBarAssociation(e.target.value)}
                                      className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  ) : (
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{barAssociation}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="text-xs text-slate-500 block mb-1">মেম্বারশিপ আইডি</label>
                                  {isEditingProfile ? (
                                    <input 
                                      type="text" 
                                      value={membershipId} 
                                      onChange={(e) => setMembershipId(e.target.value)}
                                      className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  ) : (
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{membershipId}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">পেশাদার নথিপত্র ও সোশ্যাল</p>
                              <Shield size={16} className="text-emerald-500" />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs text-slate-500 block mb-1">সার্টিফিকেট/সনদ</label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {certificates.length > 0 ? certificates.map((cert, idx) => (
                                    <div key={idx} className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                                      <FileText size={20} className="text-slate-500" />
                                    </div>
                                  )) : (
                                    <p className="text-xs text-slate-400 italic">কোনো নথি আপলোড করা হয়নি</p>
                                  )}
                                  <label className="w-12 h-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                                    <Plus size={16} className="text-slate-400" />
                                    <input type="file" className="hidden" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setCertificates([...certificates, reader.result as string]);
                                        reader.readAsDataURL(file);
                                      }
                                    }} />
                                  </label>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <a href={socialLinks.facebook || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:scale-110 transition-transform">
                                  <Facebook size={20} />
                                </a>
                                <a href={socialLinks.linkedin || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-110 transition-transform">
                                  <Linkedin size={20} />
                                </a>
                                {isEditingProfile && (
                                  <div className="flex flex-col gap-2 w-full mt-2">
                                    <input 
                                      type="text" 
                                      placeholder="Facebook Link" 
                                      value={socialLinks.facebook}
                                      onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                                    />
                                    <input 
                                      type="text" 
                                      placeholder="Linkedin Link" 
                                      value={socialLinks.linkedin}
                                      onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={`p-6 rounded-2xl border col-span-1 md:col-span-2 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-6">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">রেফারেল ও পয়েন্ট স্ট্যাটাস</p>
                              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                <DollarSign size={14} />
                                {referralHistory.length * 50} পয়েন্ট
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-2xl font-black text-indigo-600">{referralHistory.length}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">মোট রেফারেল</p>
                              </div>
                              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-2xl font-black text-emerald-600">{referralHistory.filter(r => r.case_count >= 10).length}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">সফল রেফারেল</p>
                              </div>
                              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-2xl font-black text-amber-600">{referralHistory.length * 50}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">অর্জিত পয়েন্ট</p>
                              </div>
                              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <p className="text-2xl font-black text-rose-600">০</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">ব্যয়িত পয়েন্ট</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {(currentViewMode === 'lawyer' || currentViewMode === 'clerk') && (
                      <div className="mt-8 flex justify-end">
                        <button 
                          onClick={() => {
                            if (isEditingProfile) {
                              onUpdateProfile?.({
                                fullName: editName,
                                mobile: editMobile,
                                district: editDistrict
                              });
                            }
                            setIsEditingProfile(!isEditingProfile);
                          }}
                          className={`px-6 py-2 rounded-xl font-bold transition-all ${isEditingProfile ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {isEditingProfile ? 'সেভ করুন' : 'প্রোফাইল এডিট করুন'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-8">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <div className={`p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Languages className="text-indigo-600" />
                      {t('language')}
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-slate-500">{t('select_language')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { id: 'bn', label: 'বাংলা (BD)' },
                          { id: 'en', label: 'English' }
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id as any)}
                            className={`px-6 py-4 rounded-2xl border-2 font-bold transition-all ${
                              language === lang.id 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                                : theme === 'dark' ? 'border-slate-800 bg-slate-800 text-slate-400 hover:border-slate-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="text-indigo-400" /> : <Sun className="text-amber-500" />}
                      {t('theme')}
                    </h3>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <span className="font-bold">{theme === 'dark' ? t('dark') : t('light')}</span>
                      <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-9' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className={`p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Share2 className="text-emerald-500" />
                      রেফার লিংক (Referral Link)
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-slate-500">আপনার বন্ধুদের সাথে অ্যাপটি শেয়ার করুন এবং রিওয়ার্ড পান।</p>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">
                          {currentViewMode === 'client' ? (
                            <><strong className="block mb-1">অফার:</strong> ‘মামলার অন্যান্য পক্ষ’র কাউকে রেফার করে তাকে সহযোগিতা করুন।’</>
                          ) : (
                            <><strong className="block mb-1">অফার:</strong> ‘মামলার অন্যান্য পক্ষ’র কাউকে রেফার করে তাকে সহযোগিতা করুন।’</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={referralCode ? `${window.location.origin}/?ref=${referralCode}` : 'অ্যাকাউন্ট তৈরি করুন'} 
                          className={`w-full p-4 rounded-xl border outline-none font-mono text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                        />
                        <button 
                          onClick={() => {
                            if (referralCode) {
                              navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode}`);
                              alert("লিংক কপি করা হয়েছে!");
                            } else {
                              alert("রেফার লিংক পেতে রেজিস্ট্রেশন করুন।");
                            }
                          }}
                          className="p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0"
                          title="Copy Link"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {currentViewMode !== 'client' && (
                    <div className={`p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Share2 className="text-emerald-500" />
                        রেফারেল হিস্ট্রি
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800">
                            <tr>
                              <th className="px-4 py-3">অ্যাকাউন্ট</th>
                              <th className="px-4 py-3">জয়েন করেছেন</th>
                              <th className="px-4 py-3">মামলা</th>
                              <th className="px-4 py-3">প্রোগ্রেস</th>
                              <th className="px-4 py-3">স্ট্যাটাস</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {referralHistory.map((ref: any) => {
                              const progress = Math.min((ref.case_count / 10) * 100, 100);
                              const isBonusEligible = ref.case_count >= 10;
                              return (
                                <tr key={ref.id}>
                                  <td className="px-4 py-3 font-medium">{ref.name} ({ref.mobile})</td>
                                  <td className="px-4 py-3">{new Date(ref.created_at).toLocaleDateString()}</td>
                                  <td className="px-4 py-3">{ref.case_count}</td>
                                  <td className="px-4 py-3">
                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {isBonusEligible ? (
                                      <span className="text-emerald-600 font-bold text-xs">যোগ্য</span>
                                    ) : (
                                      <span className="text-slate-400 text-xs">চলমান</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {referralHistory.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-4 text-center text-slate-500">কোনো রেফারেল পাওয়া যায়নি।</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recharge' && currentViewMode !== 'client' && (
                <div className="space-y-8 bg-[#e7e6e6] p-4 md:p-8 rounded-3xl">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <Recharge userId={userId} />
                </div>
              )}

              {activeTab === 'subscription' && currentViewMode !== 'client' && (
                <div className="space-y-8 bg-[#e7e6e6] p-4 md:p-8 rounded-3xl">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-black text-slate-900 mb-4">
                        {currentViewMode === 'lawyer' && subscriptionTarget === 'clerk' 
                          ? t('clerk_plan_title') 
                          : t('select_plan_title')}
                      </h2>
                      <p className="text-slate-600 font-medium">
                        {currentViewMode === 'lawyer' && subscriptionTarget === 'clerk'
                          ? t('clerk_plan_desc')
                          : t('select_plan_desc')}
                      </p>
                    </div>

                    {currentViewMode === 'lawyer' && (
                      <div className="flex justify-center mb-10">
                        <div className="bg-white p-1.5 rounded-2xl inline-flex shadow-sm border border-slate-200">
                          <button
                            onClick={() => setSubscriptionTarget('self')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              subscriptionTarget === 'self'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {t('for_self')}
                          </button>
                          <button
                            onClick={() => setSubscriptionTarget('clerk')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              subscriptionTarget === 'clerk'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {t('for_clerk')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-12">
                      {/* Premium Packages */}
                      <div>
                        <div className="flex items-center justify-center gap-3 mb-8">
                          <div className="h-px w-12 bg-indigo-200"></div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('premium_package_title')}</h3>
                          <div className="h-px w-12 bg-indigo-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Premium Plan - 1 Month */}
                          <div className="p-6 rounded-[30px] border-2 border-indigo-200 bg-white relative overflow-hidden hover:border-indigo-400 transition-all">
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('premium_1_month')}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-indigo-600">৳১০০</span>
                                <span className="text-slate-500 font-bold text-sm">{t('per_month')}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mb-8 text-sm">
                              {[
                                '২০ বছরের মামলার তথ্য',
                                'আনলিমিটেড ডকুমেন্ট স্টোরেজ',
                                'উন্নত AI লিগ্যাল অ্যাসিস্ট্যান্ট',
                                'মামলার অটোমেটেড ড্রাফটিং',
                                'অ্যাফিলিয়েট বোনাস ও রিওয়ার্ড',
                                'বিজ্ঞাপন মুক্ত অভিজ্ঞতা'
                              ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                                  <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => handleSubscriptionPayment({ name: 'Premium (1 Month)', price: 100, duration: '1 month' })}
                              className="w-full py-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                              {t('subscribe_now')}
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Premium Plan - 6 Months */}
                          <div className="p-6 rounded-[30px] border-4 border-indigo-600 bg-white shadow-xl shadow-indigo-100 relative overflow-hidden transform md:-translate-y-2">
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest">
                              জনপ্রিয়
                            </div>
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('premium_6_month')}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-indigo-600">৳৬০০</span>
                                <span className="text-slate-500 font-bold text-sm">{t('per_6_month')}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mb-8 text-sm">
                              {[
                                t('feature_20_years'),
                                t('feature_unlimited_docs'),
                                t('feature_ai_assistant'),
                                t('feature_automated_drafting'),
                                t('feature_affiliate_bonus'),
                                t('feature_ad_free')
                              ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                                  <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => handleSubscriptionPayment({ name: 'Premium (6 Months)', price: 600, duration: '6 months' })}
                              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                              {t('subscribe_now')}
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Premium Plan - 12 Months */}
                          <div className="p-6 rounded-[30px] border-2 border-indigo-200 bg-white relative overflow-hidden hover:border-indigo-400 transition-all">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest">
                              সাশ্রয়ী
                            </div>
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('premium_12_month')}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-indigo-600">৳১০০০</span>
                                <span className="text-slate-500 font-bold text-sm">{t('per_year')}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mb-8 text-sm">
                              {[
                                t('feature_20_years'),
                                t('feature_unlimited_docs'),
                                t('feature_ai_assistant'),
                                t('feature_automated_drafting'),
                                t('feature_affiliate_bonus'),
                                t('feature_ad_free')
                              ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                                  <CheckCircle2 size={16} className="text-indigo-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => handleSubscriptionPayment({ name: 'Premium (12 Months)', price: 1000, duration: '12 months' })}
                              className="w-full py-3 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                              {t('subscribe_now')}
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Classic Packages */}
                      <div>
                        <div className="flex items-center justify-center gap-3 mb-8">
                          <div className="h-px w-12 bg-amber-200"></div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('classic_package_title')}</h3>
                          <div className="h-px w-12 bg-amber-200"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Classic Plan - 1 Month */}
                          <div className="p-6 rounded-[30px] border-2 border-amber-200 bg-white relative overflow-hidden hover:border-amber-400 transition-all">
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('classic_1_month')}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-amber-600">৳৫০</span>
                                <span className="text-slate-500 font-bold text-sm">{t('per_month')}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mb-8 text-sm">
                              {[
                                t('feature_20_years'),
                                t('feature_unlimited_docs'),
                                t('feature_ai_assistant'),
                                t('feature_affiliate_bonus'),
                                t('feature_limited_ads')
                              ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                                  <CheckCircle2 size={16} className="text-amber-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => handleSubscriptionPayment({ name: 'Classic (1 Month)', price: 50, duration: '1 month' })}
                              className="w-full py-3 rounded-xl bg-amber-50 text-amber-600 font-bold text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                            >
                              {t('subscribe_now')}
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Classic Plan - 6 Months */}
                          <div className="p-6 rounded-[30px] border-2 border-amber-200 bg-white relative overflow-hidden hover:border-amber-400 transition-all">
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('classic_6_month')}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-amber-600">৳৩০০</span>
                                <span className="text-slate-500 font-bold text-sm">{t('per_6_month')}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mb-8 text-sm">
                              {[
                                '২০ বছরের মামলার তথ্য',
                                'আনলিমিটেড ডকুমেন্ট স্টোরেজ',
                                'উন্নত AI লিগ্যাল অ্যাসিস্ট্যান্ট',
                                'অ্যাফিলিয়েট বোনাস ও রিওয়ার্ড',
                                'সীমিত বিজ্ঞাপন'
                              ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                                  <CheckCircle2 size={16} className="text-amber-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => handleSubscriptionPayment({ name: 'Classic (6 Months)', price: 300, duration: '6 months' })}
                              className="w-full py-3 rounded-xl bg-amber-50 text-amber-600 font-bold text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                            >
                              সাবস্ক্রিপশন নিন
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Classic Plan - 12 Months */}
                          <div className="p-6 rounded-[30px] border-2 border-amber-200 bg-white relative overflow-hidden hover:border-amber-400 transition-all">
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('classic_12_month')}</h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-amber-600">৳৬০০</span>
                                <span className="text-slate-500 font-bold text-sm">{t('per_year')}</span>
                              </div>
                            </div>
                            <ul className="space-y-3 mb-8 text-sm">
                              {[
                                '২০ বছরের মামলার তথ্য',
                                'আনলিমিটেড ডকুমেন্ট স্টোরেজ',
                                'উন্নত AI লিগ্যাল অ্যাসিস্ট্যান্ট',
                                'অ্যাফিলিয়েট বোনাস ও রিওয়ার্ড',
                                'সীমিত বিজ্ঞাপন'
                              ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-700 font-bold">
                                  <CheckCircle2 size={16} className="text-amber-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              onClick={() => handleSubscriptionPayment({ name: 'Classic (12 Months)', price: 600, duration: '12 months' })}
                              className="w-full py-3 rounded-xl bg-amber-50 text-amber-600 font-bold text-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                            >
                              সাবস্ক্রিপশন নিন
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Free Plan */}
                      <div className="flex justify-center">
                        <div className={`p-6 rounded-[30px] border-2 transition-all max-w-sm w-full ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                          <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('free_plan_title')}</h3>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900 dark:text-white">৳০</span>
                              <span className="text-slate-500 font-bold text-sm">{t('per_month')}</span>
                            </div>
                          </div>
                          <ul className="space-y-3 mb-8 text-sm">
                            {[
                              t('feature_daily_diary'),
                              t('feature_general_calendar'),
                              t('feature_ai_assistant'),
                              t('feature_emergency_numbers')
                            ].map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                <CheckCircle2 size={16} className="text-slate-300 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <button className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm">
                            {t('currently_active')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-16 bg-white p-8 rounded-[40px] border border-slate-100 text-center">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">{t('why_premium_title')}</h3>
                      <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        {t('why_premium_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'cases' || activeTab === 'case_history_20y') && (
                <div className="space-y-8 bg-[#e7e6e6] p-4 md:p-8 rounded-3xl">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  
                  {activeTab === 'case_history_20y' ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 md:p-8 bg-white rounded-[40px] border border-slate-100 shadow-xl space-y-6"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                          <History size={32} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900">{t('case_history_20y')}</h2>
                          <p className="text-slate-500 font-medium">
                            {t('case_info_lifetime')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Memory Input Section */}
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <Plus size={20} className="text-indigo-600" />
                              {t('add_new_info')}
                            </h3>
                            <textarea 
                              value={newMemoryContent}
                              onChange={(e) => setNewMemoryContent(e.target.value)}
                              placeholder={t('memory_placeholder')}
                              className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                            />
                            <button 
                              onClick={handleSaveMemory}
                              disabled={isSavingMemory || !newMemoryContent.trim()}
                              className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isSavingMemory ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Send size={18} />
                              )}
                              {isSavingMemory ? t('saving') : t('save_memory')}
                            </button>
                          </div>

                          <div className="bg-white border border-slate-100 rounded-3xl p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <Clock size={20} className="text-indigo-600" />
                              {t('your_saved_info')}
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                              {!Array.isArray(memories) || memories.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                  <FileText size={40} opacity={0.3} />
                                  <p className="text-sm">{t('no_memories')}</p>
                                </div>
                              ) : (
                                memories.map((memory) => (
                                  <div key={memory.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                                        {new Date(memory.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed">{memory.content}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* AI Query Section */}
                        <div className="bg-slate-900 rounded-[32px] p-6 flex flex-col h-[600px] lg:h-full">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                              <Bot size={24} />
                            </div>
                            <div>
                              <h3 className="text-white font-bold">{t('ai_memory_assistant')}</h3>
                              <p className="text-slate-400 text-xs">
                                {t('ai_answer_history')}
                              </p>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                            {memoryChatMessages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 text-center px-4">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                                  <Search size={32} />
                                </div>
                                <p className="text-sm">
                                  {t('ai_memory_placeholder')}
                                </p>
                              </div>
                            ) : (
                              memoryChatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                                    msg.role === 'user' 
                                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                                      : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                  }`}>
                                    <div className="text-sm leading-relaxed prose prose-invert max-w-none">
                                      <Markdown>{msg.text}</Markdown>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                            {isQueryingMemoryAI && (
                              <div className="flex justify-start">
                                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none flex gap-2">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <input 
                              type="text"
                              value={memoryAiQuery}
                              onChange={(e) => setMemoryAiQuery(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAskMemoryAI()}
                              placeholder={t('ask_ai_memory')}
                              className="w-full bg-[#ffffd2] border border-slate-700 text-slate-900 p-4 pr-14 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                            <button 
                              onClick={handleAskMemoryAI}
                              disabled={isQueryingMemoryAI || !memoryAiQuery.trim()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#98ff83] text-slate-900 rounded-xl flex items-center justify-center hover:opacity-80 transition-all disabled:opacity-50"
                            >
                              {isQueryingMemoryAI ? (
                                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                              ) : (
                                <Send size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('cases')}</h2>
                          <p className="text-slate-500 font-medium">সকল মামলার তালিকা এবং বিস্তারিত তথ্য</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsCaseSearchOpen(!isCaseSearchOpen)}
                            className={`p-3 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold ${isCaseSearchOpen ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            <Search size={20} />
                            {language === 'bn' ? 'সার্চ করুন' : 'Search'}
                          </button>
                        </div>
                      </div>

                      {isCaseSearchOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm mb-8 space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase">মামলা নং</label>
                              <input 
                                type="text"
                                placeholder="মামলা নং লিখুন..."
                                value={caseSearchQuery}
                                onChange={(e) => setCaseSearchQuery(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase">থানা (ঐচ্ছিক)</label>
                              <input 
                                type="text"
                                placeholder="থানার নাম লিখুন..."
                                value={policeStationSearchQuery}
                                onChange={(e) => setPoliceStationSearchQuery(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase">মোবাইল নং</label>
                              <input 
                                type="text"
                                placeholder="মোবাইল নং লিখুন..."
                                value={mobileSearchQuery}
                                onChange={(e) => setMobileSearchQuery(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setCaseSearchQuery('');
                                setPoliceStationSearchQuery('');
                                setMobileSearchQuery('');
                              }}
                              className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              রিসেট
                            </button>
                            <button 
                              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                            >
                              সার্চ করুন
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                  <div className="space-y-6">
                    {(() => {
                      const searchedCases = visibleCases.filter(c => {
                        const hasCaseOrPS = caseSearchQuery || policeStationSearchQuery;
                        const hasMobile = mobileSearchQuery;
                        
                        if (!hasCaseOrPS && !hasMobile) return true;
                        
                        const matchesCaseAndPS = hasCaseOrPS && (
                          (!caseSearchQuery || c.caseNumber.toLowerCase().includes(caseSearchQuery.toLowerCase())) &&
                          (!policeStationSearchQuery || (c.policeStation && c.policeStation.toLowerCase().includes(policeStationSearchQuery.toLowerCase())))
                        );
                        
                        const matchesMobile = hasMobile && (
                          (c.petitionerMobile && c.petitionerMobile.includes(mobileSearchQuery)) || 
                          (c.respondentMobile && c.respondentMobile.includes(mobileSearchQuery)) ||
                          (c.petitionerLawyerMobile && (Array.isArray(c.petitionerLawyerMobile) ? c.petitionerLawyerMobile.some(m => m.includes(mobileSearchQuery)) : c.petitionerLawyerMobile.includes(mobileSearchQuery))) ||
                          (c.respondentLawyerMobile && (Array.isArray(c.respondentLawyerMobile) ? c.respondentLawyerMobile.some(m => m.includes(mobileSearchQuery)) : c.respondentLawyerMobile.includes(mobileSearchQuery)))
                        );

                        if (hasCaseOrPS && hasMobile) {
                          return matchesCaseAndPS || matchesMobile;
                        }
                        return matchesCaseAndPS || matchesMobile;
                      });

                      if (searchedCases.length === 0) {
                        return (
                          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">কোনো মামলা পাওয়া যায়নি</h3>
                          </div>
                        );
                      }

                      const groupedCases = searchedCases.reduce((acc, c) => {
                          const court = c.courtName || 'অন্যান্য আদালত';
                          if (!acc[court]) acc[court] = [];
                          acc[court].push(c);
                          return acc;
                        }, {} as Record<string, Case[]>);

                        const stepOrder: Record<string, number> = {
                          "রায়": 1,
                          "যুক্তি তর্ক": 2,
                          "স্বাক্ষী": 3,
                          "জেরা": 4,
                          "চার্জ গঠন": 5,
                          "হাজিরা": 6,
                          "সময়": 7,
                          "সমন": 8,
                          "ওয়ারেন্ট": 9
                        };

                        const getStepPriority = (order?: string) => {
                          if (!order) return 99;
                          for (const key in stepOrder) {
                            if (order.includes(key)) return stepOrder[key];
                          }
                          return 99;
                        };

                        return Object.entries(groupedCases)
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([court, cases]) => {
                            const sortedCases = [...cases].sort((a, b) => getStepPriority(a.order) - getStepPriority(b.order));
                          return (
                            <div key={court} className="court-container">
                              <div className="court-header">{court}</div>
                              <div className="overflow-x-auto">
                                <table className="court-table">
                                  <thead>
                                    <tr className="text-red">
                                      <th>ক্রমিক</th>
                                      <th>মামলা</th>
                                      <th>পদক্ষেপ</th>
                                      <th>মুহুরি</th>
                                      <th>কল</th>
                                      <th>পক্ষ</th>
                                      <th>হিস্ট্রি</th>
                                      <th>রেজাল্ট</th>
                                      <th>অ্যাকশন</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sortedCases.map((c, i) => (
                                      <tr key={c.id}>
                                        <td>{i + 1}</td>
                                        <td>{c.caseNumber}</td>
                                        <td>
                                          {c.order ? (
                                            <span className="step-box">{c.order}</span>
                                          ) : (
                                            <span className="text-slate-400">-</span>
                                          )}
                                        </td>
                                        <td>
                                          {(() => {
                                            const isPet = isUserPetitioner(c);
                                            const isRes = isUserRespondent(c);
                                            if (isPet) return c.petitionerClerk || '-';
                                            if (isRes) return c.respondentClerk || '-';
                                            return c.petitionerClerk || c.respondentClerk || '-';
                                          })()}
                                        </td>
                                        <td>
                                          {(() => {
                                            const isPet = isUserPetitioner(c);
                                            const isRes = isUserRespondent(c);
                                            const clerkMobile = isPet ? c.petitionerClerkMobile : (isRes ? c.respondentClerkMobile : (c.petitionerClerkMobile || c.respondentClerkMobile));
                                            
                                            const getCallMobile = (m: string[] | string | undefined) => {
                                              if (!m) return undefined;
                                              if (Array.isArray(m)) return m[0];
                                              return m;
                                            };
                                            
                                            const callNum = getCallMobile(clerkMobile);
                                            
                                            return callNum ? (
                                              <a href={`tel:${callNum}`} className="call-btn" title={callNum}>
                                                <PhoneCall size={16} />
                                              </a>
                                            ) : '-';
                                          })()}
                                        </td>
                                        <td>
                                          <span className={isUserPetitioner(c) ? 'text-emerald-600' : 'text-rose-600'}>
                                            {isUserPetitioner(c) ? 'বাদী' : 'আসামী'}
                                          </span>
                                        </td>
                                        <td>
                                          <button 
                                            onClick={() => setSelectedCaseForHistory(c)}
                                            className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1 mx-auto"
                                          >
                                            <Clock size={14} />
                                            <span className="text-[10px] font-bold">হিস্ট্রি</span>
                                          </button>
                                        </td>
                                        <td>
                                          <label className="switch">
                                            <input 
                                              type="checkbox" 
                                              checked={!!doneCases[c.id]}
                                              onChange={() => setDoneCases(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                            />
                                            <span className="slider"></span>
                                          </label>
                                        </td>
                                        <td>
                                          <div className="flex items-center justify-center gap-2">
                                            <button 
                                              onClick={() => setSelectedCaseForCard(c)}
                                              className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                                              title="কেস কার্ড"
                                            >
                                              <CreditCard size={14} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteCase(c.id)}
                                              className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-1"
                                              title="ডিলিট করুন"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        });
                      })()
                    }
                  </div>
                </div>
              )}

              {activeTab === 'medigen' && (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  </div>
                  <div className="flex-1">
                    <MediGen />
                  </div>
                </div>
              )}

              {activeTab === 'affiliate_zone' && (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  </div>
                  <div className="flex-1">
                    <AffiliateZone userType={currentViewMode} userId={userId} />
                  </div>
                </div>
              )}

              {activeTab === 'admin_panel' && (userType === 'admin' || userType === 'super_admin' || userType === 'country_manager') && (
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <AdminPanel userType={userType} userId={userId} />
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                isSubscribed ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <DocumentManager userId={userId} onAddDocument={handleAddDocument} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-slate-600 font-bold">ডকুমেন্টস মেনু ব্যবহার করতে সাবস্ক্রিপশন কিনুন।</p>
                    <button 
                      onClick={() => setShowSubscriptionPrompt(true)}
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      সাবস্ক্রিপশন কিনুন
                    </button>
                  </div>
                )
              )}

              {activeTab !== 'dashboard' && activeTab !== 'calendar' && activeTab !== 'cases' && activeTab !== 'news' && activeTab !== 'library' && activeTab !== 'emergency' && activeTab !== 'settings' && activeTab !== 'recharge' && activeTab !== 'affiliate_zone' && activeTab !== 'medigen' && activeTab !== 'professional_services' && activeTab !== 'media' && activeTab !== 'admin_panel' && activeTab !== 'documents' && activeTab !== 'profile' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AdBanner isPremium={subscriptionPackage === 'premium'} />
                  <div className="bg-indigo-100 p-6 rounded-full mb-6 mt-8">
                    <Bot size={48} className="text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{menuItems.find(i => i.id === activeTab)?.label}</h3>
                  <p className="text-slate-500 max-w-md mb-8">এই ফিচারটি বর্তমানে ডেভেলপমেন্ট মোডে আছে। খুব শীঘ্রই এটি আপনার জন্য উন্মুক্ত করা হবে।</p>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <ChevronRight className="rotate-180" size={20} />
                    ড্যাশবোর্ডে ফিরে যান
                  </button>
                </div>
              )}
            </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav (Optional, but good for UX) */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex items-center justify-around z-40 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={() => handleTabChange('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase">{t('dashboard')}</span>
        </button>
        <button onClick={() => handleTabChange('calendar')} className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <Calendar size={24} />
          <span className="text-[10px] font-bold uppercase">{t('calendar')}</span>
        </button>
        {currentViewMode !== 'client' && (
          <div className="relative -top-8">
            <button 
              onClick={() => setIsCaseFormOpen(true)}
              className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 border-4 border-white"
            >
              <Plus size={28} />
            </button>
          </div>
        )}
        <button onClick={() => handleTabChange('cases')} className={`flex flex-col items-center gap-1 ${activeTab === 'cases' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <FileText size={24} />
          <span className="text-[10px] font-bold uppercase">{t('cases')}</span>
        </button>
        <button onClick={toggleSidebar} className="flex flex-col items-center gap-1 text-slate-400">
          <Menu size={24} />
          <span className="text-[10px] font-bold uppercase">{t('menu')}</span>
        </button>
      </nav>

      {/* Subscription Payment Modal */}
      <AnimatePresence>
        {showSubscriptionPayment && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900">সাবস্ক্রিপশন পেমেন্ট</h3>
                  <button 
                    onClick={() => setShowSubscriptionPayment(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                {subscriptionSuccess ? (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock size={40} className="text-amber-600" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">রিকোয়েস্ট জমা হয়েছে!</h4>
                    <p className="text-slate-500">আপনার সাবস্ক্রিপশন রিকোয়েস্টটি অ্যাডমিন প্যানেলে পাঠানো হয়েছে। ভেরিফিকেশন শেষে দ্রুত এটি চালু করে দেওয়া হবে।</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-indigo-600 font-bold text-sm">নির্বাচিত প্ল্যান</span>
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase">
                          {selectedPlan.duration}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{selectedPlan.name}</h4>
                      <p className="text-3xl font-black text-indigo-600 mt-2">৳{selectedPlan.price}</p>
                    </div>

                    <button
                      onClick={() => initiateOnlinePayment(selectedPlan.price, 'Subscription')}
                      disabled={isOnlinePaymentLoading}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
                    >
                      {isOnlinePaymentLoading ? (
                        <span className="animate-pulse">প্রসেসিং হচ্ছে...</span>
                      ) : (
                        <>
                          <CreditCard size={22} />
                          অনলাইনে পেমেন্ট করুন (SSLCommerz)
                        </>
                      )}
                    </button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-4 text-slate-400 font-bold">অথবা ম্যানুয়ালি</span>
                      </div>
                    </div>

                    <PaymentGateway 
                      amount={selectedPlan.price}
                      onSuccess={(method, txId) => submitSubscriptionRequest(method, txId)}
                      isSubmitting={isSubmittingSubscription}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Legal AI Bot Button */}
      {currentViewMode !== 'client' && (
        <motion.button
          drag
          dragMomentum={false}
          dragConstraints={{
            top: -window.innerHeight / 2 + 80,
            bottom: window.innerHeight / 2 - 100,
            left: aiButtonSide === 'left' ? 0 : -window.innerWidth + 48,
            right: aiButtonSide === 'right' ? 0 : window.innerWidth - 48,
          }}
          onDragEnd={(e, info) => {
            const screenWidth = window.innerWidth;
            if (info.point.x < screenWidth / 2) {
              setAiButtonSide('left');
            } else {
              setAiButtonSide('right');
            }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsLegalAIOpen(!isLegalAIOpen)}
          type="button"
          className={`fixed top-1/2 -translate-y-1/2 ${aiButtonSide === 'right' ? 'right-0 rounded-l-2xl border-r-0' : 'left-0 rounded-r-2xl border-l-0'} w-12 h-16 bg-[#ff0c0c] text-white flex items-center justify-center shadow-xl hover:opacity-90 transition-all z-[35] border-2 border-white`}
          title={t('legal_ai')}
        >
          <Bot size={24} />
        </motion.button>
      )}

      {/* Legal AI Modal */}
      <AnimatePresence>
        {isLegalAIOpen && (
          <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between cursor-move">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsLegalAIOpen(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  title={t('minimize')}
                >
                  <Bot size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{t('legal_ai_assistant')}</h3>
                    {userType !== 'super_admin' && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium border border-white/30">
                        {t('points_label')}: {points || 0}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-indigo-100">{t('ai_subtitle')}</p>
                </div>
              </div>
              <button onClick={() => setIsLegalAIOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
              {aiMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <Bot size={48} className="text-indigo-300" />
                  <p className="text-sm text-slate-500 font-medium max-w-[250px]">
                    {t('ai_desc')}
                  </p>
                </div>
              ) : (
                aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="markdown-body prose prose-sm max-w-none prose-indigo">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <form onSubmit={handleAiSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="প্রশ্ন লিখুন..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={isAiLoading || !aiQuery.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case Form Modal */}
      <AnimatePresence>
        {isCaseFormOpen && (
          <CaseForm 
            onSave={handleSaveCase} 
            onCancel={() => {
              setIsCaseFormOpen(false);
              setEditingCase(null);
            }} 
            initialData={editingCase}
            language={language}
            userDistrict={userDistrict}
            userCountry={userCountry}
            canEditPetitioner={!editingCase || isUserPetitioner(editingCase) || (!isUserPetitioner(editingCase) && !isUserRespondent(editingCase))}
            canEditRespondent={!editingCase || isUserRespondent(editingCase) || (!isUserPetitioner(editingCase) && !isUserRespondent(editingCase))}
            userType={currentViewMode}
            userName={userName}
            userMobile={userMobile}
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{selectedPkg?.name} - {selectedPkg?.price}</h3>
                <button onClick={() => setIsPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <PaymentGateway 
                country={userCountry || 'Bangladesh'} 
                amount={parseInt(selectedPkg?.price.replace(/[^0-9]/g, '') || '0')}
                onSuccess={(method, txId) => {
                  setSelectedPlan({
                    name: selectedPkg?.name || '',
                    price: parseInt(selectedPkg?.price.replace(/[^0-9]/g, '') || '0'),
                    duration: '1 year' // Default for this section
                  });
                  submitSubscriptionRequest(method, txId);
                }} 
                isSubmitting={isSubmittingSubscription}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Case Modal */}
      <AnimatePresence>
        {isJoinFormOpen && (
          <JoinCaseForm 
            onJoin={handleJoinCase} 
            onCancel={() => setIsJoinFormOpen(false)} 
            language={language}
            existingCases={cases}
            userDistrict={userDistrict}
            userCountry={userCountry}
            userType={currentViewMode}
            userName={userName}
            userMobile={userMobile}
          />
        )}
      </AnimatePresence>

      <CaseHistoryModal 
        isOpen={!!selectedCaseForHistory}
        onClose={() => setSelectedCaseForHistory(null)}
        caseData={selectedCaseForHistory}
        language={language}
      />

      <AnimatePresence>
        {selectedCaseForCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setSelectedCaseForCard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="text-indigo-600" size={20} />
                  কেস কার্ড প্রো
                </h3>
                <button 
                  onClick={() => setSelectedCaseForCard(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <CaseCardPro 
                  caseData={selectedCaseForCard}
                  isPetitioner={isUserPetitioner(selectedCaseForCard)}
                  isRespondent={isUserRespondent(selectedCaseForCard)}
                  onUpdate={(id, nextDate, order, selectedParty) => {
                    handleUpdateCaseOrder(id, nextDate, order);
                    handleUpdateSelectedParty(id, selectedParty);
                  }}
                  onAddDocument={handleAddDocument}
                  onCaseNumberClick={(caseNum) => {
                    setSelectedCaseForCard(null);
                    setCaseSearchQuery(caseNum);
                    setActiveTab('cases');
                    setSelectedDate(null);
                  }}
                  onDelete={handleDeleteCase}
                  userType={currentViewMode}
                  userMobile={userMobile || ''}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Overlay */}
      <AnimatePresence>
        {showAd && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative"
            >
              <div className="p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                  <Video size={48} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {t('watch_ad')}
                  </h3>
                  <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
                    {t('watch_ad_desc')}
                  </p>
                </div>
                
                <div className="py-8">
                  <AdBanner containerClassName="bg-slate-50 border-slate-100 p-8" innerClassName="h-48 bg-slate-200" isPremium={subscriptionPackage === 'premium'} />
                </div>

                <button
                  onClick={() => {
                    setShowAd(false);
                    if (adAction) adAction();
                  }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                >
                  {t('close_ad')}
                  <X size={24} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Prompt Modal */}
      <AnimatePresence>
        {showSubscriptionPrompt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                  <Lock size={40} className="text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">{t('subscription_required_title')}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {t('subscription_required_desc')}
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setShowSubscriptionPrompt(false);
                      setActiveTab('recharge');
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    {t('subscribe_label')}
                  </button>
                  <button 
                    onClick={() => setShowSubscriptionPrompt(false)}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    {t('later_label')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Task Form Modal */}
      <AnimatePresence>
        {isTaskFormOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-900 text-white">
                <h3 className="text-xl font-bold">{editingTask ? t('task_edit_title') : t('task_new_title')}</h3>
                <button onClick={() => setIsTaskFormOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('task_title_label')}</label>
                  <input 
                    type="text" 
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={t('task_title_placeholder')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('category_label')}</label>
                  <select 
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="other">{t('other_label')}</option>
                    <option value="attendance">{t('attendance_label')}</option>
                    <option value="filing">{t('filing_label')}</option>
                    <option value="copy">{t('copy_label')}</option>
                    <option value="fee">{t('fee_label')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('case_no_optional')}</label>
                    <input 
                      type="text" 
                      value={taskCaseNumber}
                      onChange={(e) => setTaskCaseNumber(e.target.value)}
                      placeholder="যেমন: ১২৩/২৪"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('court_optional')}</label>
                    <input 
                      type="text" 
                      value={taskCourtName}
                      onChange={(e) => setTaskCourtName(e.target.value)}
                      placeholder="যেমন: জজ কোর্ট"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t('details_optional')}</label>
                  <textarea 
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder={t('details_placeholder')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium h-24 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('status_label')}</label>
                    <select 
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="pending">{t('pending')}</option>
                      <option value="in-progress">{t('in_progress')}</option>
                      <option value="completed">{t('completed')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('due_date_label')}</label>
                    <input 
                      type="date" 
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('priority_label')}</label>
                    <select 
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="low">{t('low')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="high">{t('high')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t('assign_to_label')}</label>
                    <input
                      type="text"
                      value={taskAssignedTo}
                      onChange={(e) => setTaskAssignedTo(e.target.value)}
                      placeholder={t('assign_to_placeholder')}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (!taskTitle) {
                      alert(t('task_title_required'));
                      return;
                    }
                    
                    const taskData: Omit<Task, 'id' | 'created_at'> = {
                      title: taskTitle,
                      description: taskDescription,
                      dueDate: taskDueDate,
                      status: taskStatus,
                      priority: taskPriority,
                      category: taskCategory,
                      caseNumber: taskCaseNumber,
                      assignedTo: taskAssignedTo,
                      assignedBy: userName,
                    };

                    if (editingTask) {
                      // For now local update, or we could add updateTask service
                      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
                    } else {
                      try {
                        await createTask(taskData);
                      } catch (err) {
                        console.error("Error creating task:", err);
                        const newTask: Task = {
                          id: Date.now(),
                          ...taskData,
                          created_at: new Date().toISOString()
                        };
                        setTasks(prev => [newTask, ...prev]);
                      }
                    }
                    setIsTaskFormOpen(false);
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  সেভ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndoToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <div className="flex-1">
              <p className="font-bold text-sm">মামলাটি ডিলিট করা হয়েছে</p>
              <p className="text-xs text-slate-400">আপনি কি এটি ফেরত আনতে চান?</p>
            </div>
            <button
              onClick={handleUndoDelete}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} />
              আন্ডু (Undo)
            </button>
            <button
              onClick={() => setShowUndoToast(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
