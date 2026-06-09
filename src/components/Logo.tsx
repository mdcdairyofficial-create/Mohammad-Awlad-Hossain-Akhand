import React from 'react';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = "", size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-auto h-10 p-0.5',
    md: 'w-auto h-14 p-1',
    lg: 'w-auto h-16 p-1',
    xl: 'w-auto h-24 p-1'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex-shrink-0 group flex items-center">
        {/* Main Logo Container */}
        <div className={`${sizeClasses[size]} bg-transparent flex items-center justify-center transition-transform duration-500 relative z-10 hover:scale-105`}>
          <img 
            src="/logo.png" 
            alt="MDC Casebook" 
            className="h-full w-auto object-contain drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
};
