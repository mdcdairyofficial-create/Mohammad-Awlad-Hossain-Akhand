import { motion } from 'motion/react';
import { Logo } from '../../components/Logo';

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-indigo-900 text-white z-50"
    >
      <motion.div
        initial={{ scale: 0.5, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        className="mb-8"
      >
        <Logo size="xl" className="scale-150" />
      </motion.div>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-indigo-200 text-lg font-medium mt-12"
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
