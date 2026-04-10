import React from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  MapPin, 
  Shield, 
  Heart, 
  AlertTriangle, 
  ChevronRight, 
  ExternalLink,
  Search,
  Plus
} from 'lucide-react';
import { AdBanner } from '../AdBanner';

interface EmergencyViewProps {
  emergencyContacts: any[];
  onAddEmergencyContact: () => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: string) => string;
  isPremium?: boolean;
}

export const EmergencyView = ({
  emergencyContacts,
  onAddEmergencyContact,
  language,
  t,
  isPremium = false
}: EmergencyViewProps) => {
  const emergencyNumbers = [
    { id: 1, name: "জাতীয় জরুরি সেবা", number: "৯৯৯", icon: Shield, color: "bg-rose-600", shadow: "shadow-rose-100", description: "পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স" },
    { id: 2, name: "নারী ও শিশু নির্যাতন প্রতিরোধ", number: "১০৯", icon: Heart, color: "bg-pink-500", shadow: "shadow-pink-100", description: "সহায়তা ও আইনি পরামর্শ" },
    { id: 3, name: "জাতীয় আইনগত সহায়তা", number: "১৬৪৩০", icon: Shield, color: "bg-indigo-600", shadow: "shadow-indigo-100", description: "বিনামূল্যে আইনি পরামর্শ ও মামলা পরিচালনা" },
    { id: 4, name: "দুর্নীতি দমন কমিশন", number: "১০৬", icon: AlertTriangle, color: "bg-amber-500", shadow: "shadow-amber-100", description: "দুর্নীতি সংক্রান্ত অভিযোগ" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={isPremium} />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('emergency_contacts')} <span className="text-rose-600 ml-2">জরুরি সহায়তা</span>
          </h2>
          <p className="text-slate-500 font-medium mt-1">যেকোনো বিপদে বা আইনি সহায়তায় তাৎক্ষণিক যোগাযোগ করুন।</p>
        </div>
        <button 
          onClick={onAddEmergencyContact}
          className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 flex items-center gap-2"
        >
          <Plus size={20} /> কন্টাক্ট যুক্ত করুন
        </button>
      </div>

      {/* National Emergency Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {emergencyNumbers.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg ${item.shadow} hover:scale-105 transition-transform group cursor-pointer relative overflow-hidden`}
          >
            <div className={`w-14 h-14 ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform`}>
              <item.icon size={28} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{item.name}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{item.description}</p>
            <a 
              href={`tel:${item.number}`}
              className={`w-full py-4 ${item.color} text-white rounded-2xl font-black text-2xl flex items-center justify-center gap-3 shadow-lg hover:brightness-110 transition-all`}
            >
              <Phone size={24} /> {item.number}
            </a>
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Emergency Contacts */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Phone className="text-indigo-600" size={28} /> আপনার ব্যক্তিগত কন্টাক্ট
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="খুঁজুন..."
                className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 w-32"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.length > 0 ? (
              emergencyContacts.map((contact, idx) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{contact.name}</h5>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{contact.relation}</p>
                    </div>
                  </div>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm hover:bg-indigo-600 hover:text-white transition-all border border-slate-100"
                  >
                    <Phone size={18} />
                  </a>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-20 text-center space-y-4 opacity-40">
                <Phone size={64} className="text-slate-300 mx-auto" />
                <p className="text-lg font-bold text-slate-500">কোন ব্যক্তিগত কন্টাক্ট যুক্ত করা হয়নি</p>
                <button 
                  onClick={onAddEmergencyContact}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  এখনই যুক্ত করুন
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Safety Tips & Resources */}
        <div className="space-y-8">
          {/* Safety Tips Card */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Shield size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">আইনি সুরক্ষা টিপস</h3>
              <ul className="space-y-4">
                {[
                  "যেকোনো আইনি দলিলে স্বাক্ষর করার আগে ভালো করে পড়ুন।",
                  "পুলিশি জিজ্ঞাসাবাদে আইনজীবীর সহায়তা নিন।",
                  "সকল গুরুত্বপূর্ণ নথিপত্র ডিজিটাল কপি করে রাখুন।"
                ].map((tip, idx) => (
                  <li key={idx} className="flex gap-3 text-sm font-medium text-slate-400 leading-relaxed">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-2" />
                    {tip}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-white/10 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all text-sm">
                আরও টিপস দেখুন
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          </div>

          {/* Nearby Services Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <MapPin className="text-rose-600" size={24} /> নিকটস্থ সেবা
            </h3>
            <div className="space-y-4">
              {[
                { name: "নিকটস্থ থানা", icon: Shield, color: "text-blue-600" },
                { name: "ফায়ার সার্ভিস", icon: AlertTriangle, color: "text-rose-600" },
                { name: "লিগ্যাল এইড অফিস", icon: Shield, color: "text-indigo-600" }
              ].map((service, idx) => (
                <button key={idx} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group border border-slate-100">
                  <div className="flex items-center gap-3">
                    <service.icon size={18} className={service.color} />
                    <span className="text-sm font-bold text-slate-700">{service.name}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
