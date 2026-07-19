import React, { useState, useRef } from 'react';
import { Download, Sparkles, Image as ImageIcon, User, Mail, Phone, MapPin, Globe, Loader2, Coins, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Language, UserProfile } from '../../types';
import LoadingOverlay from '../ui/LoadingOverlay';
import { motion } from 'motion/react';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
}

interface CardTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  bgClass: string;
  textClass: string;
  iconColor: string;
  primaryBg: string;
  titleColor: string;
  roleColor: string;
  patternType: 'circle' | 'lines' | 'waves' | 'none';
  accentClass: string;
  cardClass: string;
}

const TEMPLATES: CardTemplate[] = [
  {
    id: 'modern-indigo',
    nameEn: 'Modern Indigo',
    nameAr: 'أنديجو عصري',
    bgClass: 'bg-white',
    textClass: 'text-slate-900',
    iconColor: 'text-indigo-500',
    primaryBg: 'bg-indigo-600 text-white',
    titleColor: 'text-slate-900',
    roleColor: 'text-indigo-600',
    patternType: 'circle',
    accentClass: 'bg-indigo-500 opacity-10',
    cardClass: 'border border-slate-100 shadow-xl',
  },
  {
    id: 'midnight-gold',
    nameEn: 'Midnight Gold',
    nameAr: 'الذهبي الفاخر',
    bgClass: 'bg-slate-950',
    textClass: 'text-slate-100',
    iconColor: 'text-amber-400',
    primaryBg: 'bg-amber-500 text-slate-950',
    titleColor: 'text-amber-400',
    roleColor: 'text-slate-300',
    patternType: 'lines',
    accentClass: 'bg-gradient-to-tr from-amber-500/20 to-transparent',
    cardClass: 'border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  },
  {
    id: 'sunset-glow',
    nameEn: 'Sunset Glow',
    nameAr: 'شروق الشمس',
    bgClass: 'bg-gradient-to-br from-rose-50 to-orange-50',
    textClass: 'text-slate-800',
    iconColor: 'text-rose-500',
    primaryBg: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white',
    titleColor: 'text-rose-950',
    roleColor: 'text-rose-600',
    patternType: 'waves',
    accentClass: 'bg-rose-500/10',
    cardClass: 'border border-rose-100 shadow-lg',
  },
  {
    id: 'corporate-teal',
    nameEn: 'Corporate Teal',
    nameAr: 'تيل احترافي',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-900',
    iconColor: 'text-teal-600',
    primaryBg: 'bg-teal-600 text-white',
    titleColor: 'text-teal-950',
    roleColor: 'text-teal-600',
    patternType: 'none',
    accentClass: 'bg-teal-500/10',
    cardClass: 'border-l-8 border-l-teal-600 border-t border-r border-b border-slate-200 shadow-md',
  },
  {
    id: 'minimal-stark',
    nameEn: 'Minimal Stark',
    nameAr: 'بسيط وهادئ',
    bgClass: 'bg-zinc-100',
    textClass: 'text-zinc-900',
    iconColor: 'text-zinc-800',
    primaryBg: 'bg-zinc-900 text-white',
    titleColor: 'text-zinc-900 font-mono',
    roleColor: 'text-zinc-600 font-mono',
    patternType: 'none',
    accentClass: 'bg-zinc-500/10',
    cardClass: 'border border-zinc-300 font-mono shadow-sm',
  }
];

export default function BusinessCardMaker({ language, user, onDeductCredits, onOpenLogin }: Props) {
  const isAr = language === 'ar';
  
  const [name, setName] = useState('John Doe');
  const [title, setTitle] = useState('CEO & FOUNDER');
  const [phone, setPhone] = useState('+1 (555) 000-0000');
  const [email, setEmail] = useState('hello@company.com');
  const [website, setWebsite] = useState('www.company.com');
  const [address, setAddress] = useState('123 Business Avenue, NY');
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(TEMPLATES[0]);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JD';
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 180;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleDownload = async (type: 'pdf' | 'png') => {
    if (!user) {
      onOpenLogin?.();
      return;
    }

    if (onDeductCredits) {
      const success = onDeductCredits(3);
      if (!success) return; // Insufficient credits
    }

    setIsDownloading(true);
    
    // Simulate generation/download delay
    setTimeout(() => {
      setIsDownloading(false);
      alert(isAr ? `تم تحميل البطاقة بنجاح (${type.toUpperCase()})` : `Card downloaded successfully (${type.toUpperCase()})!`);
    }, 1500);
  };

  return (
    <>
      <LoadingOverlay isLoading={isDownloading} language={language} />
      <div className="space-y-12 py-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 dark:text-white">
          {isAr ? 'تصميم بطاقات العمل' : 'Business Card Maker'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {isAr 
            ? 'أنشئ بطاقة عمل احترافية تعكس هوية علامتك التجارية في دقائق باستخدام قوالبنا الذكية.' 
            : 'Create professional business cards that reflect your brand identity in minutes with our smart templates.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            {isAr ? 'بيانات البطاقة' : 'Card Details'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder={isAr ? 'أحمد محمد' : 'John Doe'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder={isAr ? 'المدير التنفيذي' : 'CEO & Founder'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="hello@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الموقع الإلكتروني' : 'Website'}</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="www.company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'العنوان' : 'Address'}</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="123 Business Avenue, NY" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center min-h-[380px] border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            {/* Card Preview */}
            <div 
              className={`w-[400px] max-w-full aspect-[1.75/1] shadow-2xl rounded-sm p-8 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${selectedTemplate.bgClass} ${selectedTemplate.textClass} ${selectedTemplate.cardClass}`} 
              id="card-preview"
            >
              {/* Pattern rendering based on selection */}
              {selectedTemplate.patternType === 'circle' && (
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full ${selectedTemplate.accentClass}`}></div>
              )}
              {selectedTemplate.patternType === 'lines' && (
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
              )}
              {selectedTemplate.patternType === 'waves' && (
                <div className={`absolute -right-10 -top-10 w-44 h-44 rounded-full filter blur-xl ${selectedTemplate.accentClass}`}></div>
              )}
              
              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className={`text-2xl font-black uppercase tracking-wider ${selectedTemplate.titleColor}`}>{name || (isAr ? 'الاسم الثنائي' : 'John Doe')}</h3>
                  <p className={`font-medium text-sm tracking-widest mt-1 ${selectedTemplate.roleColor}`}>{title || (isAr ? 'المسمى الوظيفي' : 'CEO & Founder')}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${selectedTemplate.primaryBg}`}>
                  {getInitials(name)}
                </div>
              </div>
              
              <div className="space-y-2 z-10 text-xs opacity-90">
                {phone && <div className="flex items-center gap-2"><Phone className={`w-3.5 h-3.5 ${selectedTemplate.iconColor}`} /> {phone}</div>}
                {email && <div className="flex items-center gap-2"><Mail className={`w-3.5 h-3.5 ${selectedTemplate.iconColor}`} /> {email}</div>}
                {website && <div className="flex items-center gap-2"><Globe className={`w-3.5 h-3.5 ${selectedTemplate.iconColor}`} /> {website}</div>}
                {address && <div className="flex items-center gap-2"><MapPin className={`w-3.5 h-3.5 ${selectedTemplate.iconColor}`} /> {address}</div>}
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-6 text-center">
              {isAr ? 'هذه معاينة حية لبطاقتك' : 'This is a live preview of your card'}
            </p>
          </div>

          {/* Interactive Carousel of Available Templates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isAr ? 'اختر قالب البطاقة' : 'Choose Template'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr ? 'انقر فوق نمط القالب لتطبيقه على الفور' : 'Click a template style to apply instantly'}
                </p>
              </div>
              
              {/* Carousel Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  aria-label="Previous template"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  aria-label="Next template"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Templates Row */}
            <div 
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 snap-x"
            >
              {TEMPLATES.map((tmpl) => {
                const isActive = selectedTemplate.id === tmpl.id;
                return (
                  <motion.button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    whileHover={{ scale: 1.06, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className={`flex-shrink-0 w-36 snap-start text-left p-2.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isActive 
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-500/10' 
                        : 'border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-white dark:hover:bg-slate-800/80 shadow-sm'
                    }`}
                  >
                    {/* Mini Card Preview */}
                    <div className={`w-full aspect-[1.75/1] rounded-lg p-2 flex flex-col justify-between overflow-hidden relative shadow-xs transition-all duration-300 ${tmpl.bgClass} ${tmpl.cardClass} ${
                      isActive ? 'ring-1 ring-indigo-500/30 scale-[1.02]' : ''
                    }`}>
                      {/* Mini Pattern */}
                      {tmpl.patternType === 'circle' && (
                        <div className={`absolute top-0 right-0 w-8 h-8 rounded-bl-full ${tmpl.accentClass}`}></div>
                      )}
                      {tmpl.patternType === 'waves' && (
                        <div className={`absolute -right-2 -top-2 w-10 h-10 rounded-full filter blur-[4px] ${tmpl.accentClass}`}></div>
                      )}
                      
                      <div className="flex justify-between items-start z-10 scale-[0.8] origin-top-left w-[125%]">
                        <div className="space-y-0.5">
                          <div className={`w-10 h-1.5 rounded-sm ${tmpl.titleColor === 'text-slate-900' || tmpl.titleColor === 'text-slate-100' ? 'bg-slate-400' : 'bg-indigo-400'}`} />
                          <div className={`w-6 h-1 rounded-sm ${tmpl.roleColor === 'text-indigo-600' || tmpl.roleColor === 'text-rose-600' ? 'bg-indigo-300' : 'bg-slate-300'}`} />
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-sm ${tmpl.primaryBg}`} />
                      </div>

                      <div className="space-y-0.5 z-10 scale-[0.7] origin-bottom-left w-[140%] opacity-80">
                        <div className="w-12 h-1 bg-slate-300 rounded-sm" />
                        <div className="w-8 h-1 bg-slate-300 rounded-sm" />
                      </div>
                    </div>

                    {/* Title & Selection Badge */}
                    <div className="mt-2.5 flex items-center justify-between px-0.5">
                      <span className={`text-xs font-bold truncate max-w-[85px] transition-colors ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {isAr ? tmpl.nameAr : tmpl.nameEn}
                      </span>
                      {isActive && (
                        <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
              className="flex-1 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-70 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-xl shadow-slate-900/20 cursor-pointer"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isAr ? 'تحميل PDF' : 'Download PDF'}
              <span className="flex items-center text-xs font-normal opacity-80 ml-1">
                (<Coins className="w-3 h-3 mr-1" /> 3)
              </span>
            </button>
            <button 
              onClick={() => handleDownload('png')}
              disabled={isDownloading}
              className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-70 rounded-xl font-bold transition flex justify-center items-center gap-2 cursor-pointer"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              {isAr ? 'تحميل PNG' : 'Download PNG'}
              <span className="flex items-center text-xs font-normal opacity-80 ml-1">
                (<Coins className="w-3 h-3 mr-1" /> 3)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
