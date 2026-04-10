import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  FileText, 
  User, 
  Scale, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  ArrowLeft,
  Plus
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'diary' | 'order' | 'date' | 'document' | 'comment';
  content: string;
  date: string;
  time: string;
  uploaderName: string;
  uploaderRole: 'lawyer' | 'clerk' | 'client' | 'admin';
  uploaderSide: 'petitioner' | 'respondent'; // বাদী | বিবাদী
  isSharedWithOpponent: boolean;
  attachments?: string[];
}

interface CaseTimelineProps {
  caseInfo: {
    caseNumber: string;
    courtName: string;
    petitioner: string;
    respondent: string;
    status: string;
  };
  currentUserRole: 'lawyer' | 'clerk' | 'client' | 'admin';
  currentUserSide: 'petitioner' | 'respondent';
  onBack: () => void;
  theme: 'light' | 'dark';
}

export default function CaseTimeline({ caseInfo, currentUserRole, currentUserSide, onBack, theme }: CaseTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      id: '1',
      type: 'date',
      content: 'আগামী শুনানির তারিখ নির্ধারণ করা হয়েছে।',
      date: '2025-03-15',
      time: '10:30 AM',
      uploaderName: 'অ্যাডভোকেট রহিম',
      uploaderRole: 'lawyer',
      uploaderSide: 'petitioner',
      isSharedWithOpponent: true,
    },
    {
      id: '2',
      type: 'order',
      content: 'আদালত আসামির জামিন মঞ্জুর করেছেন।',
      date: '2025-02-28',
      time: '02:15 PM',
      uploaderName: 'অ্যাডভোকেট করিম',
      uploaderRole: 'lawyer',
      uploaderSide: 'respondent',
      isSharedWithOpponent: true,
      attachments: ['bail_order.pdf'],
    },
    {
      id: '3',
      type: 'diary',
      content: 'ক্লায়েন্টের সাথে মিটিং সম্পন্ন হয়েছে। প্রয়োজনীয় কাগজপত্র সংগ্রহ করা হয়েছে।',
      date: '2025-02-25',
      time: '05:00 PM',
      uploaderName: 'মুহুরি রফিক',
      uploaderRole: 'clerk',
      uploaderSide: 'petitioner',
      isSharedWithOpponent: false,
    }
  ]);

  const [newEventContent, setNewEventContent] = useState('');
  const [newEventType, setNewEventType] = useState<TimelineEvent['type']>('diary');
  const [isShared, setIsShared] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddEvent = () => {
    if (!newEventContent.trim()) return;

    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      type: newEventType,
      content: newEventContent,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      uploaderName: currentUserRole === 'lawyer' ? 'অ্যাডভোকেট (আমি)' : currentUserRole === 'clerk' ? 'মুহুরি (আমি)' : currentUserRole === 'client' ? 'ক্লায়েন্ট (আমি)' : 'সাধারণ (আমি)',
      uploaderRole: currentUserRole,
      uploaderSide: currentUserSide,
      isSharedWithOpponent: isShared,
    };

    setEvents([newEvent, ...events]);
    setNewEventContent('');
    setIsAdding(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'diary': return <FileText size={18} />;
      case 'order': return <Scale size={18} />;
      case 'date': return <Calendar size={18} />;
      case 'document': return <Paperclip size={18} />;
      case 'comment': return <MessageSquare size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'diary': return 'bg-blue-500 text-white';
      case 'order': return 'bg-purple-500 text-white';
      case 'date': return 'bg-emerald-500 text-white';
      case 'document': return 'bg-amber-500 text-white';
      case 'comment': return 'bg-slate-500 text-white';
      default: return 'bg-indigo-500 text-white';
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'diary': return 'ডায়েরি আপডেট';
      case 'order': return 'আদালতের আদেশ';
      case 'date': return 'পরবর্তী তারিখ';
      case 'document': return 'নথি সংযুক্ত';
      case 'comment': return 'মন্তব্য';
      default: return 'আপডেট';
    }
  };

  // Filter events based on visibility rules
  const visibleEvents = events.filter(event => {
    // If I am the uploader's side, I can see it
    if (event.uploaderSide === currentUserSide) return true;
    // If it's from the opponent, I can only see it if it's shared
    if (event.isSharedWithOpponent) return true;
    return false;
  });

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Header */}
      <div className={`p-6 border-b flex items-center gap-4 sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button 
          onClick={onBack}
          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold">{caseInfo.caseNumber}</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{caseInfo.courtName}</p>
        </div>
        <div className="ml-auto flex gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            {caseInfo.status}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${currentUserSide === 'petitioner' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
            {currentUserSide === 'petitioner' ? 'বাদী পক্ষ' : 'বিবাদী পক্ষ'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {/* Parties Info */}
        <div className={`mb-8 p-6 rounded-2xl border flex flex-col md:flex-row gap-6 justify-between ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-emerald-600 mb-2 uppercase tracking-wider">বাদী (Plaintiff)</h3>
            <p className="font-medium">{caseInfo.petitioner}</p>
          </div>
          <div className="hidden md:flex items-center justify-center px-4">
            <div className={`w-px h-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <span className={`absolute px-2 text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>VS</span>
          </div>
          <div className="flex-1 md:text-right">
            <h3 className="text-sm font-bold text-rose-600 mb-2 uppercase tracking-wider">বিবাদী (Defendant)</h3>
            <p className="font-medium">{caseInfo.respondent}</p>
          </div>
        </div>

        {/* Add Event Button / Form */}
        {currentUserRole !== 'client' && (
          <div className="mb-8">
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
              >
                <Plus size={20} />
                নতুন আপডেট যুক্ত করুন
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
              >
                <h3 className="font-bold mb-4">নতুন আপডেট</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {(['diary', 'order', 'date', 'document'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewEventType(type)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-colors ${
                        newEventType === type 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {getEventIcon(type)}
                      {getEventTypeName(type)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newEventContent}
                  onChange={(e) => setNewEventContent(e.target.value)}
                  placeholder="বিস্তারিত লিখুন..."
                  className={`w-full p-4 rounded-xl border mb-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium flex items-center gap-1">
                      {isShared ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} className="text-slate-400" />}
                      উভয় পক্ষের জন্য উন্মুক্ত করুন (Share with Opponent)
                    </span>
                  </label>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold border ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}
                    >
                      বাতিল
                    </button>
                    <button 
                      onClick={handleAddEvent}
                      disabled={!newEventContent.trim()}
                      className="flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      সেভ করুন
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className={`absolute left-8 top-4 bottom-4 w-0.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

          <div className="space-y-6">
            {visibleEvents.map((event, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={event.id} 
                className="relative pl-20"
              >
                {/* Timeline Node */}
                <div className={`absolute left-4 top-4 w-8 h-8 rounded-full flex items-center justify-center border-4 shadow-sm z-10 ${getEventColor(event.type)} ${theme === 'dark' ? 'border-slate-900' : 'border-slate-50'}`}>
                  {getEventIcon(event.type)}
                </div>

                {/* Event Card */}
                <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${event.uploaderSide === 'petitioner' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{event.uploaderName}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-medium ${event.uploaderSide === 'petitioner' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {event.uploaderSide === 'petitioner' ? 'বাদী পক্ষ' : 'বিবাদী পক্ষ'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{event.date} at {event.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        {getEventTypeName(event.type)}
                      </span>
                      {event.isSharedWithOpponent ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" title="উভয় পক্ষের জন্য উন্মুক্ত">
                          <Eye size={12} />
                          Shared
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400" title="শুধুমাত্র নিজ পক্ষের জন্য">
                          <EyeOff size={12} />
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                    {event.content}
                  </div>

                  {event.attachments && event.attachments.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {event.attachments.map((file, i) => (
                        <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors ${theme === 'dark' ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                          <Paperclip size={14} />
                          {file}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
