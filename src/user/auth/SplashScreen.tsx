import { motion } from 'motion/react';
import { Logo } from '../../components/Logo';

export default function SplashScreen() {
  return (
    <>
      {/* Mobile Splash (Dark background) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-[#020617] z-50 md:hidden"
      >
        <motion.img
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src="/mobile-splash.png"
          alt="Mobile Splash Screen"
          className="w-full h-full object-contain pointer-events-none"
        />
      </motion.div>

      {/* Desktop Splash (Dark background blending with desktop image) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 hidden md:flex items-center justify-center bg-[#020617] z-50"
      >
        <motion.img
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          src="/desktop-splash.png"
          alt="Desktop Splash Screen"
          className="w-full h-full object-contain pointer-events-none"
        />
      </motion.div>
    </>
  );
}
