import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Phone, MapPin, Briefcase, Star, Filter, Mail, TrendingUp, CheckCircle2, XCircle, Handshake, ChevronRight, ShieldAlert, Award, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { getClerks } from '../../services/user/featureService';
import { BANGLADESH_DISTRICTS } from '../../constants';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface ClerkDirectoryProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserMobile?: string;
  t?: (key: string) => string;
}

export default function ClerkDirectory({ currentUserId, currentUserName = 'User', currentUserMobile = '', t = (k) => k }: ClerkDirectoryProps) {
  const [clerks, setClerks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);

  // Complaint states
  const [complaintTarget, setComplaintTarget] = useState<any | null>(null);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  useEffect(() => {
    const fetchClerks = async () => {
      try {
        const data = await getClerks();
        // Add mock performance stats for demo purposes
        const enrichedData = data.map(clerk => {
          const experience = Math.floor(Math.random() * 15) + 2;
          const successful_filings = Math.floor(Math.random() * 500) + 100;
          const active_cases = Math.floor(Math.random() * 50) + 5;
          const rating = (Math.random() * (5 - 4) + 4).toFixed(1);
          const reviews = Math.floor(Math.random() * 100) + 5;

          // Calculate rankingScore based on experience, successful filings, active cases, and rating
          const rankingScore = (successful_filings * 3) + (active_cases * 2) + (experience * 10) + (parseFloat(rating) * 50);

          return {
            ...clerk,
            rating,
            reviews,
            experience: `${experience} years`,
            profile_picture: clerk.profile_picture || clerk.photoUrl || null,
            email: clerk.email || `${clerk.name?.toLowerCase().replace(/\s+/g, '.')}@clerk.com`,
            trust_score: clerk.trust_score !== undefined ? clerk.trust_score : 100,
            warnings_count: clerk.warnings_count || 0,
            red_balls_count: clerk.red_balls_count || 0,
            rankingScore,
            stats: {
              active: clerk.is_approved !== false,
              experience,
              successful_filings,
              active_cases
            }
          };
        });

        // Assign true rank index relative to all clerks sorted by rankingScore descending
        const sortedByRank = [...enrichedData].sort((a, b) => b.rankingScore - a.rankingScore);
        const fullyEnrichedData = enrichedData.map(c => {
          const rankIndex = sortedByRank.findIndex(s => s.id === c.id);
          return {
            ...c,
            rank: rankIndex + 1
          };
        });

        setClerks(fullyEnrichedData);
      } catch (err) {
        console.error("Error fetching clerks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClerks();
  }, [currentUserId]);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTarget || !complaintTitle.trim() || !complaintDesc.trim()) return;

    setComplaintSubmitting(true);
    try {
      const complaintDoc = {
        title: complaintTitle.trim(),
        description: complaintDesc.trim(),
        complainantId: currentUserId || 'anonymous',
        complainantName: currentUserName,
        complainantMobile: currentUserMobile,
        accusedId: complaintTarget.firebase_uid || complaintTarget.id || '',
        accusedName: complaintTarget.name || '',
        accusedType: 'clerk',
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'complaints'), complaintDoc);

      const logDoc = {
        action: 'filed_complaint',
        details: `${currentUserName} (${currentUserMobile || 'N/A'}) filed a complaint against clerk ${complaintTarget.name}`,
        userId: currentUserId || 'anonymous',
        userName: currentUserName,
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(db, 'audit_logs'), logDoc);

      alert('আপনার অভিযোগটি সফলভাবে দাখিল করা হয়েছে। অ্যাডমিন প্যানেল শীঘ্রই এটি পর্যালোচনা করবে।');
      setComplaintTarget(null);
      setComplaintTitle('');
      setComplaintDesc('');
    } catch (err) {
      console.error('Error submitting complaint:', err);
      alert('অভিযোগ দাখিল করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const filteredClerks = useMemo(() => {
    return clerks.filter(c => {
      const isMe = currentUserId && (c.id === currentUserId || c.firebase_uid === currentUserId);
      const matchesSearch = 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mobile?.includes(searchQuery);
      const matchesDistrict = selectedDistrict ? c.district === selectedDistrict : true;
      return (matchesSearch && matchesDistrict) || isMe;
    }).sort((a, b) => {
      const aIsMe = currentUserId && (a.id === currentUserId || a.firebase_uid === currentUserId);
      const bIsMe = currentUserId && (b.id === currentUserId || b.firebase_uid === currentUserId);
      if (aIsMe) return -1;
      if (bIsMe) return 1;
      return (b.rankingScore || 0) - (a.rankingScore || 0);
    });
  }, [clerks, searchQuery, selectedDistrict, currentUserId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Search Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
        <div className="relative">
          <h2 className="text-3xl font-black text-slate-900 mb-2">মুহুরি <span className="text-indigo-600">খুঁজুন</span></h2>
          <p className="text-slate-500 font-medium">জেলা অনুযায়ী অভিজ্ঞ মুহুরি খুঁজে নিন</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto relative group">
          <div className="relative w-full sm:w-64">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all appearance-none font-bold text-slate-700"
            >
              <option value="">সকল জেলা নির্বাচন করুন</option>
              {BANGLADESH_DISTRICTS.map((dist, idx) => (
                <option key={idx} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="নাম বা মোবাইল নম্বর..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all font-bold text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">তথ্য লোড হচ্ছে...</p>
        </div>
      ) : filteredClerks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">দুঃখিত!</h3>
          <p className="text-slate-500 font-medium">আপনার খোঁজে কোনো মুহুরি পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredClerks.map((clerk) => {
            const isMe = currentUserId && (clerk.id === currentUserId || clerk.firebase_uid === currentUserId);
            const isClerkSubscribed = clerk.subscription_package && clerk.subscription_package !== 'free' || clerk.subscriptionPackage && clerk.subscriptionPackage !== 'free';
            
            return (
              <div key={clerk.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex flex-col md:flex-row gap-8 relative overflow-hidden ${
                isMe ? 'ring-2 ring-indigo-500 border-indigo-100' : 'border-slate-100'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-30"></div>
                
                {isMe && (
                  <div className="absolute top-4 right-8 z-20">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-200">
                      আমার প্রোফাইল
                    </span>
                  </div>
                )}
                
                {/* Profile Side */}
                <div className="flex flex-col items-center md:w-48 shrink-0">
                  <div className="relative mb-4">
                    <div className={`w-32 h-32 rounded-[2.5rem] bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-3xl border-4 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500 ring-4 ${
                      isClerkSubscribed 
                        ? 'ring-amber-400 shadow-amber-200 shadow-lg dark:ring-amber-500' 
                        : 'ring-indigo-50'
                    }`}>
                      {clerk.profile_picture ? (
                        <img src={clerk.profile_picture} alt={clerk.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        clerk.name?.substring(0, 2).toUpperCase() || <User size={40} />
                      )}
                    </div>
                    {/* Rank Badge */}
                    <div className={`absolute -bottom-2 -left-2 px-2.5 py-1.5 rounded-[1rem] text-[10px] font-black shadow-lg border-2 border-white flex items-center gap-0.5 z-10 whitespace-nowrap ${
                      clerk.rank === 1 ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-slate-950 border-amber-300' :
                      clerk.rank === 2 ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 border-slate-200' :
                      clerk.rank === 3 ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white border-amber-600' :
                      'bg-slate-900 text-white border-slate-700'
                    }`}>
                      {clerk.rank <= 3 ? <Crown size={10} className="fill-current" /> : null}
                      <span>র‍্যাংক #{clerk.rank}</span>
                    </div>
                    {parseFloat(clerk.rating) >= 4.5 && clerk.reviews >= 50 && (
                      <div className="absolute -top-2 -left-2 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg border border-white text-white">
                        <Star size={20} fill="currentColor" />
                      </div>
                    )}
                    {isClerkSubscribed && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white flex items-center gap-1 z-10 whitespace-nowrap animate-pulse">
                        <Award size={12} className="fill-slate-950" />
                        <span>প্রিমিয়াম</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-lg text-center mb-1 group-hover:text-indigo-600 transition-colors leading-tight flex items-center justify-center gap-1">
                    {clerk.name}
                    {isClerkSubscribed && (
                      <Award size={18} className="text-amber-500 fill-amber-100 shrink-0" />
                    )}
                  </h3>
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                    মুহুরি (Clerk)
                  </span>

                  <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                    <Star size={16} fill="currentColor" />
                    <span>{clerk.rating}</span>
                    <span className="text-slate-400 font-bold ml-1">({clerk.reviews})</span>
                  </div>

                  {/* Trust Rating Badge */}
                  <div className="mt-3 flex items-center gap-1 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">আস্থা স্কোর:</span>
                    <span className={`text-xs font-black ${
                      (clerk.trust_score || 100) >= 90 ? 'text-emerald-600' :
                      (clerk.trust_score || 100) >= 70 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {clerk.trust_score || 100}%
                    </span>
                  </div>

                  {/* Warning / Red Ball Indicator */}
                  {((clerk.warnings_count || 0) > 0 || (clerk.red_balls_count || 0) > 0) && (
                    <div className="mt-3 flex flex-col items-center gap-1.5 bg-rose-50/50 p-2.5 rounded-2xl border border-rose-100 w-full">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">স্ট্যাটাস:</span>
                        {(clerk.red_balls_count || 0) > 0 && (
                          <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 animate-pulse">
                            {(clerk.red_balls_count || 0)}  রেড বল
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-0.5">
                        {[1, 2, 3].map((strike) => (
                          <div 
                            key={strike} 
                            className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                              strike <= (clerk.warnings_count || 0) 
                                ? 'bg-rose-600 border-rose-700 shadow-md shadow-rose-200 scale-110' 
                                : 'bg-slate-100 border-slate-200'
                            }`}
                            title={strike <= (clerk.warnings_count || 0) ? `Warning ${strike}` : `Slot ${strike}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Side */}
                <div className="flex-1 space-y-6 relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <MapPin size={18} className="text-indigo-500" />
                      <span className="truncate">{clerk.district}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <Phone size={18} className="text-emerald-500" />
                      <span className="truncate">{clerk.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50 sm:col-span-2">
                      <Mail size={18} className="text-rose-500" />
                      <span className="truncate">{clerk.email}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50 sm:col-span-2">
                      <Briefcase size={18} className="text-blue-500" />
                      <span className="truncate">অভিজ্ঞতা: {clerk.experience}</span>
                    </div>
                  </div>

                  {/* Case Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">সফল ফাইলিং</p>
                      <p className="text-xl font-black text-indigo-700">{clerk.stats.successful_filings}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">সক্রিয় মামলা</p>
                      <p className="text-xl font-black text-emerald-700">{clerk.stats.active_cases}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <a href={`tel:${clerk.mobile}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                      <Phone size={14} /> কল করুন
                    </a>
                    {!isMe ? (
                      <button 
                        onClick={() => setComplaintTarget(clerk)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-rose-50 text-rose-700 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all border border-rose-100"
                      >
                        <ShieldAlert size={14} /> অভিযোগ করুন
                      </button>
                    ) : (
                      <span className="flex-1 text-center py-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-black text-xs self-center">
                        আমার আইডি
                      </span>
                    )}
                    <button className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-950 transition-all block">
                      প্রোফাইল
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complaint Submission Modal */}
      {complaintTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col p-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={24} />
                <h3 className="text-xl font-black text-slate-900">অভিযোগ ফর্ম দায়ের করুন</h3>
              </div>
              <button 
                onClick={() => setComplaintTarget(null)}
                className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full font-black text-lg flex items-center justify-center border border-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-500 font-medium text-xs mb-6 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
              আপনি মুহুরি <strong className="text-slate-800">{complaintTarget.name}</strong> এর বিরুদ্ধে লিখিত অভিযোগ জমা দিচ্ছেন। অভিযোগটি নির্ভরযোগ্য ও সঠিক হতে হবে।
            </p>

            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-black text-xs mb-2">অভিযোগের শিরোনাম</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: অননুমোদিত ফাইলিং ফি দাবি"
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-black text-xs mb-2">অভিযোগের বিবরণ</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="অভিযোগের বিস্তারিত কারণ এখানে ব্যাখ্যা করুন..."
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setComplaintTarget(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit"
                  disabled={complaintSubmitting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-rose-200"
                >
                  {complaintSubmitting ? 'দাখিল হচ্ছে...' : 'অভিযোগ পেশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
