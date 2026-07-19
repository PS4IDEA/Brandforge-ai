import React, { useState } from 'react';
import { Search, TrendingUp, BarChart3, LineChart, Target, Zap, LayoutTemplate, Loader2, Coins, Globe, ExternalLink } from 'lucide-react';
import { Language, UserProfile } from '../../types';
import LoadingOverlay from '../ui/LoadingOverlay';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
}

export default function SeoOptimization({ language, user, onDeductCredits, onOpenLogin }: Props) {
  const isAr = language === 'ar';
  
  const [niche, setNiche] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!niche.trim()) return;

    if (!user) {
      onOpenLogin?.();
      return;
    }

    setError(null);

    if (onDeductCredits) {
      const success = onDeductCredits(3);
      if (!success) return; // Insufficient credits
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/seo-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche,
          language: isAr ? 'ar' : 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze SEO data');
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setResults(data.analysis);
      } else {
        throw new Error(data.error || 'Failed to parse SEO optimization results');
      }
    } catch (err: any) {
      console.error('[SEO Optimizer Error]', err);
      setError(
        isAr 
          ? 'عذراً، حدث خطأ أثناء الاتصال بمحرك البحث الذكي. يرجى التأكد من إعداد مفتاح API في الإعدادات والمحاولة مرة أخرى.' 
          : 'Sorry, a connection error occurred with the AI search engine. Please make sure the API key is configured in settings and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isAnalyzing} language={language} />
      <div className="space-y-12 py-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <TrendingUp className="w-10 h-10 text-indigo-500" />
          {isAr ? 'تحسين محركات البحث SEO' : 'SEO Optimization'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {isAr 
            ? 'خطط وكلمات مفتاحية مخصصة لرفع تصنيف علامتك التجارية في نتائج البحث.' 
            : 'Customized plans and keywords to rank your brand higher in search engine results.'}
        </p>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            {isAr ? 'اكتشف الكلمات المفتاحية لعلامتك' : 'Discover Your Brand Keywords'}
          </h2>
          <p className="text-white/80 text-lg">
            {isAr ? 'دع الذكاء الاصطناعي يحلل مجالك ويستخرج أفضل الكلمات المفتاحية للمنافسة وتصدر نتائج جوجل.' : 'Let AI analyze your niche and extract the best keywords to compete and dominate Google results.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <input 
              type="text" 
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder={isAr ? 'مجال عملك (مثال: مقهى مختص في الرياض)' : 'Your niche (e.g. Specialty coffee shop in NY)'}
              className="flex-1 px-6 py-4 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-white/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !niche.trim()}
              className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-70 disabled:hover:bg-slate-900 transition shadow-xl cursor-pointer"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-400" />}
              {isAr ? 'تحليل الآن' : 'Analyze Now'}
              <span className="flex items-center text-xs font-normal opacity-80 ml-1">
                (<Coins className="w-3 h-3 mr-1" /> 3)
              </span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-medium flex items-center gap-2 animate-fade-in max-w-5xl mx-auto">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 animate-fade-in-up">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-500" />
              {isAr ? 'أهم الكلمات المفتاحية الأكثر طلباً' : 'Top Search Queries & Keywords'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">{isAr ? 'الكلمة' : 'Keyword'}</th>
                    <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">{isAr ? 'حجم البحث المقدر' : 'Est. Volume'}</th>
                    <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">{isAr ? 'صعوبة المنافسة' : 'SEO Difficulty'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.keywords.map((kw: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{kw.word}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{kw.volume}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${
                          kw.difficulty === 'Low' || kw.difficulty === 'منخفضة' || kw.difficulty === 'سهل' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          kw.difficulty === 'Medium' || kw.difficulty === 'متوسطة' || kw.difficulty === 'متوسط' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {isAr ? (
                            (kw.difficulty === 'Low' || kw.difficulty === 'منخفضة' || kw.difficulty === 'سهل') ? 'منخفضة' : 
                            (kw.difficulty === 'Medium' || kw.difficulty === 'متوسطة' || kw.difficulty === 'متوسط') ? 'متوسطة' : 'عالية'
                          ) : kw.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-emerald-500" />
                {isAr ? 'استراتيجيات تحسين الترتيب (SEO On-Page)' : 'On-Page SEO Action Plan'}
              </h3>
              <ul className="space-y-3">
                {results.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-sm font-bold">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-amber-500" />
                {isAr ? 'أبرز المنافسين النشطين في السوق' : 'Top Competitors & References'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.competitors.map((comp: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive citations & live search sources */}
          {results.searchSources && results.searchSources.length > 0 && (
            <div className="border-t border-slate-150 dark:border-slate-800 pt-6 mt-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-indigo-500 animate-pulse" />
                {isAr ? 'الصفحات التي تم البحث فيها والتحقق منها (مصادر حية):' : 'Web sources analyzed & consulted (Live citations):'}
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {results.searchSources.map((src: any, idx: number) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-900 text-xs text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg transition"
                    title={src.title}
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[250px] font-medium">{src.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'بحث الكلمات المفتاحية' : 'Keyword Research'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {isAr ? 'تحليل دقيق لكلمات البحث الأكثر طلباً والأقل منافسة في مجالك لجذب الزوار المستهدفين.' : 'Deep analysis of high-volume, low-competition keywords in your niche to attract targeted traffic.'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'تحسين بنية الموقع' : 'On-Page Optimization'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {isAr ? 'نصائح مخصصة لتحسين محتوى موقعك، العناوين، وسرعة التحميل لمحركات البحث.' : 'Customized tips to optimize your site content, meta titles, and loading speed for search engines.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'تحليل المنافسين' : 'Competitor Analysis'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {isAr ? 'مراقبة استراتيجيات المنافسين واكتشاف الفجوات التي يمكنك استغلالها للسيطرة على السوق.' : 'Monitor competitors strategies and discover gaps you can exploit to dominate the market.'}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
