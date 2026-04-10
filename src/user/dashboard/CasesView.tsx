import React from 'react';
import { motion } from 'motion/react';
import { Search, Plus, FileText, ChevronRight, User, Briefcase } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface CasesViewProps {
  theme: 'light' | 'dark';
  language: 'en' | 'bn' | 'hi';
  currentViewMode: 'lawyer' | 'clerk' | 'client' | 'admin';
  caseSearchQuery: string;
  setCaseSearchQuery: (query: string) => void;
  handleCaseSearch: (e: React.FormEvent) => void;
  setIsCaseFormOpen: (open: boolean) => void;
  setEditingCase: (caseData: any) => void;
  visibleCases: any[];
  handleEditCase: (caseData: any) => void;
  t: (key: string) => string;
}

const CasesView: React.FC<CasesViewProps> = ({
  theme,
  language,
  currentViewMode,
  caseSearchQuery,
  setCaseSearchQuery,
  handleCaseSearch,
  setIsCaseFormOpen,
  setEditingCase,
  visibleCases,
  handleEditCase,
  t
}) => {
  return (
    <div className="space-y-6">
      <AdBanner theme={theme} />
      <div className={`p-6 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold">{t('case_list')}</h3>
            <p className="text-slate-500 text-sm font-medium">{language === 'bn' ? 'আপনার সকল মামলার তালিকা এখানে পাবেন' : 'Find all your cases here'}</p>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={handleCaseSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                value={caseSearchQuery}
                onChange={(e) => setCaseSearchQuery(e.target.value)}
                placeholder={t('search_cases')}
                className={`pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 font-medium ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
              />
            </form>
            {currentViewMode !== 'client' && (
              <button 
                onClick={() => {
                  setEditingCase(null);
                  setIsCaseFormOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
              >
                <Plus size={18} />
                {t('new_case')}
              </button>
            )}
          </div>
        </div>

        <div className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-50'}`}>
          {visibleCases.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-500 font-bold">{language === 'bn' ? 'কোনো মামলা পাওয়া যায়নি' : 'No cases found'}</p>
            </div>
          ) : (
            visibleCases.map((c) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleEditCase(c)}
                className={`p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between group cursor-pointer gap-4 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl group-hover:bg-white transition-colors ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <FileText className="text-slate-500 group-hover:text-indigo-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{language === 'bn' ? 'মামলা নং ' : language === 'hi' ? 'मामला संख्या ' : 'Case No. '}{c.caseNumber}</h4>
                    <p className="text-slate-500 text-sm font-medium">{c.courtName}</p>
                    <div className="text-xs mt-2 flex flex-wrap gap-2 items-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100">{c.petitioner}</span>
                      <span className="text-slate-400 font-black">VS</span>
                      <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg font-bold border border-rose-100">{c.respondent}</span>
                    </div>
                    {(c.petitionerLawyer || c.petitionerClerk || c.respondentLawyer || c.respondentClerk) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.petitionerLawyer && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                            <User size={10} /> {c.petitionerLawyer} (L)
                          </span>
                        )}
                        {c.petitionerClerk && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                            <Briefcase size={10} /> {c.petitionerClerk} (C)
                          </span>
                        )}
                        {c.respondentLawyer && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                            <User size={10} /> {c.respondentLawyer} (L)
                          </span>
                        )}
                        {c.respondentClerk && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold border border-slate-200">
                            <Briefcase size={10} /> {c.respondentClerk} (C)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">{language === 'bn' ? 'পরবর্তী তারিখ' : 'Next Date'}</p>
                    <p className="text-sm font-black text-slate-700">{c.nextDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                      c.status === 'running' ? 'bg-emerald-100 text-emerald-700' : 
                      c.status === 'stayed' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.status}
                    </span>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" size={20} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CasesView;
