import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Check,
  Briefcase
} from 'lucide-react';
import { Task } from '../../../types';
import { AdBanner } from '../AdBanner';

interface TasksViewProps {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (t: Task) => void;
  onDeleteTask: (id: string | number) => void;
  onToggleTask: (id: string | number) => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: string) => string;
  isPremium?: boolean;
  isPremiumForAds?: boolean;
}

export const TasksView = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  language,
  t,
  isPremium = false,
  isPremiumForAds = false
}: TasksViewProps) => {
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={isPremiumForAds} />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('tasks')} <span className="text-indigo-600 ml-2">({pendingTasks.length})</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">{t('tasks_subtitle')}</p>
        </div>
        <button 
          onClick={onAddTask}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
        >
          <Plus size={20} /> {t('new_task')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Clock className="text-amber-500" size={24} /> {t('pending_tasks')}
            </h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-black rounded-full border border-amber-100 uppercase tracking-wider">
              {pendingTasks.length} টি
            </span>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-6">
                      <button 
                        onClick={() => onToggleTask(task.id)}
                        className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center text-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all shrink-0 mt-1"
                      >
                        <Check size={20} />
                      </button>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                            {task.caseNumber && (
                              <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                                <Briefcase size={12} /> {t('task_case_number')}: {task.caseNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              task.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {task.priority}
                            </span>
                            <div className="relative group/menu">
                              <button className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400">
                                <MoreVertical size={18} />
                              </button>
                              <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                                <button 
                                  onClick={() => onEditTask(task)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                  <Edit2 size={16} /> {t('edit')}
                                </button>
                                <button 
                                  onClick={() => onDeleteTask(task.id)}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                  <Trash2 size={16} /> {t('delete')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Calendar size={14} />
                            {task.dueDate}
                          </div>
                          {task.assignedTo && (
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                              <User size={14} />
                              {task.assignedTo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Priority Indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      task.priority === 'high' ? 'bg-rose-500' : 
                      task.priority === 'medium' ? 'bg-amber-500' : 
                      'bg-emerald-500'
                    }`} />
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4 opacity-40">
                  <CheckCircle2 size={64} className="text-slate-300 mx-auto" />
                  <p className="text-lg font-bold text-slate-500">{t('all_tasks_done')}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Completed Tasks & Stats Section */}
        <div className="space-y-8">
          {/* Stats Card */}
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-bold">{t('task_progress')}</h3>
              <div className="flex items-end gap-4">
                <h4 className="text-5xl font-black">{Math.round((completedTasks.length / (tasks.length || 1)) * 100)}%</h4>
                <p className="text-indigo-100 font-bold text-sm mb-2 uppercase tracking-widest">{t('task_done')}</p>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedTasks.length / (tasks.length || 1)) * 100}%` }}
                  className="h-full bg-white rounded-full shadow-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{t('total_work')}</p>
                  <p className="text-xl font-bold">{tasks.length}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{t('ongoing')}</p>
                  <p className="text-xl font-bold">{pendingTasks.length}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          </div>

          {/* Completed Tasks List */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={24} /> {t('completed_tasks')}
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100"
                  >
                    <Check size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-400 line-through truncate text-sm">{task.title}</h5>
                    <p className="text-[10px] font-bold text-slate-300 uppercase">{task.dueDate}</p>
                  </div>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-center text-sm font-bold text-slate-400 py-8 italic">{t('no_tasks_done')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
