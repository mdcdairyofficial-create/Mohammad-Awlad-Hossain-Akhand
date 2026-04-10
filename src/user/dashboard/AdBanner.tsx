import React from 'react';

export const AdBanner = ({ className = "", theme = "light", containerClassName = "", innerClassName = "", isPremium = false }: { className?: string, theme?: string, containerClassName?: string, innerClassName?: string, isPremium?: boolean }) => {
  if (isPremium) return null;
  return (
    <div className={`w-full ${containerClassName || (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')} border rounded-2xl flex flex-col items-center justify-center p-4 text-slate-400 text-sm font-medium ${className}`}>
      <span className="text-[10px] uppercase tracking-widest mb-2 opacity-60">Advertisement</span>
      <div className={`w-full max-w-3xl h-24 ${innerClassName || (theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300')} rounded-xl flex items-center justify-center border border-dashed`}>
        <span className="opacity-50">Ad Space (728x90)</span>
      </div>
    </div>
  );
};
