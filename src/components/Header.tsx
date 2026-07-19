import React, { useState } from 'react';
import { translations } from '../translations';
import { Language, Page, UserProfile } from '../types';
import { Sparkles, Sun, Moon, LogOut, User, ShieldCheck, Coins, Menu, X } from 'lucide-react';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onLoginClick: () => void;
  isFirebaseConnected?: boolean;
  onRefresh: () => void;
}

export default function Header({
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  currentPage,
  setCurrentPage,
  user,
  onLogout,
  onLoginClick,
  isFirebaseConnected = true,
  onRefresh,
}: HeaderProps) {
  const t = translations[language];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'active' | 'quota_warning' | 'error'>('checking');
  const [geminiLatency, setGeminiLatency] = useState<number | null>(null);

  React.useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/gemini-status');
        const data = await res.json();
        if (active) {
          if (data.success && data.working) {
            if (data.quotaExceeded) {
              setGeminiStatus('quota_warning');
            } else {
              setGeminiStatus('active');
              setGeminiLatency(data.latencyMs);
            }
          } else {
            setGeminiStatus('error');
          }
        }
      } catch {
        if (active) {
          setGeminiStatus('error');
        }
      }
    };
    checkStatus();
    return () => {
      active = false;
    };
  }, [onRefresh]);

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavClick('landing')}
          >
            <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-xl text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
              {t.brandName}
            </span>
            {isFirebaseConnected && (
              <div className="hidden xs:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20 ml-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">Firebase Connected</span>
              </div>
            )}
            

          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium relative">
            <button 
              onClick={() => handleNavClick('features')}
              className={`transition-colors duration-200 ${currentPage === 'features' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
            >
              {t.features}
            </button>
            
            {/* Services Dropdown */}
            <div className="relative group cursor-pointer">
              <button className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-200">
                {language === 'ar' ? 'خدمات إضافية' : 'Additional Services'}
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top translate-y-2 group-hover:translate-y-0">
                <div className="p-2 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                  <button onClick={() => handleNavClick('logo-maker')} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                    {language === 'ar' ? 'تصميم شعار احترافي 3D وعادي' : '3D & Flat Logo Maker'}
                  </button>
                  <button onClick={() => handleNavClick('business-cards')} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    {language === 'ar' ? 'تصميم بطاقات العمل' : 'Business Card Maker'}
                  </button>
                  <button onClick={() => handleNavClick('social-media')} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    {language === 'ar' ? 'أصول السوشيال ميديا' : 'Social Media Assets'}
                  </button>
                  <button onClick={() => handleNavClick('seo')} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    {language === 'ar' ? 'تحسين محركات البحث SEO' : 'SEO Optimization'}
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleNavClick('pricing')}
              className={`transition-colors duration-200 ${currentPage === 'pricing' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
            >
              {t.pricing}
            </button>
            <button 
              onClick={() => handleNavClick('faq')}
              className={`transition-colors duration-200 ${currentPage === 'faq' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
            >
              {t.faq}
            </button>
            <button 
              onClick={() => handleNavClick('contact')}
              className={`transition-colors duration-200 ${currentPage === 'contact' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
            >
              {t.contact}
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Language Switcher */}
            <button
              onClick={() => { setLanguage(language === 'en' ? 'ar' : 'en'); setIsMobileMenuOpen(false); }}
              className="hidden sm:block text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => { setDarkMode(!darkMode); setIsMobileMenuOpen(false); }}
              className="hidden sm:block p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Access Controls */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Credit balance badge */}
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{user.credits} {t.credits}</span>
                </div>

                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user.displayName}</span>
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="hidden md:block p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition"
                    title={t.adminPanel}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="hidden md:block p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
                className="hidden md:block bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {t.login}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 absolute top-16 left-0 right-0 shadow-lg px-4 py-6 flex flex-col gap-4">
          <button 
            onClick={() => handleNavClick('features')}
            className={`text-left text-base font-medium px-4 py-2 rounded-lg ${currentPage === 'features' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {t.features}
          </button>
          
          <div className="flex flex-col gap-2 px-4 py-2 border-l-2 border-indigo-100 dark:border-indigo-900/30 ml-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{language === 'ar' ? 'خدمات إضافية' : 'Additional Services'}</span>
            <button onClick={() => handleNavClick('logo-maker')} className="text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">{language === 'ar' ? 'تصميم شعار احترافي 3D وعادي' : '3D & Flat Logo Maker'}</button>
            <button onClick={() => handleNavClick('business-cards')} className="text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">{language === 'ar' ? 'تصميم بطاقات العمل' : 'Business Card Maker'}</button>
            <button onClick={() => handleNavClick('social-media')} className="text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">{language === 'ar' ? 'أصول السوشيال ميديا' : 'Social Media Assets'}</button>
            <button onClick={() => handleNavClick('seo')} className="text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">{language === 'ar' ? 'تحسين محركات البحث SEO' : 'SEO Optimization'}</button>
          </div>

          <button 
            onClick={() => handleNavClick('pricing')}
            className={`text-left text-base font-medium px-4 py-2 rounded-lg ${currentPage === 'pricing' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {t.pricing}
          </button>
          <button 
            onClick={() => handleNavClick('faq')}
            className={`text-left text-base font-medium px-4 py-2 rounded-lg ${currentPage === 'faq' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {t.faq}
          </button>
          <button 
            onClick={() => handleNavClick('contact')}
            className={`text-left text-base font-medium px-4 py-2 rounded-lg ${currentPage === 'contact' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            {t.contact}
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Settings</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {user ? (
            <div className="flex flex-col gap-2 mt-2 px-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.displayName}</span>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{user.credits} {t.credits}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleNavClick('dashboard')}
                className="flex items-center gap-3 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left text-base"
              >
                <User className="w-5 h-5" />
                Dashboard
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="flex items-center gap-3 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-left text-base"
                >
                  <ShieldCheck className="w-5 h-5" />
                  {t.adminPanel}
                </button>
              )}

              <button
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-left text-base mt-2"
              >
                <LogOut className="w-5 h-5" />
                {t.logout}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}
              className="mt-2 mx-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-center"
            >
              {t.login}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
