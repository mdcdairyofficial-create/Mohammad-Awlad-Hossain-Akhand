import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ThumbsUp } from "lucide-react";

interface FacebookGateProps {
  onComplete: () => void;
}

export default function FacebookGate({ onComplete }: FacebookGateProps) {
  const [hasClickedFollow, setHasClickedFollow] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f7fd] flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden">
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
          <div className="text-[28px] font-black mt-2 text-[#0866FF]">
            MDC CASEBOOK
          </div>
          <div className="text-[10px] font-bold tracking-widest mt-0.5 text-center px-4 leading-relaxed">
            ALL IN ONE LAW SOLUTION
          </div>
        </div>

        {/* Floating Facebook Icon */}
        <div className="relative z-10 mt-6 mb-8">
          <div className="w-[120px] h-[120px] bg-[#0866FF] rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(8,102,255,0.3)] relative">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[60px] h-[60px]"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>

          {/* Decorative rings/dots around main logo matching mockup */}
          <div className="absolute -top-3 -left-6 w-3 h-3 border-2 border-[#0866FF]/60 rounded-full"></div>
          <div className="absolute top-12 -right-8 w-4 h-4 border-2 border-[#0866FF]/60 rounded-full"></div>
          <div className="absolute top-2 -right-1 text-[#0866FF]/60 text-lg font-bold">
            ✦
          </div>
          <div className="absolute bottom-2 -left-6 text-[#0866FF]/60 text-xl font-black">
            +
          </div>
          <div className="absolute -top-6 left-12 text-[#0866FF]/60 text-xl font-bold">
            +
          </div>
        </div>

        {/* Thumbs Up Icon */}
        <div className="bg-[#0866FF] text-white p-[10px] rounded-full z-10 mx-auto mt-2">
          <ThumbsUp size={24} fill="white" className="text-white" />
        </div>

        {/* Titles */}
        <h2 className="text-[#132c51] text-[28px] font-extrabold text-center z-10 leading-[1.2] mt-4 mb-3 tracking-tight">
          আমাদের
          <br />
          <span className="text-[#0866FF] text-[34px]">Facebook Page</span>
          <br />
          Follow করুন
        </h2>

        {/* Blue Line Divider */}
        <div className="flex gap-1.5 mt-2 mb-6 z-10">
          <div className="h-1.5 w-10 bg-[#0866FF] rounded-full"></div>
          <div className="h-1.5 w-2 bg-[#0866FF] rounded-full"></div>
        </div>

        {/* Description */}
        <p className="text-[#475569] text-center text-[15px] font-semibold leading-relaxed px-1 z-10 mb-10">
          গুরুত্বপূর্ণ নোটিশ, আপডেট ও আইন বিষয়ক
          <br />
          তথ্য সবার আগে পেতে আমাদের অফিশিয়াল
          <br />
          Facebook Page টি Follow করুন।
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-4 z-10">
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setHasClickedFollow(true)}
            className="w-full bg-[#0866FF] hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-[0_8px_20px_rgb(8,102,255,0.25)] flex justify-center items-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[22px] h-[22px] bg-white text-[#0866FF] rounded-[4px] p-[1px]"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Follow on Facebook
          </a>

          <button
            onClick={onComplete}
            disabled={!hasClickedFollow}
            className={`w-full border-2 py-3.5 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all ${hasClickedFollow ? "border-[#0866FF] text-[#0866FF] hover:bg-blue-50 cursor-pointer active:scale-[0.98]" : "border-slate-300 text-slate-400 cursor-not-allowed opacity-70"}`}
          >
            Next
            <ArrowRight size={22} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
