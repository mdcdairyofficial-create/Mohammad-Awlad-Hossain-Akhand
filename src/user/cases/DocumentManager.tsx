import React, { useState, useEffect } from 'react';
import { FolderOpen, File, Download, Trash2, Search, Filter, Loader2, ExternalLink, X, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import FileUploader from './FileUploader';
import { listFiles, deleteFile, getPublicUrl } from '../../lib/storage';

interface Document {
  name: string;
  id: string | null;
  updated_at: string;
  created_at: string;
  metadata: any;
  url?: string;
}

export default function DocumentManager({ userId, onAddDocument }: { userId?: number, onAddDocument?: (caseId: string | number, document: { name: string; type: string; url: string }) => void }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const bucketName = 'documents';

  const [selectedCaseNumber, setSelectedCaseNumber] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseSearchInput, setCaseSearchInput] = useState('');
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [userCases, setUserCases] = useState<{caseNumber: string, id: number}[]>([]);

  useEffect(() => {
    const storedCases = localStorage.getItem('appCases');
    if (storedCases) {
      try {
        const parsed = JSON.parse(storedCases);
        setUserCases(parsed.map((c: any) => ({ caseNumber: c.caseNumber, id: c.id })));
      } catch (e) {
        console.error('Error parsing cases for DocumentManager', e);
      }
    }
  }, []);

  const filteredCases = userCases.filter(c => 
    c.caseNumber.toLowerCase().includes(caseSearchInput.toLowerCase())
  );

  const fetchDocuments = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const allFiles: Document[] = [];
      
      const listRecursive = async (path: string) => {
        const data = await listFiles(bucketName, path);
        if (data) {
          for (const item of data) {
            if (item.id === null) {
              // It's a folder
              await listRecursive(path ? `${path}/${item.name}` : item.name);
            } else {
              // It's a file
              const fileName = path ? `${path}/${item.name}` : item.name;
              let url = '';
              try {
                url = await getPublicUrl(bucketName, fileName);
              } catch (e) {
                console.error("Failed to get url for", fileName, e);
              }
              allFiles.push({
                ...item,
                name: fileName,
                url
              } as unknown as Document);
            }
          }
        }
      };

      await listRecursive('');
      setDocuments(allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      let errorMessage = error.message || 'ডকুমেন্টস লোড করা যাচ্ছে না।';
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে আপনার ইন্টারনেট কানেকশন এবং Supabase কনফিগারেশন চেক করুন।';
      }
      setFetchError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (name: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ডকুমেন্টটি ডিলিট করতে চান?')) return;
    
    try {
      await deleteFile(bucketName, name);
      setDocuments(documents.filter(doc => doc.name !== name));
    } catch (error) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return '🖼️';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    return '📁';
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    const ext = doc.name.split('.').pop()?.toLowerCase();
    if (filter === 'image') return matchesSearch && ['jpg', 'jpeg', 'png'].includes(ext || '');
    if (filter === 'pdf') return matchesSearch && ext === 'pdf';
    if (filter === 'doc') return matchesSearch && ['doc', 'docx'].includes(ext || '');
    if (filter === 'excel') return matchesSearch && ['xls', 'xlsx'].includes(ext || '');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FolderOpen className="text-indigo-600" /> আমার ডকুমেন্টস
          </h2>
          <p className="text-sm text-slate-500">আপনার প্রয়োজনীয় ফাইলগুলো এখানে আপলোড ও ম্যানেজ করুন</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">মামলা খুঁজুন ও নির্বাচন করুন (ঐচ্ছিক)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="মামলা নং লিখুন (উদা: ১/)"
                value={caseSearchInput}
                onChange={(e) => {
                  setCaseSearchInput(e.target.value);
                  setShowCaseDropdown(true);
                }}
                onFocus={() => setShowCaseDropdown(true)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                id="case-search-input"
              />
              {selectedCaseNumber && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 w-fit animate-in fade-in slide-in-from-top-1">
                  <CheckCircle className="text-indigo-500" size={14} />
                  নির্বাচিত মামলা: {selectedCaseNumber}
                  <button 
                    onClick={() => { 
                      setSelectedCaseNumber(''); 
                      setSelectedCaseId(null); 
                      setCaseSearchInput(''); 
                    }} 
                    className="ml-1 p-0.5 hover:bg-indigo-100 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {showCaseDropdown && caseSearchInput && (
              <div className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl max-h-[250px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider">সার্চ রেজাল্ট ({filteredCases.length})</p>
                </div>
                {filteredCases.length > 0 ? (
                  filteredCases.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseNumber(c.caseNumber);
                        setSelectedCaseId(c.id);
                        setCaseSearchInput(c.caseNumber);
                        setShowCaseDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm font-bold border-b border-slate-50 last:border-0 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-slate-700 group-hover:text-indigo-700">{c.caseNumber}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center flex flex-col items-center gap-2">
                    <Search size={24} className="text-slate-200" />
                    <p>কোনো মামলা পাওয়া যায়নি</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
            <h3 className="text-sm font-bold text-slate-700">নতুন ফাইল আপলোড করুন</h3>
          </div>
          <FileUploader 
            caseNumber={selectedCaseNumber} 
            onUploadSuccess={(url, fileName) => {
              fetchDocuments();
              if (onAddDocument && selectedCaseId) {
                const ext = fileName.split('.').pop() || 'file';
                // Use the original fileName (without timestamp) for history
                onAddDocument(selectedCaseId, { name: fileName, type: ext, url });
              }
            }} 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ফাইল খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              সব
            </button>
            <button 
              onClick={() => setFilter('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filter === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ছবি
            </button>
            <button 
              onClick={() => setFilter('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filter === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              পিডিএফ
            </button>
            <button 
              onClick={() => setFilter('doc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filter === 'doc' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ডকস
            </button>
            <button 
              onClick={() => setFilter('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filter === 'excel' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              এক্সেল
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-bold">ফাইলের নাম</th>
                <th className="px-6 py-3 font-bold">তারিখ</th>
                <th className="px-6 py-3 font-bold text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="text-indigo-600 animate-spin" size={24} />
                      <p className="text-sm text-slate-500 font-medium">ডকুমেন্টস লোড হচ্ছে...</p>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                        <AlertCircle size={24} />
                      </div>
                      <p className="text-sm text-rose-600 font-bold">{fetchError}</p>
                      <button 
                        onClick={() => fetchDocuments()}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        আবার চেষ্টা করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const parts = doc.name.split('/');
                  const rawFileName = parts[parts.length - 1];
                  const fileName = rawFileName.includes('-') && /^\d{13}-/.test(rawFileName) 
                    ? rawFileName.split('-').slice(1).join('-') 
                    : rawFileName;
                  const folderPath = parts.slice(0, -1).join(' / ');
                  
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getFileIcon(doc.name)}</span>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-[300px]" title={doc.name}>
                              {fileName}
                            </p>
                            {folderPath && (
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{folderPath}</p>
                            )}
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{doc.name.split('.').pop()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(doc.created_at).toLocaleDateString('bn-BD')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={doc.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="ডাউনলোড"
                          >
                            <Download size={18} />
                          </a>
                          <button 
                            onClick={() => handleDelete(doc.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="ডিলিট"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen className="text-slate-200" size={48} />
                      <p className="text-sm text-slate-500 font-medium">কোনো ডকুমেন্ট পাওয়া যায়নি</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
