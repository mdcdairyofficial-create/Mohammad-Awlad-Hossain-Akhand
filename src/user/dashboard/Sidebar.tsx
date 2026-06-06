import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  LogOut, 
  Moon, 
  Sun, 
  Languages, 
  ChevronRight,
  LucideIcon
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  menuGroups: MenuGroup[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: 'bn' | 'en' | 'hi' | 'ur';
  setLanguage: (lang: 'bn' | 'en' | 'hi' | 'ur') => void;
  userName: string;
  userType: string;
  onLogout: () => void;
}

export const Sidebar = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  menuGroups,
  theme,
  setTheme,
  language,
  setLanguage,
  userName,
  userType,
  onLogout
}: SidebarProps) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-80 z-50 transform transition-all duration-500 ease-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}
        border-r shadow-2xl lg:shadow-none
      `}>
        {/* Sidebar Header */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img src="/brand-banner.png" alt="MDC Casebook Banner" className="h-16 w-auto object-contain cursor-pointer" />
          </div>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-8">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="px-4 text-[9px] font-black text-black dark:text-slate-400 uppercase tracking-[0.25em] mb-4">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group
                      ${activeTab === item.id 
                        ? 'bg-indigo-800 text-white shadow-xl shadow-indigo-200 translate-x-1' 
                        : `text-slate-900 dark:text-slate-300 hover:translate-x-1 ${theme === 'dark' ? 'hover:bg-slate-800 hover:text-slate-200' : 'hover:bg-slate-100 hover:text-indigo-900'} ${item.id === 'my_points' ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-700 dark:text-slate-400 group-hover:scale-110 transition-transform'} />
                      <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                    </div>
                    {activeTab === item.id && (
                      <motion.div layoutId="activeTab" className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-6 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`p-4 rounded-3xl mb-4 flex items-center justify-between ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-700 text-amber-400' : 'bg-white text-slate-400 shadow-sm'}`}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="relative group">
                <button className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-700 text-indigo-400' : 'bg-white text-slate-400 shadow-sm'}`}>
                  <Languages size={18} />
                </button>
                <div className={`absolute bottom-full left-0 mb-2 p-2 rounded-2xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 min-w-[120px] ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                  {(['bn', 'en', 'hi', 'ur'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${language === lang ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      {lang === 'bn' ? 'বাংলা' : lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'اردু'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => {
              setActiveTab('profile');
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex items-center gap-3 px-2 w-full text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-indigo-950'}`}>{userName}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{userType}</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
