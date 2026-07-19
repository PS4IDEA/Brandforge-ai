import React, { useState } from 'react';
import { Image as ImageIcon, Instagram, Twitter, Linkedin, Facebook, Download, Sparkles, Layout, Loader2, Coins } from 'lucide-react';
import { Language, UserProfile } from '../../types';
import LoadingOverlay from '../ui/LoadingOverlay';

interface Props {
  language: Language;
  user?: UserProfile | null;
  onDeductCredits?: (amount: number) => boolean;
  onOpenLogin?: () => void;
}

export default function SocialMediaAssets({ language, user, onDeductCredits, onOpenLogin }: Props) {
  const isAr = language === 'ar';
  
  const [mainText, setMainText] = useState('BIG ANNOUNCEMENT');
  const [subText, setSubText] = useState('Coming soon to a screen near you.');
  const [activeTab, setActiveTab] = useState('instagram');
  const [bgColor, setBgColor] = useState('from-indigo-500 to-purple-600');
  const [isDownloading, setIsDownloading] = useState(false);

  const colors = [
    { class: 'from-indigo-500 to-purple-600', hex: 'bg-indigo-500' },
    { class: 'from-pink-500 to-rose-500', hex: 'bg-pink-500' },
    { class: 'from-emerald-400 to-teal-500', hex: 'bg-emerald-500' },
    { class: 'from-amber-400 to-orange-500', hex: 'bg-amber-500' },
    { class: 'from-slate-800 to-slate-900', hex: 'bg-slate-900' },
  ];

  const tabs = [
    { id: 'instagram', icon: Instagram, label: 'Instagram Post' },
    { id: 'twitter', icon: Twitter, label: 'Twitter Header' },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn Cover' },
    { id: 'facebook', icon: Facebook, label: 'Facebook Cover' },
  ];

  const handleDownload = () => {
    if (!user) {
      onOpenLogin?.();
      return;
    }

    if (onDeductCredits) {
      const success = onDeductCredits(3);
      if (!success) return;
    }

    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(isAr ? 'تم التحميل بنجاح!' : 'Downloaded successfully!');
    }, 1500);
  };

  return (
    <>
      <LoadingOverlay isLoading={isDownloading} language={language} />
      <div className="space-y-12 py-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 dark:text-white">
          {isAr ? 'أصول السوشيال ميديا' : 'Social Media Assets'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {isAr 
            ? 'احصل على تصميمات جاهزة لجميع منصات التواصل الاجتماعي بأبعاد مثالية.' 
            : 'Get ready-to-use designs for all social media platforms in perfect dimensions.'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg whitespace-nowrap transition ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 flex flex-col items-center">
            <div className={`
              ${activeTab === 'instagram' ? 'aspect-square w-full' : 'aspect-[3/1] w-full'} 
              bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden group transition-all duration-300
            `}>
              <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-90 mix-blend-multiply transition-colors duration-500`}></div>
              <div className="z-10 text-white text-center p-8 max-w-[90%]">
                <h3 className={`${activeTab === 'instagram' ? 'text-3xl' : 'text-xl'} font-bold mb-4 break-words`}>{mainText || 'YOUR TEXT'}</h3>
                <p className="text-white/90 font-medium break-words">{subText || 'Your subtext here'}</p>
              </div>
            </div>
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-70 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-xl shadow-slate-900/20"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isAr ? 'تحميل التصميم' : 'Download Asset'}
              <span className="flex items-center text-xs font-normal opacity-80 ml-1">
                (<Coins className="w-3 h-3 mr-1" /> 3)
              </span>
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-500" />
              {isAr ? 'تخصيص التصميم' : 'Customize Design'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'النص الرئيسي' : 'Main Text'}</label>
                <input 
                  type="text" 
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'النص الفرعي' : 'Sub Text'}</label>
                <input 
                  type="text" 
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{isAr ? 'الألوان' : 'Colors'}</label>
                <div className="flex gap-3">
                  {colors.map((c, i) => (
                    <button 
                      key={i}
                      onClick={() => setBgColor(c.class)}
                      className={`w-10 h-10 rounded-full ${c.hex} transition-transform ${bgColor === c.class ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 scale-110' : 'hover:scale-110'}`}
                    ></button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
