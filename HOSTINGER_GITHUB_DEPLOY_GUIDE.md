# BrandForge AI - Hostinger & GitHub Pages Deployment Guide
# دليل نشر BrandForge AI على Hostinger و GitHub Pages

Since you requested the application to work directly on static environments such as **GitHub Pages** or **Hostinger (Single Web Hosting Plan)**, we have completely upgraded the application with a high-performance **Client-Side Direct Mode**.

بناءً على طلبك لتشغيل التطبيق مباشرة على بيئات الاستضافة الثابتة (Static) مثل **GitHub Pages** أو **استضافة Hostinger (خطة Single Web Hosting)**، قمنا بترقية التطبيق بالكامل وإضافة **وضع التشغيل المباشر من المتصفح (Client-Side Direct Mode)**.

---

## 🚀 How It Works / كيف يعمل النظام الجديد

1. **Static Hosting Compatibility / التوافق مع الاستضافات الثابتة:**
   Hostinger Single Web Hosting and GitHub Pages only serve HTML, CSS, and JS. They do not run a Node.js/Express backend. Our update makes the entire application run purely in the user's browser.
   
   استضافة Hostinger Single Web Hosting و GitHub Pages تقدم ملفات HTML و CSS و JS فقط، ولا تشغل خادم Node.js/Express خلفي. تحديثنا الجديد يجعل التطبيق بالكامل يعمل داخل متصفح المستخدم مباشرة.

2. **Secure Client-Side Gemini SDK / تشغيل الذكاء الاصطناعي من المتصفح:**
   When you click the **"Gemini API Key" (مفتاح Gemini API)** button in the top navigation bar, you can insert your own free API Key from Google AI Studio. 
   - All AI models (Name generation, SVGs logos, slogans, palette calculation, and comparison) will run directly inside your client browser.
   - Your key is kept secure in local storage and is never shared with any third party.
   - **Credits are completely free and infinite!**

   عند الضغط على زر **"مفتاح Gemini API"** في شريط التنقل العلوي، يمكنك إدخال مفتاح API المجاني الخاص بك من Google AI Studio.
   - جميع عمليات التوليد بالذكاء الاصطناعي (توليد الأسماء، شعارات SVG، العبارات، لوحة الألوان والتحليل) ستعمل مباشرة داخل متصفحك.
   - المفتاح الخاص بك يتم حفظه بأمان في المتصفح ولا يتم مشاركته مع أي طرف ثالث.
   - **الرصيد أصبح مجانياً وغير محدود تماماً!**

---

## 🛠️ Step-by-Step Deployment / خطوات النشر بالتفصيل

### Option A: Hosting on Hostinger / الخيار أ: الاستضافة على Hostinger

1. **Build the Static Assets / بناء الملفات الثابتة:**
   Make sure you have run the build command to generate the output files:
   ```bash
   npm run build
   ```
   This compiles all static code inside the `dist` folder.

   تأكد من تشغيل أمر البناء لتوليد الملفات النهائية:
   ```bash
   npm run build
   ```
   سيقوم هذا بتجميع الكود بالكامل داخل مجلد `dist`.

2. **Upload to Hostinger File Manager / الرفع إلى مدير ملفات Hostinger:**
   - Log into your Hostinger hPanel.
   - Open **File Manager** for your domain.
   - Navigate to the `public_html` directory.
   - Drag and drop **all files inside the `dist` folder** directly into `public_html` (do not upload the `dist` folder itself, upload the *contents* of it: `index.html`, `assets/`, etc.).

   - سجل الدخول إلى لوحة التحكم hPanel في Hostinger.
   - افتح **مدير الملفات (File Manager)** الخاص بنطاقك.
   - انتقل إلى مجلد `public_html`.
   - قم بسحب وإفلات **جميع الملفات الموجودة داخل مجلد `dist`** مباشرة في `public_html` (لا ترفع مجلد `dist` نفسه، بل ارفع محتوياته: ملف `index.html` ومجلد `assets` وغيرها).

3. **Open the Site / افتح موقعك:**
   Your site is now live! Simply click the key button in the header and enter your Gemini API key to start generating.

   موقعك الآن جاهز للعمل! ما عليك سوى الضغط على زر المفتاح في الأعلى وإدخال مفتاح Gemini API لبدء التوليد فوراً.

---

### Option B: Hosting on GitHub Pages / الخيار ب: الاستضافة على GitHub Pages

1. **Create a GitHub Repository / إنشاء مستودع GitHub:**
   - Create a new public repository on GitHub.
   - Push your code to the repository.

   - قم بإنشاء مستودع عام (Public Repository) جديد على حسابك في GitHub.
   - ارفع كود المشروع إليه.

2. **Configure GitHub Pages / إعداد GitHub Pages:**
   - Go to your repository **Settings** tab.
   - Select **Pages** from the left-side menu.
   - Under **Build and deployment**, set the source to **GitHub Actions** or deploy from a branch (e.g., `gh-pages` or `main` utilizing a standard static build action).
   - Alternatively, you can use the simple `gh-pages` npm package:
     ```bash
     npm install -g gh-pages
     npm run build
     gh-pages -d dist
     ```

   - اذهب إلى تبويب **الإعدادات (Settings)** في مستودعك على GitHub.
   - اختر **Pages** من القائمة الجانبية اليسرى.
   - تحت قسم **Build and deployment**، اضبط المصدر على **GitHub Actions** أو النشر من فرع (مثل فرع `gh-pages` أو `main`).
   - بدلاً من ذلك، يمكنك استخدام حزمة النشر البسيطة بـ 1 كليك:
     ```bash
     npm run build
     npx gh-pages -d dist
     ```

---

## 🔑 How to Get a Free Gemini API Key / كيف تحصل على مفتاح API مجاني

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **"Get API Key"** (الحصول على مفتاح API).
3. Click **"Create API Key"** (إنشاء مفتاح جديد).
4. Copy the generated key (starts with `AIzaSy...`) and paste it into the BrandForge top navigation bar!

1. قم بزيارة موقع [Google AI Studio](https://aistudio.google.com/).
2. اضغط على **"Get API Key"**.
3. اضغط على **"Create API Key"**.
4. انسخ المفتاح المتولد (الذي يبدأ بـ `AIzaSy...`) وضعه في شريط التنقل العلوي لتطبيقك!
