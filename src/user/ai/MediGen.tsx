import React, { useState } from 'react';
import { Stethoscope, Building2, Globe, Languages, Printer, ExternalLink, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { AdBanner } from '../dashboard/AdBanner';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

type Language = 'en' | 'bn';

export default function MediGen() {
  const [lang, setLang] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [references, setReferences] = useState<{ uri: string; title: string }[]>([]);

  // Form states
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [disease, setDisease] = useState('');
  const [formulaSystem, setFormulaSystem] = useState('');
  const [productForm, setProductForm] = useState('');
  const [qualityTier, setQualityTier] = useState('');
  const [keyIngredients, setKeyIngredients] = useState('');

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
    if (!disease) return;

    setLoading(true);
    setResult('');
    setReferences([]);

    try {
      const systemInstruction = `Act as an expert Doctor/Hakeem/Vaidya. Generate a safe prescription/remedy including Diagnosis, The Remedy (Dosage, Preparation), and Instructions.`;
      const prompt = `
        Patient Name: ${patientName}
        Age: ${age}
        Gender: ${gender}
        Disease/Problem: ${disease}
        Formula System: ${formulaSystem}
        Product Form: ${productForm}
        Quality Tier: ${qualityTier}
        Key Ingredients: ${keyIngredients}
      `;

      const languageInstruction = lang === 'bn' 
        ? `Write the main content in Bengali but ALWAYS keep English Scientific/Medical names in brackets. Use Markdown for readability. Add a standard medical disclaimer at the bottom.`
        : `Write the content in English. Use Markdown for readability. Add a standard medical disclaimer at the bottom.`;

      const finalPrompt = `${systemInstruction}\n\n${languageInstruction}\n\nDetails:\n${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: finalPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      setResult(response.text || '');

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const refs = chunks
          .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
          .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title }));
        
        // Remove duplicates
        const uniqueRefs = Array.from(new Map(refs.map((item: any) => [item.uri, item])).values()) as {uri: string, title: string}[];
        setReferences(uniqueRefs);
      }

    } catch (error) {
      console.error('Error generating formula:', error);
      setResult(lang === 'bn' ? 'দুঃখিত, একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।' : 'Sorry, an error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className={`px-6 py-4 shadow-md flex justify-between items-center transition-colors duration-300 bg-teal-600 text-white`}>
        <div className="flex items-center gap-3">
          <Stethoscope size={28} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-xs opacity-80">{t('subtitle_personal')}</p>
          </div>
        </div>
        <button 
          onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors text-sm font-medium"
        >
          <Languages size={18} />
          {lang === 'en' ? 'বাংলা' : 'English'}
        </button>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Form */}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('product_form')}</label>
                <select 
                  value={productForm}
                  onChange={(e) => setProductForm(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                >
                  <option value="">{t('select')}</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Oil">Oil</option>
                  <option value="Powder">Powder</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drop">Drop</option>
                  <option value="Injection">Injection</option>
                </select>
              </div>
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
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading || !disease 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('generating')}
                </>
              ) : (
                t('generate')
              )}
            </button>
          </form>

          {/* Ad Space below form */}
          <div className="mt-8 print:hidden">
            <AdBanner />
          </div>
        </div>

        {/* Right Side: Result */}
        <div className="w-full lg:w-2/3 p-6 lg:p-10 overflow-y-auto bg-slate-50 print:p-0 print:bg-white print:w-full">
          {result ? (
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0">
              <div className="flex justify-end mb-6 print:hidden">
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
                <div className="mt-12 pt-8 border-t border-slate-200 print:hidden">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-teal-600" />
                    {t('references')}
                  </h3>
                  <ul className="space-y-3">
                    {references.map((ref, idx) => (
                      <li key={idx}>
                        <a 
                          href={ref.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors group"
                        >
                          <ExternalLink size={16} className="mt-0.5 opacity-50 group-hover:opacity-100 shrink-0" />
                          <span className="group-hover:underline leading-tight">{ref.title || ref.uri}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ad Space below result */}
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
      
      {/* Print Styles */}
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
