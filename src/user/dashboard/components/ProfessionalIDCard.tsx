import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { 
  CheckCircle2, 
  MapPin, 
  Shield, 
  Phone, 
  QrCode,
  Download,
  Share2,
  Calendar
} from 'lucide-react';

interface ProfessionalIDCardProps {
  userName: string;
  userType: string;
  userId: number | string;
  userDistrict: string;
  userMobile: string;
  userEmail: string;
  barAssociation: string;
  chamberAddress: string;
  sponsorName?: string;
  sponsorMobile?: string;
  profilePicture?: string;
  isPremium?: boolean;
  language: 'bn' | 'en' | 'hi' | 'ur';
  theme?: 'light' | 'dark';
}

export const ProfessionalIDCard = ({
  userName,
  userType,
  userId,
  userDistrict,
  userMobile,
  barAssociation,
  chamberAddress,
  sponsorName,
  sponsorMobile,
  profilePicture,
  isPremium,
  language
}: ProfessionalIDCardProps) => {
  const isBn = language === 'bn';
  const isClerk = userType?.toLowerCase() === 'clerk' || userType === 'মুহুরি' || userType === 'মুহুরী';
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: 'transparent',
      });

      const link = document.createElement('a');
      link.download = `professional_id_card_${userName.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
      alert(isBn ? 'ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to download card.');
    }
  };

  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    const shareData = {
      title: isBn ? 'আমার ডিজিটাল আইডি কার্ড' : 'My Digital ID Card',
      text: isBn 
        ? `${userName}-এর ডিজিটাল আইডি কার্ড দেখুন` 
        : `View ${userName}'s Digital ID Card`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web share not supported');
      }
    } catch (err) {
      // Fallback for failed share or unsupported environments
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert(isBn ? 'লিঙ্ক কপি করা হয়েছে!' : 'Link copied to clipboard!');
      } catch (clipErr) {
        console.error('Clipboard failed:', clipErr);
        alert(isBn ? 'শেয়ার করা সম্ভব হচ্ছে না।' : 'Unable to share at this moment.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div 
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col md:flex-row gap-6 items-center md:items-start bg-slate-900/5 p-4 rounded-[2.5rem]"
      >
        {/* Front of the Card */}
        <div className="relative w-[300px] aspect-[5/8] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 group">
          {/* Background Design */}
          <div className={`absolute inset-0 bg-gradient-to-br ${isClerk ? 'from-emerald-600 via-emerald-700 to-emerald-900' : 'from-indigo-600 via-indigo-700 to-indigo-900'}`} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-50" />
          
          {/* Top Pattern */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-white to-amber-400 z-10" />

          <div className="relative h-full flex flex-col p-6 text-white text-center">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-xl">
                <Shield className={isClerk ? 'text-emerald-600' : 'text-indigo-600'} size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-[11px] font-black tracking-tight leading-none uppercase">
                  {barAssociation}
                </h3>
                <p className="text-[8px] font-bold text-white/50 uppercase tracking-[0.2em]">
                  {isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Card'}
                </p>
              </div>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-[2.5rem] p-1 bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl overflow-hidden">
                  <div className="w-full h-full rounded-[2.2rem] bg-white flex items-center justify-center text-slate-900 font-black text-5xl overflow-hidden">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Professional" 
                        className="w-full h-full object-cover" 
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-slate-200">{userName.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-9 h-9 ${isClerk ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-2xl border-4 ${isClerk ? 'border-emerald-900' : 'border-indigo-900'} flex items-center justify-center shadow-lg`}>
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-black tracking-tight leading-tight">{userName}</h2>
                <div className="flex flex-col items-center gap-2">
                  <div className={`inline-block px-4 py-1.5 rounded-xl ${isClerk ? 'bg-emerald-500/20' : 'bg-indigo-500/20'} border ${isClerk ? 'border-emerald-500/30' : 'border-indigo-500/30'} text-[10px] font-black uppercase tracking-[0.3em] text-white`}>
                    {userType}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{userDistrict}</span>
                    {isPremium && (
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-[8px] font-black rounded-md uppercase">PREMIUM</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Info */}
            <div className="space-y-4 pt-6 border-t border-white/10 mt-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[8px] font-black text-white/40 uppercase tracking-widest">
                    <Shield size={8} /> {isBn ? 'সদস্য আইডি' : 'Member ID'}
                  </div>
                  <p className="text-[11px] font-black font-mono">#{userId}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[8px] font-black text-white/40 uppercase tracking-widest">
                    <Phone size={8} /> {isBn ? 'মোবাইল' : 'Mobile'}
                  </div>
                  <p className="text-[11px] font-black font-mono">{userMobile}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 pt-4 border-t border-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">{isClerk ? 'CLERK COUNCIL SERVICE' : 'BAR COUNCIL SERVICE'}</p>
                <div className="h-6 w-3/4 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of the Card (Foldable Section) */}
        <div className="relative w-[300px] aspect-[5/8] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 group">
          <div className={`absolute inset-0 ${isClerk ? 'bg-emerald-950' : 'bg-indigo-950'}`} />
          
          <div className="relative h-full flex flex-col p-8 text-white text-center">
            {/* Verification Section */}
            <div className="flex flex-col items-center gap-6 mt-4">
              <div className="p-4 bg-white rounded-[2rem] shadow-2xl">
                <QrCode size={110} className="text-slate-900" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">{isBn ? 'যাচাই করতে স্ক্যান করুন' : 'Scan to Verify'}</p>
                <p className="text-[9px] font-bold text-white/40">{isBn ? 'এমডিসি কেসবুক ডিজিটাল ভেরিফিকেশন' : 'MDC Casebook Digital Verification'}</p>
              </div>
            </div>

            {/* Address and Sponsor Details */}
            <div className="mt-8 space-y-6 flex-grow">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  <MapPin size={10} /> {isBn ? 'চেম্বার ঠিকানা' : 'Chamber Address'}
                </div>
                <p className="text-[11px] font-bold text-white/90 leading-relaxed px-4">
                  {chamberAddress}
                </p>
              </div>

              {sponsorName && (
                <div className="space-y-2 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                    <Shield size={10} /> {isBn ? 'স্পন্সর উকিলের নাম' : 'Sponsor Lawyer Name'}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-white">{sponsorName}</p>
                    <p className="text-[10px] font-bold text-white/50">{sponsorMobile}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Authority */}
            <div className="mt-auto space-y-6">
              <div className="space-y-1">
                <p className="text-[8px] font-medium text-white/30 px-6 uppercase tracking-wider leading-tight">
                  {isBn 
                    ? 'এই কার্ডটি শুধুমাত্র এমডিসি কেসবুক পোর্টালে ভেরিফাইড সদস্যদের জন্য। এটি কোনো সরকারি কার্ড নয়।' 
                    : 'This card is only for verified members of MDC Casebook portal. This is not a government ID.'
                  }
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col items-center gap-2">
                <div className="h-8 w-32 border-b border-white/20 flex items-center justify-center italic font-serif text-white/80 text-xs text-center">
                  {isClerk ? 'MDC Authority' : 'Digital Bar Authority'}
                </div>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">VERIFIED AUTHORITY</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-4 w-full max-w-[300px] md:max-w-[624px]">
        <button 
          onClick={handleDownload}
          className={`flex-grow flex items-center justify-center gap-2 px-6 py-4 ${isClerk ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'} text-white rounded-2xl font-black transition-all shadow-xl text-sm`}
        >
          <Download size={18} /> {isBn ? 'ডাউনলোড কার্ড' : 'Download Card'}
        </button>
        <button 
          onClick={handleShare}
          className="px-5 py-4 bg-white text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all border border-slate-100 shadow-sm"
        >
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};
