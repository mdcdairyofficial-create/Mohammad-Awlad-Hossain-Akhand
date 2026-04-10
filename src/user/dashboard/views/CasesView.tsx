import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Download, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  History,
  CreditCard
} from 'lucide-react';
import { Case } from '../../../types';
import { AdBanner } from '../AdBanner';

interface CasesViewProps {
  cases: Case[];
  caseSearchQuery: string;
  setCaseSearchQuery: (query: string) => void;
  caseFilter: 'all' | 'Civil' | 'Criminal' | 'High Court' | 'Supreme Court' | 'Other';
  setCaseFilter: (filter: any) => void;
  caseStatusFilter: 'all' | 'running' | 'disposed' | 'stayed';
  setCaseStatusFilter: (filter: any) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onAddCase: () => void;
  onJoinCase: () => void;
  onEditCase: (c: Case) => void;
  onDeleteCase: (id: number) => void;
  onViewHistory: (c: Case) => void;
  onViewCard: (c: Case) => void;
  t: (key: string) => string;
  language: 'bn' | 'en' | 'hi' | 'ur';
  isPremium?: boolean;
}

export const CasesView = ({
  cases,
  caseSearchQuery,
  setCaseSearchQuery,
  caseFilter,
  setCaseFilter,
  caseStatusFilter,
  setCaseStatusFilter,
  viewMode,
  setViewMode,
  onAddCase,
  onJoinCase,
  onEditCase,
  onDeleteCase,
  onViewHistory,
  onViewCard,
  t,
  language,
  isPremium = false
}: CasesViewProps) => {
  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.caseNumber.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      c.courtName.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      c.petitioner.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      c.respondent.toLowerCase().includes(caseSearchQuery.toLowerCase());
    
    const matchesType = caseFilter === 'all' || c.caseType === caseFilter;
    const matchesStatus = caseStatusFilter === 'all' || c.status === caseStatusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={isPremium} />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('my_cases')} <span className="text-indigo-600 ml-2">({filteredCases.length})</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">আপনার সকল মামলার তালিকা ও আপডেট এখানে পাবেন।</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={onJoinCase}
            className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100"
          >
            <Plus size={20} /> মামলা যুক্ত করুন
          </button>
          <button 
            onClick={onAddCase}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
          >
            <Plus size={20} /> নতুন মামলা
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="মামলা নম্বর, আদালত বা নাম দিয়ে খুঁজুন..."
              value={caseSearchQuery}
              onChange={(e) => setCaseSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-600"
            >
              <option value="all">সব টাইপ</option>
              <option value="Civil">দেওয়ানী</option>
              <option value="Criminal">ফৌজদারী</option>
              <option value="High Court">হাইকোর্ট</option>
              <option value="Supreme Court">সুপ্রিম কোর্ট</option>
              <option value="Other">অন্যান্য</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 size={16} className="text-slate-400" />
            <select 
              value={caseStatusFilter}
              onChange={(e) => setCaseStatusFilter(e.target.value as any)}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-600"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="running">চলমান</option>
              <option value="disposed">নিষ্পত্তি</option>
              <option value="stayed">স্থগিত</option>
            </select>
          </div>
          <button className="ml-auto px-4 py-2 text-indigo-600 text-sm font-bold hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-2">
            <Download size={16} /> রিপোর্ট ডাউনলোড
          </button>
        </div>
      </div>

      {/* Cases Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCases.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group flex flex-col"
              >
                {/* Card Header */}
                <div className={`p-6 ${c.caseType === 'Civil' ? 'bg-blue-600' : 'bg-rose-600'} text-white relative overflow-hidden`}>
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md">
                        {c.caseType}
                      </span>
                      <h3 className="text-2xl font-black tracking-tight mt-2">{c.caseNumber}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onViewCard(c)}
                        className="p-2.5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all backdrop-blur-md border border-white/30"
                        title="কেস কার্ড প্রো"
                      >
                        <CreditCard size={18} />
                      </button>
                      <button 
                        onClick={() => onEditCase(c)}
                        className="p-2.5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all backdrop-blur-md border border-white/30"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">আদালত</p>
                        <p className="text-sm font-bold text-slate-700 leading-tight">{c.courtName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">পরবর্তী তারিখ</p>
                        <p className="text-sm font-bold text-indigo-600">{c.nextDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">পক্ষসমূহ</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{c.petitioner}</span>
                          <span className="text-[10px] font-black text-slate-300 italic">vs</span>
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{c.respondent}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                    <button 
                      onClick={() => onViewHistory(c)}
                      className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                      <History size={14} /> ইতিহাস
                    </button>
                    <button 
                      onClick={() => onDeleteCase(c.id)}
                      className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">মামলা নম্বর</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">আদালত</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">পরবর্তী তারিখ</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">স্ট্যাটাস</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${c.caseType === 'Civil' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                        {c.caseNumber.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.caseNumber}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{c.caseType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-600">{c.courtName}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-indigo-600">{c.nextDate}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      c.status === 'running' ? 'bg-emerald-50 text-emerald-600' : 
                      c.status === 'disposed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onViewCard(c)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <CreditCard size={18} />
                      </button>
                      <button onClick={() => onEditCase(c)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDeleteCase(c.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCases.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Search size={40} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">কোন মামলা পাওয়া যায়নি</h4>
            <p className="text-slate-500 font-medium">আপনার সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।</p>
          </div>
          <button 
            onClick={() => {
              setCaseSearchQuery('');
              setCaseFilter('all');
              setCaseStatusFilter('all');
            }}
            className="text-indigo-600 font-bold hover:underline"
          >
            সব ফিল্টার রিসেট করুন
          </button>
        </div>
      )}
    </div>
  );
};

interface CheckCircle2Props {
  size?: number;
  className?: string;
}

const CheckCircle2 = ({ size = 24, className = "" }: CheckCircle2Props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);
