import React from 'react';
import { translations } from '../translations';
import { Language, Page } from '../types';
import { Sparkles, Heart, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  language: Language;
  setCurrentPage: (page: Page) => void;
}

export default function Footer({ language, setCurrentPage }: FooterProps) {
  const t = translations[language];

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Trust Badges Section */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 pb-12 mb-12 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span className="text-sm font-medium">{language === 'ar' ? 'متوافق مع GDPR' : 'GDPR Compliant'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Lock className="w-6 h-6 text-indigo-500" />
            <span className="text-sm font-medium">{language === 'ar' ? 'تشفير 256-bit SSL' : '256-bit SSL Encryption'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium">{language === 'ar' ? 'دفع آمن 100%' : '100% Secure Checkout'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {t.brandName}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              {t.footerText}
            </p>
            {/* Payment Methods Visuals */}
            <div className="flex gap-2 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
              <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">VISA</div>
              <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">MC</div>
              <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">AMEX</div>
              <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">STRIPE</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {t.features}
            </h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.nameGen}</button></li>
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.logoGen}</button></li>
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.sloganGen}</button></li>
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.brandKit}</button></li>
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.socialGen}</button></li>
              <li><button onClick={() => setCurrentPage('features')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{language === 'ar' ? 'مشاركة الأصول' : 'Asset Sharing'}</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              {language === 'ar' ? 'الخدمات والقانونية' : 'Legal & Support'}
            </h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><button onClick={() => setCurrentPage('terms')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.terms}</button></li>
              <li><button onClick={() => setCurrentPage('privacy')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.privacy}</button></li>
              <li><button onClick={() => setCurrentPage('faq')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.faq}</button></li>
              <li><button onClick={() => setCurrentPage('contact')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">{t.contact}</button></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {t.brandName}. {t.rights}</p>
          <p className="flex items-center gap-1">
            <span>{language === 'ar' ? 'صُنع بكل حب' : 'Crafted with'}</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>{language === 'ar' ? 'بواسطة BrandForge AI' : 'by BrandForge AI'}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
