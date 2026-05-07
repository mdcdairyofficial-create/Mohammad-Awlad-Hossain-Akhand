import React, { useState } from 'react';
import { BookOpen, BookText, ScrollText } from 'lucide-react';
import { translations } from '../../../translations';

interface ReligiousTextsViewProps {
  t: (key: keyof typeof translations.bn) => string;
  language: 'bn' | 'en' | 'hi' | 'ur';
}

export const ReligiousTextsView = ({ t, language }: ReligiousTextsViewProps) => {
  const texts = {
    quran: {
      title: t('quran'),
      icon: BookOpen,
      url: 'https://quran.com/bn',
      description: language === 'bn' ? 'পবিত্র আল কোরআনের বাংলা অর্থসহ সম্পূর্ণ পাঠ।' : 'Full text of the Holy Quran with Bengali translation.',
    },
    gita: {
      title: t('gita'),
      icon: BookOpen,
      url: 'https://www.holy-bhagavad-gita.org/Index/bn',
      description: language === 'bn' ? 'শ্রীমদ্ভগবদ্গীতা-এর বাংলা সম্পূর্ণ পাঠ ও মাহাত্ম্য।' : 'Full Bengali text and significance of Bhagavad Gita.',
    },
    bible: {
      title: t('bible'),
      icon: BookText,
      url: 'https://www.bible.com/bn/bible/1155/GEN.1.NIRV',
      description: language === 'bn' ? 'পবিত্র বাইবেল-এর বাংলা সম্পূর্ণ পাঠ (পুরাতন ও নতুন নিয়ম)।' : 'Full Bengali text of The Holy Bible (Old & New Testament).',
    },
    tripitaka: {
      title: t('tripitaka'),
      icon: ScrollText,
      url: 'https://tipitaka.org/beng/',
      description: language === 'bn' ? 'ত্রিপিটক-এর বাংলা সম্পূর্ণ পাঠ ও বৌদ্ধ দর্শন।' : 'Full Buddhist Tripitaka text and Buddhist philosophy.',
    },
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h2 className="text-2xl font-black text-slate-900 mb-6">{t('religious_texts')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['quran', 'gita', 'bible', 'tripitaka'] as const).map((key) => (
          <a
            key={key}
            href={texts[key].url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
              {React.createElement(texts[key].icon, { size: 32 })}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
              {texts[key].title}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed flex-1">
              {texts[key].description}
            </p>
            <div className="mt-8 flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
              {language === 'bn' ? 'পড়ুন' : 'Read Now'}
              <BookOpen size={16} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
