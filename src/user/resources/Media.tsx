import React from 'react';
import { Youtube, Facebook, ExternalLink, PlayCircle } from 'lucide-react';

export default function Media() {
  const videos = [
    {
      id: '1',
      title: 'Legal AI Assistant - How to use',
      thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800',
      url: 'https://youtube.com',
      duration: '5:30'
    },
    {
      id: '2',
      title: 'New Features Update 2026',
      thumbnail: 'https://images.unsplash.com/photo-1505664173691-a28166c15150?auto=format&fit=crop&q=80&w=800',
      url: 'https://youtube.com',
      duration: '3:45'
    },
    {
      id: '3',
      title: 'How to manage cases effectively',
      thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800',
      url: 'https://youtube.com',
      duration: '12:15'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">মিডিয়া সেন্টার</h2>
            <p className="text-slate-500">আমাদের অফিসিয়াল ইউটিউব চ্যানেল এবং ফেসবুক পেজের সাথে যুক্ত থাকুন</p>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              <Youtube size={24} />
              YouTube
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
            >
              <Facebook size={24} />
              Facebook
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <a 
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <PlayCircle size={48} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded-md">
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <Youtube size={16} className="mr-1 text-red-500" />
                  YouTube এ দেখুন
                  <ExternalLink size={14} className="ml-auto" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Facebook size={28} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">আমাদের ফেসবুক কমিউনিটি</h3>
            </div>
            <p className="text-blue-100 text-lg mb-6 max-w-xl">
              আইনজীবী, মুহুরি এবং সাধারণ মানুষের জন্য আমাদের ফেসবুক গ্রুপে যুক্ত হোন। আইনি পরামর্শ, আপডেট এবং আলোচনা করুন।
            </p>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              গ্রুপে জয়েন করুন
              <ExternalLink size={20} />
            </a>
          </div>
          
          <div className="w-full md:w-1/3 aspect-video bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <Facebook size={64} className="text-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
