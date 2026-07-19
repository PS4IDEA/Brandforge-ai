import React, { useState } from 'react';
import { Download, Share2, Image as ImageIcon, Layout, Type, Palette, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GeneratedBrandKit } from '../types';

interface SocialBrandingTabProps {
  savedKits: GeneratedBrandKit[];
  isAr: boolean;
}

export default function SocialBrandingTab({ savedKits, isAr }: SocialBrandingTabProps) {
  const [selectedKit, setSelectedKit] = useState<GeneratedBrandKit | null>(savedKits[0] || null);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'حزمة منصات التواصل' : 'Social Media Kit'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isAr ? 'قم بإنشاء أصول مرئية متناسقة لجميع منصاتك' : 'Generate consistent visual assets for all your platforms'}
          </p>
        </div>
        
        {savedKits.length > 0 && (
          <select 
            value={selectedKit?.id || ''} 
            onChange={(e) => setSelectedKit(savedKits.find(k => k.id === e.target.value) || null)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
          >
            {savedKits.map(kit => (
              <option key={kit.id} value={kit.id}>{kit.name}</option>
            ))}
          </select>
        )}
      </div>

      {!selectedKit ? (
        <div className="p-12 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {isAr ? 'لا توجد حزم علامة تجارية' : 'No Brand Kits Found'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {isAr ? 'قم بإنشاء حزمة علامتك التجارية أولاً لإنشاء أصول منصات التواصل.' : 'Generate a brand kit first to create social media assets.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              {isAr ? 'الصورة الشخصية' : 'Profile Picture'}
            </h3>
            <div className="aspect-square rounded-full border-4 overflow-hidden bg-slate-100 flex items-center justify-center relative mb-4" style={{ borderColor: selectedKit.colors.primary }}>
              {selectedKit.logoSvg ? (
                <div className="w-3/4 h-3/4" dangerouslySetInnerHTML={{ __html: selectedKit.logoSvg }} />
              ) : (
                <span className="text-4xl font-bold" style={{ color: selectedKit.colors.primary }}>{selectedKit.name.charAt(0)}</span>
              )}
            </div>
            <p className="text-sm text-slate-500 text-center mb-4">{isAr ? '1080 × 1080 بكسل (انستقرام، تويتر، لينكد إن)' : '1080 × 1080px (Instagram, Twitter, LinkedIn)'}</p>
            <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              {isAr ? 'تنزيل الأصل' : 'Download Asset'}
            </button>
          </div>

          {/* Cover Photo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-500" />
              {isAr ? 'صورة الغلاف' : 'Cover Photo'}
            </h3>
            <div className="w-full aspect-[3/1] rounded-xl overflow-hidden relative mb-4" style={{ background: `linear-gradient(135deg, ${selectedKit.colors.primary}, ${selectedKit.colors.secondary})` }}>
              <div className="absolute inset-0 flex items-center justify-center flex-col text-white p-8 text-center">
                 {selectedKit.logoSvg ? (
                  <div className="w-16 h-16 mb-4 opacity-90" dangerouslySetInnerHTML={{ __html: selectedKit.logoSvg }} />
                 ) : null}
                 <h2 className="text-3xl md:text-5xl font-bold mb-2" style={{ fontFamily: selectedKit.typography.heading }}>{selectedKit.name}</h2>
                 <p className="text-lg md:text-xl opacity-90" style={{ fontFamily: selectedKit.typography.body }}>{selectedKit.slogan}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center mb-4">{isAr ? '1500 × 500 بكسل (تويتر) و 1128 × 191 بكسل (لينكد إن)' : '1500 × 500px (Twitter) & 1128 × 191px (LinkedIn)'}</p>
            <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              {isAr ? 'تنزيل الأصل' : 'Download Asset'}
            </button>
          </div>

          {/* Post Template */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm lg:col-span-3">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Type className="w-5 h-5 text-indigo-500" />
              {isAr ? 'قالب المنشورات' : 'Social Post Template'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square rounded-2xl overflow-hidden relative p-8 flex flex-col justify-between" style={{ backgroundColor: selectedKit.colors.background }}>
                <div>
                  <h4 className="text-2xl font-bold mb-4" style={{ color: selectedKit.colors.text, fontFamily: selectedKit.typography.heading }}>
                    {isAr ? 'إعلان هام' : 'Important Announcement'}
                  </h4>
                  <p className="text-lg opacity-80" style={{ color: selectedKit.colors.text, fontFamily: selectedKit.typography.body }}>
                    {selectedKit.socialKit.postTemplate}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: `${selectedKit.colors.text}20` }}>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedKit.colors.primary, color: 'white' }}>
                       {selectedKit.name.charAt(0)}
                     </div>
                     <span className="font-semibold" style={{ color: selectedKit.colors.text }}>{selectedKit.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">{isAr ? 'الألوان المستخدمة' : 'Colors Used'}</h4>
                  <div className="flex gap-3">
                    {[selectedKit.colors.primary, selectedKit.colors.secondary, selectedKit.colors.background, selectedKit.colors.text].map((color, i) => (
                      <div key={i} className="w-10 h-10 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: color }} title={color} />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">{isAr ? 'النص المقترح' : 'Suggested Caption'}</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 text-sm">
                    {selectedKit.socialKit.bio}
                  </div>
                </div>
                <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  {isAr ? 'تنزيل جميع القوالب' : 'Download All Templates (ZIP)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
