import React from 'react';
import { 
  Menu, 
  Bell, 
  BellOff, 
  Search, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut,
  LucideIcon
} from 'lucide-react';
import { Logo } from '../../components/Logo';

interface HeaderProps {
  onMenuClick: () => void;
  userName: string;
  userType: string;
  profilePic?: string;
  unreadCount: number;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  language: 'bn' | 'en' | 'hi' | 'ur';
  t: (key: string) => string;
}

export const Header = ({
  onMenuClick,
  userName,
  userType,
  profilePic,
  unreadCount,
  onNotificationClick,
  onProfileClick,
  onLogout,
  theme,
  language,
  t
}: HeaderProps) => {
  return (
    <header className={`
      sticky top-0 z-40 h-20 px-6 lg:px-10 flex items-center justify-between transition-all duration-300
      ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'}
      backdrop-blur-xl border-b
    `}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
        >
          <Menu size={24} />
        </button>
        <div className="flex lg:hidden">
          <Logo size="sm" />
        </div>
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 group focus-within:ring-2 focus-within:ring-indigo-500 transition-all w-80">
          <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'মামলা বা তথ্য খুঁজুন...' : 'Search cases or info...'}
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-600 dark:text-slate-300 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button 
          onClick={onNotificationClick}
          className={`
            relative p-2.5 rounded-2xl transition-all duration-300 group
            ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}
          `}
        >
          {unreadCount > 0 ? <Bell size={22} className="group-hover:animate-bounce" /> : <BellOff size={22} />}
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg shadow-rose-200">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block"></div>

        <div className="relative group">
          <button className={`
            flex items-center gap-3 p-1.5 pr-3 rounded-2xl transition-all duration-300
            ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}
          `}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0)
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className={`text-xs font-black truncate max-w-[100px] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">{userType}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
          </button>

          {/* Dropdown Menu */}
          <div className={`
            absolute top-full right-0 mt-3 w-56 p-2 rounded-3xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100
            ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}
          `}>
            <button 
              onClick={onProfileClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <User size={18} />
              {t('profile')}
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Settings size={18} />
              {t('settings')}
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-4"></div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
            >
              <LogOut size={18} />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
