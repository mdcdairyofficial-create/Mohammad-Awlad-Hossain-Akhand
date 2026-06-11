import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Send } from "lucide-react";

interface TelegramGateProps {
  onComplete: () => void;
}

export default function TelegramGate({ onComplete }: TelegramGateProps) {
  const [hasClickedJoin, setHasClickedJoin] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f8ff] flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden">
      {/* Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[420px] w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 flex flex-col items-center px-6 md:px-10 py-12 border border-blue-50"
      >
        {/* Background Faded Pattern */}
        <div className="absolute top-10 inset-x-0 z-0 pointer-events-none opacity-[0.03] flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="MDC"
            className="w-56 h-auto drop-shadow-xl"
          />
          <div className="text-[28px] font-black mt-2 text-[#0088cc]">
            MDC CASEBOOK
          </div>
          <div className="text-[10px] font-bold tracking-widest mt-0.5 text-center px-4 leading-relaxed">
            ALL IN ONE LAW SOLUTION
          </div>
        </div>

        {/* Floating Telegram Icon */}
        <div className="relative z-10 mt-6 mb-8">
          <div className="w-[120px] h-[120px] bg-[#0088cc] rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(0,136,204,0.3)] relative overflow-hidden">
            <img 
              src="/Telegram.png" 
              alt="Telegram"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to purely CSS/SVG if the user hasn't uploaded the image yet
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                   (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[60px] h-[60px]"
              style={{ display: 'none', marginLeft: '-5px', marginTop: '5px' }}
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>

          {/* Decorative rings/dots around main logo matching mockup */}
          <div className="absolute -top-3 -left-6 w-3 h-3 border-2 border-[#0088cc]/60 rounded-full"></div>
          <div className="absolute top-12 -right-8 w-4 h-4 border-2 border-[#0088cc]/60 rounded-full"></div>
          <div className="absolute top-2 -right-1 text-[#0088cc]/60 text-lg font-bold">
            ✦
          </div>
          <div className="absolute bottom-2 -left-6 text-[#0088cc]/60 text-xl font-black">
            +
          </div>
          <div className="absolute -top-6 left-12 text-[#0088cc]/60 text-xl font-bold">
            +
          </div>
        </div>

        {/* Send Icon */}
        <div className="bg-[#0088cc] text-white p-[10px] rounded-full z-10 mx-auto mt-2">
          <Send size={24} fill="white" className="text-white" />
        </div>

        {/* Titles */}
        <h2 className="text-[#132c51] text-[28px] font-extrabold text-center z-10 leading-[1.2] mt-4 mb-3 tracking-tight">
          আমাদের
          <br />
          <span className="text-[#0088cc] text-[34px]">Telegram Channel</span>
          <br />
          Join করুন
        </h2>

        {/* Blue Line Divider */}
        <div className="flex gap-1.5 mt-2 mb-6 z-10">
          <div className="h-1.5 w-10 bg-[#0088cc] rounded-full"></div>
          <div className="h-1.5 w-2 bg-[#0088cc] rounded-full"></div>
        </div>

        {/* Description */}
        <p className="text-[#475569] text-center text-[15px] font-semibold leading-relaxed px-1 z-10 mb-10">
          গুরুত্বপূর্ণ নোটিশ, আপডেট ও আইন বিষয়ক
          <br />
          তথ্য সবার আগে পেতে আমাদের অফিশিয়াল
          <br />
          Telegram Channel এ Join করুন।
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-4 z-10">
          <a
            href="https://t.me/mdcdairy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setHasClickedJoin(true)}
            className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white py-4 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgb(0,136,204,0.25)] flex justify-center items-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <Send size={22} className="text-white" />
            Join Telegram
          </a>

          <button
            onClick={onComplete}
            disabled={!hasClickedJoin}
            className={`w-full border-2 py-3.5 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all ${
              hasClickedJoin
                ? "border-[#0088cc] text-[#0088cc] hover:bg-blue-50 cursor-pointer active:scale-[0.98]"
                : "border-slate-300 text-slate-400 cursor-not-allowed opacity-70"
            }`}
          >
            Next
            <ArrowRight size={22} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
