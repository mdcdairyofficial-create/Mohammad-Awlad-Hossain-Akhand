import React from 'react';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = "", showSubtitle = false, size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10 p-1',
    md: 'w-12 h-12 p-1.5',
    lg: 'w-14 h-14 p-1.5',
    xl: 'w-16 h-16 p-2'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-shrink-0 group">
        {/* Main Logo Container */}
        <div className={`${sizeClasses[size]} bg-white rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/10 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-500 relative z-10`}>
          <img 
            src="https://ais-blob-abpf5up7tfpf5iiqmxk4bl-213411422099.asia-southeast1.run.app/42d20120-cfbc-4b95-bdb1-995b057baf36" 
            alt="MDC LEGAL" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -inset-1 bg-indigo-500/5 blur-xl rounded-full -z-10 group-hover:bg-indigo-500/10 transition-colors"></div>
      </div>

      {showSubtitle && (
        <div className="flex flex-col">
          <h1 className={`${size === 'sm' ? 'text-sm' : 'text-lg'} text-white font-black leading-none tracking-tighter uppercase flex items-center gap-1`}>
            MDC <span className="text-indigo-400">DAIRY</span>
          </h1>
          <div className="flex flex-col mt-0.5">
            <p className="text-[7px] lg:text-[9px] text-indigo-200 font-bold uppercase tracking-widest leading-none">
              ডিজিটাল আদালত ভিত্তিক ডায়েরি
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
