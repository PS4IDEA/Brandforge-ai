import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { translations } from '../translations';
import { Language, UserProfile, GeneratedBrandKit } from '../types';
import { 
  Lock, Unlock, Copy, Check, Sparkles, RefreshCw, Palette, 
  Download, Save, Sliders, Layout, Shuffle, Trash2, ArrowLeftRight 
} from 'lucide-react';
import { fetchAPI } from '../lib/api';
import LoadingOverlay from './ui/LoadingOverlay';

// Helper: HSL to HEX
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const y = Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * (l - a * y)).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Helper: HEX to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper: Get color luminance
function getLuminance(hex: string): number {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Helper: Get WCAG 2.0 contrast ratio
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper: Get contrast rating badge colors & labels
function getContrastRating(ratio: number) {
  if (ratio >= 7) {
    return { label: 'AAA', pass: true, className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border-emerald-200/50' };
  } else if (ratio >= 4.5) {
    return { label: 'AA', pass: true, className: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/50' };
  } else if (ratio >= 3) {
    return { label: 'AA Large', pass: true, className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450 border-amber-200/50' };
  } else {
    return { label: 'Fail', pass: false, className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border-rose-200/50' };
  }
}

interface ColorPaletteGeneratorProps {
  language: Language;
  user: UserProfile | null;
  onDeductCredits: (amount: number) => boolean;
  onSaveBrandKit: (kit: GeneratedBrandKit) => void;
  onOpenLogin: () => void;
}

interface ColorSwatch {
  hex: string;
  name: string;
  role: string;
  locked: boolean;
  h: number;
  s: number;
  l: number;
}

export default function ColorPaletteGenerator({
  language,
  user,
  onDeductCredits,
  onSaveBrandKit,
  onOpenLogin,
}: ColorPaletteGeneratorProps) {
  const isAr = language === 'ar';
  
  // Localized Strings
  const loc = {
    title: isAr ? 'مولد لوحات الألوان التفاعلي' : 'Interactive Color Palette Generator',
    desc: isAr ? 'صمم لوحة ألوان هويتك التجارية بمرونة متكاملة. قفل الألوان المفضلة، عدل ببروز، أو استخدم الذكاء الاصطناعي للإلهام.' : 'Create, customize, and locking colors in perfect harmony for your brand. Direct tweaking via HSL, real-time canvas preview, and AI-powered palettes.',
    generateBtn: isAr ? 'توليد ألوان متناسقة' : 'Generate Harmony Palette',
    aiLabel: isAr ? 'ذكاء اصطناعي (إلهام بالوصف)' : 'Generate with AI Prompt',
    aiPromptPlaceholder: isAr ? 'مثال: علامة تجارية صديقة للبيئة، مقهى كلاسيكي دافئ...' : 'e.g. eco-friendly organic cosmetics, high-tech neon cyber agency...',
    aiBtn: isAr ? 'توليد بالذكاء الاصطناعي' : 'Forge with AI (2 Credits)',
    lockTooltip: isAr ? 'قفل اللون الحالي' : 'Lock this color',
    unlockTooltip: isAr ? 'إلغاء قفل اللون' : 'Unlock color',
    harmonyLabel: isAr ? 'قاعدة التناسق اللوني' : 'Color Harmony Rule',
    styleLabel: isAr ? 'النمط اللوني العام' : 'Stylistic Palette Tone',
    saveBtn: isAr ? 'حفظ اللوحة كدليل هوية' : 'Save as Brand Kit',
    saveNamePlaceholder: isAr ? 'أدخل اسم مشروعك التجاري...' : 'Enter brand/project name...',
    exportLabel: isAr ? 'تصدير الكود البرمجي' : 'Export Code Snippets',
    copySuccess: isAr ? 'تم النسخ!' : 'Copied!',
    previewTitle: isAr ? 'معاينة حية للمشروع' : 'Live Brand UI Preview',
    previewDesc: isAr ? 'تطبيق عملي للألوان على واجهة موقع افتراضي' : 'Simulated dashboard using your active brand color coordinates'
  };

  const harmonyRules = [
    { id: 'analogous', label: isAr ? 'ألوان متشابهة (Analogous)' : 'Analogous' },
    { id: 'monochromatic', label: isAr ? 'أحادية اللون (Monochromatic)' : 'Monochromatic' },
    { id: 'complementary', label: isAr ? 'ألوان متكاملة (Complementary)' : 'Complementary' },
    { id: 'triadic', label: isAr ? 'ألوان ثلاثية (Triadic)' : 'Triadic' },
    { id: 'split-complementary', label: isAr ? 'متكاملة مجزأة (Split Comp.)' : 'Split Complementary' },
    { id: 'golden-ratio', label: isAr ? 'النسبة الذهبية (Golden Ratio)' : 'Golden Ratio' },
    { id: 'random', label: isAr ? 'عشوائي احترافي (Random Pro)' : 'Random Designer Pro' },
  ];

  const stylePresets = [
    { id: 'standard', label: isAr ? 'قياسي متوازن' : 'Balanced Standard' },
    { id: 'pastel', label: isAr ? 'ألوان هادئة (Pastel)' : 'Pastel Soft' },
    { id: 'neon', label: isAr ? 'ساطع ونيون (Cyberpunk)' : 'Neon Cyberpunk' },
    { id: 'vintage', label: isAr ? 'دافئ وكلاسيكي (Retro)' : 'Warm Retro/Vintage' },
    { id: 'minimalist', label: isAr ? 'بسيط وهادئ' : 'Minimalist/Corporate' },
    { id: 'vibrant', label: isAr ? 'حيوي عالي التباين' : 'Vibrant High Contrast' },
  ];

  const defaultSwatches: ColorSwatch[] = [
    { hex: '#4F46E5', name: 'Royal Indigo', role: 'Primary Core Brand Color', locked: false, h: 244, s: 75, l: 59 },
    { hex: '#7C3AED', name: 'Bright Violet', role: 'Secondary brand base accent', locked: false, h: 262, s: 80, l: 58 },
    { hex: '#F43F5E', name: 'Neon Rose', role: 'Vibrant highlight & action element', locked: false, h: 351, s: 90, l: 60 },
    { hex: '#F8FAFC', name: 'Slate Light', role: 'Main Canvas Background default', locked: false, h: 210, s: 40, l: 98 },
    { hex: '#0F172A', name: 'Slate Dark', role: 'Contrast font text headings', locked: false, h: 222, s: 47, l: 11 },
  ];

  const [swatches, setSwatches] = useState<ColorSwatch[]>(defaultSwatches);
  const [harmony, setHarmony] = useState('analogous');
  const [stylePreset, setStylePreset] = useState('standard');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreviewType, setShowPreviewType] = useState<'card' | 'landing'>('landing');

  // Trigger palette generation based on color rules
  const generatePaletteHeuristic = (currentSwatches: ColorSwatch[], selectedHarmony: string, selectedStyle: string) => {
    // Find first unlocked or locked seed color
    const seed = currentSwatches.find(s => s.locked) || currentSwatches[0];
    const { h: baseH, s: baseS, l: baseL } = seed;

    return currentSwatches.map((swatch, idx) => {
      if (swatch.locked) return swatch;

      let h = baseH;
      let s = baseS;
      let l = baseL;

      // Harmony modifications
      if (selectedHarmony === 'monochromatic') {
        // Keeps same hue, alters lightness/saturation
        const lSteps = [20, 38, 55, 75, 95];
        const sSteps = [80, 70, 60, 45, 20];
        l = lSteps[idx];
        s = sSteps[idx];
      } else if (selectedHarmony === 'analogous') {
        const offset = [-30, -15, 0, 15, 30];
        h = (baseH + offset[idx] + 360) % 360;
      } else if (selectedHarmony === 'complementary') {
        // Base, lighter base, neutral, complement, lighter complement
        if (idx === 0) { h = baseH; l = Math.max(30, baseL - 10); }
        else if (idx === 1) { h = baseH; l = Math.min(85, baseL + 20); }
        else if (idx === 2) { h = baseH; s = 10; l = 95; } // background neutral
        else if (idx === 3) { h = (baseH + 180) % 360; l = baseL; }
        else { h = (baseH + 180) % 360; l = Math.min(85, baseL + 25); }
      } else if (selectedHarmony === 'triadic') {
        const triadOffsets = [0, 120, 240, 0, 120];
        h = (baseH + triadOffsets[idx]) % 360;
        if (idx > 2) l = idx === 3 ? 95 : 12; // neutral helpers
      } else if (selectedHarmony === 'split-complementary') {
        const splitOffsets = [0, 150, 210, 0, 150];
        h = (baseH + splitOffsets[idx]) % 360;
        if (idx > 2) l = idx === 3 ? 97 : 14;
      } else if (selectedHarmony === 'golden-ratio') {
        // Adjust Hue progressively by Golden Angle (~137.5 deg)
        h = Math.round(baseH + idx * 137.5) % 360;
      } else {
        // Random Designer Pro
        h = Math.round(Math.random() * 360);
        s = Math.round(40 + Math.random() * 50);
        l = Math.round(25 + Math.random() * 60);
      }

      // Apply Style presets
      if (selectedStyle === 'pastel') {
        s = Math.min(s, 45); // highly desaturated
        l = Math.max(l, 70); // extremely light
      } else if (selectedStyle === 'neon') {
        s = Math.max(s, 90); // ultra saturated
        l = Math.max(40, Math.min(l, 60)); // high glow midtones
      } else if (selectedStyle === 'vintage') {
        s = Math.max(20, Math.min(s, 50)); // retro desaturated
        l = Math.max(30, Math.min(l, 70)); // rich golden age warm tones
      } else if (selectedStyle === 'minimalist') {
        if (idx === 3) { s = 5; l = 97; } // clear cool white bg
        else if (idx === 4) { s = 10; l = 12; } // clean dark grey contrast text
        else {
          s = Math.min(s, 40); // corporate toned
          l = Math.max(25, Math.min(l, 75));
        }
      } else if (selectedStyle === 'vibrant') {
        s = Math.max(s, 85);
        l = Math.max(35, Math.min(l, 65));
      }

      // Constrain values
      h = Math.round((h + 360) % 360);
      s = Math.max(0, Math.min(100, Math.round(s)));
      l = Math.max(0, Math.min(100, Math.round(l)));

      const hex = hslToHex(h, s, l);
      
      const roles = [
        isAr ? 'اللون الأساسي' : 'Primary Brand Core',
        isAr ? 'اللون الثانوي' : 'Secondary Highlight',
        isAr ? 'اللون المميز' : 'Accent Call-To-Action',
        isAr ? 'خلفية التطبيق' : 'Canvas Background',
        isAr ? 'نصوص العناوين' : 'Contrast Core Text'
      ];

      const names = [
        isAr ? 'النبيل المهيب' : 'Brand Primary',
        isAr ? 'الحيوي الهادئ' : 'Brand Secondary',
        isAr ? 'الشرارة الذهبية' : 'Accent Spark',
        isAr ? 'الخلفية المتزنة' : 'Neutral Canvas',
        isAr ? 'الفحم الأنيق' : 'Contrast Deep'
      ];

      return {
        ...swatch,
        h, s, l, hex,
        role: roles[idx],
        name: names[idx]
      };
    });
  };

  const handleGenerateHarmony = () => {
    setSwatches(prev => generatePaletteHeuristic(prev, harmony, stylePreset));
  };

  // Run initial generator once on load
  useEffect(() => {
    handleGenerateHarmony();
  }, [harmony, stylePreset]);

  // Update a single swatch's state
  const updateSwatchField = (idx: number, field: Partial<ColorSwatch>) => {
    setSwatches(prev => prev.map((sw, i) => {
      if (i !== idx) return sw;
      const merged = { ...sw, ...field };
      if (field.hex) {
        const hsl = hexToHsl(field.hex);
        merged.h = hsl.h;
        merged.s = hsl.s;
        merged.l = hsl.l;
      } else if (field.h !== undefined || field.s !== undefined || field.l !== undefined) {
        merged.hex = hslToHex(merged.h, merged.s, merged.l);
      }
      return merged;
    }));
  };

  // Call backend AI generator proxy
  const handleAIPaletteGenerate = async () => {
    if (!aiPrompt.trim()) return;

    if (!user) {
      onOpenLogin();
      return;
    }

    setAiLoading(true);
    setAiError(null);

    const userCredits = user && typeof user.credits === 'number' && !isNaN(user.credits) ? user.credits : 0;
    if (userCredits < 2) {
      setAiError(isAr ? 'عذراً! الرصيد الحالي غير كافٍ.' : 'Insufficient credits. Please load credits or upgrade.');
      setAiLoading(false);
      return;
    }

    try {
      const resJson = await fetchAPI('/api/generate-palette', {
        method: 'POST',
        body: JSON.stringify({
          prompt: aiPrompt,
          harmony,
          style: stylePreset,
          language
        })
      });

      if (resJson.success && resJson.data?.colors) {
        onDeductCredits(2);
        const aiColors = resJson.data.colors;
        setSwatches(prev => prev.map((sw, idx) => {
          if (sw.locked) return sw; // Keep user's locked colors! Extremely clever design decision
          const aiColor = aiColors[idx] || aiColors[0];
          const hsl = hexToHsl(aiColor.hex);
          return {
            ...sw,
            hex: aiColor.hex.toUpperCase(),
            name: aiColor.name,
            role: aiColor.role,
            h: hsl.h,
            s: hsl.s,
            l: hsl.l
          };
        }));
        if (resJson.data.paletteName) {
          setSaveName(resJson.data.paletteName);
        }
      } else {
        throw new Error(resJson.error || 'Palette formatting failed');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error communicating with AI model. Standard harmony loaded instead.');
    } finally {
      setAiLoading(false);
    }
  };

  // Copy individual hex code
  const handleCopyHex = (hex: string, idx: number) => {
    navigator.clipboard.writeText(hex);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Save palette as a brand kit
  const handleSaveToBrandKits = () => {
    if (!saveName.trim()) return;

    const brandKit: GeneratedBrandKit = {
      id: `kit-palette-${Date.now()}`,
      name: saveName.trim(),
      slogan: isAr ? 'هوية ألوان تفاعلية منسقة' : 'Interactive engineered color scheme',
      colors: {
        primary: swatches[0].hex,
        secondary: swatches[1].hex,
        accent: swatches[2].hex,
        background: swatches[3].hex,
        text: swatches[4].hex
      },
      typography: {
        heading: 'Space Grotesk',
        body: 'Inter',
        rationale: isAr ? 'دليل ألوان تجاري احترافي تم هندسته تفاعلياً.' : 'A robust and clean color palette crafted interactively.'
      },
      socialKit: {
        bio: 'Designed using BrandForge AI Interactive Palette Orchestrator.',
        coverPrompt: 'Minimal abstract background styled with brand colors.',
        postTemplate: 'Captivating visual template guide.'
      },
      createdAt: new Date().toISOString(),
      tags: ['Interactive Palette']
    };

    onSaveBrandKit(brandKit);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSaveName('');
    }, 2500);
  };

  // Format Copy Handlers
  const handleCopyFormat = (type: 'tailwind' | 'css' | 'json') => {
    let text = '';
    if (type === 'tailwind') {
      text = `colors: {\n  primary: '${swatches[0].hex}',\n  secondary: '${swatches[1].hex}',\n  accent: '${swatches[2].hex}',\n  background: '${swatches[3].hex}',\n  text: '${swatches[4].hex}',\n}`;
    } else if (type === 'css') {
      text = `:root {\n  --color-primary: ${swatches[0].hex};\n  --color-secondary: ${swatches[1].hex};\n  --color-accent: ${swatches[2].hex};\n  --color-background: ${swatches[3].hex};\n  --color-text: ${swatches[4].hex};\n}`;
    } else if (type === 'json') {
      text = JSON.stringify({
        primary: swatches[0].hex,
        secondary: swatches[1].hex,
        accent: swatches[2].hex,
        background: swatches[3].hex,
        text: swatches[4].hex
      }, null, 2);
    }
    navigator.clipboard.writeText(text);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Swap Colors Order Tool
  const handleRotateColors = () => {
    setSwatches(prev => {
      const unlocked = prev.filter(s => !s.locked);
      if (unlocked.length < 2) return prev;
      
      // Rotate unlocked colors to the right
      const last = unlocked[unlocked.length - 1];
      const rotated = [last, ...unlocked.slice(0, -1)];
      
      let rotIdx = 0;
      return prev.map(s => {
        if (s.locked) return s;
        return {
          ...rotated[rotIdx++],
          role: s.role, // Maintain original role slot description
        };
      });
    });
  };

  return (
    <>
      <LoadingOverlay isLoading={aiLoading} language={language} />
      <div className="space-y-8 animate-fade-in" id="palette-generator-tool">
      
      {/* Tool Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 dark:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-950/50 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Palette className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                {loc.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                {loc.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRotateColors}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Rotate unlocked colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isAr ? 'تدوير الألوان' : 'Rotate Colors'}</span>
            </button>
            <button
              onClick={handleGenerateHarmony}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>{loc.generateBtn}</span>
            </button>
          </div>
        </div>

        {/* Harmony Customizers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              {loc.harmonyLabel}
            </label>
            <select
              value={harmony}
              onChange={(e) => setHarmony(e.target.value)}
              className="w-full py-2.5 px-3 pr-8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat"
            >
              {harmonyRules.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              {loc.styleLabel}
            </label>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
              className="w-full py-2.5 px-3 pr-8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat"
            >
              {stylePresets.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Prompt AI generator */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              {loc.aiLabel}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={loc.aiPromptPlaceholder}
                value={aiPrompt}
                onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }}
                className="flex-grow py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAIPaletteGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition cursor-pointer"
              >
                {aiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                )}
                <span>{isAr ? 'ذكاء اصطناعي' : 'AI Forge'}</span>
              </button>
            </div>
            {aiError && (
              <div className="flex items-center justify-between gap-3 mt-2 p-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40">
                <p className="text-[10px] text-red-500 font-semibold">{aiError}</p>
                <button
                  onClick={handleAIPaletteGenerate}
                  disabled={aiLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer shrink-0"
                >
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------- */}
        {/* Swatches Board Grid */}
        {/* ----------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {swatches.map((sw, idx) => (
            <motion.div
              key={idx}
              layout
              className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative"
            >
              {/* Color Block Visual */}
              <div 
                className="w-full h-32 rounded-xl shadow-inner relative overflow-hidden flex items-end justify-between p-2.5 group border border-slate-200/40 dark:border-slate-800/40"
                style={{ backgroundColor: sw.hex }}
              >
                {/* Lock Indicator */}
                <button
                  onClick={() => updateSwatchField(idx, { locked: !sw.locked })}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-white/80 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900 backdrop-blur-md text-slate-700 dark:text-slate-300 rounded-lg border border-slate-150/40 transition-all cursor-pointer shadow-sm"
                  title={sw.locked ? loc.unlockTooltip : loc.lockTooltip}
                >
                  {sw.locked ? (
                    <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-current" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Styled Color Picker Trigger */}
                <div className="absolute top-2.5 left-2.5 overflow-hidden w-7 h-7 rounded-lg border border-white/40 shadow-sm cursor-pointer">
                  <input
                    type="color"
                    value={sw.hex}
                    onChange={(e) => updateSwatchField(idx, { hex: e.target.value.toUpperCase() })}
                    className="absolute -inset-1 w-10 h-10 cursor-pointer border-0 p-0"
                  />
                </div>

                {/* Copied visual flash overlay */}
                {copiedIndex === idx && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold animate-fade-in">
                    <Check className="w-4 h-4 mr-1 text-emerald-400" />
                    <span>{loc.copySuccess}</span>
                  </div>
                )}

                {/* Code Hex display */}
                <button
                  onClick={() => handleCopyHex(sw.hex, idx)}
                  className="bg-black/40 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wider font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer w-full justify-center"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>{sw.hex}</span>
                </button>
              </div>

              {/* Swatch Details */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-1">
                    {sw.name}
                  </span>
                  <button
                    onClick={() => handleCopyHex(sw.hex, idx)}
                    className="text-slate-400 hover:text-indigo-600 transition p-1 cursor-pointer shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <span className="block text-[9px] font-mono text-slate-400 font-bold uppercase">
                  {sw.hex}
                </span>
                <span className="block text-[10px] text-slate-500 leading-tight">
                  {sw.role}
                </span>
              </div>

              {/* Accessibility Contrast Ratios */}
              <div className="bg-slate-100/50 dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-150/40 dark:border-slate-800/80 space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between font-bold text-slate-400 uppercase tracking-wider text-[8px]">
                  <span>{isAr ? 'التباين اللوني' : 'Contrast Ratio'}</span>
                  <span className="font-mono text-indigo-500">WCAG 2.0</span>
                </div>
                
                {/* Contrast with White */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white border border-slate-300 shadow-xs inline-block" />
                    <span className="text-slate-500 dark:text-slate-400 text-[9px]">{isAr ? 'أبيض' : 'On White'}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{getContrastRatio(sw.hex, '#FFFFFF').toFixed(1)}:1</span>
                    <span className={`px-1 py-0.2 text-[8px] font-extrabold rounded-md border ${getContrastRating(getContrastRatio(sw.hex, '#FFFFFF')).className}`}>
                      {getContrastRating(getContrastRatio(sw.hex, '#FFFFFF')).label}
                    </span>
                  </div>
                </div>

                {/* Contrast with Black */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-black border border-slate-800 shadow-xs inline-block" />
                    <span className="text-slate-500 dark:text-slate-400 text-[9px]">{isAr ? 'أسود' : 'On Black'}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{getContrastRatio(sw.hex, '#000000').toFixed(1)}:1</span>
                    <span className={`px-1 py-0.2 text-[8px] font-extrabold rounded-md border ${getContrastRating(getContrastRatio(sw.hex, '#000000')).className}`}>
                      {getContrastRating(getContrastRatio(sw.hex, '#000000')).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjust HSL Sliders */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>{isAr ? 'درجة اللون' : 'HUE'}</span>
                  <span className="font-mono">{sw.h}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={sw.h}
                  onChange={(e) => updateSwatchField(idx, { h: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>{isAr ? 'التشبع' : 'SAT'}</span>
                  <span className="font-mono">{sw.s}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sw.s}
                  onChange={(e) => updateSwatchField(idx, { s: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>{isAr ? 'السطوع' : 'LIG'}</span>
                  <span className="font-mono">{sw.l}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sw.l}
                  onChange={(e) => updateSwatchField(idx, { l: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Save to brand kits form */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder={loc.saveNamePlaceholder}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="py-2.5 px-4 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 w-full sm:w-72"
            />
            <button
              onClick={handleSaveToBrandKits}
              disabled={!saveName.trim() || saveSuccess}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? (isAr ? 'تم الحفظ بالدليل!' : 'Saved to Kits!') : loc.saveBtn}</span>
            </button>
          </div>

          {/* Copy Snippets Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loc.exportLabel}:</span>
            {[
              { id: 'json', label: 'JSON' },
              { id: 'tailwind', label: 'Tailwind' },
              { id: 'css', label: 'CSS' }
            ].map(fmt => (
              <button
                key={fmt.id}
                onClick={() => handleCopyFormat(fmt.id as any)}
                className="px-3 py-1.5 text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                {copiedFormat === fmt.id ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ----------------------------------------------- */}
      {/* Live Preview Mockup Section */}
      {/* ----------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 dark:shadow-none space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                {loc.previewTitle}
              </h3>
              <p className="text-[10px] text-slate-400">
                {loc.previewDesc}
              </p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => setShowPreviewType('landing')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                showPreviewType === 'landing'
                  ? 'bg-white dark:bg-slate-850 shadow-xs text-indigo-600 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {isAr ? 'قالب موقع الويب' : 'Web Mockup'}
            </button>
            <button
              onClick={() => setShowPreviewType('card')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${
                showPreviewType === 'card'
                  ? 'bg-white dark:bg-slate-850 shadow-xs text-indigo-600 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {isAr ? 'بطاقة بينتو' : 'Bento Card'}
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div 
          className="border border-slate-150/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
          style={{ backgroundColor: swatches[3].hex, color: swatches[4].hex }}
        >
          {showPreviewType === 'landing' ? (
            <div className="p-6 sm:p-10 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-200/20">
                <div className="flex items-center gap-2 font-display font-bold text-sm">
                  <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: swatches[0].hex }}>
                    ★
                  </div>
                  <span>{saveName || (isAr ? 'أستوديو براند فورج' : 'BrandForge Studio')}</span>
                </div>
                <div className="flex gap-4 text-[10px] font-semibold opacity-80">
                  <span>{isAr ? 'الرئيسية' : 'Home'}</span>
                  <span>{isAr ? 'المنتجات' : 'Products'}</span>
                  <span>{isAr ? 'حولنا' : 'About'}</span>
                </div>
              </div>

              {/* Hero block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
                <div className="space-y-4">
                  <span className="px-2.5 py-1 text-[9px] font-bold rounded-full text-white" style={{ backgroundColor: swatches[1].hex }}>
                    {isAr ? 'إصدار جديد' : 'NEW RELEASE'}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-display font-black leading-tight">
                    {isAr ? 'عزز نمو أعمالك بدقة متفوقة' : 'Elevate Your Business Visual Integrity'}
                  </h1>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {isAr 
                      ? 'يقوم برنامجنا بتنظيم تصاميم الهوية التجارية الذكية وتنسيقات نظرية الألوان التفاعلية وهندسة الخطوط في مساحة عمل موحدة جميلة.' 
                      : 'Our software organizes smart brand kit designs, interactive color theory coordination, and typography orchestration in a beautifully unified workspace.'}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button 
                      className="px-4 py-2.5 text-[10px] font-bold text-white rounded-lg cursor-pointer shadow-md transform hover:scale-[1.02] transition-all"
                      style={{ backgroundColor: swatches[0].hex }}
                    >
                      {isAr ? 'زر إجراء رئيسي' : 'Primary Button'}
                    </button>
                    <button 
                      className="px-4 py-2.5 text-[10px] font-bold rounded-lg border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      style={{ borderColor: swatches[0].hex }}
                    >
                      {isAr ? 'زر إجراء ثانوي' : 'Secondary Button'}
                    </button>
                  </div>
                </div>

                {/* Accent Dashboard visual block */}
                <div 
                  className="rounded-2xl p-5 border border-slate-200/10 shadow-lg relative overflow-hidden"
                  style={{ backgroundColor: swatches[1].hex + '15' }} // 8% opacity tint
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-2 text-[9px] font-mono opacity-80">
                    <div className="flex justify-between pb-1 border-b border-slate-200/10">
                      <span>{isAr ? 'مؤشر متغير' : 'Variable Parameter'}</span>
                      <span className="font-bold text-emerald-500" style={{ color: swatches[2].hex }}>{isAr ? 'نشط' : 'Active'}</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full bg-slate-200 dark:bg-slate-800/65 overflow-hidden">
                      <div className="h-full rounded-full w-3/4" style={{ backgroundColor: swatches[2].hex }} />
                    </div>
                    <p className="text-[8px] leading-relaxed pt-2">
                      {isAr 
                        ? `التمييز اللوني (Hex: ${swatches[2].hex}) مثالي للمؤشرات، وحلقات التغذية الراجعة، والهايلايت الديناميكي الدقيق.` 
                        : `Accent highlighting (hex: ${swatches[2].hex}) is perfect for indicators, feedback loops, and dynamic highlights.`}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg"
                style={{ backgroundColor: swatches[0].hex }}
              >
                ✦
              </div>
              <div className="space-y-2 max-w-sm">
                <h4 className="font-display font-bold text-lg">
                  {saveName || (isAr ? 'بطاقة استعراض بينتو' : 'Bento Showcase Card')}
                </h4>
                <p className="text-xs opacity-85 leading-relaxed">
                  {isAr 
                    ? 'تستعرض هذه البطاقة دمج الخطوط وتباين الألوان مباشرة على خلفية هويتك المختارة. الوضوح العالي هو مفتاح النجاح!' 
                    : 'This card showcases typography pairing & color contrast directly on your chosen background canvas. High legibility is crucial!'}
                </p>
              </div>

              <div className="flex gap-2">
                {swatches.map((sw, i) => (
                  <div 
                    key={i} 
                    className="w-4 h-4 rounded-full border border-white/20 shadow-xs" 
                    style={{ backgroundColor: sw.hex }} 
                    title={sw.name}
                  />
                ))}
              </div>

              <button 
                className="px-5 py-2 rounded-full text-[10px] font-bold text-white shadow-md cursor-pointer"
                style={{ backgroundColor: swatches[2].hex }}
              >
                {isAr ? 'إجراء تفاعلي مميز' : 'Accent Action Call'}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
    </>
  );
}
