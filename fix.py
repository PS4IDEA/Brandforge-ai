with open('src/components/BlogFAQPages.tsx', 'r') as f:
    content = f.read()

good_content = content.replace("""      date:  if (page === 'features') {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: t.nameGen, desc: isAr ? 'ينشئ ما يصل إلى 10 نماذج أسماء تجارية مطابقة لمعايير الصناعة والبلدان المستهدفة.' : 'Generates up to 10 contextual business name models matching standard industry parameters and target countries.', icon: <Award className="w-6 h-6" /> },
            { title: t.logoGen, desc: isAr ? 'يصمم شعارات دقيقة بصيغة XML/SVG مباشرة، قابلة للتنزيل مع أنماط متجاوبة وتخطيطات شفافة.' : 'Crafts real vector-precision XML/SVG logo marks directly, fully downloadable with responsive styles and optional transparent layouts.', icon: <Star className="w-6 h-6" /> },
            { title: t.sloganGen, desc: isAr ? 'يخلق خيارات متعددة لشعارات تسويقية لا تُنسى وعبارات جذابة تتماشى مع النبرة العاطفية للعلامة.' : 'Creates multiple options of memorable marketing slogans and catchy taglines aligned with emotional tone profiles.', icon: <MessageSquare className="w-6 h-6" /> },
            { title: t.brandKit, desc: isAr ? 'ينشئ طباعة كاملة ولوحات ألوان سداسية عشرية مخصصة تعكس النمط الأساسي لعلامتك التجارية.' : 'Generates full typography and custom hexadecimal color swatches reflecting your brand archetype.', icon: <PaletteIcon className="w-6 h-6" /> },
            { title: isAr ? 'التحقق من توفر النطاق (Domain)' : 'Domain Availability Check', desc: isAr ? 'تحقق على الفور من توفر أسماء النطاقات المقترحة مباشرة ضمن نتائج التوليد.' : 'Instantly check the availability of suggested domain names right within the generation results.', icon: <Globe className="w-6 h-6" /> },
            { title: isAr ? 'أصول منصات التواصل الاجتماعي' : 'Social Media Kit Generation', desc: isAr ? 'قم بإنشاء حزمة متناسقة لمنصات التواصل الاجتماعي تتضمن الصور الشخصية وصور الغلاف وقوالب المنشورات.' : 'Generate a cohesive social media branding kit including profile pictures, cover photos, and post templates.', icon: <Layout className="w-6 h-6" /> },
            { title: isAr ? 'تصدير الحزمة إلى PDF' : 'Brand Kit PDF Export', desc: isAr ? 'قم بتصدير إرشادات الهوية البصرية لعلامتك التجارية بشكل احترافي مباشرة إلى ملف PDF.' : 'Export your complete, professionally formatted brand identity guidelines directly to PDF.', icon: <Download className="w-6 h-6" /> }
          ].map((item, idx) => (sted domain names right within the generation results.', icon: <Globe className="w-6 h-6" /> },
            { title: 'Social Media Kit Generation', desc: 'Generate a cohesive social media branding kit including profile pictures, cover photos, and post templates.', icon: <Layout className="w-6 h-6" /> },
            { title: 'Brand Kit PDF Export', desc: 'Export your complete, professionally formatted brand identity guidelines directly to PDF.', icon: <Download className="w-6 h-6" /> }
          ].map((item, idx) => (""", """      date: '2026-06-25',
      image: 'https://picsum.photos/seed/colors/600/400',
      author: 'Marcus Vance'
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !contactEmail.trim()) return;

    onSubmitTicket({
      userId: userUid || 'guest',
      userEmail: contactEmail,
      subject,
      message,
    });

    setSubject('');
    setMessage('');
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 4000);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: t.nameGen, desc: isAr ? 'ينشئ ما يصل إلى 10 نماذج أسماء تجارية مطابقة لمعايير الصناعة والبلدان المستهدفة.' : 'Generates up to 10 contextual business name models matching standard industry parameters and target countries.', icon: <Award className="w-6 h-6" /> },
            { title: t.logoGen, desc: isAr ? 'يصمم شعارات دقيقة بصيغة XML/SVG مباشرة، قابلة للتنزيل مع أنماط متجاوبة وتخطيطات شفافة.' : 'Crafts real vector-precision XML/SVG logo marks directly, fully downloadable with responsive styles and optional transparent layouts.', icon: <Star className="w-6 h-6" /> },
            { title: t.sloganGen, desc: isAr ? 'يخلق خيارات متعددة لشعارات تسويقية لا تُنسى وعبارات جذابة تتماشى مع النبرة العاطفية للعلامة.' : 'Creates multiple options of memorable marketing slogans and catchy taglines aligned with emotional tone profiles.', icon: <MessageSquare className="w-6 h-6" /> },
            { title: t.brandKit, desc: isAr ? 'ينشئ طباعة كاملة ولوحات ألوان سداسية عشرية مخصصة تعكس النمط الأساسي لعلامتك التجارية.' : 'Generates full typography and custom hexadecimal color swatches reflecting your brand archetype.', icon: <PaletteIcon className="w-6 h-6" /> },
            { title: isAr ? 'التحقق من توفر النطاق (Domain)' : 'Domain Availability Check', desc: isAr ? 'تحقق على الفور من توفر أسماء النطاقات المقترحة مباشرة ضمن نتائج التوليد.' : 'Instantly check the availability of suggested domain names right within the generation results.', icon: <Globe className="w-6 h-6" /> },
            { title: isAr ? 'أصول منصات التواصل الاجتماعي' : 'Social Media Kit Generation', desc: isAr ? 'قم بإنشاء حزمة متناسقة لمنصات التواصل الاجتماعي تتضمن الصور الشخصية وصور الغلاف وقوالب المنشورات.' : 'Generate a cohesive social media branding kit including profile pictures, cover photos, and post templates.', icon: <Layout className="w-6 h-6" /> },
            { title: isAr ? 'تصدير الحزمة إلى PDF' : 'Brand Kit PDF Export', desc: isAr ? 'قم بتصدير إرشادات الهوية البصرية لعلامتك التجارية بشكل احترافي مباشرة إلى ملف PDF.' : 'Export your complete, professionally formatted brand identity guidelines directly to PDF.', icon: <Download className="w-6 h-6" /> }
          ].map((item, idx) => (""")

with open('src/components/BlogFAQPages.tsx', 'w') as f:
    f.write(good_content)
