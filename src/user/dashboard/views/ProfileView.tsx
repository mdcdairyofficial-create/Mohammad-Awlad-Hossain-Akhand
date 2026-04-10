import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  CreditCard, 
  Settings, 
  ChevronRight, 
  Camera, 
  Edit2, 
  CheckCircle2,
  Lock,
  Globe,
  Bell
} from 'lucide-react';
import { AdBanner } from '../AdBanner';

interface ProfileViewProps {
  userName: string;
  userEmail: string;
  userMobile: string;
  userDistrict: string;
  userCountry: string;
  userType: string;
  points: number;
  selectedPlan: any;
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: string) => string;
  isPremium?: boolean;
}

export const ProfileView = ({
  userName,
  userEmail,
  userMobile,
  userDistrict,
  userCountry,
  userType,
  points,
  selectedPlan,
  language,
  t,
  isPremium = false
}: ProfileViewProps) => {
  const profileStats = [
    { label: "পয়েন্ট", value: points || 0, icon: Shield, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "মামলা", value: "১২", icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "টাস্ক", value: "৪৫", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={isPremium} />
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative group">
        <div className="h-48 bg-indigo-600 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/2 blur-2xl" />
        </div>
        
        <div className="px-8 pb-8 flex flex-col items-center -mt-20 relative z-10">
          <div className="relative group/avatar">
            <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl relative overflow-hidden">
              <div className="w-full h-full rounded-[2rem] bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-5xl border-4 border-indigo-50">
                {userName.charAt(0)}
              </div>
            </div>
            <button className="absolute bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform border-4 border-white">
              <Camera size={20} />
            </button>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
              {userName}
              <CheckCircle2 size={24} className="text-indigo-600" />
            </h2>
            <div className="flex items-center justify-center gap-3">
              <span className="px-4 py-1 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-100">
                {userType}
              </span>
              <span className="px-4 py-1 bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest rounded-full border border-slate-100">
                ID: #123456
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-10 w-full max-w-2xl">
            {profileStats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-2 group cursor-pointer">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-sm`}>
                  <stat.icon size={28} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <User className="text-indigo-600" size={28} /> ব্যক্তিগত তথ্য
              </h3>
              <button className="px-6 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 flex items-center gap-2">
                <Edit2 size={16} /> এডিট করুন
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: "ইমেইল অ্যাড্রেস", value: userEmail, icon: Mail },
                { label: "মোবাইল নম্বর", value: userMobile, icon: Phone },
                { label: "জেলা", value: userDistrict, icon: MapPin },
                { label: "দেশ", value: userCountry, icon: Globe }
              ].map((info, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-colors">
                    <info.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{info.label}</p>
                    <p className="text-sm font-bold text-slate-700">{info.value || 'প্রদান করা হয়নি'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <CreditCard className="text-indigo-600" size={28} /> সাবস্ক্রিপশন ও প্ল্যান
            </h3>
            
            <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/30 backdrop-blur-md">
                      সক্রিয় প্ল্যান
                    </span>
                    <span className="text-indigo-200 text-xs font-bold flex items-center gap-1">
                      <Lock size={12} /> রিনিউয়াল: ১২ মে ২০২৪
                    </span>
                  </div>
                  <h4 className="text-4xl font-black tracking-tight">{selectedPlan?.name || 'ফ্রি ট্রায়াল'}</h4>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-md">
                    আপনার বর্তমান প্ল্যানে আপনি আনলিমিটেড কেস ম্যানেজমেন্ট ও লিগ্যাল এআই অ্যাসিস্ট্যান্ট ব্যবহার করতে পারছেন।
                  </p>
                </div>
                <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:scale-105 transition-transform shadow-xl shadow-indigo-900/20 flex items-center gap-2 whitespace-nowrap">
                  প্ল্যান পরিবর্তন করুন <ChevronRight size={20} />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            </div>
          </div>
        </div>

        {/* Account Settings Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Settings className="text-indigo-600" size={24} /> অ্যাকাউন্ট সেটিংস
            </h3>
            <div className="space-y-3">
              {[
                { label: "নোটিফিকেশন সেটিংস", icon: Bell },
                { label: "সিকিউরিটি ও পাসওয়ার্ড", icon: Lock },
                { label: "ভাষা পরিবর্তন", icon: Globe },
                { label: "প্রাইভেসি পলিসি", icon: Shield }
              ].map((setting, idx) => (
                <button key={idx} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group border border-slate-100">
                  <div className="flex items-center gap-3">
                    <setting.icon size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-sm font-bold text-slate-700">{setting.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-6">
            <h3 className="text-xl font-bold text-rose-600">বিপদজনক এলাকা</h3>
            <p className="text-rose-400 text-xs font-medium leading-relaxed">
              অ্যাকাউন্ট ডিলিট করলে আপনার সকল ডাটা স্থায়ীভাবে মুছে যাবে। এই কাজটি করার আগে চিন্তা করে নিন।
            </p>
            <button className="w-full py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
              অ্যাকাউন্ট ডিলিট করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
