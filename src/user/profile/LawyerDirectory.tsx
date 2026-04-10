import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Phone, MapPin, Briefcase, Star, Filter } from 'lucide-react';
import { getLawyers } from '../../services/user/featureService';

export default function LawyerDirectory() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const data = await getLawyers();
        // Add mock ratings and reviews if they don't exist
        const enrichedData = data.map(lawyer => ({
          ...lawyer,
          rating: lawyer.rating || (Math.random() * (5 - 4) + 4).toFixed(1), // Random rating between 4.0 and 5.0
          reviews: lawyer.reviews || Math.floor(Math.random() * 200) + 10, // Random reviews count
          specialization: lawyer.specialization || 'সিভিল ও ক্রিমিনাল বিশেষজ্ঞ',
          profile_picture: lawyer.profile_picture || lawyer.photoUrl || null
        }));
        setLawyers(enrichedData);
      } catch (err) {
        console.error("Error fetching lawyers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, []);

  const specialties = useMemo(() => {
    const allSpecialties = lawyers.map(l => l.specialization);
    return [...new Set(allSpecialties)].filter(Boolean);
  }, [lawyers]);

  const filteredLawyers = lawyers.filter(l => {
    const matchesSearch = 
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.mobile?.includes(searchQuery);
    
    const matchesSpecialty = selectedSpecialty ? l.specialization === selectedSpecialty : true;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">আইনজীবী ডিরেক্টরি</h2>
          <p className="text-slate-500">আপনার এলাকা অনুযায়ী সেরা আইনজীবী খুঁজে নিন</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all appearance-none"
            >
              <option value="">সকল বিশেষত্ব</option>
              {specialties.map((spec, idx) => (
                <option key={idx} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="নাম, জেলা বা মোবাইল নম্বর..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredLawyers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">কোনো আইনজীবী পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <div key={lawyer.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-white shadow-sm overflow-hidden">
                  {lawyer.profile_picture ? (
                    <img src={lawyer.profile_picture} alt={lawyer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    lawyer.name?.substring(0, 2).toUpperCase() || <User className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{lawyer.name}</h3>
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-bold mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{lawyer.rating} ({lawyer.reviews} রিভিউ)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span>{lawyer.specialization}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{lawyer.district}, {lawyer.country}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>{lawyer.mobile}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  যোগাযোগ করুন
                </button>
                <button className="py-2.5 bg-slate-50 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all border border-slate-200">
                  প্রোফাইল দেখুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
