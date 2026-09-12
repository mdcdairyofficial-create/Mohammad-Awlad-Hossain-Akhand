import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  Check, 
  X, 
  Briefcase, 
  FileText, 
  AlertCircle, 
  CornerDownRight, 
  ChevronDown, 
  HelpCircle,
  Clock,
  Trash2,
  Plus,
  UserPlus,
  Smartphone,
  Mail,
  User
} from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ChamberAssociate, Case } from '../../../types';

interface ClerkAssistantsAssignmentViewProps {
  assistants: ChamberAssociate[];
  cases: Case[];
  onAssignCase: (caseId: string | number, assistant: ChamberAssociate | null) => Promise<void> | void;
  onAddAssistant: (assistant: Omit<ChamberAssociate, 'id' | 'createdAt'>) => Promise<void> | void;
  onDeleteAssistant: (id: string) => Promise<void> | void;
  language?: 'bn' | 'en' | 'hi' | 'ur';
  t?: (key: string) => string;
}

export const ClerkAssistantsAssignmentView: React.FC<ClerkAssistantsAssignmentViewProps> = ({
  assistants = [],
  cases = [],
  onAssignCase,
  onAddAssistant,
  onDeleteAssistant,
  language = 'bn',
  t
}) => {
  const isBn = language === 'bn';

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string | number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New assistant modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formRole, setFormRole] = useState('Senior Assistant Clerk');
  const [formEmail, setFormEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile photo lookup states
  const [fetchedPhoto, setFetchedPhoto] = useState<string | null>(null);
  const [isSearchingPhoto, setIsSearchingPhoto] = useState(false);
  const [assistantPhotos, setAssistantPhotos] = useState<Record<string, string>>({});

  const normalizeMobile = (m?: string | null) => {
    if (!m) return '';
    let clean = m.trim();
    if (clean.startsWith('+88')) clean = clean.substring(3);
    if (clean.startsWith('88')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };

  const fetchProfilePicByMobile = async (mobile: string): Promise<string | null> => {
    if (!mobile || mobile.length < 5) return null;
    const normalizedInput = normalizeMobile(mobile);
    if (!normalizedInput) return null;

    try {
      const formats = [
        normalizedInput,
        '0' + normalizedInput,
        '+880' + normalizedInput,
        '880' + normalizedInput
      ];
      
      for (const format of formats) {
        const q = query(collection(db, 'users'), where('mobile', '==', format), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.profilePicture) {
            return userData.profilePicture;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
    return null;
  };

  // Trigger live photo lookup when mobile field changes
  useEffect(() => {
    const cleanMobile = formMobile.trim();
    if (cleanMobile.length >= 11) {
      setIsSearchingPhoto(true);
      const timer = setTimeout(async () => {
        const pic = await fetchProfilePicByMobile(cleanMobile);
        setFetchedPhoto(pic);
        setIsSearchingPhoto(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setFetchedPhoto(null);
    }
  }, [formMobile]);

  // Load photos for existing assistants
  useEffect(() => {
    let active = true;
    const loadPhotos = async () => {
      const photosMap: Record<string, string> = {};
      for (const asst of assistants) {
        if (asst.photoURL) {
          photosMap[asst.id] = asst.photoURL;
        } else if (asst.mobile) {
          const pic = await fetchProfilePicByMobile(asst.mobile);
          if (pic && active) {
            photosMap[asst.id] = pic;
          }
        }
      }
      if (active) {
        setAssistantPhotos(prev => ({ ...prev, ...photosMap }));
      }
    };
    loadPhotos();
    return () => { active = false; };
  }, [assistants]);

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const resetForm = () => {
    setFormName('');
    setFormMobile('');
    setFormRole('Senior Assistant Clerk');
    setFormEmail('');
    setFetchedPhoto(null);
  };

  // Calculations
  const totalCases = cases.length;
  const assignedCases = cases.filter(c => c.assignedClerkAssistantName).length;
  const unassignedCases = totalCases - assignedCases;
  const totalAssistants = assistants.length;

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.petitioner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.respondent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseType?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'assigned') return !!c.assignedClerkAssistantName;
    if (filterType === 'unassigned') return !c.assignedClerkAssistantName;
    return true;
  });

  const handleQuickAssign = async (caseId: string | number, asst: ChamberAssociate | null) => {
    try {
      await onAssignCase(caseId, asst);
      
      const caseItem = cases.find(c => c.id === caseId);
      const caseName = caseItem ? caseItem.caseNumber : '';
      
      if (asst) {
        setSuccessToast(
          isBn 
            ? `মামলা নং ${caseName} সফলভাবে সহকারী মুহুরী ${asst.name}-কে অর্পণ করা হয়েছে!` 
            : `Case No. ${caseName} successfully assigned to assistant clerk ${asst.name}!`
        );
      } else {
        setSuccessToast(
          isBn 
            ? `মামলা নং ${caseName} থেকে সহকারী মুহুরী মুক্ত করা হয়েছে (প্রধান মুহুরীর দায়িত্বে)।` 
            : `Case No. ${caseName} assistant clerk unassigned (Assigned to Head Clerk).`
        );
      }
      setSelectedCaseId(null);
    } catch (error) {
      console.error('Error assigning assistant clerk:', error);
    }
  };

  const handleAssignAll = async (caseId: string | number) => {
    try {
      const mobilesList = assistants.map(a => a.mobile).filter(Boolean).join(', ');
      const allAsstStub: ChamberAssociate = {
        id: 'all_assistants',
        name: isBn ? 'সহকারী মুহুরী টিম (All Assistants)' : 'Assistant Clerks (All Members)',
        mobile: mobilesList,
        role: 'Assistant Clerk Team',
        status: 'active'
      };
      
      await onAssignCase(caseId, allAsstStub);
      
      const caseItem = cases.find(c => c.id === caseId);
      const caseName = caseItem ? caseItem.caseNumber : '';
      
      setSuccessToast(
        isBn 
          ? `মামলা নং ${caseName} সকল সহকারী মুহুরীকে অর্পণ করা হয়েছে!` 
          : `Case No. ${caseName} successfully assigned to all assistant clerks!`
      );
      setSelectedCaseId(null);
    } catch (error) {
      console.error('Error assigning all assistant clerks:', error);
    }
  };

  const handleAddAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddAssistant({
        name: formName.trim(),
        mobile: formMobile.trim(),
        role: formRole,
        status: 'active',
        addedAt: new Date().toISOString(),
        photoURL: fetchedPhoto || undefined,
      });

      setSuccessToast(
        isBn 
          ? `নতুন সহকারী মুহুরী "${formName}" সফলভাবে যুক্ত করা হয়েছে!` 
          : `New assistant clerk "${formName}" added successfully!`
      );
      
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssistantClick = async (asst: ChamberAssociate) => {
    const message = isBn 
      ? `আপনি কি নিশ্চিতভাবে "${asst.name}"-কে সহকারী মুহুরী তালিকা থেকে বাদ দিতে চান? এর ফলে এই মুহুরীর দায়িত্বপ্রাপ্ত মামলাগুলো প্রধান মুহুরীর দায়িত্বে চলে যাবে।`
      : `Are you sure you want to remove assistant clerk "${asst.name}"? All assigned cases under this assistant will fall back to Head Clerk.`;
    
    if (window.confirm(message)) {
      try {
        await onDeleteAssistant(asst.id);
        setSuccessToast(
          isBn 
            ? `সহকারী মুহুরী "${asst.name}"-কে সফলভাবে বাদ দেওয়া হয়েছে।` 
            : `Assistant clerk "${asst.name}" removed.`
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getAssignedCaseCount = (assistantName: string, assistantMobile?: string) => {
    return cases.filter(c => {
      const matchName = c.assignedClerkAssistantName && c.assignedClerkAssistantName.toLowerCase() === assistantName.toLowerCase();
      const matchMobile = assistantMobile && c.assignedClerkAssistantMobile && c.assignedClerkAssistantMobile.replace(/\D/g, '') === assistantMobile.replace(/\D/g, '');
      return matchName || matchMobile;
    }).length;
  };

  return (
    <div id="clerk_assistants_assignment_view" className="space-y-6">
      {/* Dynamic Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
          <p className="text-xs font-bold font-sans tracking-wide">{successToast}</p>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white ml-2 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modern Indigo Glass Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <UserCheck size={12} className="text-indigo-300" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-200">
                {isBn ? 'সহকারী মুহুরী কন্ট্রোল সেন্টার' : 'Assistant Clerk Control Panel'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {isBn ? 'সহকারী মুহুরী বণ্টন ও দায়িত্ব অর্পণ' : 'Assistant Clerk Assignment'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              {isBn 
                ? 'আপনার সহকারী মুহুরী বা জুনিয়র ক্লার্কদের মধ্যে কাজ বণ্টন ও তদারকি করুন। যেকোনো সময় নতুন সহকারী মুহুরী যুক্ত অথবা বাদ দিতে পারবেন।' 
                : 'Manage and distribute cases or field works among your assistant clerks. You can add or remove assistants anytime.'}
            </p>
          </div>

          {/* Header Action Button */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 shrink-0 self-start md:self-center"
          >
            <UserPlus size={15} />
            <span>{isBn ? 'নতুন সহকারী মুহুরী যুক্ত করুন' : 'Add Assistant Clerk'}</span>
          </button>
        </div>

        {/* Header Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-indigo-800/40">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
              {isBn ? 'মোট মামলা' : 'Total Cases'}
            </span>
            <span className="text-2xl font-black text-white">{totalCases}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1">
              {isBn ? 'সহকারীকে অর্পিত' : 'Assigned to Assistant'}
            </span>
            <span className="text-2xl font-black text-emerald-400">{assignedCases}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
              {isBn ? 'নিজের দায়িত্বে' : 'Under Head Clerk'}
            </span>
            <span className="text-2xl font-black text-amber-400">{unassignedCases}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
              {isBn ? 'সহকারী সংখ্যা' : 'Assistants Count'}
            </span>
            <span className="text-2xl font-black text-blue-400">{totalAssistants}</span>
          </div>
        </div>
      </div>

      {/* Assistant Team List Grid */}
      {assistants.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users size={15} className="text-indigo-600" />
              <span>{isBn ? 'সহকারী মুহুরী তালিকা ও কর্মবণ্টন' : 'Assistant Clerks List'}</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">
              {isBn ? `মোট সহকারী: ${totalAssistants} জন` : `${totalAssistants} Assistants`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assistants.map((asst) => {
              const caseCount = getAssignedCaseCount(asst.name, asst.mobile);
              return (
                <div 
                  key={asst.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-150 flex items-center justify-between gap-3 shadow-3xs group hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-indigo-700 font-black text-sm flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-3xs">
                      {assistantPhotos[asst.id] || asst.photoURL ? (
                        <img src={assistantPhotos[asst.id] || asst.photoURL} alt={asst.name} className="w-full h-full object-cover" />
                      ) : (
                        asst.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate leading-tight" title={asst.name}>
                        {asst.name}
                      </p>
                      <p className="text-[9px] text-indigo-600 font-bold mt-0.5 leading-none">
                        {asst.role || (isBn ? 'সহকারী মুহুরী' : 'Assistant Clerk')}
                      </p>
                      <p className="text-[8px] text-slate-400 font-semibold mt-1">
                        💼 {caseCount} {isBn ? 'টি মামলা অর্পিত' : 'cases assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Delete Action */}
                  <button
                    onClick={() => handleDeleteAssistantClick(asst)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                    title={isBn ? 'সহকারী তালিকা থেকে বাদ দিন' : 'Remove Assistant'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Assistants Safeguard */}
      {totalAssistants === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start gap-4 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-950 text-sm">
              {isBn ? 'কোনো সহকারী মুহুরী খুঁজে পাওয়া যায়নি' : 'No Assistant Clerks Found'}
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              {isBn 
                ? 'কাজ বণ্টন করার জন্য প্রথমে আপনাকে আপনার সহকারী মুহুরী বা জুনিয়র অ্যাসিস্ট্যান্ট যুক্ত করতে হবে। উপরের "নতুন সহকারী মুহুরী যুক্ত করুন" বাটনে ক্লিক করে এখনই সদস্য যুক্ত করুন!' 
                : 'To assign work, you first need to add an assistant clerk. Click the "Add Assistant Clerk" button above to add members now!'}
            </p>
          </div>
        </div>
      )}

      {/* Main Board Workspace */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Quick Filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              {isBn ? 'সকল মামলা' : 'All Cases'}
            </button>
            <button
              onClick={() => setFilterType('assigned')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterType === 'assigned' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              {isBn ? 'সহকারীকে অর্পিত' : 'Assigned'}
            </button>
            <button
              onClick={() => setFilterType('unassigned')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterType === 'unassigned' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              {isBn ? 'নিজের দায়িত্বে' : 'My Responsibility'}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'মামলা নম্বর বা বাদী-বিবাদী খুঁজুন...' : 'Search case number or parties...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Empty Cases List Screen */}
        {filteredCases.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">
                {isBn ? 'কোনো মামলা খুঁজে পাওয়া যায়নি' : 'No Cases Found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isBn 
                  ? 'আপনার এই ক্যাটাগরির কোনো মামলা বর্তমানে অন্তর্ভুক্ত নেই।' 
                  : 'There are no cases matching the filter criteria.'}
              </p>
            </div>
          </div>
        ) : (
          /* Desktop Case Assignment Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20">
                  <th className="p-4 text-xs font-black text-slate-700 tracking-wider w-1/4">
                    {isBn ? 'মামলা নম্বর ও টাইপ' : 'Case Info'}
                  </th>
                  <th className="p-4 text-xs font-black text-slate-700 tracking-wider w-1/4">
                    {isBn ? 'বাদী বনাম বিবাদী' : 'Parties'}
                  </th>
                  <th className="p-4 text-xs font-black text-slate-700 tracking-wider">
                    {isBn ? 'ফোরাম ও পরবর্তী তারিখ' : 'Court & Next Date'}
                  </th>
                  <th className="p-4 text-xs font-black text-slate-700 tracking-wider w-[220px]">
                    {isBn ? 'দায়িত্বপ্রাপ্ত সহকারী মুহুরী' : 'Assigned Assistant'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const isOpen = selectedCaseId === c.id;

                  // Find assistant object to get photo
                  const asstObject = assistants.find(a => a.id === c.assignedClerkAssistantId || (a.name === c.assignedClerkAssistantName && a.mobile === c.assignedClerkAssistantMobile));
                  const isAllMembersAssigned = c.assignedClerkAssistantId === 'all_assistants';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Case Info */}
                      <td className="p-4 align-middle">
                        <div className="space-y-1">
                          <span className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">
                            {c.caseType}
                          </span>
                          <p className="font-bold text-slate-900 text-sm tracking-wide leading-snug">
                            {c.caseNumber}
                          </p>
                        </div>
                      </td>

                      {/* Parties */}
                      <td className="p-4 align-middle">
                        <div className="text-xs space-y-1">
                          <p className="text-slate-800 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{c.petitioner || '—'}</span>
                          </p>
                          <p className="text-slate-400 font-semibold text-[10px] pl-3.5 italic">vs</p>
                          <p className="text-slate-800 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{c.respondent || '—'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Court & Date */}
                      <td className="p-4 align-middle">
                        <div className="text-xs space-y-1 font-medium">
                          <p className="text-slate-800 font-semibold truncate max-w-[180px]" title={c.courtName}>
                            🏛️ {c.courtName || 'Not specified'}
                          </p>
                          {c.nextDate && (
                            <p className="text-indigo-600 font-bold text-[10px] flex items-center gap-1">
                              <Clock size={11} /> {c.nextDate}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Assigned Clerk Assistant / Control Cell */}
                      <td className="p-4 align-middle relative">
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              if (totalAssistants === 0) return;
                              setSelectedCaseId(isOpen ? null : c.id);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 group/btn transition-all ${
                              totalAssistants === 0 ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60' :
                              isAllMembersAssigned ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50 text-emerald-950' :
                              c.assignedClerkAssistantName ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50 text-slate-900' :
                              'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isAllMembersAssigned ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200 shadow-3xs">
                                  👥
                                </div>
                              ) : asstObject?.photoURL ? (
                                <img
                                  src={asstObject.photoURL}
                                  alt={c.assignedClerkAssistantName}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-amber-300 shadow-3xs"
                                />
                              ) : c.assignedClerkAssistantName ? (
                                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-200 font-mono shadow-3xs">
                                  {c.assignedClerkAssistantName.charAt(0)}
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                                  👑
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold truncate leading-tight">
                                  {isAllMembersAssigned ? (isBn ? 'সহকারী মুহুরী টিম' : 'Assistant Clerks') :
                                   c.assignedClerkAssistantName || (isBn ? 'প্রধান মুহুরী' : 'Head Clerk')}
                                </p>
                                {c.assignedClerkAssistantRole && !isAllMembersAssigned && (
                                  <p className="text-[9px] text-slate-500 font-semibold truncate leading-none mt-0.5">
                                    {c.assignedClerkAssistantRole}
                                  </p>
                                )}
                              </div>
                            </div>
                            {totalAssistants > 0 && (
                              <ChevronDown size={14} className="text-slate-400 group-hover/btn:text-slate-600 transition-colors shrink-0" />
                            )}
                          </button>

                          {/* Popover */}
                          {isOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setSelectedCaseId(null)} />
                              
                              <div className="absolute right-4 top-16 z-40 w-[240px] bg-white rounded-2xl border border-slate-150 shadow-xl p-2.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
                                  <span className="text-[9px] font-black tracking-wider uppercase text-slate-400">
                                    {isBn ? 'সহকারী সিলেক্ট করুন' : 'Assign to assistant'}
                                  </span>
                                </div>

                                {/* Option: Head Clerk */}
                                <button
                                  type="button"
                                  onClick={() => handleQuickAssign(c.id, null)}
                                  className={`w-full p-2 text-left rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-2 ${
                                    !c.assignedClerkAssistantName ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-700'
                                  }`}
                                >
                                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[9px] shrink-0 border">
                                    👑
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate">{isBn ? 'প্রধান মুহুরী (My Responsibility)' : 'Head Clerk'}</p>
                                  </div>
                                  {!c.assignedClerkAssistantName && <Check size={14} className="text-indigo-600 shrink-0" />}
                                </button>

                                {/* Option: All Assistant Clerks */}
                                <button
                                  type="button"
                                  onClick={() => handleAssignAll(c.id)}
                                  className={`w-full p-2 text-left rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-2 ${
                                    isAllMembersAssigned ? 'bg-emerald-50/60 text-emerald-800' : 'text-slate-700'
                                  }`}
                                >
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[9px] shrink-0 border">
                                    👥
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate">{isBn ? 'সকল সহকারী মুহুরী (All Assistants)' : 'All Assistants'}</p>
                                  </div>
                                  {isAllMembersAssigned && <Check size={14} className="text-emerald-600 shrink-0" />}
                                </button>

                                {/* List individual assistants */}
                                {assistants.map((asst) => {
                                  const isAsstSelected = c.assignedClerkAssistantName === asst.name && !isAllMembersAssigned;
                                  return (
                                    <button
                                      key={asst.id}
                                      type="button"
                                      onClick={() => handleQuickAssign(c.id, asst)}
                                      className={`w-full p-2 text-left rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-2 ${
                                        isAsstSelected ? 'bg-amber-50/60 text-amber-900' : 'text-slate-700'
                                      }`}
                                    >
                                      {asst.photoURL ? (
                                        <img src={asst.photoURL} alt={asst.name} className="w-5 h-5 rounded-full object-cover border shrink-0" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[9px] shrink-0 border font-mono">
                                          {asst.name.charAt(0)}
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate">{asst.name}</p>
                                        <p className="text-[8px] text-slate-400 font-semibold truncate">{asst.role}</p>
                                      </div>
                                      {isAsstSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Assistant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                <span>{isBn ? 'নতুন সহকারী মুহুরী যুক্ত করুন' : 'Add New Assistant Clerk'}</span>
              </h3>
              <button 
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAssistantSubmit} className="space-y-3.5">
              {/* Photo lookup */}
              {(fetchedPhoto || isSearchingPhoto) && (
                <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-500 overflow-hidden flex items-center justify-center relative shadow-sm">
                    {isSearchingPhoto ? (
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    {fetchedPhoto ? (
                      <img src={fetchedPhoto} alt="Matched Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-indigo-600" size={24} />
                    )}
                  </div>
                  <p className="text-[10px] font-black text-indigo-600 mt-2 flex items-center gap-1">
                    <span>✨ {isBn ? 'প্রোফাইল ছবি পাওয়া গেছে!' : 'Profile picture found!'}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'সহকারী মুহুরীর পুরো নাম *' : 'Assistant Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isBn ? 'যেমন: মো: করিম মিয়া' : 'e.g. Md. Karim Mia'}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'মোবাইল নম্বর * (স্মার্ট ছবি হায়ার করতে সাহায্য করবে)' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'পদবী / রোল *' : 'Role *'}
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                >
                  <option value="Senior Assistant Clerk">{isBn ? 'সিনিয়র সহকারী মুহুরী' : 'Senior Assistant Clerk'}</option>
                  <option value="Junior Assistant Clerk">{isBn ? 'জুনিয়র সহকারী মুহুরী' : 'Junior Assistant Clerk'}</option>
                  <option value="Apprentice Clerk">{isBn ? 'শিক্ষানবিস মুহুরী' : 'Apprentice Clerk'}</option>
                  <option value="Field Assistant">{isBn ? 'মাঠ সহকারী' : 'Field Assistant'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'ইমেইল অ্যাড্রেস (ঐচ্ছিক)' : 'Email Address (Optional)'}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(false);
                  }}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>{isBn ? 'সংরক্ষণ করুন' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
