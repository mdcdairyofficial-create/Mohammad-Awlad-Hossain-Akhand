import { motion } from 'motion/react';
import { Gavel } from 'lucide-react';

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-indigo-900 text-white z-50"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        className="mb-6 bg-white/10 p-6 rounded-full backdrop-blur-sm"
      >
        <Gavel size={64} className="text-indigo-200" />
      </motion.div>
      
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold tracking-tight mb-2"
      >
        MDC Diary
      </motion.h1>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-indigo-200 text-lg font-medium"
      >
        আদালত ভিত্তিক মামলার তথ্য ডায়েরি
      </motion.p>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ delay: 0.8, duration: 1.5 }}
        className="h-1 bg-indigo-400/30 rounded-full mt-8 overflow-hidden"
      >
        <motion.div 
          animate={{ x: [-200, 200] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-full w-1/2 bg-white rounded-full"
        />
      </motion.div>
    </motion.div>
  );
}
