import React, { useState } from 'react';
import { Search, History, FileText, Calendar, MapPin, User, ChevronRight, Bot } from 'lucide-react';
import { searchArchiveCases } from '../../services/user/featureService';
import { ArchiveCase } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function ArchiveCaseHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ArchiveCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ArchiveCase | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await searchArchiveCases(searchQuery);
      setResults(data);
    } catch (err) {
      console.error("Error searching archive:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" />
          ২০ বছরের মামলার ইতিহাস
        </h2>
        <p className="text-slate-500">পুরানো মামলার রেকর্ড এবং ফলাফল অনুসন্ধান করুন</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="মামলা নম্বর দিয়ে খুঁজুন (যেমন: ১২৩/২০০৫)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-lg font-medium"
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Search className="w-5 h-5" />
          )}
          অনুসন্ধান করুন
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="bg-indigo-50 p-6 rounded-full mb-6">
              <Bot size={48} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">কোনো রেকর্ড পাওয়া যায়নি</h3>
            <p className="text-slate-500 max-w-md">সঠিক মামলা নম্বর দিয়ে সার্চ করুন। আমাদের আর্কাইভে ২০ বছরেরও বেশি সময়ের মামলার তথ্য সংরক্ষিত আছে।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedCase(item)}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {item.year}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.caseNumber}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{item.courtName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <User className="w-4 h-4" />
                    <span>{item.parties}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">মামলার বিস্তারিত</h3>
                <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <Bot size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">মামলা নম্বর</p>
                    <p className="font-bold text-lg">{selectedCase.caseNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">সাল</p>
                    <p className="font-bold text-lg">{selectedCase.year}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">আদালত</p>
                  <p className="font-bold text-lg">{selectedCase.courtName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">পক্ষসমূহ</p>
                  <p className="font-bold text-lg">{selectedCase.parties}</p>
                </div>
                {selectedCase.result && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">ফলাফল / রায়</p>
                    <p className="font-bold text-emerald-900">{selectedCase.result}</p>
                  </div>
                )}
                {selectedCase.summary && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">সারসংক্ষেপ</p>
                    <p className="text-slate-700 leading-relaxed">{selectedCase.summary}</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
