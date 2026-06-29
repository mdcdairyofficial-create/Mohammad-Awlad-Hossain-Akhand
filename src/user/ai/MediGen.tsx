import React, { useState, useEffect } from 'react';
import { Stethoscope, Building2, Globe, Languages, Printer, ExternalLink, Loader2, Copy, Award } from 'lucide-react';
import Markdown from 'react-markdown';
import { AdBanner } from '../dashboard/AdBanner';
import { fetchWithAuth } from '../../lib/api';
import { auth, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type Language = 'en' | 'bn';

interface MediGenProps {
  points?: number;
  onPointsUpdate?: (newPoints: number) => void;
}

export default function MediGen({ points = 0, onPointsUpdate }: MediGenProps) {
  const [lang, setLang] = useState<Language>('bn'); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [yellowBalls, setYellowBalls] = useState<number | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setYellowBalls(data.yellow_balls_count || 0);
      }
    }, (error) => {
      console.error("Real-time snapshot error in MediGen:", error);
    });
    return () => unsubscribe();
  }, []);
  const [references, setReferences] = useState<{ uri: string; title: string }[]>([]);

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [disease, setDisease] = useState('');
  const [formulaSystem, setFormulaSystem] = useState('');
  const [selectedProductForms, setSelectedProductForms] = useState<string[]>([]);
  const [qualityTier, setQualityTier] = useState('');
  const [keyIngredients, setKeyIngredients] = useState('');

  const productForms = [
    { id: 'Syrup', en: 'Syrup', bn: 'সিরাপ' },
    { id: 'Tablet', en: 'Tablet', bn: 'ট্যাবলেট' },
    { id: 'Capsule', en: 'Capsule', bn: 'ক্যাপসুল' },
    { id: 'Oil', en: 'Oil', bn: 'তেল' },
    { id: 'Powder', en: 'Powder', bn: 'পাউডার' },
    { id: 'Ointment', en: 'Ointment', bn: 'মলম' },
    { id: 'Drop', en: 'Drop', bn: 'ড্রপ' },
    { id: 'Injection', en: 'Injection', bn: 'ইনজেকশন' },
  ];

  const toggleProductForm = (id: string) => {
    setSelectedProductForms(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const t = (key: string) => {
    const translations: Record<string, Record<Language, string>> = {
      title: { en: 'MediGen', bn: 'মেডিজেন' },
      subtitle_personal: { en: 'Chat & provide details repeatedly for better advice', bn: 'বারবার চ্যাট করে তথ্য প্রদান করে সঠিক পরামর্শ নিন' },
      patient_name: { en: 'Patient Name', bn: 'রোগীর নাম' },
      age: { en: 'Age', bn: 'বয়স' },
      gender: { en: 'Gender', bn: 'লিঙ্গ' },
      male: { en: 'Male', bn: 'পুরুষ' },
      female: { en: 'Female', bn: 'মহিলা' },
      other: { en: 'Other', bn: 'অন্যান্য' },
      disease: { en: 'Disease / Problem Description', bn: 'রোগ / সমস্যার বিবরণ' },
      formula_system: { en: 'Formula System', bn: 'ফর্মুলা সিস্টেম' },
      product_form: { en: 'Product Form', bn: 'পণ্যের ধরন' },
      quality_tier: { en: 'Quality Tier', bn: 'কোয়ালিটি টিয়ার' },
      key_ingredients: { en: 'Key Ingredients (Optional)', bn: 'মূল উপাদান (ঐচ্ছিক)' },
      generate: { en: 'Generate Formula', bn: 'ফর্মুলা তৈরি করুন' },
      generating: { en: 'Generating...', bn: 'তৈরি হচ্ছে...' },
      print: { en: 'Print', bn: 'প্রিন্ট করুন' },
      references: { en: 'Reference Links', bn: 'তথ্যসূত্র' },
      select: { en: 'Select...', bn: 'নির্বাচন করুন...' },
    };
    return translations[key]?.[lang] || key;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[MediGen] handleGenerate called");
    if (!disease) {
        console.warn("[MediGen] No disease description");
        return;
    }

    setLoading(true);
    setResult('');
    setReferences([]);

    try {
      const user = auth.currentUser;
      console.log("[MediGen] Current user UID:", user?.uid);
      if (!user) {
         console.warn("[MediGen] No user logged in, but trying to generate!");
      }

      const systemInstruction = `Act as an expert Doctor/Hakeem/Vaidya. Generate a safe prescription/remedy following this strict structure:                
1. Remedy/Formula: Include Dosage, Preparation, and Instructions.
2. Reason and Explanation (কারণ ও ব্যাখ্যা): Provide a DETAILED medical reasoning behind this specific formula and why these ingredients/actions are chosen.
3. Cause of Disease (রোগটি কেন হল): Explain the root causes and contributing factors to why this specific disease/problem occurred in the patient (e.g., lifestyle, diet, environmental or physiological reasons).
Always keep Scientific/Medical names in brackets.`;
      const prompt = `
        Patient Name: ${patientName}
        Age: ${age}
        Gender: ${gender}
        Disease/Problem: ${disease}
        Formula System: ${formulaSystem}
        Product Forms: ${selectedProductForms.join(', ') || 'Any'}
        Quality Tier: ${qualityTier}
        Key Ingredients: ${keyIngredients}
      `;

      const languageInstruction = lang === 'bn' 
        ? `Write the main content in Bengali but ALWAYS keep English Scientific/Medical names in brackets. Use Markdown for readability. Add a standard medical disclaimer at the bottom. ALWAYS include the 'কারন ও ব্যাখ্যা' section in Bengali.`
        : `Write the content in English. Use Markdown for readability. Add a standard medical disclaimer at the bottom. ALWAYS include the 'Reason and Explanation' section.`;

      const finalPrompt = `${systemInstruction}\n\n${languageInstruction}\n\nDetails:\n${prompt}`;

      const response = await fetchWithAuth('/api/medigen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
            setResult(lang === 'bn' 
              ? '### আপনার পর্যাপ্ত হলুদ বল নেই।\nমেডিজেন এর সুবিধা ব্যবহার করতে ১ টি হলুদ বল 🟡 খরচ হবে। অনুগ্রহ করে বিজ্ঞাপন দেখে বা টাকা কনভার্ট করে হলুদ বল সংগ্রহ করুন।' 
              : '### Insufficient yellow balls.\nUsing MediGen requires 1 Yellow Ball 🟡. Please watch ads or convert balance to get yellow balls.');
            return;
        }
        throw new Error(errorData.error || `Failed to generate formula: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data.text || '');
      setReferences(data.references || []);
      
      if (data.yellowBallsCount !== undefined && onPointsUpdate) {
        onPointsUpdate(data.yellowBallsCount);
      }

    } catch (error: any) {
      console.error('Error generating formula:', error);
      const suffix = error.message ? `\n\n**Error details:** ${error.message}` : '';
      setResult(lang === 'bn' 
        ? `দুঃখিত, একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।${suffix}` 
        : `Sorry, an error occurred. Please try again.${suffix}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className={`px-6 py-4 shadow-md flex justify-between items-center transition-colors duration-300 bg-teal-600 text-white`}>
        <div className="flex items-center gap-3">
          <Stethoscope size={28} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-xs opacity-80">{t('subtitle_personal')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
            <Award size={14} />
            <span>{yellowBalls !== null ? yellowBalls : points} {lang === 'bn' ? 'হলুদ বল 🟡' : 'Yellow Balls 🟡'}</span>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors text-sm font-medium"
          >
            <Languages size={18} />
            {lang === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        <div className="w-full lg:w-1/3 p-6 overflow-y-auto border-r border-slate-200 bg-white print:hidden">
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('patient_name')}</label>
                <input 
                  type="text" 
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('age')}</label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('gender')}</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                >
                  <option value="">{t('select')}</option>
                  <option value="Male">{t('male')}</option>
                  <option value="Female">{t('female')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('disease')} *</label>
              <textarea 
                required
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
                placeholder={lang === 'bn' ? "আপনার সমস্যা বিস্তারিত লিখুন..." : "Describe the symptoms or condition..."}
              />
              <p className="mt-1 text-[10px] text-slate-500 italic">
                {lang === 'bn' 
                  ? "* সঠিক পরামর্শের জন্য বারবার তথ্য প্রদান করে বিস্তারিত আলোচনা করুন।" 
                  : "* Provide details repeatedly and discuss thoroughly for accurate advice."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('formula_system')}</label>
                <select 
                  value={formulaSystem}
                  onChange={(e) => setFormulaSystem(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                >
                  <option value="">{t('select')}</option>
                  <option value="Allopathic">Allopathic</option>
                  <option value="Ayurvedic">Ayurvedic</option>
                  <option value="Unani">Unani</option>
                  <option value="Homeopathic">Homeopathic</option>
                  <option value="Herbal">Herbal</option>
                  <option value="Home Remedy">Home Remedy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('quality_tier')}</label>
                <select 
                  value={qualityTier}
                  onChange={(e) => setQualityTier(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                >
                  <option value="">{t('select')}</option>
                  <option value="Premium">Premium</option>
                  <option value="Standard">Standard</option>
                  <option value="Economy">Economy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('product_form')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {productForms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => toggleProductForm(form.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      selectedProductForms.includes(form.id)
                        ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-sm border ${
                      selectedProductForms.includes(form.id)
                        ? 'bg-teal-500 border-teal-500 flex items-center justify-center'
                        : 'border-slate-300'
                    }`}>
                      {selectedProductForms.includes(form.id) && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    {lang === 'bn' ? form.bn : form.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('key_ingredients')}</label>
              <input 
                type="text" 
                value={keyIngredients}
                onChange={(e) => setKeyIngredients(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="e.g. Paracetamol, Ginger, Honey"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !disease}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-lg mt-6 ${
                loading || !disease 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20 shadow-teal-500/10'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  {t('generating')}
                </>
              ) : (
                t('generate')
              )}
            </button>
          </form>

          <div className="mt-8 print:hidden">
            <AdBanner />
          </div>
        </div>

        <div className="w-full lg:w-2/3 p-6 lg:p-10 overflow-y-auto bg-slate-50 print:p-0 print:bg-white print:w-full">
          {result ? (
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0">
              <div className="flex justify-end mb-6 print:hidden gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                  }}
                  className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors px-4 py-2 rounded-lg hover:bg-teal-50 border border-transparent hover:border-teal-100"
                >
                  <Copy size={18} />
                  <span className="text-sm font-medium">{lang === 'bn' ? 'কপি করুন' : 'Copy'}</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
                >
                  <Printer size={18} />
                  <span className="text-sm font-medium">{t('print')}</span>
                </button>
              </div>
              
              <div className="prose prose-slate prose-teal max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-teal-600">
                <div className="markdown-body">
                  <Markdown>{result}</Markdown>
                </div>
              </div>

              {references.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 print:hidden">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <ExternalLink size={16} />
                    {t('references')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {references.map((ref, idx) => (
                      <a 
                        key={idx}
                        href={ref.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-3 py-1.5 rounded-full border border-slate-200 hover:border-teal-200 transition-all flex items-center gap-1.5"
                      >
                        {ref.title || 'Source'}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-12 pt-8 border-t border-slate-200 print:hidden">
                <AdBanner />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 print:hidden">
              <Stethoscope size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">
                {lang === 'bn' ? 'ফর্মুলা তৈরি করতে বাম দিকের ফর্মটি পূরণ করুন' : 'Fill out the form on the left to generate a formula'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:w-full, .print\\:w-full * {
            visibility: visible;
          }
          .print\\:w-full {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
