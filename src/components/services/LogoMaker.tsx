import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, Copy, Check, RefreshCw, X, Maximize2, Share2, Coins, AlertTriangle, Layers, Box, Compass, Laptop, Grid3X3, Eye } from 'lucide-react';
import { Language, UserProfile, GeneratedLogo } from '../../types';
import { fetchAPI } from '../../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import LoadingOverlay from '../ui/LoadingOverlay';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
  onSaveLogo?: (logo: GeneratedLogo) => void;
}

export default function LogoMaker({ language, user, onDeductCredits, onOpenLogin, onSaveLogo }: Props) {
  const isAr = language === 'ar';
  
  const [prompt, setPrompt] = useState('');
  const [enable3D, setEnable3D] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('minimalist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoResult, setLogoResult] = useState<{ svg: string; concept: string; primaryColor: string; secondaryColor: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mockupView, setMockupView] = useState<'none' | 'card' | 'glass' | 'app'>('none');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const logoStyles = [
    { id: 'minimalist', labelEn: 'Minimalist Flat', labelAr: 'بسيط مسطح', descEn: 'Clean geometric lines, single plane', descAr: 'خطوط هندسية نظيفة ومسطحة', color: 'from-slate-400 to-slate-600' },
    { id: 'luxury', labelEn: 'Royal Luxury', labelAr: 'ملكي فاخر', descEn: 'Premium gold & bronze luxury accents', descAr: 'لمسات ذهبية فاخرة وراقية', color: 'from-amber-400 to-amber-600' },
    { id: 'technology', labelEn: 'Futuristic Tech', labelAr: 'تكنولوجيا مستقبلية', descEn: 'Neon grids, laser lines & tech icons', descAr: 'شبكات نيون، خطوط ليزر وأيقونات', color: 'from-cyan-400 to-blue-500' },
    { id: 'gaming', labelEn: 'Dynamic Gaming', labelAr: 'ألعاب ديناميكية', descEn: 'Mascots, active sharp curves', descAr: 'شخصيات كرتونية وزوايا حادة', color: 'from-rose-500 to-purple-600' },
    { id: 'creative', labelEn: 'Artistic Fluid', labelAr: 'إبداعي سائل', descEn: 'Fluid shapes & artistic vibrant flows', descAr: 'أشكال إبداعية متدفقة وألوان نابضة', color: 'from-teal-400 to-emerald-500' },
    { id: 'corporate', labelEn: 'Professional Solid', labelAr: 'شركات احترافي', descEn: 'Grid alignments, solid grids', descAr: 'شبكات متوازنة احترافية صلبة', color: 'from-indigo-500 to-slate-800' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!user) {
      onOpenLogin?.();
      return;
    }

    setError(null);
    setLoading(true);
    setLogoResult(null);
    setSaved(false);

    const requiredCredits = enable3D ? 3 : 1;
    const userCredits = user && typeof user.credits === 'number' && !isNaN(user.credits) ? user.credits : 0;
    if (userCredits < requiredCredits) {
      setError(isAr 
        ? `رصيدك غير كافٍ! هذه العملية تتطلب ${requiredCredits} من الأرصدة.` 
        : `Insufficient credits! This operation requires ${requiredCredits} credits.`);
      setLoading(false);
      return;
    }

    try {
      // Setup style instruction based on standard or 3D
      const styleInstruction = enable3D 
        ? ', stylized with spectacular 3D isometric extruded depth, volumetric rendering, glossy lighting, bevel effects, and layered rich drop-shadows' 
        : '';
      
      const resJson = await fetchAPI('/api/generate-logo', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `${prompt} (${selectedStyle} logo style${styleInstruction})`,
          style: enable3D ? 'threeD' : selectedStyle
        })
      });

      if (resJson.success) {
        if (onDeductCredits) {
          onDeductCredits(requiredCredits);
        }
        setLogoResult(resJson.data);
      } else {
        throw new Error(resJson.error || 'Failed to generate logo');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isAr ? 'حدث خطأ ما. يرجى التحقق من الاتصال وإعادة المحاولة.' : 'Something went wrong. Please check your connection and try again.'));
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
      
      canvas.width = 1000;
      canvas.height = 1000;
      ctx.clearRect(0, 0, 1000, 1000);
      
      if (!transparent) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1000, 1000);
      }
      
      ctx.drawImage(image, 0, 0, 1000, 1000);
      
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

  const handleCopySVG = () => {
    if (!logoResult) return;
    navigator.clipboard.writeText(logoResult.svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLogo = () => {
    if (!logoResult) return;
    if (onSaveLogo) {
      const newLogo: GeneratedLogo = {
        id: `logo-${Date.now()}`,
        style: enable3D ? 'threeD' : selectedStyle,
        prompt,
        svg: logoResult.svg,
        createdAt: new Date().toISOString()
      };
      onSaveLogo(newLogo);
      setSaved(true);
    }
  };

  const handleShare = async () => {
    if (!logoResult) return;
    const textToShare = `Logo Concept: ${prompt} (${enable3D ? '3D Volumetric' : selectedStyle})\nGenerated by BrandForge AI`;
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
      alert(isAr ? 'تم نسخ النص للمشاركة!' : 'Text copied to clipboard for sharing!');
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={loading} language={language} />
      
      <div className="space-y-12 py-8 animate-fade-in max-w-6xl mx-auto px-4">
        {/* Hero Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{isAr ? 'تصميم شعارات احترافي 3D وعادي' : 'Premium 3D & Flat Logo Maker'}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-slate-900 dark:text-white leading-tight">
            {isAr ? 'مصنع الشعارات الذكي' : 'AI Professional Logo Engine'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {isAr 
              ? 'صمم شعاراً متجهاً فائق الدقة ومخصصاً بالكامل بالذكاء الاصطناعي مع إمكانية التبديل الفوري بين المظهر الاحترافي العادي المسطح والمظهر ثلاثي الأبعاد المذهل.' 
              : 'Construct pristine, high-resolution custom vector brandmarks utilizing the advanced Gemini models, with instant toggles between standard flat designs and volumetric 3D extrusions.'}
          </p>
        </div>

        {/* Dual Style Selector Intro (Showcase Standard vs 3D) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setEnable3D(false)}
            className={`cursor-pointer rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group ${!enable3D ? 'border-indigo-500/40 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent shadow-lg' : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Layers className="w-6 h-6" />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${!enable3D ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {isAr ? 'مسطح كلاسيكي' : 'Classic Flat'}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
              {isAr ? 'شعار احترافي مسطح (Flat Logo)' : 'Professional Flat Design'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr 
                ? 'شعارات نظيفة بهوية ممتدة، خطوط هندسية مبسطة، وتدرجات لونية ثنائية الأبعاد، تضمن سهولة الطباعة واستخدامها على جميع المنصات والمطبوعات.' 
                : 'Clean geometrical paths, flat planes, and balanced typography. Optimized for high contrast, standard printing, and versatile digital responsiveness.'}
            </p>
          </div>

          <div 
            onClick={() => setEnable3D(true)}
            className={`cursor-pointer rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group ${enable3D ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent shadow-lg' : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Box className="w-6 h-6 animate-pulse" />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${enable3D ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {isAr ? 'مجسم ثلاثي الأبعاد' : '3D Volumetric'}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
              {isAr ? 'شعار مجسم احترافي (3D Logo)' : '3D Isometric & Volumetric'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr 
                ? 'شعارات بلمسة عمق فنية، خطوط نيون مضيئة، تدرجات ثلاثية الأبعاد بارزة مع ظلال مكدسة وطابع مستقبلي مذهل كالأيقونات الفاخرة.' 
                : 'Spectacular depth, layered drop-shadows, beveled borders, glossy material look and volumetric extruded geometry designed to stand out on screens.'}
            </p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/30 dark:shadow-none space-y-6">
              
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إعدادات الشعار' : 'Configure Brandmark'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'اختر النمط واكتب فكرة تصميم الشعار' : 'Select parameters and type your design concept'}
                  </p>
                </div>
              </div>

              {/* Textarea description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {isAr ? 'وصف فكرتك للشعار بالتفصيل' : 'Describe your Brand Vision'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isAr ? 'مثال: نسر هندسي أنيق يحمل في صدره قلب نابض، بخطوط ذهبية فاخرة ونظيفة، طابع شركات ملكي' : 'e.g. Minimalist luxury geometric owl head with glowing amber eyes, technology matrix grid style'}
                  rows={4}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Dimensionality Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-850 transition-all hover:bg-slate-100/30 dark:hover:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${enable3D ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                    {enable3D ? <Box className="w-4 h-4 animate-spin-slow" /> : <Layers className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {isAr ? 'تفعيل التأثير ثلاثي الأبعاد (3D Depth)' : 'Enable 3D Depth Rendering'}
                    </span>
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                      {isAr ? 'تحويل الشعار إلى أيقونة مجسمة بظلال وإضاءة واقعية مذهلة' : 'Render with volumetric extruded height, glossy shine and layered depth'}
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
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Style Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  {isAr ? 'النمط الفني واللوني لعلامتك' : 'Visual Archetype & Style'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {logoStyles.map((style) => (
                    <motion.button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-24 cursor-pointer relative overflow-hidden transition-all duration-200 ${
                        selectedStyle === style.id
                          ? 'border-indigo-600 bg-indigo-50/15 dark:border-indigo-500 dark:bg-indigo-950/10 shadow-md'
                          : 'border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 bg-white dark:bg-slate-950'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${style.color} self-end`} />
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          {isAr ? style.labelAr : style.labelEn}
                        </span>
                        <span className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                          {isAr ? style.descAr : style.descEn}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Trigger */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>{isAr ? `التكلفة: ${enable3D ? '3 أرصدة' : 'رصيد واحد (1)'}` : `Cost: ${enable3D ? '3 Credits' : '1 Credit'}`}</span>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3 rounded-xl transition duration-150 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري الصياغة...' : 'Crafting...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'توليد الشعار' : 'Generate Logo'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Results Workspace Canvas */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {logoResult ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col items-center">
                    
                    {/* Interactive Canvas */}
                    <div 
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full aspect-square max-w-[400px] bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-6 border border-slate-200/70 dark:border-slate-850 relative shadow-inner overflow-hidden cursor-zoom-in group/canvas transition-all"
                      title={isAr ? 'اضغط لعرض ملء الشاشة' : 'Click for Full Screen Preview'}
                    >
                      {/* Logo Rendered SVG */}
                      <div 
                        dangerouslySetInnerHTML={{ __html: logoResult.svg }} 
                        className={`w-full h-full flex items-center justify-center ${mockupView === 'glass' ? 'blur-[0.5px] scale-[0.9] opacity-80' : ''}`} 
                      />

                      {/* Experimental Glassmorphic Preview overlays */}
                      {mockupView === 'glass' && (
                        <div className="absolute inset-4 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800/30 flex flex-col items-center justify-center p-4 shadow-xl">
                          <div className="w-24 h-24 p-2 bg-white/20 dark:bg-slate-950/25 rounded-2xl border border-white/10 shadow-lg flex items-center justify-center">
                            <div dangerouslySetInnerHTML={{ __html: logoResult.svg }} className="w-14 h-14" />
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-800 dark:text-slate-200 mt-4 font-mono">Luxury Glassmorphism Mockup</span>
                        </div>
                      )}

                      {mockupView === 'card' && (
                        <div className="absolute inset-4 bg-slate-950 text-white rounded-2xl border border-amber-500/20 shadow-2xl p-6 flex flex-col justify-between font-sans">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                              <div dangerouslySetInnerHTML={{ __html: logoResult.svg }} className="w-8 h-8" />
                            </div>
                            <span className="text-[9px] text-amber-400 font-mono tracking-widest">GOLD PREMIUM MEMBER</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-sm font-bold tracking-wider">SARAH AL-DOSARI</span>
                            <span className="block text-[8px] text-slate-400 font-mono">CHIEF TECHNOLOGY ARCHITECT</span>
                            <span className="block text-[8px] text-slate-500 font-mono mt-1">+966 50 123 4567 • RIYADH, KSA</span>
                          </div>
                        </div>
                      )}

                      {mockupView === 'app' && (
                        <div className="absolute top-12 bottom-12 left-16 right-16 bg-slate-900 border-4 border-slate-750 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                          <div className="h-4 bg-slate-950 flex items-center justify-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                            <div className="w-6 h-1 rounded-full bg-slate-800"></div>
                          </div>
                          <div className="flex-1 bg-gradient-to-b from-indigo-950 to-slate-950 flex flex-col items-center justify-center p-4">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center shadow-lg mb-3">
                              <div dangerouslySetInnerHTML={{ __html: logoResult.svg }} className="w-11 h-11" />
                            </div>
                            <span className="text-[9px] text-indigo-400 tracking-wider font-bold animate-pulse">Launching Application...</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-slate-950/0 group-hover/canvas:bg-slate-950/5 dark:group-hover/canvas:bg-white/[0.01] flex items-center justify-center transition-all">
                        <div className="opacity-0 group-hover/canvas:opacity-100 scale-90 group-hover/canvas:scale-100 p-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-xs font-semibold transition-all">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{isAr ? 'عرض ملء الشاشة' : 'Full Screen Preview'}</span>
                        </div>
                      </div>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Palette Indicators */}
                    <div className="mt-4 flex gap-2 w-full max-w-[400px]">
                      <div 
                        className="flex-1 py-1.5 text-center rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-850"
                        style={{ borderLeftColor: logoResult.primaryColor, borderLeftWidth: '4px' }}
                      >
                        {isAr ? 'الرئيسي' : 'Primary'}: {logoResult.primaryColor}
                      </div>
                      <div 
                        className="flex-1 py-1.5 text-center rounded-lg text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-850"
                        style={{ borderLeftColor: logoResult.secondaryColor, borderLeftWidth: '4px' }}
                      >
                        {isAr ? 'الثانوي' : 'Secondary'}: {logoResult.secondaryColor}
                      </div>
                    </div>

                    {/* Mockup Preview Selectors */}
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850 w-full">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
                        {isAr ? 'معاينة القالب الحي والتطبيقي' : 'Live Mockup Preview Modes'}
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'none', label: isAr ? 'شعار نقي' : 'Raw SVG', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
                          { id: 'card', label: isAr ? 'بطاقة عمل' : 'Business Card', icon: <Laptop className="w-3.5 h-3.5" /> },
                          { id: 'glass', label: isAr ? 'مجسم زجاجي' : '3D Glass', icon: <Box className="w-3.5 h-3.5" /> },
                          { id: 'app', label: isAr ? 'واجهة جوال' : 'App Icon', icon: <Laptop className="w-3.5 h-3.5" /> },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setMockupView(m.id as any)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-semibold cursor-pointer transition-all ${
                              mockupView === m.id
                                ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                                : 'border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900'
                            }`}
                          >
                            {m.icon}
                            <span className="mt-1">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Actions & Rationale Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">
                        {isAr ? 'النظرية التصميمية والفلسفة' : 'Design Philosophy & Theory'}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {logoResult.concept}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={downloadSVG}
                          className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold py-3 rounded-xl transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>{isAr ? 'تنزيل ملف SVG' : 'Download SVG'}</span>
                        </button>

                        <button
                          onClick={handleCopySVG}
                          className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-3 rounded-xl transition cursor-pointer"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          <span>{copied ? (isAr ? 'تم نسخ كود SVG' : 'Copied!') : (isAr ? 'نسخ كود SVG' : 'Copy SVG XML')}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleDownloadPNG(false)}
                          className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold py-3 rounded-xl transition cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-blue-500" />
                          <span>{isAr ? 'ملف PNG ملون' : 'Solid PNG'}</span>
                        </button>

                        <button
                          onClick={() => handleDownloadPNG(true)}
                          className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold py-3 rounded-xl transition cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-emerald-500" />
                          <span>{isAr ? 'ملف PNG شفاف' : 'Transparent PNG'}</span>
                        </button>
                      </div>

                      <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold py-3 rounded-xl transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{isAr ? 'مشاركة فكرة الشعار' : 'Share Design Scheme'}</span>
                      </button>

                      {onSaveLogo && (
                        <button
                          onClick={handleSaveLogo}
                          disabled={saved}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                            saved 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100' 
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{saved ? (isAr ? 'تم الحفظ في المعرض' : 'Saved to Account!') : (isAr ? 'حفظ الشعار في حسابك' : 'Save Logo to Account')}</span>
                        </button>
                      )}
                    </div>

                  </div>
                </motion.div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[450px]">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-indigo-500/40 animate-pulse" />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-2">
                    {isAr ? 'جاهز لتوليد هويتك البصرية' : 'Design Workbench'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {isAr 
                      ? 'حدد خياراتك الفنية بالكامل في القائمة الجانبية، ثم اضغط على توليد الشعار لبدء الصياغة الذكية للملفات المتجهية بدقة لا نهائية.' 
                      : 'Choose your desired aesthetic on the left panel, and describe your business to generate professional high fidelity vector logo graphics.'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error Dialog */}
        {error && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-400 text-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shrink-0 cursor-pointer shadow-sm transition"
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {isPreviewOpen && logoResult && (
        <div 
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 md:p-8 animate-fade-in"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90 cursor-pointer z-[160]"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -right-24 -top-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

            <div className="text-center w-full">
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                {isAr ? 'معاينة الشعار بدقة فائقة' : 'Infinite Vector Preview'}
              </h3>
            </div>

            <div className="w-full aspect-square max-w-[450px] bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-8 border border-slate-150 dark:border-slate-850 shadow-inner">
              <div 
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{ __html: logoResult.svg }} 
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[450px]">
              <button
                type="button"
                onClick={downloadSVG}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل بصيغة SVG' : 'Download SVG'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPNG(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-500" />
                <span>{isAr ? 'تحميل بصيغة PNG' : 'Download PNG'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
