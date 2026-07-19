import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { X, Cookie } from 'lucide-react';

interface CookieConsentProps {
  language: Language;
}

export default function CookieConsent({ language }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('brandforge_cookie_consent');
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('brandforge_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('brandforge_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in-up pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full shrink-0">
              <Cookie className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className={`text-sm text-slate-600 dark:text-slate-300 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="font-semibold text-slate-900 dark:text-white mb-1">
                {language === 'ar' ? 'نحن نستخدم ملفات تعريف الارتباط' : 'We use cookies'}
              </p>
              <p className="leading-relaxed">
                {language === 'ar' 
                  ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا، وتحليل حركة المرور، وتخصيص المحتوى. باستخدامك للموقع، فإنك توافق على سياسة الخصوصية الخاصة بنا.' 
                  : 'We use cookies to improve your experience, analyze site traffic, and personalize content. By continuing to use this site, you consent to our use of cookies.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <button 
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              {language === 'ar' ? 'رفض' : 'Decline'}
            </button>
            <button 
              onClick={handleAccept}
              className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition"
            >
              {language === 'ar' ? 'قبول' : 'Accept All'}
            </button>
            <button 
              onClick={() => setIsVisible(false)}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
