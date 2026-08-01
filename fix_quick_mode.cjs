const fs = require('fs');
let code = fs.readFileSync('src/user/cases/CaseForm.tsx', 'utf8');

const target1 = `<label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</label>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input`;

const replacement1 = `<div className="flex justify-between items-center">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties'}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setPlaintiffs([...plaintiffs, { name: '', phone: '' }]);
                          setDefendants([...defendants, { name: '', serial: (defendants.length + 1).toString(), phone: '' }]);
                        }}
                        className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Plus size={14} /> {language === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {plaintiffs.map((p, i) => (
                        <div key={'p'+i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                          <input
                            type="text"
                            placeholder={language === 'bn' ? 'বাদীর নাম' : 'Petitioner Name'}
                            value={p.name || ''}
                            onChange={(e) => handlePartyChange(i, 'name', e.target.value, setPlaintiffs)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                          <input
                            type="tel"
                            placeholder={language === 'bn' ? 'বাদীপক্ষ মোবাইল নং' : 'Petitioner Mobile No.'}
                            value={p.phone || ''}
                            onChange={(e) => handlePartyChange(i, 'phone', e.target.value, setPlaintiffs)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                          {i > 0 && (
                            <button type="button" onClick={() => setPlaintiffs(prev => prev.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1"><Trash2 size={12}/></button>
                          )}
                        </div>
                      ))}
                      {defendants.map((d, i) => (
                        <div key={'d'+i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                          <input
                            type="text"
                            placeholder={language === 'bn' ? 'আসামীর নাম' : 'Respondent Name'}
                            value={d.name || ''}
                            onChange={(e) => handlePartyChange(i, 'name', e.target.value, setDefendants)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                          <input
                            type="tel"
                            placeholder={language === 'bn' ? 'আসামীপক্ষ মোবাইল নং' : 'Respondent Mobile No.'}
                            value={d.phone || ''}
                            onChange={(e) => handlePartyChange(i, 'phone', e.target.value, setDefendants)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                          {i > 0 && (
                            <button type="button" onClick={() => setDefendants(prev => prev.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1"><Trash2 size={12}/></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>`;

// Wait, I need to match the exact block to replace!
