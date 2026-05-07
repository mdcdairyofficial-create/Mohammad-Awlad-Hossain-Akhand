import React from 'react';
import { motion } from 'motion/react';
import { Clock, FileText, Download, Edit2, Paperclip } from 'lucide-react';
import { Case, CaseHistoryEntry } from '../../../types';

interface TimelineViewProps {
  caseData: Case;
  t: (key: string) => string;
  theme: 'light' | 'dark';
  onEditEntry?: (entry: CaseHistoryEntry) => void;
  onUploadDoc?: (entry: CaseHistoryEntry) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ caseData, t, theme, onEditEntry, onUploadDoc }) => {
  const history = caseData.history || [];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">{t('case_timeline')}</h3>
      <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
        {history.length > 0 ? (
          history.map((entry: CaseHistoryEntry, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className={`absolute -left-[33px] p-1 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="w-4 h-4 rounded-full bg-indigo-500" />
              </div>
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={14} />
                    <span className="font-bold">{entry.date}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onUploadDoc?.(entry)} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors" title={t('add_attachment')}>
                      <Paperclip size={16} className="text-slate-400" />
                    </button>
                    <button onClick={() => onEditEntry?.(entry)} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors" title={t('edit')}>
                      <Edit2 size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-lg">{entry.description}</h4>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs font-medium text-slate-400 capitalize">{entry.actionBy}</div>
                  <button className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline">
                    <Download size={14} /> {t('download_order')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400">{t('no_history_found')}</div>
        )}
      </div>
    </div>
  );
};
