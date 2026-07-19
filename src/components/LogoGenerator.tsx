import React, { useState, useRef, useEffect } from 'react';
import { translations } from '../translations';
import { Language, UserProfile, GeneratedLogo } from '../types';
import { Sparkles, Download, Bookmark, Copy, Check, FileCode, AlertTriangle, RefreshCw, X, Maximize2, Share2 } from 'lucide-react';
import { fetchAPI } from '../lib/api';
import { motion } from 'motion/react';
import LoadingOverlay from './ui/LoadingOverlay';

interface LogoGeneratorProps {
  language: Language;
  user: UserProfile | null;
  onDeductCredits: (amount: number) => boolean;
  onSaveLogo: (logo: GeneratedLogo) => void;
  savedLogos: GeneratedLogo[];
  onOpenLogin: () => void;
}

export default function LogoGenerator({
  language,
  user,
  onDeductCredits,
  onSaveLogo,
  savedLogos,
  onOpenLogin,
}: LogoGeneratorProps) {
  const t = translations[language];

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('minimalist');
  const [enable3D, setEnable3D] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoResult, setLogoResult] = useState<{ svg: string; concept: string; primaryColor: string; secondaryColor: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionCache = useRef<{ [key: string]: { svg: string; concept: string; primaryColor: string; secondaryColor: string } }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPreviewOpen(false);
      }
    };
    if (isPreviewOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPreviewOpen]);

  const logoStyles = [
    { id: 'minimalist', label: t.minimalist, desc: language === 'ar' ? 'خطوط نظيفة، أشكال مبسطة' : 'Clean lines, minimal shapes', color: 'from-slate-500 to-slate-700' },
    { id: 'luxury', label: t.luxury, desc: language === 'ar' ? 'ذهبي، أناقة راقية' : 'Gold, premium elegance', color: 'from-amber-400 to-amber-600' },
    { id: 'technology', label: t.technology, desc: language === 'ar' ? 'خطوط نيون متطورة' : 'Neon vectors, cybernetics', color: 'from-cyan-400 to-blue-500' },
    { id: 'gaming', label: t.gaming, desc: language === 'ar' ? 'شخصيات كرتونية وتأثيرات حركية' : 'Mascots, dynamic curves', color: 'from-rose-500 to-purple-600' },
    { id: 'creative', label: t.creative, desc: language === 'ar' ? 'ألوان فنية نابضة بالحياة' : 'Vibrant artistic colors', color: 'from-teal-400 to-emerald-500' },
    { id: 'corporate', label: t.corporate, desc: language === 'ar' ? 'شبكات صلبة احترافية' : 'Professional solid grids', color: 'from-indigo-500 to-slate-800' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!user) {
      onOpenLogin();
      return;
    }

    const cacheKey = `${prompt.trim()}-${selectedStyle}-${enable3D}`;
    if (sessionCache.current[cacheKey]) {
      setLogoResult(sessionCache.current[cacheKey]);
      setSaved(false);
      setError(null);
      return;
    }

    setError(null);
    setLoading(true);
    setLogoResult(null);
    setSaved(false);

    const requiredCredits = enable3D ? 3 : 1;
    const userCredits = user && typeof user.credits === 'number' && !isNaN(user.credits) ? user.credits : 0;
    if (userCredits < requiredCredits) {
      setError(language === 'en' 
        ? `Insufficient credits! This operation requires ${requiredCredits} credits.` 
        : `رصيدك غير كافٍ! هذه العملية تتطلب ${requiredCredits} من الأرصدة.`);
      setLoading(false);
      return;
    }

    try {
      const styleInstruction = enable3D ? ', stylized with spectacular 3D isometric extruded depth, volumetric rendering, glossy lighting, bevel effects, and layered rich drop-shadows' : '';
      const resJson = await fetchAPI('/api/generate-logo', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `${prompt} (${selectedStyle} logo style${styleInstruction})`,
          style: enable3D ? 'threeD' : selectedStyle
        })
      });

      if (resJson.success) {
        onDeductCredits(requiredCredits);
        setLogoResult(resJson.data);
        sessionCache.current[cacheKey] = resJson.data;
      } else {
        throw new Error(resJson.error || 'Failed to generate logo');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSVG = () => {
    if (!logoResult) return;
    const blob = new Blob([logoResult.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brandforge-logo-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = (transparent: boolean) => {
    if (!logoResult) return;
    
    const svgString = logoResult.svg;
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.src = url;
    
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 500;
      canvas.height = 500;
      ctx.clearRect(0, 0, 500, 500);
      
      if (!transparent) {
        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 500, 500);
      }
      
      ctx.drawImage(image, 0, 0, 500, 500);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `brandforge-logo-${transparent ? 'transparent' : 'solid'}-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
  };

  const handleShare = async () => {
    if (!logoResult) return;
    const textToShare = `Logo Concept: ${prompt} (${selectedStyle})\nGenerated by BrandForge AI`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Brand Logo Concept',
          text: textToShare,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(textToShare);
      alert(language === 'ar' ? 'تم نسخ النص للمشاركة!' : 'Text copied to clipboard for sharing!');
    }
  };

  const handleCopySVG = () => {
    if (!logoResult) return;
    navigator.clipboard.writeText(logoResult.svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLogo = () => {
    if (!logoResult) return;
    const newLogo: GeneratedLogo = {
      id: `logo-${Date.now()}`,
      style: selectedStyle,
      prompt,
      svg: logoResult.svg,
      createdAt: new Date().toISOString()
    };
    onSaveLogo(newLogo);
    setSaved(true);
  };

  return (
    <>
      <LoadingOverlay isLoading={loading} language={language} />
      <div className="space-y-8 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 dark:shadow-none">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 dark:bg-indigo-950/50 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
              {t.logoGen}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ar' ? 'يولد شعار متجهي حديث ومخصص بالكامل بصيغة SVG فائقة الدقة (يكلف رصيد واحد أو 3 أرصدة للـ 3D)' : 'Generates a fully customized modern vector logo as high-resolution crisp SVG (Costs 1 credit, or 3 credits for 3D)'}
            </p>
          </div>
        </div>

        {/* Configurations */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {language === 'ar' ? 'صف رؤيتك للشعار' : 'Describe your Logo Vision'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: نسر هندسي مبسط وجريء بأجنحة ممتدة، يمسك بقلب متوهج، طابع شركات فاخر وأنيق' : 'e.g. A bold minimalist geometric eagle with wings, holding a glowing core, elegant luxury corporate vibe'}
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Enable 3D Style Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 transition-all hover:bg-slate-100/40 dark:hover:bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-950/30 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ar' ? 'تفعيل مظهر ثلاثي الأبعاد (3D Style)' : 'Enable 3D Style'}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ar' ? 'يمنح الشعار عمقاً مجسماً، ظلالاً واقعية، وتدرجات لونية سينمائية ممتازة' : 'Add volumetric depth, 3D extruded shapes, highlights, and layered drop-shadows'}
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 ml-2">
              <input 
                type="checkbox" 
                checked={enable3D} 
                onChange={(e) => setEnable3D(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t.logoStyle}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {logoStyles.map((style) => (
                <motion.button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  whileHover={{ scale: 1.03, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden transition-colors duration-200 ${
                    selectedStyle === style.id
                      ? 'border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/10 shadow-lg shadow-indigo-100 dark:shadow-none'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${style.color} self-end`} />
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                      {style.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {style.desc}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Prompt cost & button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{language === 'ar' ? `التكلفة: ${enable3D ? '3 أرصدة' : 'رصيد واحد (1)'}` : `Credits Cost: ${enable3D ? '3 credits' : '1 credit'}`}</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm px-6 py-3 rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.generating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.generate}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-400 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 self-start sm:self-center bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition duration-150 cursor-pointer shadow-md shrink-0"
          >
            <span>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
          
          {/* Logo Canvas Frame Skeleton */}
          <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg">
            <div className="w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 border border-slate-100 dark:border-slate-800 relative shadow-inner overflow-hidden">
              {/* Animated spinner inside the canvas skeleton */}
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            
            <div className="mt-4 flex gap-2 w-full">
              <div className="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-100 dark:border-slate-800"></div>
              <div className="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-100 dark:border-slate-800"></div>
            </div>
          </div>

          {/* Details & Actions Panel Skeleton */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              
              <div className="space-y-3">
                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="w-64 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="space-y-2 pt-2">
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  <div className="w-4/5 h-4 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                </div>
              </div>

              {/* Action Buttons list Skeletons */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 bg-slate-100 dark:bg-slate-850 rounded-xl"></div>
                  <div className="h-11 bg-slate-100 dark:bg-slate-850 rounded-xl"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="h-11 bg-slate-100 dark:bg-slate-850 rounded-xl"></div>
                  <div className="h-11 bg-slate-100 dark:bg-slate-850 rounded-xl"></div>
                </div>

                <div className="h-11 bg-slate-200 dark:bg-slate-805 rounded-xl"></div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Results Display */}
      {logoResult && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          
          {/* Logo Canvas Frame */}
          <motion.div 
            whileHover={{ scale: 1.025 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg"
          >
            <div 
              onClick={() => setIsPreviewOpen(true)}
              className="w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-6 border border-slate-100 dark:border-slate-800 relative shadow-inner overflow-hidden cursor-zoom-in group/logo transition-all duration-300 hover:shadow-md dark:hover:shadow-none hover:border-slate-200 dark:hover:border-slate-700"
              title={language === 'ar' ? 'انقر لتكبير وتنزيل الشعار' : 'Click to enlarge and download logo'}
            >
              <div dangerouslySetInnerHTML={{ __html: logoResult.svg }} className="w-full h-full flex items-center justify-center" />
              
              {/* Overlay on hover for better discovery */}
              <div className="absolute inset-0 bg-slate-950/0 group-hover/logo:bg-slate-950/5 dark:group-hover/logo:bg-white/[0.02] flex items-center justify-center transition-all duration-300">
                <div className="opacity-0 group-hover/logo:opacity-100 scale-90 group-hover/logo:scale-100 p-2.5 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 text-xs font-semibold transition-all duration-300">
                  <Maximize2 className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>{language === 'ar' ? 'عرض ملء الشاشة' : 'Full Screen Preview'}</span>
                </div>
              </div>
            </div>
            
            {/* hidden canvas for generating PNG */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 flex gap-2 w-full">
              <div 
                className="flex-1 py-2 text-center rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                style={{ borderLeftColor: logoResult.primaryColor, borderLeftWidth: '4px' }}
              >
                {language === 'ar' ? 'الأساسي' : 'Primary'}: {logoResult.primaryColor}
              </div>
              <div 
                className="flex-1 py-2 text-center rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
                style={{ borderLeftColor: logoResult.secondaryColor, borderLeftWidth: '4px' }}
              >
                {language === 'ar' ? 'الثانوي' : 'Secondary'}: {logoResult.secondaryColor}
              </div>
            </div>
          </motion.div>

          {/* Details & Actions Panel */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">
                  {language === 'ar' ? 'مفهوم ونظرية التصميم' : 'Concept & Design Theory'}
                </span>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-3">
                  {language === 'ar' ? 'تعريف هوية العلامة التجارية' : 'Brand Forge Identity Definition'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {logoResult.concept}
                </p>
              </div>

              {/* Action Buttons list */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={downloadSVG}
                    className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-sm font-semibold py-3 rounded-xl transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'ar' ? 'تنزيل ملف SVG' : 'Download SVG'}</span>
                  </button>

                  <button
                    onClick={handleCopySVG}
                    className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold py-3 rounded-xl transition cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? t.copied : (language === 'ar' ? 'نسخ كود SVG' : 'Copy SVG Markup')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadPNG(false)}
                    className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold py-3 rounded-xl transition cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span>{t.downloadPng}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPNG(true)}
                    className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold py-3 rounded-xl transition cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ar' ? 'ملف PNG شفاف' : 'Transparent PNG'}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="col-span-2 flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-sm font-semibold py-3 rounded-xl transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مشاركة الفكرة' : 'Share Idea'}</span>
                  </button>
                </div>

                <button
                  onClick={handleSaveLogo}
                  disabled={saved}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    saved 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{saved ? t.saved : t.save}</span>
                </button>
              </div>

            </div>
          </div>

        </motion.div>
      )}

      {/* Full-Screen Preview Modal */}
      {isPreviewOpen && logoResult && (
        <div 
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 md:p-8 animate-fade-in"
          onClick={() => setIsPreviewOpen(false)}
        >
          {/* Close button (round, floating top-right) */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 hover:rotate-90 active:scale-95 cursor-pointer z-[160] shadow-lg border border-white/10"
            title={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Modal Container */}
          <div 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()} // Stop propagation so clicking content doesn't close it
          >
            {/* Background design accents */}
            <div className="absolute -right-24 -top-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

            {/* Title / Header of preview */}
            <div className="text-center z-10 w-full">
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                {language === 'ar' ? 'معاينة الشعار بدقة عالية' : 'High-Resolution Logo Preview'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar' ? 'صمم في ثوانٍ باستخدام نموذج Gemini الذكي' : 'Designed in seconds using the advanced Gemini engine'}
              </p>
            </div>

            {/* High-res Display Canvas */}
            <div className="w-full aspect-square max-w-[450px] bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-8 border border-slate-150 dark:border-slate-850 shadow-inner relative z-10">
              <div 
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{ __html: logoResult.svg }} 
              />
            </div>

            {/* Download Buttons / Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[450px] relative z-10">
              <button
                type="button"
                onClick={downloadSVG}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-indigo-600/15 hover:scale-[1.02] active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحميل بصيغة SVG' : 'Download SVG'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPNG(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold py-3 px-4 rounded-xl border border-slate-200/70 dark:border-slate-700 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <FileCode className="w-4 h-4 text-blue-500" />
                <span>{language === 'ar' ? 'تحميل بصيغة PNG' : 'Download PNG'}</span>
              </button>
            </div>

            {/* Tech details footer */}
            <div className="flex items-center justify-between w-full max-w-[450px] text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 z-10">
              <span className="font-mono">Format: Vector (SVG)</span>
              <span>•</span>
              <span className="font-mono">Resolution: Scalable / Infinite</span>
              <span>•</span>
              <span className="font-mono">Type: Logo Style</span>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
