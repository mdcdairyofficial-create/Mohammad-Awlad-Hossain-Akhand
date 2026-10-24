import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, BookOpen, Shield, FileText, Home, Sparkles, Scale, Smartphone } from 'lucide-react';
import { Logo } from './Logo';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface PublicNavbarProps {
  isLoggedIn?: boolean;
  onGoToPortal?: () => void;
  language?: 'bn' | 'en';
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  isLoggedIn = false,
  onGoToPortal,
  language = 'bn',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: language === 'bn' ? 'হোম' : 'Home', href: '/', icon: Home },
    { label: language === 'bn' ? 'ফিচারসমূহ' : 'Features', href: '/#features', icon: Sparkles },
    { label: language === 'bn' ? 'আইনি ব্লগ' : 'Legal Blog', href: '/blog', icon: BookOpen },
    { label: language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: language === 'bn' ? 'শর্তাবলী' : 'Terms of Service', href: '/terms', icon: FileText },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const elementId = href.replace('/#', '');
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#060c1d]/95 backdrop-blur-xl border-b border-indigo-950/80 text-white transition-all shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-md shadow-indigo-600/30 border border-indigo-400/40 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Scale className="text-white" size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                MDC Casebook
                <span className="text-[10px] uppercase font-bold bg-indigo-500/20 text-cyan-300 border border-indigo-400/30 px-1.5 py-0.5 rounded-full">
                  BD
                </span>
              </span>
              <span className="text-[10px] text-cyan-200/90 font-medium tracking-wide">
                ডিজিটাল কোর্ট ও মামলার ডায়েরি
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/25 border border-indigo-400/30' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <item.icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <PWAInstallButton variant="header" language={language} />

            {isLoggedIn ? (
              <Link
                to="/dashboard"
                onClick={onGoToPortal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full text-xs sm:text-sm font-black shadow-lg shadow-purple-600/30 active:scale-95 transition-all border border-purple-400/30"
              >
                <span>{language === 'bn' ? 'আমার ড্যাশবোর্ড' : 'My Dashboard'}</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={onGoToPortal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full text-xs sm:text-sm font-black shadow-lg shadow-purple-600/30 active:scale-95 transition-all border border-purple-400/30"
              >
                <span>{language === 'bn' ? 'আমার অ্যাকাউন্ট' : 'My Account'}</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <PWAInstallButton variant="header" language={language} />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoToPortal?.();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm shadow-md transition-all"
              >
                <span>{language === 'bn' ? 'আমার ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Dashboard'}</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoToPortal?.();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white rounded-xl font-black text-sm shadow-md transition-all"
              >
                <span>{language === 'bn' ? 'লগইন / রেজিস্ট্রেশন পোর্টাল' : 'Login / Register'}</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
