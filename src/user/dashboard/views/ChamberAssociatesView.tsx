import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  Briefcase, 
  Award, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  X, 
  Plus, 
  FolderGit2, 
  Search,
  ExternalLink,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ChamberAssociate, Case } from '../../../types';

interface ChamberAssociatesViewProps {
  associates: ChamberAssociate[];
  onAddAssociate: (associate: Omit<ChamberAssociate, 'id'>) => Promise<void> | void;
  onUpdateAssociate: (associate: ChamberAssociate) => Promise<void> | void;
  onDeleteAssociate: (id: string) => Promise<void> | void;
  cases: Case[];
  onAssignCase: (caseId: string | number, associate: ChamberAssociate | null) => Promise<void> | void;
  onViewAssociateCases: (associateName: string) => void;
  chamberName?: string;
  chamberAddress?: string;
  onUpdateChamberInfo?: (name: string, address: string) => Promise<void> | void;
  leadLawyerName: string;
  leadLawyerMobile: string;
  leadLawyerPhoto?: string;
  barAssociation?: string;
  language?: 'bn' | 'en' | 'hi' | 'ur';
  t?: (key: string) => string;
}

export const ChamberAssociatesView: React.FC<ChamberAssociatesViewProps> = ({
  associates,
  onAddAssociate,
  onUpdateAssociate,
  onDeleteAssociate,
  cases,
  onAssignCase,
  onViewAssociateCases,
  chamberName = '',
  chamberAddress = '',
  onUpdateChamberInfo,
  leadLawyerName,
  leadLawyerMobile,
  leadLawyerPhoto,
  barAssociation = '',
  language = 'bn',
}) => {
  const isBn = language === 'bn';
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssociate, setEditingAssociate] = useState<ChamberAssociate | null>(null);
  const [assignModalAssociate, setAssignModalAssociate] = useState<ChamberAssociate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chamber info edit state
  const [isEditingChamber, setIsEditingChamber] = useState(false);
  const [tempChamberName, setTempChamberName] = useState(chamberName || (leadLawyerName ? `${leadLawyerName} অ্যান্ড অ্যাসোসিয়েটস` : 'ল’ চেম্বার ও লিগ্যাল অ্যাসোসিয়েটস'));
  const [tempChamberAddress, setTempChamberAddress] = useState(chamberAddress || 'সুপ্রিম কোর্ট বার অ্যাসোসিয়েশন ভবন, ঢাকা');

  // Form states
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formRole, setFormRole] = useState('Senior Associate');
  const [formBarReg, setFormBarReg] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile photo lookup states & helpers
  const [fetchedPhoto, setFetchedPhoto] = useState<string | null>(null);
  const [isSearchingPhoto, setIsSearchingPhoto] = useState(false);
  const [associatePhotos, setAssociatePhotos] = useState<Record<string, string>>({});

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

  // Trigger live photo lookup when mobile field changes in modal
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

  // Load photos for existing associates on mount and cache them
  useEffect(() => {
    let active = true;
    const loadPhotos = async () => {
      const photosMap: Record<string, string> = {};
      for (const assoc of associates) {
        if (assoc.photoURL) {
          photosMap[assoc.id] = assoc.photoURL;
        } else if (assoc.mobile) {
          const pic = await fetchProfilePicByMobile(assoc.mobile);
          if (pic && active) {
            photosMap[assoc.id] = pic;
            // Store it back to persist permanently
            onUpdateAssociate({ ...assoc, photoURL: pic });
          }
        }
      }
      if (active) {
        setAssociatePhotos(prev => ({ ...prev, ...photosMap }));
      }
    };
    loadPhotos();
    return () => { active = false; };
  }, [associates]);

  const resetForm = () => {
    setFormName('');
    setFormMobile('');
    setFormRole('Senior Associate');
    setFormBarReg('');
    setFormEmail('');
    setFetchedPhoto(null);
    setEditingAssociate(null);
  };

  const handleOpenEdit = (assoc: ChamberAssociate) => {
    setEditingAssociate(assoc);
    setFormName(assoc.name);
    setFormMobile(assoc.mobile);
    setFormRole(assoc.role || 'Senior Associate');
    setFormBarReg(assoc.barRegNo || '');
    setFormEmail(assoc.email || '');
    setFetchedPhoto(assoc.photoURL || null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMobile.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingAssociate) {
        await onUpdateAssociate({
          ...editingAssociate,
          name: formName.trim(),
          mobile: formMobile.trim(),
          role: formRole,
          barRegNo: formBarReg.trim() || undefined,
          email: formEmail.trim() || undefined,
          photoURL: fetchedPhoto || editingAssociate.photoURL || undefined,
        });
      } else {
        await onAddAssociate({
          name: formName.trim(),
          mobile: formMobile.trim(),
          role: formRole,
          barRegNo: formBarReg.trim() || undefined,
          email: formEmail.trim() || undefined,
          status: 'active',
          addedAt: new Date().toISOString(),
          photoURL: fetchedPhoto || undefined,
        });
      }
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate caseload per associate
  const getAssignedCaseCount = (associateName: string, associateMobile?: string) => {
    return cases.filter(c => {
      const matchName = c.assignedAssociateName && c.assignedAssociateName.toLowerCase() === associateName.toLowerCase();
      const matchMobile = associateMobile && c.assignedAssociateMobile && c.assignedAssociateMobile.replace(/\D/g, '') === associateMobile.replace(/\D/g, '');
      return matchName || matchMobile;
    }).length;
  };

  const leadCasesCount = cases.filter(c => !c.assignedAssociateName || c.assignedAssociateName === leadLawyerName).length;
  const totalAssignedCases = cases.filter(c => Boolean(c.assignedAssociateName)).length;

  const filteredAssociates = associates.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.mobile.includes(searchQuery) ||
    (a.role && a.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Chamber Profile */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={12} /> {isBn ? 'ল’ চেম্বার টিম ও অ্যাসোসিয়েট ব্যবস্থাপনা' : 'Chamber & Associates Management'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                {isBn ? 'সক্রিয় দল' : 'Active Team'}
              </span>
            </div>

            {isEditingChamber ? (
              <div className="space-y-3 pt-2 max-w-xl">
                <div>
                  <label className="text-xs text-indigo-200 font-bold block mb-1">{isBn ? 'চেম্বারের নাম' : 'Chamber Name'}</label>
                  <input
                    type="text"
                    value={tempChamberName}
                    onChange={(e) => setTempChamberName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-indigo-400/40 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-indigo-200 font-bold block mb-1">{isBn ? 'চেম্বারের ঠিকানা' : 'Chamber Address'}</label>
                  <input
                    type="text"
                    value={tempChamberAddress}
                    onChange={(e) => setTempChamberAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-indigo-400/40 rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (onUpdateChamberInfo) {
                        await onUpdateChamberInfo(tempChamberName, tempChamberAddress);
                      }
                      setIsEditingChamber(false);
                    }}
                    className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {isBn ? 'সংরক্ষণ করুন' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditingChamber(false)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {chamberName || tempChamberName}
                  </h1>
                  <button
                    onClick={() => setIsEditingChamber(true)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-200 hover:text-white transition-all text-xs flex items-center gap-1 font-semibold"
                    title={isBn ? 'চেম্বারের তথ্য পরিবর্তন' : 'Edit Chamber Info'}
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-indigo-200 flex items-center gap-2">
                  <MapPin size={14} className="text-rose-400 shrink-0" />
                  <span>{chamberAddress || tempChamberAddress}</span>
                  {barAssociation && (
                    <span className="hidden sm:inline-block text-indigo-300 border-l border-indigo-700 pl-2">
                      {barAssociation}
                    </span>
                  )}
                </p>
              </>
            )}
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition-all hover:scale-102 active:scale-98"
            >
              <UserPlus size={18} />
              <span>{isBn ? 'নতুন অ্যাসোসিয়েট যোগ করুন' : 'Add Associate'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-indigo-800/40">
          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
              {isBn ? 'চেম্বারের মোট মামলা' : 'Total Chamber Cases'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">{cases.length}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
              {isBn ? 'সহযোগী আইনজীবী' : 'Associate Lawyers'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">{associates.length + 1}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
              {isBn ? 'বণ্টনকৃত মামলা' : 'Assigned Cases'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalAssignedCases}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
              {isBn ? 'প্রধানের প্রত্যক্ষ দায়িত্বে' : 'Under Lead Advocate'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-sky-400">{leadCasesCount}</span>
          </div>
        </div>
      </div>

      {/* Associates List Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="text-indigo-600" size={22} />
            <span>{isBn ? 'চেম্বারের আইনজীবী ও টিম সদস্যবৃন্দ' : 'Chamber Advocates & Associates'}</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {associates.length + 1}
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isBn 
              ? 'এখানে চেম্বারের সকল জুনিয়র ও সহযোগী আইনজীবীদের তথ্য ও তাদের বরাদ্দকৃত মামলা পরিচালনা করুন।' 
              : 'Manage chamber junior/associate advocates and their assigned cases.'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={isBn ? 'অ্যাসোসিয়েট খুঁজুন...' : 'Search associate...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Lead Advocate Card (Permanent Head of Chamber) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-indigo-200 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-xs flex items-center gap-1">
            <Crown size={12} /> {isBn ? 'চেম্বার প্রধান (Lead)' : 'Lead Advocate'}
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-200 shrink-0 overflow-hidden">
              {leadLawyerPhoto ? (
                <img src={leadLawyerPhoto} alt="Lead Profile" className="w-full h-full object-cover" />
              ) : (
                leadLawyerName ? leadLawyerName.charAt(0) : 'L'
              )}
            </div>
            <div className="min-w-0 pr-16">
              <h3 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1">
                <span>{leadLawyerName || 'আইনজীবী'}</span>
                <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
              </h3>
              <p className="text-[11px] font-bold text-indigo-600">{isBn ? 'ম্যানেজিং পার্টনার ও প্রধান আইনজীবী' : 'Principal Advocate'}</p>
              {barAssociation && (
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{barAssociation}</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <Phone size={13} className="text-slate-400" />
              <span className="font-mono">{leadLawyerMobile || '-'}</span>
            </div>
            <a 
              href={leadLawyerMobile ? `tel:${leadLawyerMobile}` : '#'}
              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1"
            >
              <Phone size={12} />
              <span>{isBn ? 'কল' : 'Call'}</span>
            </a>
          </div>

          <div className="mt-3 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 size={15} className="text-indigo-600" />
              <span className="text-[11px] font-bold text-indigo-900">{isBn ? 'তত্ত্বাবধানে থাকা মামলা:' : 'Active Cases:'}</span>
            </div>
            <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
              {leadCasesCount} {isBn ? 'টি' : ''}
            </span>
          </div>
        </div>

        {/* 2. Associates Cards */}
        {filteredAssociates.map((assoc) => {
          const caseCount = getAssignedCaseCount(assoc.name, assoc.mobile);
          return (
            <div 
              key={assoc.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-indigo-700 font-black text-base flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors overflow-hidden">
                      {associatePhotos[assoc.id] || assoc.photoURL ? (
                        <img src={associatePhotos[assoc.id] || assoc.photoURL} alt={assoc.name} className="w-full h-full object-cover" />
                      ) : (
                        assoc.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate" title={assoc.name}>
                        {assoc.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold mt-0.5">
                        {assoc.role || 'Associate Advocate'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(assoc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title={isBn ? 'সম্পাদনা' : 'Edit'}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(isBn ? `আপনি কি নিশ্চিতভাবে "${assoc.name}"-কে চেম্বার থেকে বাদ দিতে চান?` : `Are you sure you want to remove "${assoc.name}"?`)) {
                          onDeleteAssociate(assoc.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone size={12} className="text-slate-400" />
                      <span className="font-mono font-medium">{assoc.mobile}</span>
                    </span>
                    <a
                      href={`tel:${assoc.mobile}`}
                      className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded-md transition-all flex items-center gap-1"
                    >
                      <Phone size={10} /> {isBn ? 'কল দিন' : 'Call'}
                    </a>
                  </div>

                  {assoc.barRegNo && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Award size={12} className="text-amber-500" />
                      <span>{isBn ? 'সনদ নং:' : 'Sanad:'} {assoc.barRegNo}</span>
                    </div>
                  )}

                  {assoc.email && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                      <Mail size={12} className="text-slate-400" />
                      <span className="truncate">{assoc.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Caseload & Assign Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <FolderGit2 size={13} className="text-indigo-600" />
                    {isBn ? 'বরাদ্দকৃত মামলা:' : 'Assigned Cases:'}
                  </span>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {caseCount} {isBn ? 'টি' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onViewAssociateCases(assoc.name)}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-slate-200"
                  >
                    <ExternalLink size={12} />
                    <span>{isBn ? 'মামলা দেখুন' : 'View Cases'}</span>
                  </button>
                  <button
                    onClick={() => setAssignModalAssociate(assoc)}
                    className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-indigo-200"
                  >
                    <Plus size={12} />
                    <span>{isBn ? 'মামলা দিন' : 'Assign Case'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. Add Associate Quick Card */}
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/40 p-6 flex flex-col items-center justify-center text-center gap-3 transition-all min-h-[220px] group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 group-hover:scale-110 flex items-center justify-center shadow-xs border border-slate-200 group-hover:border-indigo-300 transition-all">
            <Plus size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
              {isBn ? 'নতুন অ্যাসোসিয়েট যুক্ত করুন' : 'Add New Associate'}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {isBn ? 'চেম্বারের জুনিয়র বা সহকারী আইনজীবীর প্রোফাইল বানান' : 'Create junior / associate profile'}
            </p>
          </div>
        </button>
      </div>

      {/* Add / Edit Associate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="text-indigo-600" size={20} />
                {editingAssociate 
                  ? (isBn ? 'অ্যাসোসিয়েটের তথ্য সম্পাদনা' : 'Edit Associate') 
                  : (isBn ? 'নতুন ল’ অ্যাসোসিয়েট যুক্ত করুন' : 'Add New Associate')}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Real-time photo preview of fetched profile picture */}
              {(fetchedPhoto || isSearchingPhoto) && (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-indigo-500 overflow-hidden flex items-center justify-center relative shadow-sm">
                    {isSearchingPhoto ? (
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    {fetchedPhoto ? (
                      <img src={fetchedPhoto} alt="Matched Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="text-indigo-600" size={24} />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-indigo-600 mt-2 flex items-center gap-1">
                    <span>✨ {isBn ? 'প্রোফাইল ছবি হায়ার করা হয়েছে!' : 'Profile picture hired!'}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'আইনজীবীর পুরো নাম *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isBn ? 'যেমন: অ্যাডভোকেট তানভীর আহমেদ' : 'e.g. Adv. Tanvir Ahmed'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'পদবি / দায়িত্ব (Role)' : 'Role / Designation'}
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Senior Associate">{isBn ? 'সিনিয়র অ্যাসোসিয়েট (Senior Associate)' : 'Senior Associate'}</option>
                  <option value="Junior Associate">{isBn ? 'জুনিয়র অ্যাসোসিয়েট (Junior Associate)' : 'Junior Associate'}</option>
                  <option value="Associate Advocate">{isBn ? 'সহযোগী আইনজীবী (Associate Advocate)' : 'Associate Advocate'}</option>
                  <option value="Research Assistant">{isBn ? 'লিগ্যাল রিসার্চার (Research Assistant)' : 'Research Assistant'}</option>
                  <option value="Apprentice Advocate">{isBn ? 'শিক্ষানবিশ আইনজীবী (Apprentice)' : 'Apprentice Advocate'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'বার কাউন্সিল সনদ নং (ঐচ্ছিক)' : 'Bar Sanad / Reg No (Optional)'}
                </label>
                <input
                  type="text"
                  value={formBarReg}
                  onChange={(e) => setFormBarReg(e.target.value)}
                  placeholder="যেমন: DH-12345/2023"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? 'ইমেইল এড্রেস (ঐচ্ছিক)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="tanvir@chamber.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {isSubmitting 
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                    : (editingAssociate ? (isBn ? 'আপডেট করুন' : 'Update') : (isBn ? 'যুক্ত করুন' : 'Add Associate'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Assignment Modal */}
      {assignModalAssociate && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Briefcase className="text-indigo-600" size={18} />
                  <span>{assignModalAssociate.name}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                    {assignModalAssociate.role}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isBn ? 'এই আইনজীবীকে চেম্বারের মামলা অর্পণ করুন' : 'Assign chamber cases to this advocate'}
                </p>
              </div>
              <button 
                onClick={() => setAssignModalAssociate(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of cases */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[250px]">
              {cases.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  {isBn ? 'চেম্বারে কোনো মামলা নেই।' : 'No cases in chamber.'}
                </div>
              ) : (
                cases.map((c) => {
                  const isAssignedToThis = c.assignedAssociateName === assignModalAssociate.name;
                  return (
                    <div 
                      key={c.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isAssignedToThis 
                          ? 'bg-indigo-50/70 border-indigo-200' 
                          : 'bg-slate-50/60 border-slate-100 hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {c.caseNumber}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                            {c.courtName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {c.petitioner} বনাম {c.respondent}
                        </p>
                        {c.assignedAssociateName && !isAssignedToThis && (
                          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                            {isBn ? `বর্তমানে দায়িত্বে: ${c.assignedAssociateName}` : `Currently assigned: ${c.assignedAssociateName}`}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (isAssignedToThis) {
                            await onAssignCase(c.id, null);
                          } else {
                            await onAssignCase(c.id, assignModalAssociate);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isAssignedToThis
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                        }`}
                      >
                        {isAssignedToThis 
                          ? (isBn ? 'দায়িত্ব বাতিল' : 'Unassign') 
                          : (isBn ? 'দায়িত্ব দিন' : 'Assign')}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAssignModalAssociate(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                {isBn ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
