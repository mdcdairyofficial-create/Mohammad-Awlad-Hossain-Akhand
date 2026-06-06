import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  Copy, 
  FileText, 
  User, 
  Building2,
  Trash2, 
  Smartphone,
  CheckCircle2,
  Camera,
  Share2,
  Paperclip,
  X,
  Loader2,
  Upload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Case } from '../../types';
import { uploadFile, getPublicUrl } from '../../lib/storage';
import { AdBanner } from './AdBanner';

interface CaseCardProProps {
  caseData: Case;
  onUpdate: (id: string | number, nextDate: string, order: string, selectedParty: 'petitioner' | 'respondent' | 'accused', clerkCanCall?: boolean, lawyerCanCall?: boolean, visibility?: 'private' | 'public', attachedDocs?: {name: string, type: string, url: string}[]) => void;
  onCaseNumberClick?: (caseNumber: string) => void;
  onAddDocument: (id: string | number, document: { name: string; type: string; url: string }) => void;
  onDelete?: (id: string | number) => void;
  isPetitioner?: boolean;
  isRespondent?: boolean;
  userType: string;
  userMobile: string;
}

export const CaseCardPro = ({ 
  caseData, 
  onUpdate, 
  onCaseNumberClick, 
  onAddDocument, 
  onDelete, 
  isPetitioner, 
  isRespondent, 
  userType, 
  userMobile 
}: CaseCardProProps) => {
  const [side, setSide] = useState<'petitioner' | 'respondent' | 'accused'>(caseData.selectedParty || 'petitioner');
  const [nextDate, setNextDate] = useState(caseData.nextDate);
  const [order, setOrder] = useState(caseData.order || '');
  const [clerkCanCall, setClerkCanCall] = useState(caseData.clerkCanCall || false);
  const [lawyerCanCall, setLawyerCanCall] = useState(caseData.lawyerCanCall || false);
  const [visibility, setVisibility] = useState<'private' | 'public'>(caseData.visibility as any || 'private');
  const [attachedDocs, setAttachedDocs] = useState<{name: string, type: string, url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [showAd, setShowAd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  const isOwner = isPetitioner || isRespondent;
  const canCall = (isOwner || (userType === 'lawyer' ? caseData.lawyerCanCall : caseData.clerkCanCall));

  const getDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const renderCalendarTable = () => {
    const month = calDate.getMonth();
    const year = calDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const weekDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const todayStr = getDateStr(new Date());

    return (
      <div className="bg-white border border-slate-200 shadow-2xl p-3 rounded-2xl min-w-[220px] text-slate-900 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-3 bg-slate-50 p-1.5 rounded-xl">
          <button onClick={(e) => { e.stopPropagation(); setCalDate(new Date(year, month - 1)); }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">{'<'}</button>
          <span className="font-bold text-sm text-slate-700">{monthNames[month]} {year}</span>
          <button onClick={(e) => { e.stopPropagation(); setCalDate(new Date(year, month + 1)); }} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all">{'>'}</button>
        </div>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr>
              {weekDays.map(d => <th key={d} className="p-1 text-slate-400 font-bold uppercase text-[9px]">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(days.length / 7) }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {days.slice(rowIndex * 7, (rowIndex + 1) * 7).map((day, colIndex) => {
                  if (!day) return <td key={colIndex} className="p-0.5" />;
                  const currentStr = getDateStr(new Date(year, month, day));
                  const isSelected = nextDate === currentStr;
                  const isToday = todayStr === currentStr;
                  
                  return (
                    <td key={colIndex} className="p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNextDate(currentStr);
                          setShowCalendar(false);
                        }}
                        className={`w-full h-8 flex items-center justify-center rounded-lg transition-all ${
                          isSelected 
                          ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200' 
                          : isToday
                          ? 'bg-orange-100 text-orange-700 font-bold border border-orange-200'
                          : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setNextDate(todayStr);
            setShowCalendar(false);
          }}
          className="w-full mt-3 py-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          আজকের তারিখ সেট করুন
        </button>
      </div>
    );
  };

  const handleAction = (msg: string, update: boolean = false) => {
    if (update) {
      onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs);
      setAttachedDocs([]);
    }
    setConfirmMsg(msg);
    setShowAd(true);
  };

  const handleAllPartiesUpdate = () => {
    if (caseData.isUpdated) {
      handleAction('ধন্যবাদ, আপনার আগেই তথ্য আপলোড করা হয়েছে। আপনি অন্যত্র চেষ্টা করুন।', false);
      return;
    }
    onUpdate(caseData.id, nextDate, order, side, clerkCanCall, lawyerCanCall, visibility, attachedDocs);
    setAttachedDocs([]);
    handleAction('সকল পক্ষের ক্যালেন্ডারে তথ্য আপডেট করা হয়েছে।', true);
  };

  const onAdClose = () => {
    setShowAd(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const doc = new jsPDF();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onload = (event) => {
          const imgData = event.target?.result as string;
          if (i > 0) doc.addPage();
          doc.addImage(imgData, 'JPEG', 10, 10, 180, 250);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    const pdfBlob = doc.output('blob');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${caseData.caseNumber}_${Date.now()}.pdf`;
    const path = `${caseData.caseNumber}/${dateStr}/${fileName}`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    await uploadFile('documents', path, file);
    const url = await getPublicUrl('documents', path);
    
    onAddDocument(caseData.id, { name: fileName, type: 'pdf', url });
    alert('PDF আপলোড হয়েছে: ' + url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      {showAd && <AdBanner />}
      
      {showConfirm && (
        <div className="fixed top-4 right-4 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">{confirmMsg}</span>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${caseData.caseType === 'Civil' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  onClick={() => onCaseNumberClick?.(caseData.caseNumber)}
                  className="text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                >
                  {caseData.caseNumber}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${caseData.caseType === 'Civil' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                  {caseData.caseType}
                </span>
              </div>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" />
                {caseData.courtName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onDelete && (
              <button 
                onClick={() => onDelete(caseData.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="মামলা মুছুন"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                আগামী তারিখ <span className="opacity-70">(Next Date)</span>
              </p>
              <p className="text-sm font-bold text-indigo-600">{caseData.nextDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">বাদী/আবেদনকারী (Petitioner)</p>
                  <p className="font-bold text-slate-800">{caseData.petitioner}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-300">VS</span>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">বিবাদী/আসামী (Respondent)</p>
                  <p className="font-bold text-slate-800">{caseData.respondent}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shadow-sm">
                  <User size={20} className="text-rose-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">পদক্ষেপ (Step/Action)</p>
                <p className="text-sm font-bold text-slate-700">{caseData.order || caseData.status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">আইনজীবী (Lawyer)</p>
                <p className="text-sm font-bold text-slate-700">{caseData.petitionerLawyer || caseData.respondentLawyer || 'নির্ধারিত নেই'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">আগামী তারিখ (Next Date)</p>
                  <div className="relative">
                    <input 
                      type="text"
                      value={nextDate}
                      readOnly
                      onClick={() => setShowCalendar(true)}
                      placeholder="YYYY-MM-DD"
                      className="w-full pl-4 pr-10 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar); }}
                      className="absolute right-3 top-3.5 text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50 p-1 rounded-lg"
                    >
                      <Calendar size={18} />
                    </button>
                    {showCalendar && (
                      <div className="absolute z-[60] mt-2 top-full right-0">
                        {renderCalendarTable()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">আপনার পক্ষ (Your Party)</p>
                  <select 
                    value={side}
                    onChange={(e) => setSide(e.target.value as any)}
                    className={`w-full px-4 py-3 border rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all ${
                      side === 'petitioner' 
                        ? 'bg-sky-50 text-sky-700 border-sky-100 focus:ring-sky-500' 
                        : 'bg-red-50 text-red-700 border-red-100 focus:ring-red-500'
                    }`}
                  >
                    <option value="petitioner" className="text-sky-700">বাদী পক্ষ (Petitioner - Sky)</option>
                    <option value="respondent" className="text-red-700">বিবাদী পক্ষ (Respondent - Red)</option>
                    <option value="accused" className="text-red-700">আসামি পক্ষ (Accused - Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1 ml-1">পদক্ষেপ / আদেশ (Step / Order)</p>
                <textarea 
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="হাজিরা, সময়, স্বাক্ষী, জেরা অথবা আজকের আদেশ লিখুন..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24 mb-3"
                />
                
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 ml-1">সংযুক্ত ডকুমেন্ট (Attached Documents)</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachedDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600">
                        <FileText size={14} />
                        <span className="truncate max-w-[100px]">{doc.name}</span>
                        <button type="button" onClick={() => setAttachedDocs(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                           <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input 
                    type="file" 
                    id="update-doc-upload"
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploading(true);
                      try {
                        const dateStr = new Date().toISOString().split('T')[0];
                        const path = `${caseData.caseNumber}/${dateStr}/updates/${Date.now()}_${file.name}`;
                        await uploadFile('documents', path, file);
                        const url = await getPublicUrl('documents', path);
                        setAttachedDocs(prev => [...prev, { name: file.name, type: file.type, url }]);
                      } catch (err) {
                        console.error("Upload failed", err);
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => document.getElementById('update-doc-upload')?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all"
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Paperclip size={14} />}
                    ডকুমেন্ট যোগ করুন
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => handleAction('আপনার তথ্য সফলভাবে আপডেট হয়েছে।', true)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  আপডেট করুন
                </button>
                <button 
                  onClick={handleAllPartiesUpdate}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  সকল পক্ষকে জানান
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
            >
              <Camera size={16} />
              ছবি থেকে PDF
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
            
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">কল করার অনুমতি:</span>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={clerkCanCall} 
                  onChange={(e) => setClerkCanCall(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">মুহুরি</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={lawyerCanCall} 
                  onChange={(e) => setLawyerCanCall(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">আইনজীবী</span>
              </label>

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={visibility === 'public'} 
                  onChange={(e) => setVisibility(e.target.checked ? 'public' : 'private')}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">পাবলিক ভিউ</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCall && (
              <a 
                href={`tel:${caseData.petitionerMobile}`}
                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                title="কল করুন"
              >
                <Smartphone size={20} />
              </a>
            )}
            <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
