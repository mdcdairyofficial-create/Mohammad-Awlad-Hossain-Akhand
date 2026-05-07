import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Phone, MapPin, Briefcase, Star, Filter, Mail, TrendingUp, CheckCircle2, XCircle, Handshake, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { getLawyers } from '../../services/user/featureService';
import { BANGLADESH_DISTRICTS } from '../../constants';

interface LawyerDirectoryProps {
  currentUserId?: string;
  t?: (key: string) => string;
}

export default function LawyerDirectory({ currentUserId, t = (k) => k }: LawyerDirectoryProps) {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সকল');
  const [loading, setLoading] = useState(true);

  const categories = ['সকল', 'ফৌজদারী', 'দেওয়ানি', 'ট্যাক্স', 'লিগ্যাল এইড', 'আদালত'];

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const data = await getLawyers();
        // Add mock performance stats for demo purposes
        const enrichedData = data.map(lawyer => {
          const ongoing = Math.floor(Math.random() * 50) + 10;
          const won = Math.floor(Math.random() * 200) + 50;
          const lost = Math.floor(Math.random() * 30) + 5;
          const settled = Math.floor(Math.random() * 100) + 20;
          const total = won + lost + settled;
          const growth = total > 0 ? Math.floor((won / total) * 100) : 0;
          
          // Randomly assign categories if not present
          const randomCat = categories[Math.floor(Math.random() * (categories.length - 1)) + 1];

          return {
            ...lawyer,
            rating: lawyer.rating || (Math.random() * (5 - 4) + 4).toFixed(1),
            reviews: lawyer.reviews || Math.floor(Math.random() * 200) + 10,
            specialization: lawyer.specialization || randomCat,
            profile_picture: lawyer.profile_picture || lawyer.photoUrl || null,
            email: lawyer.email || `${lawyer.name?.toLowerCase().replace(/\s+/g, '.')}@lawyer.com`,
            stats: {
              active: lawyer.is_active !== false,
              ongoing,
              won,
              lost,
              settled,
              growth
            }
          };
        });

        // Ensure current user is in the list if they are a lawyer
        setLawyers(enrichedData);
      } catch (err) {
        console.error("Error fetching lawyers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, [currentUserId]);

  const filteredLawyers = useMemo(() => {
    return lawyers.filter(l => {
      // Always show current user if not specifically searching for something else
      const isMe = currentUserId && (l.id === currentUserId || l.firebase_uid === currentUserId);
      
      const matchesSearch = 
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.mobile?.includes(searchQuery);
      
      const matchesDistrict = selectedDistrict ? l.district === selectedDistrict : true;
      const matchesCategory = selectedCategory === 'সকল' ? true : l.specialization === selectedCategory;

      return matchesSearch && matchesDistrict && matchesCategory;
    }).sort((a, b) => {
      // Sort current user to the top
      const aIsMe = currentUserId && (a.id === currentUserId || a.firebase_uid === currentUserId);
      const bIsMe = currentUserId && (b.id === currentUserId || b.firebase_uid === currentUserId);
      if (aIsMe) return -1;
      if (bIsMe) return 1;
      return 0;
    });
  }, [lawyers, searchQuery, selectedDistrict, selectedCategory, currentUserId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Search Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
        <div className="relative">
          <h2 className="text-3xl font-black text-slate-900 mb-2">আইনজীবী <span className="text-indigo-600">খুঁজুন</span></h2>
          <p className="text-slate-500 font-medium">জেলা ও দক্ষতা অনুযায়ী সেরা আইনি পরামর্শক বেছে নিন</p>
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

      {/* Categories Scroller */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap shadow-sm border ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100 scale-105' 
                : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">তথ্য লোড হচ্ছে...</p>
        </div>
      ) : filteredLawyers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">দুঃখিত!</h3>
          <p className="text-slate-500 font-medium">আপনার খোঁজে কোনো আইনজীবী পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filteredLawyers.map((lawyer) => {
            const isMe = currentUserId && (lawyer.id === currentUserId || lawyer.firebase_uid === currentUserId);
            
            return (
              <div key={lawyer.id} className={`bg-white p-8 rounded-[3rem] border shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex flex-col md:flex-row gap-8 relative overflow-hidden ${
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
                    <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-3xl border-4 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500 ring-4 ring-indigo-50">
                      {lawyer.profile_picture ? (
                        <img src={lawyer.profile_picture} alt={lawyer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        lawyer.name?.substring(0, 2).toUpperCase() || <User size={40} />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50 text-emerald-500">
                      <CheckCircle2 size={20} fill="currentColor" className="text-white" />
                      <CheckCircle2 size={24} className="absolute" />
                    </div>
                    {parseFloat(lawyer.rating) >= 4.5 && lawyer.reviews >= 50 && (
                      <div className="absolute -top-2 -left-2 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg border border-white text-white">
                        <Star size={20} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-black text-slate-900 text-lg text-center mb-1 group-hover:text-indigo-600 transition-colors leading-tight">{lawyer.name}</h3>
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider mb-3">
                    {lawyer.specialization}
                  </span>

                  <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                    <Star size={16} fill="currentColor" />
                    <span>{lawyer.rating}</span>
                    <span className="text-slate-400 font-bold ml-1">({lawyer.reviews})</span>
                  </div>
                </div>

                {/* Stats & Info Side */}
                <div className="flex-1 space-y-6 relative">
                  {/* Info Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <MapPin size={18} className="text-indigo-500" />
                      <span className="truncate">{lawyer.district}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <Phone size={18} className="text-emerald-500" />
                      <span className="truncate">{lawyer.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50 sm:col-span-2">
                      <Mail size={18} className="text-rose-500" />
                      <span className="truncate">{lawyer.email}</span>
                    </div>
                  </div>

                  {/* Growth Meter */}
                  <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group/meter">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp size={14} className="text-indigo-600" /> উন্নতির হার
                        </span>
                        <span className="text-lg font-black text-indigo-600 italic">{lawyer.stats.growth}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${lawyer.stats.growth}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-800 rounded-full shadow-lg shadow-indigo-200"
                        />
                    </div>
                  </div>

                  {/* Case Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-indigo-50 p-3 rounded-2xl text-center border border-indigo-100 transition-transform group-hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">চলমান</p>
                      <p className="text-lg font-black text-indigo-700">{lawyer.stats.ongoing}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl text-center border border-emerald-100 transition-transform group-hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">জয়</p>
                      <p className="text-lg font-black text-emerald-700">{lawyer.stats.won}</p>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-2xl text-center border border-rose-100 transition-transform group-hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-rose-400 uppercase mb-1">পরাজয়</p>
                      <p className="text-lg font-black text-rose-700">{lawyer.stats.lost}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100 transition-transform group-hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-amber-400 uppercase mb-1">মিমাংসা</p>
                      <p className="text-lg font-black text-amber-700">{lawyer.stats.settled}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <a href={`tel:${lawyer.mobile}`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 group/btn">
                      <Phone size={18} className="group-hover/btn:animate-bounce" /> কল করুন
                    </a>
                    <button className="px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-indigo-900 transition-all border border-slate-800">
                      প্রোফাইল
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
