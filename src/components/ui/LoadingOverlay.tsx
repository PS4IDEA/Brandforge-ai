import React from 'react';
import { Loader2 } from 'lucide-react';
import { Language } from '../../types';

interface Props {
  isLoading: boolean;
  message?: string;
  language: Language;
}

export default function LoadingOverlay({ isLoading, message, language }: Props) {
  if (!isLoading) return null;
  const isAr = language === 'ar';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
          {message || (isAr ? 'جاري المعالجة...' : 'Processing...')}
        </h3>
        <p className="text-slate-500 text-center text-sm">
          {isAr ? 'يرجى الانتظار حتى تكتمل العملية.' : 'Please wait while the process completes.'}
        </p>
      </div>
    </div>
  );
}
