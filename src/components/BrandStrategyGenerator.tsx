import React, { useState } from 'react';
import { Sparkles, Loader2, Coins, Target, Award, CheckCircle2, Copy, Download } from 'lucide-react';
import { Language, UserProfile } from '../types';
import LoadingOverlay from './ui/LoadingOverlay';
import { motion } from 'motion/react';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
}

export default function BrandStrategyGenerator({ language, user, onDeductCredits, onOpenLogin }: Props) {
  const isAr = language === 'ar';
  
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goals, setGoals] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-brand-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName, 
          industry, 
          targetAudience, 
          goals,
          language 
        })
      });

      const resJson = await response.json();

      if (resJson.success && resJson.strategy) {
        if (onDeductCredits) {
          onDeductCredits(5);
        }
        setResult(resJson.strategy);
      } else {
        if (response.status === 429) {
          setError(isAr ? 'تم تجاوز حصة الطلبات اليومية، يرجى المحاولة لاحقاً.' : 'Daily API quota exceeded, please try again later.');
        } else {
          setError(resJson.error || (isAr ? 'فشل توليد الاستراتيجية.' : 'Failed to generate strategy.'));
        }
      }
    } catch (err: any) {
      setError(isAr ? 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.' : 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <LoadingOverlay isLoading={loading} language={language} message={isAr ? 'جاري بناء الاستراتيجية...' : 'Building strategy...'} />
      <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder={isAr ? 'اسم العلامة' : 'Brand Name'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl" required />
          <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={isAr ? 'مجال العمل' : 'Industry'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl" required />
        </div>
        <textarea value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder={isAr ? 'الجمهور المستهدف' : 'Target Audience'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl" required />
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder={isAr ? 'أهداف العلامة' : 'Brand Goals'} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl" required />

        <button type="submit" disabled={loading} className="w-full px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isAr ? 'توليد الاستراتيجية' : 'Generate Strategy'}
        </button>
      </form>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border rounded-3xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{result.title}</h2>
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{result.content}</div>
        </motion.div>
      )}
    </div>
  );
}
