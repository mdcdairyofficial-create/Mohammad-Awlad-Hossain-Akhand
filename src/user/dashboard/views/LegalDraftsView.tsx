import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Download, 
  Copy, 
  ChevronRight,
  BookOpen,
  Scale,
  Gavel,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  categoryBn: string;
  content: string;
}

export const LegalDraftsView = ({ language }: { language: 'bn' | 'en' | 'hi' | 'ur' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const templates: Template[] = [
    {
      id: '1',
      title: 'Vakalatnama (Power of Attorney)',
      titleBn: 'ওকালতনামা (পাওয়ার অফ অ্যাটর্নি)',
      category: 'General',
      categoryBn: 'সাধারণ',
      content: `IN THE COURT OF... \nCase No... of 2024 \n\nPetitioner: ... \nRespondent: ... \n\nKNOW ALL MEN BY THESE PRESENTS that I/We... do hereby appoint... Advocate to be my/our Advocate in the above-mentioned case...`
    },
    {
      id: '2',
      title: 'Civil Suit - Money Recovery',
      titleBn: 'দেওয়ানী মামলা - অর্থ উদ্ধার',
      category: 'Civil',
      categoryBn: 'দেওয়ানী',
      content: `IN THE COURT OF THE JOINT DISTRICT JUDGE, ... \n\nMoney Suit No... of 2024 \n\nPlaintiff: ... \nDefendant: ... \n\nPLINTIFF'S CLAIM FOR RECOVERY OF BDT... \n\nThe Plaintiff most respectfully states: \n1. That the defendant borrowed...`
    },
    {
      id: '3',
      title: 'Criminal Revision - 439 CrPC',
      titleBn: 'ফৌজদারি রিভিশন - ৪৩৯ সিআরপিসি',
      category: 'Criminal',
      categoryBn: 'ফৌজদারি',
      content: `IN THE HIGH COURT DIVISION OF THE SUPREME COURT OF BANGLADESH... \n\nCriminal Revision No... of 2024 \n\nPetitioner: ... \nOpposite Party: ... \n\nIn the matter of an application under Section 439 of the CrPC...`
    }
  ];

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.titleBn.includes(searchQuery)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">
            {language === 'bn' ? 'আইনি খসড়া ও ফরম' : 'Legal Drafts & Formats'}
          </h2>
          <p className="text-indigo-100 font-medium opacity-90 max-w-lg leading-relaxed">
            {language === 'bn' 
              ? 'আইনি কাজের জন্য প্রয়োজনীয় সকল প্রকার খসড়া এবং ফরম্যাট এখানে পাবেন যা আপনি সরাসরি কপি বা ডাউনলোড করতে পারবেন।' 
              : 'Find all necessary legal drafts and formats here that you can copy or download directly.'}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={language === 'bn' ? 'খসড়া খুঁজুন...' : 'Search templates...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="space-y-3">
            {filteredTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-6 rounded-3xl transition-all border ${
                  selectedTemplate?.id === t.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-2' 
                    : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${selectedTemplate?.id === t.id ? 'text-indigo-200' : 'text-indigo-600'}`}>
                      {language === 'bn' ? t.categoryBn : t.category}
                    </p>
                    <h4 className="font-bold">{language === 'bn' ? t.titleBn : t.title}</h4>
                  </div>
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor/Viewer */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <motion.div 
              key={selectedTemplate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden h-full flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{language === 'bn' ? selectedTemplate.titleBn : selectedTemplate.title}</h3>
                    <p className="text-slate-500 text-sm font-medium">{language === 'bn' ? selectedTemplate.categoryBn : selectedTemplate.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedTemplate.content)}
                    className="flex items-center gap-2 p-3 bg-white border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Copy size={20} />
                    <span className="text-sm font-bold">{language === 'bn' ? 'কপি' : 'Copy'}</span>
                  </button>
                  <button className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                    <Download size={20} />
                  </button>
                </div>
              </div>
              <div className="p-8 flex-1">
                <textarea 
                  value={selectedTemplate.content}
                  readOnly
                  className="w-full h-full min-h-[400px] p-6 bg-slate-50 border-none rounded-3xl font-mono text-sm leading-relaxed text-slate-700 focus:ring-0 outline-none resize-none"
                />
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Scale size={48} className="text-slate-200" />
              </div>
              <h4 className="text-xl font-bold text-slate-400 mb-2">
                {language === 'bn' ? 'খসড়া নির্বাচন করুন' : 'Select a Template'}
              </h4>
              <p className="text-slate-400 font-medium max-w-xs">
                {language === 'bn' 
                  ? 'বামিকের তালিকা থেকে একটি খসড়া নির্বাচন করে তার বিস্তারিত ফরম্যাট দেখতে পারবেন।' 
                  : 'Select a template from the list to view its full format.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
