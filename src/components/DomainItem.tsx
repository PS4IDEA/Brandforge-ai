import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function DomainItem({ domain }: { domain: string }) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const handleCheck = () => {
    setStatus('checking');
    setTimeout(() => {
      // Mock random availability
      setStatus(Math.random() > 0.3 ? 'available' : 'taken');
    }, 1500);
  };

  const handleClick = () => {
    if (status === 'idle') {
      handleCheck();
    } else if (status === 'available') {
      window.open(`https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <span
      onClick={handleClick}
      className={`text-xs px-2.5 py-1.5 border rounded-lg flex items-center gap-2 transition-all ${
        status === 'idle' ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer' :
        status === 'checking' ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400' :
        status === 'available' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/40 cursor-pointer' :
        'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-400 line-through'
      }`}
      title={status === 'idle' ? "Click to check availability" : status === 'available' ? "Available! Click to register on Namecheap" : undefined}
    >
      <span>{domain}</span>
      {status === 'idle' && <span className="text-[10px] opacity-60">Check</span>}
      {status === 'checking' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'available' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'taken' && <XCircle className="w-3 h-3" />}
    </span>
  );
}
