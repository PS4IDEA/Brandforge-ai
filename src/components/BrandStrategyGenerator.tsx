import React, { useState } from 'react';
import { Sparkles, Loader2, Coins, Target, Award, CheckCircle2, Copy, Download } from 'lucide-react';
import { Language, UserProfile } from '../types';
import LoadingOverlay from './ui/LoadingOverlay';
import { motion } from 'motion/react';
import { fetchAPI } from '../lib/api';

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
      const resJson = await fetchAPI('/api/generate-brand-strategy', {
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

      if (resJson.success && resJson.strategy) {
        if (onDeductCredits) {
          onDeductCredits(5);
        }
        setResult(resJson.strategy);
      } else {
        setError(resJson.error || (isAr ? 'فشل توليد الاستراتيجية.' : 'Failed to generate strategy.'));
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
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {isAr ? 'اسم العلامة التجارية:' : 'Brand Name:'}
            </label>
            <input 
              type="text" 
              value={brandName} 
              onChange={(e) => setBrandName(e.target.value)} 
              placeholder={isAr ? 'مثال: سلة، نون، إلخ' : 'e.g. Acme Corp'} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {isAr ? 'مجال أو قطاع العمل:' : 'Industry / Sector:'}
            </label>
            <input 
              type="text" 
              value={industry} 
              onChange={(e) => setIndustry(e.target.value)} 
              placeholder={isAr ? 'مثال: التجارة الإلكترونية، الذكاء الاصطناعي' : 'e.g. E-commerce, Artificial Intelligence'} 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all" 
              required 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {isAr ? 'الجمهور المستهدف بالتفصيل:' : 'Detailed Target Audience:'}
          </label>
          <textarea 
            value={targetAudience} 
            onChange={(e) => setTargetAudience(e.target.value)} 
            placeholder={isAr ? 'صف عملائك المثاليين، احتياجاتهم وفئتهم العمرية...' : 'Describe your ideal customers, their needs, demographic traits...'} 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all" 
            required 
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {isAr ? 'أهداف العلامة ورؤيتك المستقبلية:' : 'Brand Goals & Vision:'}
          </label>
          <textarea 
            value={goals} 
            onChange={(e) => setGoals(e.target.value)} 
            placeholder={isAr ? 'ما هي الأهداف الرئيسية لعلامتك التجارية ورؤيتها في السوق؟' : 'What are the core objectives and market vision of your brand?...'} 
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all" 
            required 
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading} className="w-full px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md focus:ring-2 focus:ring-orange-400">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isAr ? 'توليد الاستراتيجية' : 'Generate Strategy'}
        </button>
      </form>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-md text-slate-800 dark:text-slate-100"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 dark:text-orange-400">
              {isAr ? 'الاستراتيجية المولّدة' : 'Generated Strategy'}
            </span>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{result.title}</h2>
          </div>
          <div className="text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base font-medium">
            {result.content}
          </div>
        </motion.div>
      )}
    </div>
  );
}
