import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Search, Download, Eye, ExternalLink } from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  categoryBn: string;
  pdfUrl: string;
  year: string;
}

const STATIC_BOOKS: BookItem[] = [
  {
    id: '1',
    title: 'The Penal Code, 1860',
    titleBn: 'দণ্ডবিধি, ১৮৬০',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-11.html',
    year: '1860'
  },
  {
    id: '2',
    title: 'The Code of Criminal Procedure, 1898',
    titleBn: 'ফৌজদারি কার্যবিধি, ১৮৯৮',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-75.html',
    year: '1898'
  },
  {
    id: '3',
    title: 'The Code of Civil Procedure, 1908',
    titleBn: 'দেওয়ানী কার্যবিধি, ১৯০৮',
    category: 'Civil Law',
    categoryBn: 'দেওয়ানী আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-86.html',
    year: '1908'
  },
  {
    id: '4',
    title: 'The Evidence Act, 1872',
    titleBn: 'সাক্ষ্য আইন, ১৮৭২',
    category: 'General Law',
    categoryBn: 'সাধারণ আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-24.html',
    year: '1872'
  },
  {
    id: '5',
    title: 'The Specific Relief Act, 1877',
    titleBn: 'সুনির্দিষ্ট প্রতিকার আইন, ১৮৭৭',
    category: 'Civil Law',
    categoryBn: 'দেওয়ানী আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-26.html',
    year: '1877'
  },
  {
    id: '6',
    title: 'The Limitation Act, 1908',
    titleBn: 'তামাদি আইন, ১৯০৮',
    category: 'General Law',
    categoryBn: 'সাধারণ আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-87.html',
    year: '1908'
  },
  {
    id: '7',
    title: 'The Contract Act, 1872',
    titleBn: 'চুক্তি আইন, ১৮৭২',
    category: 'Civil Law',
    categoryBn: 'দেওয়ানী আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-21.html',
    year: '1872'
  },
  {
    id: '8',
    title: 'The Transfer of Property Act, 1882',
    titleBn: 'সম্পত্তি হস্তান্তর আইন, ১৮৮২',
    category: 'Civil Law',
    categoryBn: 'দেওয়ানী আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-33.html',
    year: '1882'
  },
  {
    id: '9',
    title: 'The Registration Act, 1908',
    titleBn: 'রেজিস্ট্রেশন আইন, ১৯০৮',
    category: 'Civil Law',
    categoryBn: 'দেওয়ানী আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-85.html',
    year: '1908'
  },
  {
    id: '10',
    title: 'The Muslim Family Laws Ordinance, 1961',
    titleBn: 'মুসলিম পারিবারিক আইন অধ্যাদেশ, ১৯৬১',
    category: 'Family Law',
    categoryBn: 'পারিবারিক আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-305.html',
    year: '1961'
  },
  {
    id: '11',
    title: 'The Family Courts Ordinance, 1985',
    titleBn: 'পারিবারিক আদালত অধ্যাদেশ, ১৯৮৫',
    category: 'Family Law',
    categoryBn: 'পারিবারিক আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-673.html',
    year: '1985'
  },
  {
    id: '12',
    title: 'The Nari-O-Shishu Nirjatan Daman Ain, 2000',
    titleBn: 'নারী ও শিশু নির্যাতন দমন আইন, ২০০০',
    category: 'Women, Children & Anti-Trafficking',
    categoryBn: 'নারী, শিশু ও মানব পাচার আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-809.html',
    year: '2000'
  },
  {
    id: '28',
    title: 'The Prevention and Suppression of Human Trafficking Act, 2012',
    titleBn: 'মানব পাচার প্রতিরোধ ও দমন আইন, ২০১২',
    category: 'Women, Children & Anti-Trafficking',
    categoryBn: 'নারী, শিশু ও মানব পাচার আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-1082.html',
    year: '2012'
  },
  {
    id: '29',
    title: 'The Children Act, 2013',
    titleBn: 'শিশু আইন, ২০১৩',
    category: 'Women, Children & Anti-Trafficking',
    categoryBn: 'নারী, শিশু ও মানব পাচার আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-1119.html',
    year: '2013'
  },
  {
    id: '13',
    title: 'The Arbitration Act, 2001',
    titleBn: 'সালিশ আইন, ২০০১',
    category: 'General Law',
    categoryBn: 'সাধারণ আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-823.html',
    year: '2001'
  },
  {
    id: '14',
    title: 'The Cyber Security Act, 2023',
    titleBn: 'সাইবার নিরাপত্তা আইন, ২০২৩',
    category: 'Cyber Law',
    categoryBn: 'সাইবার আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-1418.html',
    year: '2023'
  },
  {
    id: '15',
    title: 'The Constitution of the People\'s Republic of Bangladesh',
    titleBn: 'গণপ্রজাতন্ত্রী বাংলাদেশের সংবিধান',
    category: 'Constitutional Law',
    categoryBn: 'সাংবিধানিক আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-367.html',
    year: '1972'
  },
  {
    id: '16',
    title: 'The Anti-Corruption Commission Act, 2004',
    titleBn: 'দুর্নীতি দমন কমিশন আইন, ২০০৪',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-875.html',
    year: '2004'
  },
  {
    id: '17',
    title: 'The Labour Act, 2006',
    titleBn: 'শ্রম আইন, ২০০৬',
    category: 'Labour Law',
    categoryBn: 'শ্রম আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-903.html',
    year: '2006'
  },
  {
    id: '18',
    title: 'The Negotiable Instruments Act, 1881',
    titleBn: 'হস্তান্তরযোগ্য দলিল আইন, ১৮৮১',
    category: 'Commercial Law',
    categoryBn: 'বাণিজ্যিক আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-32.html',
    year: '1881'
  },
  {
    id: '19',
    title: 'The Sale of Goods Act, 1930',
    titleBn: 'পণ্য বিক্রয় আইন, ১৯৩০',
    category: 'Commercial Law',
    categoryBn: 'বাণিজ্যিক আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-148.html',
    year: '1930'
  },
  {
    id: '20',
    title: 'The Trust Act, 1882',
    titleBn: 'ট্রাস্ট আইন, ১৮৮২',
    category: 'Civil Law',
    categoryBn: 'দেওয়ানী আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-34.html',
    year: '1882'
  },
  {
    id: '21',
    title: 'The Special Powers Act, 1974',
    titleBn: 'বিশেষ ক্ষমতা আইন, ১৯৭৪',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-452.html',
    year: '1974'
  },
  {
    id: '22',
    title: 'The Companies Act, 1994',
    titleBn: 'কোম্পানি আইন, ১৯৯৪',
    category: 'Commercial Law',
    categoryBn: 'বাণিজ্যিক আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-469.html',
    year: '1994'
  },
  {
    id: '23',
    title: 'The State Acquisition and Tenancy Act, 1950',
    titleBn: 'রাষ্ট্রীয় অধিগ্রহণ ও প্রজাস্বত্ব আইন, ১৯৫০',
    category: 'Land Law',
    categoryBn: 'ভূমি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-243.html',
    year: '1950'
  },
  {
    id: '24',
    title: 'The Non-Agricultural Tenancy Act, 1949',
    titleBn: 'অকৃষি প্রজাস্বত্ব আইন, ১৯৪৯',
    category: 'Land Law',
    categoryBn: 'ভূমি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-236.html',
    year: '1949'
  },
  {
    id: '25',
    title: 'The Arms Act, 1878',
    titleBn: 'অস্ত্র আইন, ১৮ ৭৮',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-28.html',
    year: '1878'
  },
  {
    id: '26',
    title: 'The Explosive Substances Act, 1908',
    titleBn: 'বিস্ফোরক দ্রব্য আইন, ১৯০৮',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-84.html',
    year: '1908'
  },
  {
    id: '27',
    title: 'The Explosives Act, 1884',
    titleBn: 'বিস্ফোরক আইন, ১৮৮৪',
    category: 'Criminal Law',
    categoryBn: 'ফৌজদারি আইন',
    pdfUrl: 'http://bdlaws.minlaw.gov.bd/act-36.html',
    year: '1884'
  }
];

export const LibraryView = ({ language }: { language: 'bn' | 'en' | 'hi' | 'ur' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<BookItem[]>(STATIC_BOOKS);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.titleBn.includes(searchQuery)
  );

  const groupedBooks = filteredBooks.reduce((acc, book) => {
    const cat = language === 'bn' ? book.categoryBn : book.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(book);
    return acc;
  }, {} as Record<string, BookItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Book className="text-indigo-600" />
            {language === 'bn' ? 'আইন লাইব্রেরি' : 'Law Library'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn' ? 'বাংলাদেশের সকল আইনের বই (পিডিএফ সহ)' : 'All Law Books of Bangladesh (with PDF)'}
          </p>
        </div>
        
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder={language === 'bn' ? "বই খুঁজুন..." : "Search books..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-inter"
          />
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
        </div>
      </div>

      <div className="space-y-10">
        {Object.entries(groupedBooks).map(([category, categoryBooks]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="w-2 h-6 rounded-full bg-indigo-500"></span>
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {categoryBooks.map((book) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={book.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600">
                        <Book size={24} />
                      </div>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">
                        {language === 'bn' ? book.categoryBn : book.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-2">
                      {language === 'bn' ? book.titleBn : book.title}
                    </h3>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      {language === 'bn' ? 'প্রকাশকাল:' : 'Year:'} {book.year}
                    </p>

                    <div className="flex gap-2">
                      <a 
                        href={book.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 py-2.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors font-medium text-sm"
                      >
                        <Eye size={16} />
                        {language === 'bn' ? 'পড়ুন' : 'Read'}
                      </a>
                      <a 
                        href={book.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm hover:shadow"
                      >
                        <Download size={16} />
                        {language === 'bn' ? 'ডাউনলোড' : 'Download'}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <div className="py-12 text-center text-slate-500 w-full">
            <Book size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg">{language === 'bn' ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
