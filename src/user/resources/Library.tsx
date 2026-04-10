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
  url: string;
  type: 'motivational' | 'religious';
}

const Library: React.FC<LibraryProps> = ({ language }) => {
  const [motivationalBooks, setMotivationalBooks] = useState<Book[]>([]);
  const [religiousBooks, setReligiousBooks] = useState<Book[]>([]);
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
        setReligiousBooks(booksList.filter(book => book.type === 'religious'));
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
            {language === 'bn' ? 'মোটিভেশনাল এবং ধর্মীয় গ্রন্থসমূহ' : 'Motivational and Religious Books'}
          </p>
        </div>
      </div>

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
                <BookOpenText size={20} />
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{book.name}</h4>
            </div>
            <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </a>
        )) : (
          <p className="text-slate-500 col-span-full">{language === 'bn' ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}</p>
        )}
      </div>

      <h3 className="text-xl font-bold text-slate-900 mt-8">
        {language === 'bn' ? 'ধর্মীয় গ্রন্থসমূহ (পিডিএফ)' : 'Religious Books (PDF)'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {religiousBooks.length > 0 ? religiousBooks.map((book) => (
          <div key={book.id} className="relative group">
            <a 
              href={book.url === '#' ? '#' : book.url} 
              target={book.url === '#' ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex items-center justify-between ${book.url === '#' ? 'opacity-70' : ''}`}
              onClick={(e) => { if (book.url === '#') e.preventDefault(); }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                  <FileText size={20} />
                </div>
                <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{book.name}</h4>
              </div>
              <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </a>
          </div>
        )) : (
          <p className="text-slate-500 col-span-full">{language === 'bn' ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}</p>
        )}
      </div>
    </div>
  );
};

export default Library;
