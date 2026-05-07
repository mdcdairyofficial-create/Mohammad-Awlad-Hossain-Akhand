import React, { useState, useEffect } from 'react';
import { BookOpen, BookOpenText, FileText, ExternalLink } from 'lucide-react';
import { AdBanner } from '../dashboard/AdBanner';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

interface LibraryProps {
  language: 'bn' | 'en' | 'hi' | 'ur';
}

interface Book {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: 'motivational' | 'religious' | 'law';
}

const Library: React.FC<LibraryProps> = ({ language }) => {
  const [motivationalBooks, setMotivationalBooks] = useState<Book[]>([]);
  const [lawBooks, setLawBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, 'library_books');
        const booksSnapshot = await getDocs(booksCollection);
        const booksList = booksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];

        setMotivationalBooks(booksList.filter(book => book.type === 'motivational'));
        setLawBooks(booksList.filter(book => book.type === 'law'));
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading library...</div>;
  }

  // Predefined law books if they don't exist in DB yet
  const defaultLawBooksData = [
    { name: 'BD Laws', description: 'বাংলাদেশের সকল আইনের অনলাইন ভাণ্ডার।', url: 'http://bdlaws.minlaw.gov.bd/' },
    { name: 'Bangladesh Constitution', description: 'গনপ্রজাতন্ত্রী বাংলাদেশের সংবিধান (আপডেটেড)।', url: 'http://bdlaws.minlaw.gov.bd/act-367.html' },
    { name: 'The Penal Code, 1860', description: 'দণ্ডবিধি ১৮৬০ - অপরাধ ও শাস্তির প্রধান আইন।', url: 'http://bdlaws.minlaw.gov.bd/act-11.html' },
    { name: 'The Code of Criminal Procedure, 1898', description: 'ফৌজদারি কার্যবিধি ১৮৯৮ - ফৌজদারি আদালতের কার্যপ্রণালী।', url: 'http://bdlaws.minlaw.gov.bd/act-75.html' },
    { name: 'The Code of Civil Procedure, 1908', description: 'দেওয়ানি কার্যবিধি ১৯০৮ - দেওয়ানি মামলার পদ্ধতি।', url: 'http://bdlaws.minlaw.gov.bd/act-86.html' },
    { name: 'The Evidence Act, 1872', description: 'সাক্ষ্য আইন ১৮৭২ - আদালতে সাক্ষ্য প্রদানের নিয়মাবলী।', url: 'http://bdlaws.minlaw.gov.bd/act-24.html' },
    { name: 'The Specific Relief Act, 1877', description: 'সুনির্দিষ্ট প্রতিকার আইন ১৮৭৭ - অধিকার পুনরুদ্ধারের উপায়।', url: 'http://bdlaws.minlaw.gov.bd/act-31.html' },
    { name: 'The Limitation Act, 1908', description: 'তামাদি আইন ১৯০৮ - মামলা দায়েরের সময়সীমা।', url: 'http://bdlaws.minlaw.gov.bd/act-92.html' },
    { name: 'The Registration Act, 1908', description: 'রেজিস্ট্রেশন আইন ১৯০৮ - দলিল নিবন্ধনের নিয়ম।', url: 'http://bdlaws.minlaw.gov.bd/act-93.html' },
    { name: 'The Transfer of Property Act, 1882', description: 'সম্পত্তি হস্তান্তর আইন ১৮৮২ - স্থাবর সম্পত্তি লেনদেন।', url: 'http://bdlaws.minlaw.gov.bd/act-44.html' },
    { name: 'The Contract Act, 1872', description: 'চুক্তি আইন ১৮৭২ - চুক্তির বৈধতা ও শর্তাবলী।', url: 'http://bdlaws.minlaw.gov.bd/act-26.html' },
    { name: 'The Negotiable Instruments Act, 1881', description: 'নেগোশিয়েবল ইনস্ট্রুমেন্ট আইন ১৮৮১ - চেক ডিজঅনার ও প্রমিসরি নোট।', url: 'http://bdlaws.minlaw.gov.bd/act-43.html' },
    { name: 'The Family Courts Ordinance, 1985', description: 'পারিবারিক আদালত অধ্যাদেশ ১৯৮৫ - পারিবারিক বিরোধ নিষ্পত্তি।', url: 'http://bdlaws.minlaw.gov.bd/act-679.html' },
    { name: 'Special Powers Act, 1974', description: 'বিশেষ ক্ষমতা আইন ১৯৭৪ - জননিরাপত্তা ও বিশেষ অপরাধ দমন।', url: 'http://bdlaws.minlaw.gov.bd/act-462.html' },
    { name: 'The Arms Act, 1878', description: 'অস্ত্র আইন ১৮৭৮ - আগ্নেয়াস্ত্র ব্যবহারের বিধান।', url: 'http://bdlaws.minlaw.gov.bd/act-34.html' },
    { name: 'Artha Rin Adalat Ain, 2003', description: 'অর্থ ঋণ আদালত আইন ২০০৩ - ব্যাংক ও আর্থিক প্রতিষ্ঠানের পাওনা আদায়।', url: 'http://bdlaws.minlaw.gov.bd/act-898.html' },
    { name: 'Narcotics Control Act, 2018', description: 'মাদকদ্রব্য নিয়ন্ত্রণ আইন ২০১৮ - মাদক সংক্রান্ত অপরাধ ও দণ্ড।', url: 'http://bdlaws.minlaw.gov.bd/act-1268.html' },
    { name: 'Bankruptcy Act, 1997', description: 'দেউলিয়া বিষয়ক আইন ১৯৯৭ - ঋণ খেলাপি ও দেউলিয়া ঘোষণা।', url: 'http://bdlaws.minlaw.gov.bd/act-815.html' }
  ];

  // Merge DB law books with defaults to ensure they appear
  const displayLawBooks = [...lawBooks];
  defaultLawBooksData.forEach(defaultBook => {
    if (!lawBooks.find(b => b.name === defaultBook.name)) {
      displayLawBooks.push({
        id: `default-${defaultBook.name}`,
        name: defaultBook.name,
        description: defaultBook.description,
        url: defaultBook.url,
        type: 'law'
      });
    }
  });

  return (
    <div className="space-y-6">
      <AdBanner />
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <BookOpen size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {language === 'bn' ? 'লাইব্রেরি' : 'Library'}
          </h3>
          <p className="text-slate-500 text-sm font-medium">
            {language === 'bn' ? 'আইনী এবং মোটিভেশনাল গ্রন্থসমূহ' : 'Legal and Motivational Books'}
          </p>
        </div>
      </div>

      {/* Law Books - First */}
      <h3 className="text-xl font-bold text-slate-900 mt-8">
        {language === 'bn' ? 'আইনের সকল অনলাইন বই সমূহ' : 'All Online Law Books'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayLawBooks.map((book) => (
          <a 
            key={book.id} 
            href={book.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex items-center justify-between ${book.url === '#' ? 'opacity-70 cursor-help' : ''}`}
            title={book.url === '#' ? (language === 'bn' ? 'শীঘ্রই আসছে' : 'Coming Soon') : ''}
            onClick={(e) => { if (book.url === '#') e.preventDefault(); }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                <FileText size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{book.name}</h4>
                {book.description && <p className="text-xs text-slate-500">{book.description}</p>}
              </div>
            </div>
            <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </a>
        ))}
      </div>

      {/* Motivational Books - Last */}
      <h3 className="text-xl font-bold text-slate-900 mt-8">
        {language === 'bn' ? 'মোটিভেশনাল বই' : 'Motivational Books'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {motivationalBooks.length > 0 ? motivationalBooks.map((book) => (
          <a 
            key={book.id} 
            href={book.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                <BookOpen size={20} />
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{book.name}</h4>
            </div>
            <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </a>
        )) : (
          <p className="text-slate-500 col-span-full">{language === 'bn' ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}</p>
        )}
      </div>
    </div>
  );
};

export default Library;
