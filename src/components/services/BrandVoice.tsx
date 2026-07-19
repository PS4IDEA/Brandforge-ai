import React, { useState } from 'react';
import { 
  Volume2, Sparkles, Loader2, Save, Coins, 
  CheckCircle2, Copy, Download, Info, Check, 
  X, FileText, ArrowLeftRight, MessageSquare, 
  Layers, BadgeAlert
} from 'lucide-react';
import { Language, UserProfile } from '../../types';
import LoadingOverlay from '../ui/LoadingOverlay';
import { motion } from 'motion/react';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
  isEmbedded?: boolean;
}

export default function BrandVoice({ language, user, onDeductCredits, onOpenLogin, isEmbedded }: Props) {
  const isAr = language === 'ar';
  
  // Input fields
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandValues, setBrandValues] = useState('');
  const [sampleText, setSampleText] = useState('');
  
  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate markdown playbook dynamically on the frontend
  const generateMarkdown = (data: any) => {
    return `
# ${data.voiceProfile?.name || 'Brand Voice Playbook'}

## ${isAr ? 'الملخص التنفيذي للهوية اللغوية' : 'Executive Summary'}
${data.voiceProfile?.summary || ''}

---

## ${isAr ? 'السمات اللغوية الأساسية' : 'Core Linguistic Traits'}
${(data.traits || []).map((t: any, idx: number) => `
### ${idx + 1}. 🌟 ${t.trait}
* **${isAr ? 'الوصف' : 'Description'}:** ${t.description}
* **${isAr ? 'افعل (Do)' : 'Do'}:** ${t.do}
* **${isAr ? 'تجنب (Don\'t)' : 'Don\'t'}:** ${t.dont}
`).join('\n')}

---

## ${isAr ? 'قواعد الأسلوب والتحرير' : 'Style & Formatting Rules'}
* **${isAr ? 'طول وبنية الجمل' : 'Sentence Structure'}:** ${data.styleGuide?.sentenceLength || ''}
* **${isAr ? 'علامات الترقيم والرموز التعبيرية' : 'Punctuation & Emojis'}:** ${data.styleGuide?.punctuation || ''}

### 🟢 ${isAr ? 'الكلمات والمصطلحات المفضلة' : 'Words to Embrace'}
${(data.styleGuide?.wordsToUse || []).map((w: string) => `- ${w}`).join('\n')}

### 🔴 ${isAr ? 'المصطلحات التي ينبغي تجنبها' : 'Words to Avoid'}
${(data.styleGuide?.wordsToAvoid || []).map((w: string) => `- ${w}`).join('\n')}

---

## ${isAr ? 'الملائمة اللغوية حسب القنوات الرقمية' : 'Channel Adaptation Guidelines'}
* **${isAr ? 'شبكات التواصل الاجتماعي' : 'Social Media'}:** ${data.channelGuidelines?.socialMedia || ''}
* **${isAr ? 'خدمة العملاء والدعم الفني' : 'Customer Support'}:** ${data.channelGuidelines?.customerSupport || ''}
* **${isAr ? 'التسويق والإعلانات الممولة' : 'Marketing & Ads'}:** ${data.channelGuidelines?.marketing || ''}

---

## ${isAr ? 'نموذج التحول اللغوي (قبل وبعد)' : 'Brand Voice Makeover (Before & After)'}

### ❌ ${isAr ? 'النص الأصلي (التقليدي/الجامد)' : 'Original Copy (Generic)'}
> ${data.beforeAfter?.original || ''}

### 🟢 ${isAr ? 'النص بعد تطبيق الهوية اللغوية' : 'Rewritten Copy (Brand Voice Applied)'}
> ${data.beforeAfter?.rewritten || ''}

### 🔍 ${isAr ? 'التحليل والتعليل اللغوي' : 'Linguistic Analysis & Rationale'}
${data.beforeAfter?.explanation || ''}
    `.trim();
  };

  const handleCopy = () => {
    if (!result) return;
    const md = generateMarkdown(result);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const md = generateMarkdown(result);
    const element = document.createElement("a");
    const file = new Blob([md], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${brandName ? brandName.replace(/\s+/g, '_') : 'Brand'}_Voice_Playbook.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    const userCredits = user && typeof user.credits === 'number' && !isNaN(user.credits) ? user.credits : 0;
    if (userCredits < 3) {
      setError(isAr 
        ? 'رصيدك غير كافٍ! هذه الخدمة تتطلب 3 أرصدة.' 
        : 'Insufficient credits! This operation requires 3 credits.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/brand-voice-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName, 
          brandDescription, 
          targetAudience, 
          brandValues, 
          sampleText, 
          language 
        })
      });

      const resJson = await response.json();

      if (resJson.success && resJson.analysis) {
        if (onDeductCredits) {
          onDeductCredits(3);
        }
        setResult(resJson.analysis);
      } else {
        setError(resJson.error || (isAr ? 'حدث خطأ أثناء توليد الهوية اللغوية.' : 'An error occurred while analyzing brand voice.'));
      }
    } catch (err: any) {
      console.error('BrandVoice error:', err);
      setError(isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isEmbedded ? "" : "max-w-5xl mx-auto space-y-8"} dir={isAr ? 'rtl' : 'ltr'}>
      {!isEmbedded && (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/20 text-amber-600 dark:text-amber-400 mb-2 shadow-inner">
            <Volume2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white">
            {isAr ? 'مساعد نبرة الصوت والهوية اللغوية' : 'Brand Voice Architect'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {isAr 
              ? 'صمم دليلاً لغوياً استثنائياً لعلامتك التجارية باستخدام الذكاء الاصطناعي لتحليل أسلوب الكتابة وبناء شخصية لغوية تأسر جمهورك.' 
              : 'Architect a custom brand voice playbook, analyze writing styles, and craft cohesive guidelines tailored to your target audience.'}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'اسم العلامة التجارية' : 'Brand Name'}
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all dark:text-white text-sm"
              placeholder={isAr ? 'مثال: نكهة هادئة، ركن التقنية...' : 'e.g., Brew & Byte, TechPoint...'}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'الجمهور المستهدف بالتحديد' : 'Target Audience'}
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all dark:text-white text-sm"
              placeholder={isAr ? 'مثال: رواد الأعمال الطموحين، طلاب الجامعات...' : 'e.g., Ambitious entrepreneurs, College students...'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'عن العلامة ومجال العمل' : 'Brand Description & Industry'}
            </label>
            <textarea
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all dark:text-white text-sm resize-none"
              placeholder={isAr ? 'مثال: مقهى هادئ يدمج بين تذوق القهوة والعمل المشترك، نقدم مأكولات خفيفة...' : 'e.g., A cozy cafe combining gourmet coffee with creative co-working spaces...'}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'القيم والروح العامة (مفصولة بفاصلة)' : 'Core Brand Values & Vibe (Comma separated)'}
            </label>
            <textarea
              value={brandValues}
              onChange={(e) => setBrandValues(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all dark:text-white text-sm resize-none"
              placeholder={isAr ? 'مثال: الابتكار، الأصالة، البساطة، الترحيب والسرعة...' : 'e.g., Innovation, Warmth, Professionalism, Bold simplicity...'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'عينة من أسلوب كتابتك الحالي (اختياري)' : 'Optional Copy Sample for Analysis'}
            </label>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {isAr ? 'يساعد في محاكاة وصقل أسلوبك المفضّل' : 'Helps replicate or refine your existing writing style'}
            </span>
          </div>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all dark:text-white text-sm resize-none"
            placeholder={isAr ? 'الصق منشوراً قديماً، بريداً إلكترونياً، أو مقالاً ترغب بتحسين نبرة صوته المكتوبة...' : 'Paste a previous social post, email newsletter, or blog intro to analyze and improve...'}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{isAr ? 'تكلفة التحليل والبناء: 3 أرصدة' : 'Analysis Cost: 3 Credits'}</span>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isAr ? 'ابتكار وتوليد الدليل اللغوي' : 'Architect Brand Voice'}
          </button>
        </div>
      </form>

      {loading && (
        <LoadingOverlay 
          isLoading={true} 
          language={language} 
          message={isAr ? 'جاري تحليل نبرة الصوت والمحتوى وبناء الهوية اللغوية لعلامتك التجارية...' : 'Decoding linguistic patterns & tailoring your unique Brand Voice Playbook...'} 
        />
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Main Voice Badge & Playbook Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-100/10 dark:bg-amber-900/10 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAr ? 'النمط اللغوي المبتكر' : 'Linguistic Archetype Created'}
                </div>
                <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">
                  {result.voiceProfile?.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isAr ? `دليل لغوي لعلامة: ${brandName || 'الهوية الشخصية'}` : `Engineered custom playbook for: ${brandName || 'Personal Brand'}`}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Copy Markdown */}
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={isAr ? 'نسخ الدليل كـ Markdown' : 'Copy playbook as Markdown'}
                >
                  {copied ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                  {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}
                </button>

                {/* Download File */}
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 transition-all cursor-pointer"
                  title={isAr ? 'تحميل الدليل بصيغة ملف (.md)' : 'Download playbook as .md file'}
                >
                  <Download className="w-4.5 h-4.5" />
                  {isAr ? 'تحميل كملف' : 'Download .MD'}
                </button>

                {/* Save State */}
                <button
                  onClick={() => setSaved(true)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    saved 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-transparent' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-transparent'
                  }`}
                >
                  {saved ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Save className="w-4.5 h-4.5" />}
                  {saved ? (isAr ? 'تم الحفظ بالملف' : 'Saved to Profile') : (isAr ? 'حفظ المشروع' : 'Save Archetype')}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-amber-500" />
                {isAr ? 'فلسفة الهوية اللغوية المقترحة' : 'Linguistic Summary & Philosophy'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {result.voiceProfile?.summary}
              </p>
            </div>
          </div>

          {/* Section 1: Core Linguistic Traits */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white px-1">
              {isAr ? '1. السمات اللغوية الأساسية وسلوكياتها' : '1. Core Linguistic Traits & Guidelines'}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(result.traits || []).map((t: any, index: number) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <h4 className="text-md font-bold text-slate-950 dark:text-white">
                        {t.trait}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {/* DO */}
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        {isAr ? 'افعل (Do)' : 'Do'}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {t.do}
                      </p>
                    </div>

                    {/* DONT */}
                    <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100/60 dark:border-red-900/20 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" />
                        {isAr ? 'تجنب (Don\'t)' : 'Don\'t'}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {t.dont}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Style Guide Rules & Side-By-Side Vocabulary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: General Rules */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white px-1">
                {isAr ? '2. قواعد التحرير والنمط المكتوب' : '2. Styling & Formatting Regulations'}
              </h3>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
                
                {/* Sentence Length */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {isAr ? 'طول وهيكلة الجمل' : 'Sentence Structure & Length'}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                    {result.styleGuide?.sentenceLength}
                  </p>
                </div>

                {/* Punctuation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {isAr ? 'علامات الترقيم والرموز التعبيرية (Emojis)' : 'Punctuation, Accents & Emojis'}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                    {result.styleGuide?.punctuation}
                  </p>
                </div>

              </div>
            </div>

            {/* Right: Vocabulary guide */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white px-1">
                {isAr ? 'قاموس المصطلحات المعتمد' : 'Brand Vocabulary Guide'}
              </h3>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                
                {/* Words to Use */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-1">
                    <Check className="w-4 h-4" />
                    {isAr ? 'كلمات نوصي بتكرارها (احتضنها):' : 'Words to Embrace:'}
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    {(result.styleGuide?.wordsToUse || []).map((w: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 font-medium text-xs flex items-center gap-1"
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Words to Avoid */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1.5 px-1">
                    <X className="w-4 h-4" />
                    {isAr ? 'مصطلحات تجنب استخدامها تماماً:' : 'Words to Strictly Avoid:'}
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    {(result.styleGuide?.wordsToAvoid || []).map((w: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-900/30 font-medium text-xs flex items-center gap-1"
                      >
                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Section 3: Channel Guidelines */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white px-1">
              {isAr ? '3. التكييف اللغوي حسب قنوات التواصل المحددة' : '3. Contextual Adaptation Across Channels'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Social Media */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {isAr ? 'وسائل التواصل الاجتماعي' : 'Social Media Channels'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.channelGuidelines?.socialMedia}
                </p>
              </div>

              {/* Customer Support */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {isAr ? 'الدعم وخدمة العملاء' : 'Customer Support & Chat'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.channelGuidelines?.customerSupport}
                </p>
              </div>

              {/* Marketing & Ads */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {isAr ? 'الإعلانات والبريد التسويقي' : 'Ads & Marketing Campaigns'}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.channelGuidelines?.marketing}
                </p>
              </div>

            </div>
          </div>

          {/* Section 4: Brand Copy Makeover */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-extrabold text-slate-900 dark:text-white px-1">
              {isAr ? '4. التحول والتطبيق اللغوي العملي' : '4. Practical Linguistic Makeover'}
            </h3>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Before: Generic */}
                <div className="p-5 bg-red-50/30 dark:bg-red-950/5 border border-red-100/50 dark:border-red-950/30 rounded-2xl space-y-3 relative">
                  <div className="absolute top-4 right-4 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {isAr ? 'قبل: نص تقليدي ممل' : 'Before: Generic Copy'}
                  </div>
                  
                  <div className="pt-6 space-y-1">
                    <h5 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {isAr ? 'الصياغة العامة المستهلكة' : 'Stale Industry Standard'}
                    </h5>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic pt-1">
                      "{result.beforeAfter?.original}"
                    </p>
                  </div>
                </div>

                {/* After: Revamped */}
                <div className="p-5 bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-950/30 rounded-2xl space-y-3 relative">
                  <div className="absolute top-4 right-4 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {isAr ? 'بعد: هوية لغوية حية' : 'After: Brand Voice Applied'}
                  </div>

                  <div className="pt-6 space-y-1">
                    <h5 className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                      {isAr ? 'الصياغة بهويتك اللغوية الجديدة' : 'Your Customized Copy'}
                    </h5>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed pt-1">
                      "{result.beforeAfter?.rewritten}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Explanation / Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4" />
                  {isAr ? 'لماذا صياغتك الجديدة أفضل؟ (تحليل لغوي للتحويل)' : 'Why this transformation succeeds (Linguistic Analysis)'}
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.beforeAfter?.explanation}
                </p>
              </div>

            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
