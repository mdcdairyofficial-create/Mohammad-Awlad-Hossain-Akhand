import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2000; // smooth 2 second load duration

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, []);

  const dotVariants = {
    initial: { opacity: 0.3 },
    animate: (i: number) => ({
      opacity: [0.3, 1, 0.3],
      transition: {
        delay: i * 0.25,
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      } as any
    })
  };

  const loadingContent = (
    <div className="flex flex-col items-center justify-center w-full max-w-[280px] px-6">
      {/* Loading Text with Blinking Dots */}
      <div className="flex items-center text-slate-300 font-medium text-base tracking-wide mb-3 select-none">
        <span>লোড হচ্ছে</span>
        <div className="flex items-center gap-0.5 ml-1 h-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              custom={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              className="text-indigo-400 font-black text-xl leading-none"
            >
              .
            </motion.span>
          ))}
        </div>
      </div>

      {/* Loading Progress Bar Container */}
      <div className="w-full h-2.5 bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden shadow-inner relative flex items-center">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ ease: "easeOut" }}
        />
        {/* Dynamic active glow pulse */}
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-12 animate-pulse" />
      </div>

      {/* Percentage Indicator */}
      <span className="text-[10px] font-bold text-slate-500 mt-1.5 font-mono tracking-wider select-none">
        {Math.round(progress)}%
      </span>
    </div>
  );

  return (
    <>
      {/* Mobile Splash (Dark background) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex flex-col items-center justify-center bg-[#020617] h-screen w-screen overflow-hidden z-50 md:hidden"
      >
        <div className="relative w-full h-[72%] flex items-center justify-center mt-[-4%]">
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src="/mobile-splash.png"
            alt="Mobile Splash Screen"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
        
        {/* Dynamic Loading Area (Perfect blend-mask covering the static PNG loader) */}
        <div className="absolute bottom-[10%] left-0 right-0 py-6 flex justify-center bg-[#020617] z-10">
          {loadingContent}
        </div>
      </motion.div>

      {/* Desktop Splash (Dark background blending with desktop image) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 hidden md:flex flex-col items-center justify-center bg-[#020617] h-screen w-screen overflow-hidden z-50"
      >
        <div className="relative w-full h-[76%] flex items-center justify-center mt-[-2%]">
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            src="/desktop-splash.png"
            alt="Desktop Splash Screen"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* Dynamic Loading Area for Desktop */}
        <div className="absolute bottom-[12%] left-0 right-0 py-6 flex justify-center bg-[#020617] z-10">
          {loadingContent}
        </div>
      </motion.div>
    </>
  );
}

