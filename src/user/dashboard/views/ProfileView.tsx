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
  Bell,
  QrCode,
  X
} from 'lucide-react';
import { AdBanner } from '../AdBanner';
import { ProfessionalIDCard } from '../components/ProfessionalIDCard';
import { AnimatePresence } from 'motion/react';

interface ProfileViewProps {
  userId?: number;
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
  profilePicture?: string;
  onUploadProfilePic?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditingProfile?: boolean;
  onToggleEdit?: () => void;
  theme?: 'light' | 'dark';
  barAssociation: string;
  chamberAddress: string;
  sponsorName?: string;
  sponsorMobile?: string;
}

export const ProfileView = ({
  userId,
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
  isPremium = false,
  profilePicture,
  onUploadProfilePic,
  isEditingProfile = false,
  onToggleEdit,
  theme = 'light',
  barAssociation,
  chamberAddress,
  sponsorName,
  sponsorMobile
}: ProfileViewProps) => {
  const [showIDCard, setShowIDCard] = React.useState(false);
  const profileStats = [
    { label: t('points'), value: points || 0, icon: Shield, color: "text-amber-500", bg: "bg-amber-50" },
    { label: t('total_cases'), value: "12", icon: CreditCard, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: t('total_tasks'), value: "45", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdBanner isPremium={isPremium} />
      
      {/* Profile Header Card */}
      <div className={`rounded-[2.5rem] border shadow-xl overflow-hidden relative group ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="h-48 bg-indigo-600 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/2 blur-2xl" />
        </div>
        
        <div className="px-8 pb-8 flex flex-col items-center -mt-20 relative z-10">
          <div className="relative group/avatar">
            <div className={`w-40 h-40 rounded-[2.5rem] p-2 shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
              <div className={`w-full h-full rounded-[2rem] flex items-center justify-center text-indigo-600 font-black text-5xl border-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-indigo-100 border-indigo-50'}`}>
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0)
                )}
              </div>
            </div>
            <label className="absolute bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform border-4 border-white dark:border-slate-900 cursor-pointer">
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={onUploadProfilePic} />
            </label>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <h2 className={`text-3xl font-black tracking-tight flex items-center justify-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {userName}
              <CheckCircle2 size={24} className="text-indigo-600" />
            </h2>
            <div className="flex items-center justify-center gap-3">
              <span className="px-4 py-1 bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                {userType}
              </span>
              <span className="px-4 py-1 bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest rounded-full border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                ID: #{userId || '000000'}
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
                <User className="text-indigo-600" size={28} /> {t('personal_info')}
              </h3>
              <button 
                onClick={onToggleEdit}
                className="px-6 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 flex items-center gap-2"
              >
                <Edit2 size={16} /> {t('edit_profile')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: t('email_address'), value: userEmail, icon: Mail },
                { label: t('mobile_label'), value: userMobile, icon: Phone },
                { label: t('district_label'), value: userDistrict, icon: MapPin },
                { label: t('country_label'), value: userCountry, icon: Globe }
              ].map((info, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm transition-colors">
                    <info.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{info.label}</p>
                    <p className="text-sm font-bold text-slate-700">{info.value || t('not_provided')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <CreditCard className="text-indigo-600" size={28} /> {t('subscription_and_plan')}
            </h3>
            
            <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/30 backdrop-blur-md">
                      {t('active_plan')}
                    </span>
                    <span className="text-indigo-200 text-xs font-bold flex items-center gap-1">
                      <Lock size={12} /> {t('renewal')}: 12 মে 2024
                    </span>
                  </div>
                  <h4 className="text-4xl font-black tracking-tight">{selectedPlan?.name || t('free_trial')}</h4>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed max-w-md">
                    {t('plan_benefits_desc')}
                  </p>
                </div>
                <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:scale-105 transition-transform shadow-xl shadow-indigo-900/20 flex items-center gap-2 whitespace-nowrap">
                  {t('change_plan')} <ChevronRight size={20} />
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
              <Shield className="text-indigo-600" size={24} /> {t('digital_id_card')}
            </h3>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-4">
              <QrCode size={48} className="text-slate-300" />
              <p className="text-xs font-bold text-slate-500 max-w-[200px]">
                {language === 'bn' ? 'আপনার ডিজিটাল মেম্বারশিপ কার্ড জেনারেট করুন' : 'Generate your digital professional membership card'}
              </p>
              <button 
                onClick={() => setShowIDCard(true)}
                className="w-full py-3 bg-white text-indigo-600 border border-indigo-100 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                <QrCode size={16} /> {t('view_id_card')}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Settings className="text-indigo-600" size={24} /> {t('account_settings')}
            </h3>
            <div className="space-y-3">
              {[
                { label: t('notification_settings'), icon: Bell },
                { label: t('security_password'), icon: Lock },
                { label: t('change_language'), icon: Globe },
                { label: t('privacy_policy'), icon: Shield }
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
            <h3 className="text-xl font-bold text-rose-600">{t('danger_zone')}</h3>
            <p className="text-rose-400 text-xs font-medium leading-relaxed">
              {t('delete_account_warning')}
            </p>
            <button className="w-full py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
              {t('delete_account')}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showIDCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg p-8 rounded-[3rem] shadow-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <button 
                onClick={() => setShowIDCard(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('digital_id_card')}</h3>
                <p className="text-sm font-bold text-slate-400">{language === 'bn' ? 'আপনার প্রফেশনাল ডিজিটাল পরিচয়পত্র' : 'Your professional digital identification card'}</p>
              </div>

              <ProfessionalIDCard 
                userName={userName}
                userType={userType}
                userId={userId || '0000'}
                userDistrict={userDistrict}
                userMobile={userMobile}
                userEmail={userEmail}
                barAssociation={barAssociation}
                chamberAddress={chamberAddress}
                sponsorName={sponsorName}
                sponsorMobile={sponsorMobile}
                profilePicture={profilePicture}
                isPremium={isPremium}
                language={language}
                theme={theme}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
