import React, { useState } from 'react';
import { translations } from '../translations';
import { Language, Page, BlogArticle, SupportTicket } from '../types';
import { Mail, HelpCircle, FileText, ChevronRight, Check, Star, ShieldCheck, Award, MessageSquare, Coins, Zap, Sparkles, Globe, Layout, Download, RefreshCw, X, Lock, CreditCard, Volume2, Briefcase, Search, Box } from 'lucide-react';
import CheckoutModal from './CheckoutModal';

interface BlogFAQPagesProps {
  language: Language;
  page: Page;
  setCurrentPage: (page: Page) => void;
  onSubmitTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status'>) => Promise<{ success: boolean; emailSuccess: boolean; error?: string }>;
  userEmail?: string;
  userUid?: string;
  onAddCredits?: (amount: number) => void;
  onOpenLogin?: () => void;
}

export default function BlogFAQPages({
  language,
  page,
  setCurrentPage,
  onSubmitTicket,
  userEmail,
  userUid,
  onAddCredits,
  onOpenLogin,
}: BlogFAQPagesProps) {
  const t = translations[language];

  // Contact form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(userEmail || '');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    itemName: string;
    price: number;
    onSuccess: () => void;
  } | null>(null);

  const handleBuyPack = (amount: number, cost: number) => {
    if (!userUid || userUid === 'guest') {
      if (onOpenLogin) {
        onOpenLogin();
      }
      return;
    }
    
    setCheckoutModal({
      isOpen: true,
      itemName: language === 'ar' ? `شحن ${amount} رصيد ذكاء اصطناعي` : `${amount} AI Generation Credits`,
      price: cost,
      onSuccess: () => {
        if (onAddCredits) {
          onAddCredits(amount);
          setPurchaseSuccess(language === 'ar' ? `تم شراء ${amount} رصيد بنجاح! شكراً لك.` : `Successfully purchased ${amount} credits! Thank you.`);
          setTimeout(() => setPurchaseSuccess(null), 4000);
        }
      }
    });
  };

  const blogArticles: BlogArticle[] = [
    {
      id: 'blog-1',
      titleEn: 'How to Choose the Perfect Brand Name for Your Startup',
      titleAr: 'كيف تختار الاسم التجاري المثالي لشركتك الناشئة',
      excerptEn: 'Learn the principles of modern brand naming, including linguistics, domain availability, and memorability.',
      excerptAr: 'تعرف على أساسيات اختيار الأسماء التجارية الحديثة، بما في ذلك اللغويات، وتوافر النطاق، وسهولة الحفظ.',
      contentEn: 'Choosing a startup name can define your trajectory. Start with simple phonetics, ensure semantic alignment, check trademark registries, and secure modern domains.',
      contentAr: 'اختيار اسم شركتك الناشئة يحدد مسارك. ابدأ بالصوتيات البسيطة، وتأكد من المحاذاة الدلالية، وتحقق من سجلات العلامات التجارية، وضمن النطاقات الحديثة.',
      date: '2026-07-01',
      image: 'https://picsum.photos/seed/naming/600/400',
      author: 'Aria Carter'
    },
    {
      id: 'blog-2',
      titleEn: 'The Psychology of Color in Logo Design',
      titleAr: 'سيكولوجية الألوان في تصميم الشعارات',
      excerptEn: 'Discover how gold, blue, and black gradients communicate luxury, technology, and trust to your prospective audience.',
      excerptAr: 'اكتشف كيف تعبر تدرجات اللون الذهبي والأزرق والأسود عن الفخامة والتقنية والثقة لجمهورك المحتمل.',
      contentEn: 'Colors elicit immediate cognitive responses. Blue triggers reliability, gold represents royal prestige, while red represents visceral power and speed.',
      contentAr: 'تثير الألوان استجابات معرفية فورية. يثير اللون الأزرق الثقة والموثوقية، ويمثل اللون الذهبي المكانة الفاخرة، بينما يمثل اللون الأحمر القوة والسرعة.',
      date: '2026-06-25',
      image: 'https://picsum.photos/seed/colors/600/400',
      author: 'Marcus Vance'
    }
  ];

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !contactEmail.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setEmailWarning(false);
    setTicketSuccess(false);

    try {
      const res = await onSubmitTicket({
        userId: userUid || 'guest',
        userEmail: contactEmail,
        subject,
        message,
      });

      if (res.success) {
        setSubject('');
        setMessage('');
        setTicketSuccess(true);
        if (!res.emailSuccess) {
          setEmailWarning(true);
          setSubmitError(res.error || null);
        }
      } else {
        setSubmitError(res.error || 'Firestore write failed');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (page === 'features') {
    const isAr = language === 'ar';
    return (
      <div className="space-y-12 animate-fade-in py-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {isAr ? 'أدوات بناء العلامة التجارية الشاملة' : 'Comprehensive Brand Forge Tools'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr ? 'ينسق BrandForge AI مولدات عصبية متخصصة لبناء هويات بصرية دقيقة وعالية الدقة.' : 'BrandForge AI coordinates specialized neural generators to construct pristine, high-resolution visual identities.'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: isAr ? 'تصميم شعار احترافي ثلاثي الأبعاد وعادي' : 'Premium 3D & Flat Logo Maker', desc: isAr ? 'صمم شعارًا لعلامتك التجارية بالكامل، واختر بين مظهر متجهي مسطح أو مجسم ثلاثي الأبعاد بارز بلمسات إضاءة سينمائية.' : 'Generate infinite precision brand logos with standard flat vector profiles or breathtaking volumetric 3D extruded depths.', icon: <Box className="w-6 h-6" />, targetPage: 'logo-maker' as Page },
            { title: isAr ? 'تحسين سيو ومحركات البحث الذكي' : 'AI SEO Keywords & Optimization', desc: isAr ? 'حلل الكلمات المفتاحية لمشروعك، وأنشئ ميتادات كاملة وتوصيات سيو مخصصة لعلامتك التجارية لتتصدر بحث جوجل.' : 'Analyze target keywords, generate meta-tags, and get custom recommendations to rank on top of Google Search Console.', icon: <Search className="w-6 h-6" />, targetPage: 'seo' as Page },
            { title: isAr ? 'تصميم بطاقات العمل الاحترافية' : 'Premium Business Card Maker', desc: isAr ? 'صمم بطاقات عمل وهوية ورقية احترافية لعلامتك التجارية مع خيارات متنوعة جاهزة للتنزيل والطباعة فوراً.' : 'Design professional and printable business cards and corporate stationery for your team instantly.', icon: <Briefcase className="w-6 h-6" />, targetPage: 'business-cards' as Page },
            { title: t.nameGen, desc: isAr ? 'ينشئ ما يصل إلى 10 نماذج أسماء تجارية مطابقة لمعايير الصناعة والبلدان المستهدفة.' : 'Generates up to 10 contextual business name models matching standard industry parameters and target countries.', icon: <Award className="w-6 h-6" />, targetPage: 'dashboard' as Page },
            { title: t.logoGen, desc: isAr ? 'يصمم شعارات دقيقة بصيغة XML/SVG مباشرة، قابلة للتنزيل مع أنماط متجاوبة وتخطيطات شفافة.' : 'Crafts real vector-precision XML/SVG logo marks directly, fully downloadable with responsive styles and optional transparent layouts.', icon: <Star className="w-6 h-6" />, targetPage: 'dashboard' as Page },
            { title: t.sloganGen, desc: isAr ? 'يخلق خيارات متعددة لشعارات تسويقية لا تُنسى وعبارات جذابة تتماشى مع النبرة العاطفية للعلامة.' : 'Creates multiple options of memorable marketing slogans and catchy taglines aligned with emotional tone profiles.', icon: <MessageSquare className="w-6 h-6" />, targetPage: 'dashboard' as Page },
            { title: t.brandKit, desc: isAr ? 'ينشئ طباعة كاملة ولوحات ألوان سداسية عشرية مخصصة تعكس النمط الأساسي لعلامتك التجارية.' : 'Generates full typography and custom hexadecimal color swatches reflecting your brand archetype.', icon: <PaletteIcon className="w-6 h-6" />, targetPage: 'dashboard' as Page },
            { title: isAr ? 'أصول منصات التواصل الاجتماعي' : 'Social Media Kit Generation', desc: isAr ? 'قم بإنشاء حزمة متناسقة لمنصات التواصل الاجتماعي تتضمن الصور الشخصية وصور الغلاف وقوالب المنشورات.' : 'Generate a cohesive social media branding kit including profile pictures, cover photos, and post templates.', icon: <Layout className="w-6 h-6" />, targetPage: 'social-media' as Page },
            { title: isAr ? 'تصدير الحزمة إلى PDF' : 'Brand Kit PDF Export', desc: isAr ? 'قم بتصدير إرشادات الهوية البصرية لعلامتك التجارية بشكل احترافي مباشرة إلى ملف PDF.' : 'Export your complete, professionally formatted brand identity guidelines directly to PDF.', icon: <Download className="w-6 h-6" /> },
            { title: isAr ? 'منشئ لوحات الألوان التفاعلي' : 'Interactive Color Palette Generator', desc: isAr ? 'صمم لوحات ألوان هويتك التجارية التفاعلية بالكامل، اقفل الألوان المفضلة، عاينها مباشرة على قوالب واجهات حية، أو ولد ألوان ملهمة بمساعدة الذكاء الاصطناعي.' : 'Design interactive color schemes. Lock/unlock favorite swatches, fine-tune using precise HSL sliders, generate thematic palettes with AI, and view real-time live mockup UI previews.', icon: <Sparkles className="w-6 h-6" />, targetPage: 'dashboard' as Page },
            { title: isAr ? 'مشاركة الأصول بروابط عامة' : 'Public Brand Asset Sharing', desc: isAr ? 'احصل على روابط ويب عامة فورية لمشاركة الهويات البصرية والشعارات والتصميمات مع العملاء وأعضاء فريق العمل بسهولة.' : 'Generate instant, shareable public showcase web links for your branding guidelines and logo assets to present directly to clients or team members.', icon: <Globe className="w-6 h-6" /> }
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => item.targetPage && setCurrentPage(item.targetPage)}
              className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-3xl flex gap-4 items-start hover:shadow-lg transition-all duration-300 ${item.targetPage ? 'cursor-pointer hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:-translate-y-1 group' : ''}`}
            >
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                {item.icon}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  {item.targetPage && (
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {isAr ? 'جرب الآن ↗' : 'Try Now ↗'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === 'pricing') {
    const isAr = language === 'ar';
    return (
      <div className="space-y-12 animate-fade-in py-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{isAr ? 'نظام الدفع حسب الاستخدام' : 'Pay-As-You-Go Credits'}</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {isAr ? 'شراء رصيد التصميم والهوية' : 'Purchase AI Design Credits'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            {isAr 
              ? 'احصل على رصيد إضافي لتصميم الأسماء، الشعارات، والهويات البصرية الكاملة فوراً. لا توجد اشتراكات متكررة، ورصيدك صالح للأبد دون انتهاء صلاحية!'
              : 'Acquire credits immediately to forge professional brand names, vector logos, slogans, and complete branding kits. No monthly plans, no surprise bills, credits never expire!'}
          </p>
        </div>

        {/* Prominent Double Credits Banner */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 dark:from-amber-600 dark:via-orange-600 dark:to-yellow-600 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-amber-300 dark:border-amber-500 animate-pulse">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="space-y-2 text-center md:text-left flex-1">
            <h3 className="text-2xl md:text-3xl font-display font-black tracking-tight flex items-center justify-center md:justify-start gap-2.5">
              <Coins className="w-8 h-8 text-white drop-shadow-md animate-bounce" />
              <span>{isAr ? 'ضاعف رصيدك الآن!' : 'DOUBLE YOUR CREDITS!'}</span>
            </h3>
            <p className="text-sm md:text-base font-semibold opacity-95 max-w-xl">
              {isAr 
                ? 'في أول عملية شحن لرصيدك، ستحصل على ضعف عدد الـ Credits فوراً! يتم ضرب قيمة أي حزمة رصيد تشتريها بـ 2 تلقائياً!'
                : 'On your first recharge/purchase, you will get DOUBLE the credits instantly! Any package purchased will be multiplied by 2 automatically!'}
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/30 text-center shadow-lg transform hover:scale-105 transition">
            <span className="block text-2xl md:text-3xl font-mono font-black tracking-wider text-yellow-100">X2</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
              {isAr ? 'العرض مفعل تلقائياً' : 'Auto-applied on first buy'}
            </span>
          </div>
        </div>

        {purchaseSuccess && (
          <div className="max-w-md mx-auto bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl text-center text-xs font-semibold shadow-sm animate-pulse">
            {purchaseSuccess}
          </div>
        )}

        {/* Credit Packs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          
          {/* Starter Pack */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl space-y-5 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isAr ? 'حزمة البداية' : 'Starter Pack'}</span>
              <h3 className="text-xl font-display font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-500" />
                <span>100 {t.credits}</span>
              </h3>
              <p className="text-xs text-slate-500">{isAr ? 'مثالي لتجربة المحرك وابتكار أصول سريعة لعلامة واحدة.' : 'Perfect to test the forge and secure single brand ideas.'}</p>
              <div className="py-1">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">$3</span>
                <span className="text-xs text-slate-400 font-mono"> {isAr ? 'دفعة واحدة' : 'one-time payment'}</span>
              </div>
              <ul className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'توليد حتى 50 اسم تجاري' : 'Generate up to 50 names'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'توليد حتى 33 شعار فيكتور' : 'Forge up to 33 vector logos'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'الرصيد صالح للأبد' : 'Credits never expire'}</li>
              </ul>
            </div>
            <button 
              onClick={() => handleBuyPack(100, 3)}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              {isAr ? 'شراء الحزمة' : 'Buy Pack'}
            </button>
          </div>

          {/* Growth Pack */}
          <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 p-6 rounded-3xl space-y-5 relative flex flex-col justify-between shadow-xl shadow-indigo-100 dark:shadow-none hover:shadow-2xl transition">
            <span className="absolute top-4 right-4 bg-indigo-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">
              {isAr ? 'الأكثر طلباً' : 'Best Value'}
            </span>
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{isAr ? 'حزمة النمو' : 'Growth Pack'}</span>
              <h3 className="text-xl font-display font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-500" />
                <span>500 {t.credits}</span>
              </h3>
              <p className="text-xs text-slate-500">{isAr ? 'مثالي للشركات الناشئة ورواد الأعمال لتصميم هوية كاملة.' : 'Highly recommended for launching complete startup identities.'}</p>
              <div className="py-1">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">$12</span>
                <span className="text-xs text-slate-400 font-mono"> {isAr ? 'دفعة واحدة' : 'one-time payment'}</span>
              </div>
              <ul className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'توليد هويات بصرية كاملة' : 'Complete Brand Kit generation'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'تصدير بصيغة SVG عالية الدقة' : 'High-res SVG exports'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'دعم فني ذو أولوية' : 'Priority server bandwidth'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'رصيد لا ينتهي' : 'Credits never expire'}</li>
              </ul>
            </div>
            <button 
              onClick={() => handleBuyPack(500, 12)}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              {isAr ? 'شراء الحزمة الأكثر طلباً' : 'Buy Best Value'}
            </button>
          </div>

          {/* Power Pack */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl space-y-5 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isAr ? 'الحزمة الفائقة' : 'Power Pack'}</span>
              <h3 className="text-xl font-display font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-500" />
                <span>1500 {t.credits}</span>
              </h3>
              <p className="text-xs text-slate-500">{isAr ? 'ممتاز للمطورين والمصممين المستقلين الذين يطلقون علامات متعددة.' : 'Perfect for freelancers & builders launching multiple identities.'}</p>
              <div className="py-1">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">$30</span>
                <span className="text-xs text-slate-400 font-mono"> {isAr ? 'دفعة واحدة' : 'one-time payment'}</span>
              </div>
              <ul className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'توليد حتى 750 اسم تجاري' : 'Generate up to 750 names'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'توليد حتى 500 شعار فيكتور' : 'Forge up to 500 logos'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'سرعة فائقة مخصصة' : 'Blazing fast dedicated queue'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'الرصيد صالح للأبد' : 'Credits never expire'}</li>
              </ul>
            </div>
            <button 
              onClick={() => handleBuyPack(1500, 30)}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 py-3 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              {isAr ? 'شراء الحزمة' : 'Buy Pack'}
            </button>
          </div>

          {/* Enterprise Pack */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl space-y-5 flex flex-col justify-between hover:shadow-lg transition">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isAr ? 'حزمة المؤسسات' : 'Elite Agency Pack'}</span>
              <h3 className="text-xl font-display font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-500" />
                <span>4000 {t.credits}</span>
              </h3>
              <p className="text-xs text-slate-500">{isAr ? 'مخصصة لوكالات التسويق وتصميم العلامات التجارية الكبيرة.' : 'Enterprise-level volume built for agencies & studios.'}</p>
              <div className="py-1">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white">$60</span>
                <span className="text-xs text-slate-400 font-mono"> {isAr ? 'دفعة واحدة' : 'one-time payment'}</span>
              </div>
              <ul className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'حجم رصيد هائل للمشاريع' : 'Bulk credits for high volume'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'توليد بلا حدود للعلامات' : 'Unlimited branding suites'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'دعم فني مخصص 24/7' : '24/7 Priority support lines'}</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> {isAr ? 'صلاحية مدى الحياة' : 'Lifetime validity'}</li>
              </ul>
            </div>
            <button 
              onClick={() => handleBuyPack(4000, 60)}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 py-3 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              {isAr ? 'شراء الحزمة' : 'Buy Pack'}
            </button>
          </div>

        </div>

        {/* Checkout Modal Overlay */}
        {checkoutModal && (
          <CheckoutModal
            isOpen={checkoutModal.isOpen}
            onClose={() => setCheckoutModal(null)}
            onSuccess={checkoutModal.onSuccess}
            itemName={checkoutModal.itemName}
            price={checkoutModal.price}
            language={language}
            userEmail={userEmail}
            userDisplayName={userEmail ? userEmail.split('@')[0] : ''}
          />
        )}
      </div>
    );
  }

  if (page === 'blog') {
    return (
      <div className="space-y-12 animate-fade-in py-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            Brand Forge Insights
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Latest trends in logo graphics, design psychology, and startup branding tips.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogArticles.map((art) => (
            <div key={art.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <img src={art.image} alt={art.titleEn} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                <div className="p-6 space-y-3">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">{art.date} • By {art.author}</span>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg">
                    {language === 'ar' ? art.titleAr : art.titleEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'ar' ? art.excerptAr : art.excerptEn}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850">
                <button className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer">
                  <span>Read Full Article</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === 'faq') {
    const isAr = language === 'ar';
    
    const faqList = isAr ? [
      { 
        q: 'كيف يعمل نظام النقاط (الرصيد) في BrandForge AI؟', 
        a: 'كل اسم شركة تولده يستهلك نقطتين (2)، والشعارات تستهلك نقطة واحدة (1)، والدليل التجاري 4 نقاط، وتوليد الشعارات الرسومية بصيغة SVG يستهلك 3 نقاط. يتم تجديد الرصيد شهرياً تلقائياً حسب باقة اشتراكك.' 
      },
      { 
        q: 'هل أمتلك كامل حقوق الملكية الفكرية للشعارات المولدة؟', 
        a: 'نعم تماماً! جميع أكواد SVG وتصاميم الشعارات المبتكرة التي تولدها تصبح ملكاً لك بنسبة 100%. يمكنك تسجيل علاماتك التجارية والترويج لها واستخدامها تجارياً دون أي قيود أو رسوم ملكية إضافية.' 
      },
      { 
        q: 'هل يمكنني تحميل الشعارات بخلفية شفافة عالية الجودة؟', 
        a: 'بالتأكيد. يتيح لك محرك الشعارات لدينا تحميل ملفات متجهات SVG نقية (والتي يمكن تكبيرها لأي حجم دون فقدان الجودة) بالإضافة إلى صور PNG شفافة وخلفيات ملونة بضغطة زر واحدة.' 
      },
      { 
        q: 'هل هناك سياسة لاسترداد الأموال للرصيد المشترى؟', 
        a: 'نظراً لأن تكاليف تشغيل ومعالجة الذكاء الاصطناعي تُستهلك بشكل فوري عند تقديم الطلب، فإننا لا نُصدر مبالغ مستردة للأرصدة المستهلكة، ولكن يمكنك إلغاء أو تغيير باقة اشتراكك في أي وقت تريده.' 
      }
    ] : [
      { 
        q: 'How do credits work in BrandForge AI?', 
        a: 'Every generated business name costs 2 credits, slogans cost 1 credit, brand guidelines cost 4 credits, and vector logo generation costs 3 credits. Credits reset monthly based on your subscription.' 
      },
      { 
        q: 'Do I own the full intellectual property of generated logos?', 
        a: 'Yes! All SVG codes and logo concepts generated belong 100% to you. You can register trademarks and use them commercially without restriction.' 
      },
      { 
        q: 'Can I download logos with a transparent background?', 
        a: 'Absolutely. The AI Logo Forge lets you download pure XML/SVG vectors as well as rasterized transparent PNGs directly in-browser.' 
      },
      { 
        q: 'Is there a refund policy for credits purchased?', 
        a: 'Since AI processing costs are consumed immediately, we do not issue refunds for generated assets, but you can cancel your subscription at any time.' 
      }
    ];

    return (
      <div className="space-y-12 animate-fade-in py-8 max-w-3xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {isAr ? 'الأسئلة الشائعة والمساعدة' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {isAr 
              ? 'كل ما تحتاج إلى معرفته حول نقاط توليد الذكاء الاصطناعي، وتراخيص شعارات SVG المتجهة، وباقات الاشتراك والدعم الفني.' 
              : 'Everything you need to know about our AI generation credits, SVG logo licensing, and subscription tiers.'}
          </p>
        </div>

        <div className="space-y-5">
          {faqList.map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-2xl space-y-3 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700">
              <h3 className="font-bold text-[15px] text-slate-800 dark:text-white flex gap-3 items-center">
                <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pr-1 pl-1">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    const isAr = language === 'ar';
    const isGuest = !userUid || userUid === 'guest';

    return (
      <div className="space-y-12 animate-fade-in py-8 max-w-xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {isAr ? 'اتصل بالدعم الفني لـ BrandForge' : 'Contact BrandForge Support'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr 
              ? 'أرسل تذكرة دعم وسيتولى مهندسونا مراجعتها والرد عليك خلال 24 ساعة. يتم تسجيل تذكرتك فوراً في قاعدة بيانات Firestore السحابية.' 
              : 'Submit a support ticket and our engineering team will get back to you within 24 hours. Your tickets immediately route to our cloud Firestore database and Admin panel.'}
          </p>
        </div>

        {isGuest ? (
          <div className="bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-500/30 p-8 rounded-3xl shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                {isAr ? 'يجب تسجيل الدخول أولاً للمراسلة' : 'Authentication Required'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                {isAr
                  ? 'لحماية المنصة وضمان وصول الردود والرسائل إلى بريدك الإلكتروني بشكل موثوق، يُرجى تسجيل الدخول أو إنشاء حساب جديد أولاً قبل إرسال الرسالة.'
                  : 'To secure the platform and ensure responses reach your email address reliably, please log in or create an account first before contacting support.'}
              </p>
            </div>
            <button
              onClick={onOpenLogin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-500/20"
            >
              {isAr ? 'تسجيل الدخول / إنشاء حساب جديد' : 'Log In / Sign Up'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {isAr ? 'بريدك الإلكتروني (للمراسلة والرد)' : 'Your Email Address'}
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. email@domain.com"
                className={`w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all ${isAr ? 'text-right' : 'text-left'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {isAr ? 'عنوان الرسالة / الموضوع' : 'Subject'}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isAr ? 'مثال: مشكلة في تحميل الشعار الشفاف' : 'e.g. Credit adjustment inquiry'}
                className={`w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all ${isAr ? 'text-right' : 'text-left'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {isAr ? 'تفاصيل الرسالة أو المشكلة بالتفصيل' : 'Message Description'}
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAr ? 'اكتب رسالتك أو استفسارك هنا بالتفصيل...' : 'Detailed explanation of your request...'}
                rows={5}
                className={`w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري إرسال الرسالة والتحقق...' : 'Sending Message & Verifying...'}</span>
                </>
              ) : (
                <span>{isAr ? 'إرسال التذكرة والمراسلة' : 'Submit Ticket'}</span>
              )}
            </button>

            {ticketSuccess && (
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-xs">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">
                      {isAr ? 'تم إرسال التذكرة وحفظها بنجاح! 🎉' : 'Ticket submitted and saved successfully! 🎉'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {isAr 
                        ? 'تم تسجيل تذكرتك بنجاح في قاعدة بيانات Cloud Firestore السحابية. يمكنك رؤيتها والتحكم بحالتها مباشرة من لوحة تحكم الأدمن (Admin Panel).' 
                        : 'Your support ticket has been recorded in the Firestore cloud database. You can manage and resolve it inside the Admin Dashboard.'}
                    </p>
                  </div>
                </div>

                {!emailWarning && (
                  <div className="flex items-start gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl text-xs">
                    <Mail className="w-4 h-4 mt-0.5 shrink-0 animate-pulse text-indigo-500" />
                    <div>
                      <p className="font-bold">
                        {isAr ? 'تم إرسال البريد التأكيدي بنجاح ✉️' : 'Emails Dispatched successfully ✉️'}
                      </p>
                      <p className="text-[11px] opacity-95 mt-0.5">
                        {isAr 
                          ? 'تم إرسال بريد إلكتروني تأكيدي إليك، وبريد إشعار آخر لمدير النظام لتنبيهه. 💡 يرجى تفقد صندوق البريد العشوائي (Spam/Junk) إذا لم تجد الرسالة في صندوق الوارد الرئيسي.' 
                          : 'A confirmation email was dispatched to your inbox, and an alert email was sent to the system administrator. 💡 Please check your Spam/Junk folder if you do not see it in your primary inbox.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {ticketSuccess && emailWarning && (
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-xs mt-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0 animate-pulse text-amber-500" />
                <div>
                  <p className="font-bold">
                    {isAr ? 'تنبيه: تعذر إرسال البريد الإلكتروني الحقيقي' : 'Notice: Real email could not be delivered'}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isAr 
                      ? `التذكرة حُفظت بنجاح في لوحة الأدمن، ولكن خادم البريد (SMTP) رفض الإرسال. السبب: (${submitError || 'خطأ غير معروف في خادم SMTP'}).` 
                      : `Ticket saved to Admin Panel, but real SMTP dispatch failed. Reason: (${submitError || 'SMTP rejection'}).`}
                  </p>
                  <p className="text-[11px] font-medium mt-1">
                    {isAr 
                      ? '💡 لحل هذه المشكلة: تأكد من إضافة بيانات خادم الـ SMTP الخاص بك بشكل صحيح كمتغيرات بيئية (Environment Variables) في لوحة تحكم Render أو الاستضافة الخاصة بك.' 
                      : '💡 To fix this: Make sure your own custom SMTP credentials (SMTP_USER, SMTP_PASS, SMTP_HOST) are set as Environment Variables in Render or your hosting provider.'}
                  </p>
                </div>
              </div>
            )}

            {!ticketSuccess && submitError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-xs mt-2">
                <X className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                <div>
                  <p className="font-bold">
                    {isAr ? 'فشل الإرسال بالكامل' : 'Submission failed completely'}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isAr ? `تعذر معالجة طلبك وحفظه. تفاصيل الخطأ: ${submitError}` : `Error details: ${submitError}`}
                  </p>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    );
  }

  // Terms and Privacy fallback
  const isAr = language === 'ar';
  
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8 animate-fade-in text-slate-700 dark:text-slate-350" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-3">
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-5">
          {page === 'terms' 
            ? (isAr ? 'شروط الخدمة والاستخدام' : 'Terms of Service') 
            : (isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy')
          }
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span>{isAr ? 'آخر تحديث: ١٣ يوليو ٢٠٢٦' : 'Last updated: July 13, 2026'}</span>
          <span>•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{isAr ? 'رسمي ومعتمد' : 'Official & Certified'}</span>
        </div>
      </div>
      
      {page === 'terms' ? (
        <div className="space-y-8 text-sm sm:text-[15px] leading-relaxed">
          <div className="p-6 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 rounded-2xl">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {isAr 
                ? 'أهلاً بك في منصة BrandForge AI. باستخدامك لخدماتنا وموقعنا، فإنك توافق تماماً وبشكل ملزم على الالتزام بشروط الترخيص التجاري وضوابط استهلاك الرصيد وقواعد الاستخدام القياسية التالية.'
                : 'Welcome to BrandForge AI. By accessing or using our services and website, you fully and legally agree to comply with our commercial licensing, credit consumption constraints, and standard usage rules detailed below.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">1</span>
              <span>{isAr ? 'الترخيص التجاري والاستخدام' : 'Commercial Licensing & Utilization'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 pr-1 pl-1">
              {isAr 
                ? 'جميع الشعارات التي يتم توليدها بصيغة المتجهات الحديثة (SVG markup)، والشعارات التسويقية المبتكرة، وأفكار أسماء الشركات التي توفرها المنصة هي ملك لك بالكامل وبنسبة 100% وخالية من أي رسوم ملكية فكرية للاستخدام التجاري الشخصي والمؤسسي.'
                : 'All brand logos generated in modern vector format (SVG markup), creative marketing slogans, and startup name suggestions provided by the platform are 100% owned by you and entirely royalty-free for personal or corporate commercial utilization.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">2</span>
              <span>{isAr ? 'نظام استهلاك وتعبئة الرصيد' : 'Credit Consumption & Billing'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 pr-1 pl-1">
              {isAr 
                ? 'عمليات التوليد باستخدام الذكاء الاصطناعي تستهلك رصيد حسابك بشكل فوري. نظراً للتكاليف التشغيلية الفورية لتوليد الأصول، فإن جميع عمليات شراء الأرصدة والاشتراكات غير قابلة للاسترداد المالي، ولكن يمكنك إلغاء اشتراكك أو ترقيته في أي وقت.'
                : 'All AI generations consume system credits instantly. Due to the immediate operational cost of AI processing, credit purchases and subscription payments are non-refundable. However, you can upgrade, downgrade, or cancel your active subscription plan at any time.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold">3</span>
              <span>{isAr ? 'أمن وسلامة المنصة الإلكترونية' : 'Platform Security & Asset Protection'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 pr-1 pl-1">
              {isAr 
                ? 'استخدام المنصة يقتضي الالتزام الصارم بضوابط مكافحة التعدين البرمجي. لا يُسمح بأي حال من الأحوال بمشاركة بيانات حسابك السري، أو توظيف برمجيات آلية (Scrapers/Bots) لنسخ وسحب وتعدين تصاميم وأصول BrandForge.'
                : 'Access to the platform requires strict compliance with anti-scraping controls. Under no circumstance may credentials or user profiles be shared, nor may automated bots or scripts be deployed to mine or scrape BrandForge\'s visual assets.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-sm sm:text-[15px] leading-relaxed">
          <div className="p-6 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/20 rounded-2xl">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {isAr 
                ? 'في BrandForge AI، نضع خصوصية وحماية بياناتك وتصاميمك التي تبتكرها في مقدمة أولوياتنا. نوضح هنا كيفية جمعنا ومعالجتنا لبياناتك الشخصية وتخزينها الآمن.'
                : 'At BrandForge AI, protecting your personal details, secure design assets, and generated brand histories is our highest priority. This policy outlines how we responsibly collect, process, and secure your information.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">1</span>
              <span>{isAr ? 'البيانات التي نجمعها بشكل آمن' : 'Information We Securely Collect'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 pr-1 pl-1">
              {isAr 
                ? 'نقوم بجمع البيانات الأساسية لتشغيل حسابك فقط، وتشمل الاسم والبريد الإلكتروني لتوثيق ملكية حسابك، بالإضافة إلى سجل عمليات التوليد السابقة لنعرضها لك في لوحة التحكم وتسهيل تحميلها.'
                : 'We collect only essential information required to run your profile. This includes your registered email, display name, and the history of your generated logo marks and brand assets to provide cloud storage access and redownloads.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">2</span>
              <span>{isAr ? 'التخزين السحابي الآمن ونظام التشفير' : 'Cloud Storage & Encryption Standards'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 pr-1 pl-1">
              {isAr 
                ? 'تُحفظ جميع بياناتك وتصاميمك ومجموعاتك الشخصية بشكل مشفر وآمن تماماً في قاعدة بيانات Cloud Firestore السحابية المحمية بقواعد أمان صارمة. لا نبيع ولا نُشارك معلوماتك أو تصاميمك الشخصية مع أي جهات خارجية.'
                : 'All user data, generated vector codes, and custom palettes are saved with high-grade cloud encryption within Firestore databases. Guarded by robust security parameters, your personal details or brand assets are never sold or shared with third-party networks.'}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">3</span>
              <span>{isAr ? 'أمن بطاقات الائتمان والدفع' : 'Payment Data & Sandbox Protection'}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 pr-1 pl-1">
              {isAr 
                ? 'معالجة المدفوعات تتم بكامل الحماية عبر بوابة Stripe الآمنة المعتمدة. لا نقوم بحفظ أو استلام أو معالجة أي بيانات خاصة ببطاقاتك الائتمانية على خوادمنا الشخصية، مما يضمن أماناً مالياً مطلقاً.'
                : 'All transactions are proxied safely via Stripe. We do not store, access, or process your credit card numbers or financial passwords on our own servers. Your transaction safety is 100% handled on certified bank-grade secure channels.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple PaletteIcon because we deleted custom SVG policy
function PaletteIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.01445 19.1559 5.09238 19.2338 5.15218 19.3271C5.30251 19.5617 5.30251 19.8643 5.15218 20.0989C5.09238 20.1922 5.01445 20.2701 4.85857 20.426C4.42651 20.8581 4.42651 21.5587 4.85857 21.9908C4.94522 22.0774 5.06214 22 5.18434 22H12Z" />
      <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
      <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
