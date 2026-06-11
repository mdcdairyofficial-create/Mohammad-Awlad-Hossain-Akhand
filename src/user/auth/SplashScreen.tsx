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
      {/* Mobile Splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
        style={{ willChange: "opacity" }}
        className="fixed inset-0 flex flex-col items-center justify-end bg-[#020617] h-screen w-screen overflow-hidden z-[9999] md:hidden"
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src="/mobile-splash-screen.png"
            alt="Mobile Splash Screen"
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        </div>
        
        <div className="relative z-10 w-full flex justify-center bg-transparent py-10 pb-16">
          {loadingContent}
        </div>
      </motion.div>

      {/* Desktop Splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
        style={{ willChange: "opacity" }}
        className="fixed inset-0 hidden md:flex flex-col items-center justify-end bg-[#020617] h-screen w-screen overflow-hidden z-[9999]"
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            src="/website sp;ash scerrn.png"
            alt="Desktop Splash Screen"
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        </div>

        <div className="relative z-10 w-full flex justify-center bg-transparent py-12 pb-16">
          {loadingContent}
        </div>
      </motion.div>
    </>
  );
}

