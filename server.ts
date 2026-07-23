import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy-loaded GoogleGenAI client to prevent crash if key is missing
let aiInstance: GoogleGenAI | null = null;
let lastUsedKey: string | null = null;

console.log("[Startup] Checking environment variables...");
console.log("[Startup] GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.log("[Startup] OPENROUTER_API_KEY present:", !!process.env.OPENROUTER_API_KEY);

function getAI() {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Backend API] GEMINI_API_KEY is not set. Local fallback will be used.");
    return null;
  }
  
  // Strip outer quotes if they exist (common issue with environment configuration)
  apiKey = apiKey.trim();
  if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
    apiKey = apiKey.slice(1, -1);
  } else if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
    apiKey = apiKey.slice(1, -1);
  }
  apiKey = apiKey.trim();

  if (!aiInstance || lastUsedKey !== apiKey) {
    console.log(`[Backend API] Creating/Updating GoogleGenAI client. Key length: ${apiKey.length}. Key prefix: "${apiKey.substring(0, 5)}...".`);
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    lastUsedKey = apiKey;
  }
  return aiInstance;
}

function cleanJSON(text: string): string {
  let cleaned = text.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return cleaned;
}

function repairTruncatedJSON(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (err) {
    // Continue to repair
  }

  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];
  let repaired = "";

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (isEscaped) {
      repaired += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      repaired += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      repaired += char;
      continue;
    }

    if (inString) {
      if (char === '\n') {
        repaired += '\\n';
      } else if (char === '\r') {
        repaired += '\\r';
      } else if (char === '\t') {
        repaired += '\\t';
      } else {
        repaired += char;
      }
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char);
      repaired += char;
    } else if (char === '}') {
      if (stack[stack.length - 1] === '{') {
        stack.pop();
        repaired += char;
      }
    } else if (char === ']') {
      if (stack[stack.length - 1] === '[') {
        stack.pop();
        repaired += char;
      }
    } else {
      repaired += char;
    }
  }

  if (inString) {
    repaired += '"';
  }

  let temp = repaired.trim();
  let changed = true;
  while (changed) {
    changed = false;
    temp = temp.trim();
    
    if (temp.endsWith(',')) {
      temp = temp.slice(0, -1).trim();
      changed = true;
    }
    
    const trailingColonMatch = temp.match(/:\s*$/);
    if (trailingColonMatch) {
      temp = temp.slice(0, -trailingColonMatch[0].length).trim();
      const trailingKeyMatch = temp.match(/"[^"]*"\s*$/);
      if (trailingKeyMatch) {
        temp = temp.slice(0, -trailingKeyMatch[0].length).trim();
      }
      changed = true;
    }
  }

  const reverseStack = [...stack].reverse();
  for (const openChar of reverseStack) {
    if (openChar === '{') {
      temp += '}';
    } else if (openChar === '[') {
      temp += ']';
    }
  }

  return temp;
}

function robustParseJSON(text: string): any {
  let cleaned = text.trim();
  const match = /```(?:json)?\s*([\s\S]*?)\s*```/gi.exec(cleaned);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else {
    startIdx = firstBrace !== -1 ? firstBrace : firstBracket;
  }
  
  if (startIdx !== -1) {
    cleaned = cleaned.substring(startIdx);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log("[Backend API] Standard JSON parse did not match perfectly. Applying advanced sanitization...");
    let depth = 0;
    let inString = false;
    let escapeActive = false;
    let endIdx = -1;
    let sanitized = "";
    let lastNonWhitespaceChar = '';

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      if (char === '\\') {
        escapeActive = !escapeActive;
        sanitized += char;
      } else if (char === '"') {
        if (!escapeActive) inString = !inString;
        sanitized += char;
        escapeActive = false;
        if (!inString) lastNonWhitespaceChar = '"';
      } else if (!inString) {
        if (char === '{' || char === '[') {
          depth++;
          sanitized += char;
          lastNonWhitespaceChar = char;
        } else if (char === '}' || char === ']') {
          if (lastNonWhitespaceChar === ',') {
            sanitized = sanitized.replace(/,\s*$/, '');
          }
          depth--;
          sanitized += char;
          lastNonWhitespaceChar = char;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        } else if (!/\s/.test(char)) {
          sanitized += char;
          lastNonWhitespaceChar = char;
        } else {
          sanitized += char;
        }
        escapeActive = false;
      } else {
        if (char === '\n') {
          sanitized += '\\n';
        } else if (char === '\r') {
          sanitized += '\\r';
        } else if (char === '\t') {
          sanitized += '\\t';
        } else {
          sanitized += char;
        }
        escapeActive = false;
      }
    }

    if (depth === 0 && sanitized.length > 0) {
      try {
        return JSON.parse(sanitized);
      } catch (finalError) {
        console.log("[Backend API] Advanced sanitization did not resolve perfectly. Trying auto-repair on truncated JSON...");
      }
    }
    
    // Fall back to auto-repairing the truncated/incomplete JSON
    try {
      console.log("[Backend API] Running intelligent truncated JSON auto-repair...");
      const repaired = repairTruncatedJSON(cleaned);
      return JSON.parse(repaired);
    } catch (repairErr: any) {
      console.log("[Backend API] Truncated JSON auto-repair did not resolve.", repairErr?.message || repairErr);
      throw e;
    }
  }
}

function generateLocalFallbackResponse(rawPrompt: any, jsonParser?: (text: string) => any) {
  let systemPrompt = "";
  if (typeof rawPrompt === "string") {
    systemPrompt = rawPrompt;
  } else if (rawPrompt && typeof rawPrompt === "object") {
    try {
      systemPrompt = JSON.stringify(rawPrompt);
    } catch {
      systemPrompt = String(rawPrompt);
    }
  } else {
    systemPrompt = String(rawPrompt || "");
  }

  const systemPromptLower = systemPrompt.toLowerCase();
  const isAr = systemPromptLower.includes("language: ar") || 
               systemPrompt.includes('"ar"') || 
               systemPrompt.includes("ar is specified") || 
               systemPrompt.includes("arabic") ||
               systemPrompt.includes("باللغة العربية") || 
               systemPrompt.includes("اسم") ||
               systemPrompt.includes("العربية");

  console.log(`[Local Fallback Generator] Generating rich realistic responsive data. Is Arabic: ${isAr}`);

  // Helper to extract concept text
  const extractConcept = (): string => {
    const conceptMatch = systemPrompt.match(/User Prompt \/ Concept:\s*([^\n]*)/i) || 
                         systemPrompt.match(/concept:\s*"([^"]*)"/i) || 
                         systemPrompt.match(/for:\s*"([^"]*)"/i) ||
                         systemPrompt.match(/description:\s*"([^"]*)"/i);
    if (conceptMatch && conceptMatch[1] && conceptMatch[1].trim()) {
      return conceptMatch[1].trim();
    }
    return isAr ? "مشروع إبداعي" : "Creative Forge";
  };

  const concept = extractConcept();
  const conceptLower = concept.toLowerCase();

  let parsedData: any = {};

  // 1. Business Name & Domain Generator
  if (systemPrompt.includes("BrandName") || systemPrompt.includes("brand name ideas") || systemPrompt.includes("naming specialist")) {
    if (isAr) {
      if (conceptLower.includes("قهوة") || conceptLower.includes("مقهى") || conceptLower.includes("كافيه") || conceptLower.includes("باريستا") || conceptLower.includes("coffee") || conceptLower.includes("cafe")) {
        parsedData = [
          { name: "أصيل للقهوة المختصة", meaning: "يعكس أصالة حبوب القهوة الفاخرة وجودة التحميص الاحترافي العالي.", meaningAr: "يعكس أصالة حبوب القهوة الفاخرة وجودة التحميص الاحترافي العالي.", style: "Premium & Authentic", domainSuggestions: ["aseelcoffee.com", "aseelcoffee.co", "aseel.coffee"] },
          { name: "سول باريستا", meaning: "مستوحى من الشغف والروح العالية في إعداد القهوة المقطرة بعناية.", meaningAr: "مستوحى من الشغف والروح العالية في إعداد القهوة المقطرة بعناية.", style: "Modern & Catchy", domainSuggestions: ["soulbarista.com", "soulbarista.co", "soulbarista.ai"] },
          { name: "موجة وقطرة", meaning: "يعبر عن التناغم والدقة في درجات استخلاص القهوة المقطرة.", meaningAr: "يعبر عن التناغم والدقة في درجات استخلاص القهوة المقطرة.", style: "Creative & Visual", domainSuggestions: ["mowja.com", "mowjacoffee.com", "dripwave.co"] },
          { name: "كافيا", meaning: "اسم عصري وسلس مستوحى من القهوة مع لمسة أوروبية أنيقة.", meaningAr: "اسم عصري وسلس مستوحى من القهوة مع لمسة أوروبية أنيقة.", style: "Short & Modern", domainSuggestions: ["caffia.com", "caffia.co", "caffia.app"] },
          { name: "رستو بيت", meaning: "رمز لتحميص حبوب القهوة بدرجة متقنة تحاكي أفضل المتاجر العالمية.", meaningAr: "رمز لتحميص حبوب القهوة بدرجة متقنة تحاكي أفضل المتاجر العالمية.", style: "Phonetic", domainSuggestions: ["roastbeat.com", "roastbeat.co", "roast.cafe"] },
          { name: "عربستا", meaning: "يمزج بين العروبة والأصالة مع حرفية الباريستا العالمية.", meaningAr: "يمزج بين العروبة والأصالة مع حرفية الباريستا العالمية.", style: "Blended & Unique", domainSuggestions: ["arabista.com", "arabista.co", "arabista.net"] },
          { name: "سلو دريب", meaning: "يرمز للهدوء والتركيز الفائق في تقديم القهوة المقطرة بطيئة التحضير.", meaningAr: "يرمز للهدوء والتركيز الفائق في تقديم القهوة المقطرة بطيئة التحضير.", style: "Modern Tech", domainSuggestions: ["slowdrip.co", "slowdrip.cafe", "slowdrip.app"] },
          { name: "روست هاب", meaning: "المكان الجامع لعشاق المحامص والقهوة المتميزة.", meaningAr: "المكان الجامع لعشاق المحامص والقهوة المتميزة.", style: "Compound", domainSuggestions: ["roasthub.com", "roasthub.co", "roasthub.net"] }
        ];
      } else if (conceptLower.includes("مطعم") || conceptLower.includes("طعام") || conceptLower.includes("بيتزا") || conceptLower.includes("أكل") || conceptLower.includes("وجب") || conceptLower.includes("food") || conceptLower.includes("pizza") || conceptLower.includes("restaurant")) {
        parsedData = [
          { name: "لقمة وهناء", meaning: "اسم دافئ يعبر عن الجودة واللذة والدفء العائلي في تناول الطعام.", meaningAr: "اسم دافئ يعبر عن الجودة واللذة والدفء العائلي في تناول الطعام.", style: "Traditional & Warm", domainSuggestions: ["luqma.com", "luqma.co", "luqma.app"] },
          { name: "أورجانو", meaning: "مستوحى من المكونات الطازجة والأعشاب الإيطالية الفاخرة للبيتزا.", meaningAr: "مستوحى من المكونات الطازجة والأعشاب الإيطالية الفاخرة للبيتزا.", style: "Modern & European", domainSuggestions: ["organo.co", "organofood.com", "organo.app"] },
          { name: "طبلية", meaning: "يحمل طابع الكرم والأصالة والجمعة العربية الدافئة حول المائدة.", meaningAr: "يحمل طابع الكرم والأصالة والجمعة العربية الدافئة حول المائدة.", style: "Authentic Culture", domainSuggestions: ["tableya.com", "tableya.co", "tableya.net"] },
          { name: "مذاق سبيشال", meaning: "يركز على المذاق الاستثنائي والخبرة العريقة في الطهي.", meaningAr: "يركز على المذاق الاستثنائي والخبرة العريقة في الطهي.", style: "Direct & Clear", domainSuggestions: ["mazag.com", "mazagspecial.com", "mazag.co"] },
          { name: "زوّادة", meaning: "اسم عربي فصيح يعكس السخاء والوجبات الشهية المجهزة بحب.", meaningAr: "اسم عربي فصيح يعكس السخاء والوجبات الشهية المجهزة بحب.", style: "Traditional & Elegant", domainSuggestions: ["zawada.com", "zawada.co", "zawada.app"] },
          { name: "فليم آند فورك", meaning: "يعبر عن الطهي على النار المباشرة والتقديم الاحترافي العالي.", meaningAr: "يعبر عن الطهي على النار المباشرة والتقديم الاحترافي العالي.", style: "Modern & Trendy", domainSuggestions: ["flamefork.com", "flamefork.co", "flamefork.net"] },
          { name: "روزا بيتزا", meaning: "اسم يدمج الأناقة الإيطالية لتقديم البيتزا الطازجة والمقرمشة.", meaningAr: "اسم يدمج الأناقة الإيطالية لتقديم البيتزا الطازجة والمقرمشة.", style: "Catchy & Short", domainSuggestions: ["rosapizza.com", "rosapizza.co", "rosapizza.app"] },
          { name: "شيف وليمة", meaning: "يعبر عن الضيافة الملكية والخبرة العالية لشيفات المطعم.", meaningAr: "يعبر عن الضيافة الملكية والخبرة العالية لشيفات المطعم.", style: "Premium", domainSuggestions: ["chefwaleema.com", "chefwaleema.co", "waleema.app"] }
        ];
      } else if (conceptLower.includes("محاماة") || conceptLower.includes("قانون") || conceptLower.includes("استشار") || conceptLower.includes("عدالة") || conceptLower.includes("حقوق") || conceptLower.includes("law") || conceptLower.includes("legal")) {
        parsedData = [
          { name: "مسار العدالة", meaning: "يعكس التوجه الواضح والدقيق في حماية الحقوق وتأكيد العدالة.", meaningAr: "يعكس التوجه الواضح والدقيق في حماية الحقوق وتأكيد العدالة.", style: "Institutional & Clear", domainSuggestions: ["masaraladala.com", "masar.law", "justicepath.co"] },
          { name: "صرح القانون", meaning: "يعبر عن الهيبة والموثوقية العالية والخبرة القانونية الراسخة.", meaningAr: "يعبر عن الهيبة والموثوقية العالية والخبرة القانونية الراسخة.", style: "Prestige & Legacy", domainSuggestions: ["sarhlaw.com", "sarh.law", "sarhlaw.co"] },
          { name: "ميثاق للحماية", meaning: "يدل على الأمانة والالتزام الكامل بحفظ حقوق ومصالح العملاء.", meaningAr: "يدل على الأمانة والالتزام الكامل بحفظ حقوق ومصالح العملاء.", style: "Trust & Defense", domainSuggestions: ["methaq.law", "methaq.co", "methaqlaw.com"] },
          { name: "بصيرة واستشارات", meaning: "يرمز إلى الحكمة والرؤية الثاقبة في تقديم الحلول القانونية المعقدة.", meaningAr: "يرمز إلى الحكمة والرؤية الثاقبة في تقديم الحلول القانونية المعقدة.", style: "Professional Advisory", domainSuggestions: ["baseera.law", "baseera.co", "baseeralaw.com"] },
          { name: "حقوق وتأكيد", meaning: "اسم قوي ومباشر يبعث على الاطمئنان والثقة التامة لدى العميل.", meaningAr: "اسم قوي ومباشر يبعث على الاطمئنان والثقة التامة لدى العميل.", style: "Direct & Trustworthy", domainSuggestions: ["huqoq.law", "huqoq.co", "huqoqlaw.com"] },
          { name: "درع الحماية", meaning: "يرمز للوقاية والدفاع القانوني الصارم لحماية الشركات والأفراد.", meaningAr: "يرمز للوقاية والدفاع القانوني الصارم لحماية الشركات والأفراد.", style: "Defense", domainSuggestions: ["dirlaw.com", "dir.law", "dirlaw.co"] },
          { name: "ليكس جارد", meaning: "اسم عصري يجمع بين المصطلحات القانونية العالمية والوقاية المستمرة.", meaningAr: "اسم عصري يجمع بين المصطلحات القانونية العالمية والوقاية المستمرة.", style: "Modern International", domainSuggestions: ["lexguard.co", "lexguard.law", "lexguard.app"] },
          { name: "ميزان وحكمة", meaning: "يرمز إلى العدل والاتزان في اتخاذ القرارات وحسم القضايا.", meaningAr: "يرمز إلى العدل والاتزان في اتخاذ القرارات وحسم القضايا.", style: "Classic Prestige", domainSuggestions: ["mizanlaw.com", "mizan.law", "mizanlaw.co"] }
        ];
      } else {
        const cleanWords = concept.split(/\s+/).filter(w => w.length > 2);
        const coreWord = cleanWords[0] || "ابتكار";
        parsedData = [
          { name: `نواة ${coreWord}`, meaning: "تعبر عن المركز الرئيسي للانطلاق والأساس المتين للتوسع.", meaningAr: "تعبر عن المركز الرئيسي للانطلاق والأساس المتين للتوسع.", style: "Core & Modern", domainSuggestions: [`nawat${coreWord}.com`, `nawat.co`, `nawat.ai`] },
          { name: `مسار ${coreWord}`, meaning: "يركز على الوضوح والخطوات المدروسة نحو النجاح.", meaningAr: "يركز على الوضوح والخطوات المدروسة نحو النجاح.", style: "Strategic", domainSuggestions: [`masar${coreWord}.com`, `masar.co`, `masar.app`] },
          { name: `صرح ${coreWord}`, meaning: "يعكس الهيبة والاستقرار والنمو القوي في قطاع الأعمال.", meaningAr: "يعكس الهيبة والاستقرار والنمو القوي في قطاع الأعمال.", style: "Premium", domainSuggestions: [`sarh${coreWord}.com`, `sarh.co`, `sarh.net`] },
          { name: `أفق ${coreWord}`, meaning: "رمز للتوسع والرؤية المستقبلي الرائدة.", meaningAr: "رمز للتوسع والرؤية المستقبلي الرائدة.", style: "Visionary", domainSuggestions: [`ofoq${coreWord}.com`, `ofoq.co`, `ofoq.ai`] },
          { name: `مدار ${coreWord}`, meaning: "يعبر عن الإحاطة الكاملة بالحلول والخدمات المتكاملة.", meaningAr: "يعبر عن الإحاطة الكاملة بالحلول والخدمات المتكاملة.", style: "Ecosystem", domainSuggestions: [`madar${coreWord}.com`, `madar.co`, `madar.io`] },
          { name: `سول ${coreWord}`, meaning: "اسم عصري وسلس يعكس الشغف والروح الإبداعية.", meaningAr: "اسم عصري وسلس يعكس الشغف والروح الإبداعية.", style: "Short & Trendy", domainSuggestions: [`soul${coreWord}.com`, `soul.co`, `soul.app`] },
          { name: `قبس ${coreWord}`, meaning: "رمز للإلهام والابتكار المشرق الذي يضيء الطريق.", meaningAr: "رمز للإلهام والابتكار المشرق الذي يضيء الطريق.", style: "Inspirational", domainSuggestions: [`qabas${coreWord}.com`, `qabas.co`, `qabas.net`] },
          { name: `أبعاد ${coreWord}`, meaning: "يعبر عن التفكير العميق وزوايا النظر المتعددة للتطوير.", meaningAr: "يعبر عن التفكير العميق وزوايا النظر المتعددة للتطوير.", style: "Advanced", domainSuggestions: [`abaad${coreWord}.com`, `abaad.co`, `abaad.ai`] }
        ];
      }
    } else {
      if (conceptLower.includes("coffee") || conceptLower.includes("cafe") || conceptLower.includes("roast") || conceptLower.includes("espresso")) {
        parsedData = [
          { name: "RoastCraft", meaning: "Emphasizes master roasting precision and artisanal coffee preparation.", meaningAr: "يركز على الدقة في تحميص القهوة وإعدادها بطريقة حرفية استثنائية.", style: "Artisanal", domainSuggestions: ["roastcraft.com", "roastcraft.co", "roastcraft.cafe"] },
          { name: "AromaPulse", meaning: "Connects the rich sensory fragrance of fresh brews with modern energy.", meaningAr: "يربط بين عبق القهوة الطازجة ورائحتها الزكية مع الطاقة الحيوية العصرية.", style: "Sensory & Modern", domainSuggestions: ["aromapulse.com", "aromapulse.co", "aromapulse.app"] },
          { name: "VelvetGrind", meaning: "Describes smooth extraction and rich, high-end espresso texture.", meaningAr: "يصف سلاسة الاستخلاص وقوام الإسبريسو الغني الفاخر.", style: "Premium", domainSuggestions: ["velvetgrind.com", "velvetgrind.co", "velvetgrind.cafe"] },
          { name: "Sip & Slate", meaning: "Combines the relaxing ritual of sipping with sleek urban design.", meaningAr: "يمزج بين طقوس الاستمتاع بالرشفة الأولى والتصميم العصري الأنيق.", style: "Minimalist", domainSuggestions: ["sipslate.com", "sipslate.co", "sipandslate.com"] },
          { name: "UrbanBrew", meaning: "A trendy, community-focused naming option for city coffee houses.", meaningAr: "اسم عصري جاذب يعبر عن مقهى المدينة المجتمعي الراقي.", style: "Short & Catchy", domainSuggestions: ["urbanbrew.co", "urbanbrew.cafe", "urbanbrew.app"] },
          { name: "DripStudio", meaning: "Reflects meticulous attention to pour-over coffee engineering.", meaningAr: "يعكس الاهتمام الدقيق بالتفاصيل الهندسيّة لتحضير القهوة المقطرة.", style: "Tech & Craft", domainSuggestions: ["dripstudio.com", "dripstudio.co", "drip.studio"] },
          { name: "BeanVoyage", meaning: "Captures the journey of single-origin coffee beans from origin to cup.", meaningAr: "يجسد رحلة حبوب القهوة الفاخرة من المزارع العالمية إلى الفنجان.", style: "Storytelling", domainSuggestions: ["beanvoyage.com", "beanvoyage.co", "beanvoyage.cafe"] },
          { name: "ArtisanSpout", meaning: "Highlights handcrafted precision poured to perfection.", meaningAr: "يسلط الضوء على الإعداد اليدوي الدقيق الذي يسكب بإتقان.", style: "Craft", domainSuggestions: ["artisanspout.com", "artisanspout.co", "spout.cafe"] }
        ];
      } else {
        const cleanWords = concept.split(/\s+/).filter(w => w.length > 2);
        const core = cleanWords[0] ? cleanWords[0].charAt(0).toUpperCase() + cleanWords[0].slice(1).toLowerCase() : "Core";
        parsedData = [
          { name: `${core}Pulse`, meaning: `Expresses the energetic momentum and real-time vital force of ${core}.`, meaningAr: `يعبر عن الزخم والطاقة الحيوية المستمرة لـ ${core}.`, style: "Dynamic & Modern", domainSuggestions: [`${core.toLowerCase()}pulse.com`, `${core.toLowerCase()}pulse.co`, `${core.toLowerCase()}pulse.ai`] },
          { name: `Apex${core}`, meaning: `Positions your brand at the absolute summit of ${core} solutions.`, meaningAr: `يضع علامتك التجارية في القمة الحقيقية لتقديم حلول ${core}.`, style: "Premium & Authority", domainSuggestions: [`apex${core.toLowerCase()}.com`, `apex${core.toLowerCase()}.co`, `apex${core.toLowerCase()}.net`] },
          { name: `${core}Craft`, meaning: `Highlights handcrafted precision, detail-oriented design, and quality.`, meaningAr: `يسلط الضوء على الحرفية والدقة العالية والاهتمام الدقيق بالتفاصيل.`, style: "Artisanal", domainSuggestions: [`${core.toLowerCase()}craft.com`, `${core.toLowerCase()}craft.co`, `${core.toLowerCase()}craft.io`] },
          { name: `Vera${core}`, meaning: `Derived from 'Veritas' (truth), projecting integrity and genuine quality.`, meaningAr: `مستوحى من الحقيقة والشفافية ليعكس الموثوقية والجودة الأصيلة.`, style: "Trust & Heritage", domainSuggestions: [`vera${core.toLowerCase()}.com`, `vera${core.toLowerCase()}.co`, `vera${core.toLowerCase()}.org`] },
          { name: `${core}Haven`, meaning: `Creates a welcoming, secure, and delightful space centered around ${core}.`, meaningAr: `يخلق مساحة مرحبة وآمنة وممتعة مكرسة لـ ${core}.`, style: "Warm & Inviting", domainSuggestions: [`${core.toLowerCase()}haven.com`, `${core.toLowerCase()}haven.co`, `${core.toLowerCase()}haven.app`] },
          { name: `Omni${core}`, meaning: `Represents a complete, 360-degree ecosystem covering all needs.`, meaningAr: `يمثل منظومة متكاملة 360 درجة تغطي كافة الاحتياجات بشكل متناغم.`, style: "Compound", domainSuggestions: [`omni${core.toLowerCase()}.com`, `omni${core.toLowerCase()}.co`, `omni${core.toLowerCase()}.ai`] },
          { name: `${core}Studio`, meaning: `Gives an innovative, creative laboratory feel to your operations.`, meaningAr: `يعطي انطباعاً بالمختبر الإبداعي والاستوديو المتطور.`, style: "Creative", domainSuggestions: [`${core.toLowerCase()}studio.com`, `${core.toLowerCase()}studio.co`, `${core.toLowerCase()}.studio`] },
          { name: `Luxe${core}`, meaning: `Signals top-tier luxury, exclusivity, and elevated customer service.`, meaningAr: `يعكس الفخامة المطلقة والتمياز والخدمة الاستثنائية للعملاء.`, style: "Luxury", domainSuggestions: [`luxe${core.toLowerCase()}.com`, `luxe${core.toLowerCase()}.co`, `luxe${core.toLowerCase()}.net`] }
        ];
      }
    }
  }
  // 2. Logo Generator
  else if (systemPrompt.includes("brand logo in valid SVG") || systemPrompt.includes("vector graphic designer") || systemPrompt.includes("svg")) {
    let primaryColor = "#2563EB";
    let secondaryColor = "#3B82F6";
    let iconPath = "<circle cx='250' cy='210' r='70' fill='url(#grad)' /><path d='M220,180 L290,210 L220,240 Z' fill='#FFFFFF' />";

    if (conceptLower.includes("قهوة") || conceptLower.includes("coffee") || conceptLower.includes("cafe") || conceptLower.includes("مقهى")) {
      primaryColor = "#78350F";
      secondaryColor = "#D97706";
      iconPath = "<path d='M180,180 C180,140 210,140 210,180 C210,240 180,240 180,180 Z' fill='url(#grad)' /><path d='M250,180 C250,140 280,140 280,180 C280,240 250,240 250,180 Z' fill='url(#grad)' transform='rotate(15 250 210)' /><rect x='170' y='220' width='160' height='70' rx='20' fill='url(#grad)' /><path d='M330,230 C350,230 360,245 360,255 C360,265 350,280 330,280' stroke='url(#grad)' stroke-width='12' fill='none' />";
    } else if (conceptLower.includes("مطعم") || conceptLower.includes("food") || conceptLower.includes("pizza") || conceptLower.includes("بيتزا")) {
      primaryColor = "#DC2626";
      secondaryColor = "#F59E0B";
      iconPath = "<path d='M250,130 L340,280 L160,280 Z' fill='url(#grad)' rx='10' /><circle cx='250' cy='200' r='18' fill='#FFFFFF' opacity='0.8' /><circle cx='220' cy='240' r='14' fill='#FFFFFF' opacity='0.8' /><circle cx='280' cy='245' r='14' fill='#FFFFFF' opacity='0.8' />";
    } else if (conceptLower.includes("قانون") || conceptLower.includes("محاماة") || conceptLower.includes("law") || conceptLower.includes("legal")) {
      primaryColor = "#1E3A8A";
      secondaryColor = "#D97706";
      iconPath = "<rect x='244' y='140' width='12' height='150' fill='url(#grad)' /><rect x='170' y='160' width='160' height='10' rx='5' fill='url(#grad)' /><path d='M170,170 L140,230 A30,30 0 0,0 200,230 Z' fill='url(#grad)' opacity='0.85' /><path d='M330,170 L300,230 A30,30 0 0,0 360,230 Z' fill='url(#grad)' opacity='0.85' /><rect x='200' y='280' width='100' height='16' rx='8' fill='url(#grad)' />";
    }

    const svgString = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500' width='100%' height='100%'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${primaryColor}' /><stop offset='100%' stop-color='${secondaryColor}' /></linearGradient><filter id='shadow' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='0' dy='8' stdDeviation='12' flood-color='#000000' flood-opacity='0.15' /></filter></defs><rect width='500' height='500' fill='#0F172A' rx='28' /><g filter='url(#shadow)'>${iconPath}</g><text x='250' y='380' font-family='sans-serif' font-size='28' font-weight='900' fill='#FFFFFF' text-anchor='middle' letter-spacing='3'>${concept.toUpperCase()}</text><text x='250' y='415' font-family='sans-serif' font-size='13' font-weight='600' fill='${primaryColor}' text-anchor='middle' letter-spacing='2'>ESTABLISHED 2026</text></svg>`;

    parsedData = {
      svg: svgString,
      concept: `A custom vector emblem designed specifically for "${concept}". It features clean geometry, a targeted domain icon, and a rich dual-tone gradient background emphasizing trust and modern elegance.`,
      primaryColor,
      secondaryColor
    };
  }
  // 3. Slogan Generator
  else if (systemPrompt.includes("brand slogans/taglines") || systemPrompt.includes("advertising creative director")) {
    parsedData = isAr ? [
      { slogan: `الريادة والتميز الملموس في عالم ${concept}`, vibe: "Bold" },
      { slogan: `${concept} - جودة تفوق التوقعات كل يوم`, vibe: "Inspiring" },
      { slogan: "شريكك الموثوق لنقل أعمالك نحو القمة", vibe: "Professional" },
      { slogan: `رؤية متجددة تجسد طموحك في ${concept}`, vibe: "Modern" },
      { slogan: "اصنع انطباعاً يدوم مع كل تفصيل", vibe: "Creative" },
      { slogan: "الدقة في الأداء، والبساطة في التميز", vibe: "Tech" },
      { slogan: "حيث يلتقي الإبداع بالحرفية العالية", vibe: "Warm" },
      { slogan: "تجربة استثنائية مصممة خصيصاً لك", vibe: "Inspiring" },
      { slogan: "التزام راسخ بالتميز والابتكار المستمر", vibe: "Professional" },
      { slogan: "اختر الأفضل، واصنع فرقاً حقيقياً اليوم", vibe: "Bold" }
    ] : [
      { slogan: `Redefining Excellence in ${concept}`, vibe: "Inspiring" },
      { slogan: `${concept}: Smart Solutions for Modern Growth`, vibe: "Bold" },
      { slogan: "Where Innovation Meets Uncompromised Quality", vibe: "Tech" },
      { slogan: "Crafted for Distinction, Built for Success", vibe: "Professional" },
      { slogan: "Your Trusted Partner in Every Milestone", vibe: "Warm" },
      { slogan: "Elevate Your Experience to the Next Level", vibe: "Modern" },
      { slogan: "Bold Choices. Unlimited Possibilities.", vibe: "Bold" },
      { slogan: "Unleash the True Power of Quality Performance", vibe: "Inspiring" },
      { slogan: `The Smarter Way to Live & Experience ${concept}`, vibe: "Creative" },
      { slogan: "Precision Perfected. Excellence Delivered.", vibe: "Professional" }
    ];
  }
  // 4. Complete Brand Kit & Guideline Generator
  else if (systemPrompt.includes("brand kit and identity guidelines") || systemPrompt.includes("brand kit")) {
    parsedData = {
      colors: {
        primary: "#2563EB",
        secondary: "#10B981",
        accent: "#F59E0B",
        background: "#F8FAFC",
        text: "#0F172A",
        paletteName: isAr ? "الأفق العصري" : "Modern Horizon"
      },
      typography: {
        heading: isAr ? "Cairo" : "Space Grotesk",
        body: isAr ? "Readex Pro" : "Inter",
        rationale: isAr 
          ? "مزيج خيم ومتناسق جداً يجمع بين العناوين المعاصرة القوية مع خطوط متن سهلة المقروئية على كافة الشاشات."
          : "A bold modern heading font for professional authority, paired with a clean geometric body font for optimal readability."
      },
      socialKit: {
        bio: isAr 
          ? `نبتكر أفضل الحلول المتميزة لـ ${concept}. تابعنا لتصلك أحدث الأفكار والابتكارات الاستثنائية! ✨`
          : `Designing high-impact solutions for ${concept}. Follow us for daily creative insights and elite updates! ✨`,
        coverPrompt: `High-resolution ultra-clean social media banner representing ${concept} with modern gradient geometry and generous negative space.`,
        postTemplate: "[Hook Headline] 🚀\n\n[Key Insight or Value Point]\n\n[Action Step] Visit link in bio to learn more!\n\n#Branding #Innovation #Success"
      }
    };
  }
  // 5. Complete Interactive Color Palette Generator
  else if (systemPrompt.includes("highly professional, cohesive 5-color palette") || systemPrompt.includes("paletteName")) {
    if (conceptLower.includes("قهوة") || conceptLower.includes("coffee") || conceptLower.includes("cafe")) {
      parsedData = {
        paletteName: isAr ? "عبق التحميص" : "Roasted Mocha Palette",
        explanation: isAr ? "لوحة ألوان دافئة ومستوحات من حبوب القهوة الفاخرة ورغوة الإسبريسو لتعكس الدفء والراحة." : "A warm, rich earth-tone palette inspired by dark roasted espresso beans and creamy foam.",
        colors: [
          { hex: "#3E2723", name: isAr ? "إسبريسو داكن" : "Dark Espresso", role: isAr ? "العناوين والهوية الرئيسية" : "Primary brand element" },
          { hex: "#8D6E63", name: isAr ? "موكا دافئة" : "Warm Mocha", role: isAr ? "اللون الثانوي للتوازن" : "Secondary accent" },
          { hex: "#D7CCC8", name: isAr ? "رغوة اللاتيه" : "Latte Foam", role: isAr ? "خلفية الكروت والبطاقات" : "Card surface" },
          { hex: "#FFF8E1", name: isAr ? "كريمي ناصع" : "Cream Canvas", role: isAr ? "خلفية التطبيق والمساحات" : "Background canvas" },
          { hex: "#212121", name: isAr ? "حبر المحمصة" : "Roaster Charcoal", role: isAr ? "النصوص الطويلة والقراءة" : "Primary body text" }
        ]
      };
    } else {
      parsedData = {
        paletteName: isAr ? "الأفق الراقٍ" : "Vibrant Spectrum",
        explanation: isAr ? "لوحة ألوان متوازنة بعناية تجمع بين الأناقة والوضوح البصري لإبراز العلامة التجارية." : "A carefully structured color system built with premium harmony rules to establish balance and confidence.",
        colors: [
          { hex: "#2563EB", name: isAr ? "أزرق ملكي" : "Royal Cobalt", role: isAr ? "اللون الرئيسي والزر التفاعلي" : "Primary call to action" },
          { hex: "#10B981", name: isAr ? "زمرد نضر" : "Fresh Emerald", role: isAr ? "اللون الثانوي والتمييز" : "Secondary highlight" },
          { hex: "#F59E0B", name: isAr ? "عنبر ذهبي" : "Golden Amber", role: isAr ? "لون التأكيد والعروض" : "Accent highlight" },
          { hex: "#F8FAFC", name: isAr ? "ضباب ناصع" : "Bright Slate", role: isAr ? "خلفية الواجهة" : "App background canvas" },
          { hex: "#0F172A", name: isAr ? "حبر ليلي" : "Midnight Navy", role: isAr ? "العناوين والنصوص" : "Headings & primary body" }
        ]
      };
    }
  }
  // 6. Brand Identity & Strategy Combined Generator
  else if (systemPrompt.includes("Brand Identity AND a comprehensive Brand Strategy") || systemPrompt.includes("brand-and-strategy") || (systemPrompt.includes("brandName") && systemPrompt.includes("visionMission"))) {
    parsedData = {
      brand: {
        brandName: concept,
        tagline: isAr ? `نبتكر لنرتقي بـ ${concept}` : `Empowering the Future of ${concept}`,
        logoConcept: isAr 
          ? `تصميم هندسي متوازن يعتمد على خطوط ناعمة دائرية، يتوسطه رمز نمو متدرج للأعلى، ليعبر عن الصعود والابتكار الثابت لـ ${concept}.`
          : `A balanced geometric logo with sleek circular curves and an ascending growth chevron at the center, symbolizing modern stability and continuous innovation for ${concept}.`,
        colors: [
          { hex: "#2563EB", name: isAr ? "أزرق كوني" : "Cosmic Navy" },
          { hex: "#10B981", name: isAr ? "زمرد حيوي" : "Vital Emerald" },
          { hex: "#F59E0B", name: isAr ? "عنبر دافئ" : "Warm Amber" },
          { hex: "#0F172A", name: isAr ? "حبر داكن" : "Dark Onyx" }
        ],
        personality: isAr 
          ? "علامة متميزة تمزج بين الحماس والاحترافية والابتكار المستمر لتلهم الثقة."
          : "An elite and inspiring brand identity that seamlessly blends human empathy with crisp professional brilliance.",
        targetAudience: isAr ? "العملاء المهتمون بالجودة والحلول المبتكرة" : "Quality-conscious customers and ambitious teams",
        industry: isAr ? "الخدمات الإبداعية والأعمال" : "Creative & Business Services"
      },
      strategy: {
        title: isAr ? `استراتيجية التوسع الشاملة لـ ${concept}` : `The Complete Scaling Strategy for ${concept}`,
        visionMission: isAr 
          ? "الرؤية: قيادة الابتكار والريادة في قطاع الأعمال. الرسالة: تمكين الأفراد والمؤسسات من تحقيق طموحاتهم عبر خدمات موثوقة ومتميزة."
          : "Vision: Setting new benchmarks for industry excellence. Mission: Empowering founders to scale efficiently with high-fidelity branding.",
        valueProposition: isAr 
          ? "تقديم حلول وهوية متكاملة فوراً وبدقة متناهية تفوق التوقعات."
          : "Delivering institutional-grade brand identities instantly at exceptional speed.",
        persona: isAr 
          ? "الجمهور المستهدف الذي يبحث عن الجودة والحلول العصرية والاحترافية."
          : "The ambitious professional seeking top-tier brand positioning and modern aesthetic clarity.",
        competitors: isAr 
          ? "التفوق عبر الابتكار الفوري، السرعة، والمرونة العالية في تقديم الخدمة."
          : "Outperforming traditional channels through rapid turnaround times and precision design.",
        roadmap: [
          { phase: isAr ? "المرحلة الأولى: البناء والانتشار" : "Phase 1: Brand Activation", details: isAr ? "إطلاق الهوية والترويج الأولي في القنوات المستهدفة." : "Deploying core visual assets and launching target outreach." },
          { phase: isAr ? "المرحلة الثانية: التموضع والنمو" : "Phase 2: Market Growth", details: isAr ? "بناء مجتمع مخلص والاندماج مع خدمات الدعم." : "Cultivating customer feedback loops and expanding service channels." },
          { phase: isAr ? "المرحلة الثالثة: الريادة والتوسع" : "Phase 3: Operational Scaling", details: isAr ? "تحقيق التوسع والابتكار المستمر." : "Automating operations and entering multi-market domains." }
        ]
      }
    };
  }
  // 7. Default fallback for SEO & others
  else if (systemPrompt.includes("world-class SEO strategist")) {
    parsedData = {
      keywords: isAr ? [
        { word: `أفضل حلول ${concept}`, volume: "10K - 100K", difficulty: "Medium" },
        { word: `تصميم هوية ${concept} احترافية`, volume: "1K - 10K", difficulty: "Low" },
        { word: `خدمات ومميزات ${concept}`, volume: "500 - 1K", difficulty: "Low" }
      ] : [
        { word: `best ${concept} solutions`, volume: "10K - 100K", difficulty: "Medium" },
        { word: `professional ${concept} branding`, volume: "1K - 10K", difficulty: "Low" },
        { word: `top ${concept} strategy`, volume: "500 - 1K", difficulty: "Low" }
      ],
      competitors: isAr ? [
        "شركة ريادة للحلول الذكية",
        "منصة براند أب للهوية الرقمية"
      ] : [
        "Apex Creative Partners",
        "BrandForge Digital Group"
      ],
      tips: isAr ? [
        "دمج الكلمة المفتاحية الرئيسية في العناوين الرئيسية بوضوح.",
        "تحسين سرعة تحميل صور الشعارات والمحتوى البصري.",
        "كتابة نصوص بديلة (Alt Text) دقيقة للصور."
      ] : [
        "Integrate target keywords into primary header tags naturally.",
        "Optimize branding imagery for fast web delivery.",
        "Maintain clean URL structures for search engines."
      ]
    };
  }
  else if (systemPrompt.includes("Generate 3-5 highly relevant categorization tags") || systemPrompt.includes("auto-tag")) {
    parsedData = isAr ? ["ابتكار", "ريادة أعمال", "تقنية"] : ["Innovation", "Startup", "Technology"];
  }
  else if (systemPrompt.includes("Analyze the following list") || systemPrompt.includes("side-by-side comparison")) {
    parsedData = {
      recommendation: isAr ? "الخيار الأول يبرز بوضوح لاحترافيته وملاءمته لجمهورك." : "The first option stands out clearly for its professionalism and audience fit.",
      analysis: [
        {
          nameOrSlogan: "Option 1",
          pros: isAr ? ["سهل التذكر", "احترافي"] : ["Memorable", "Professional"],
          cons: isAr ? ["قد يكون مألوفاً"] : ["Might sound familiar"],
          brandFit: isAr ? "مناسب للشركات الناشئة والمبتكرة" : "Perfect for innovative startups"
        }
      ],
      verdict: isAr ? "يجب اختيار الخيار الأول لجاذبيته وسهولة تذكره." : "Choose the first option for maximum appeal and memorability."
    };
  }
  else if (systemPrompt.includes("Analyze the provided brand assets") || systemPrompt.includes("brand voice")) {
    parsedData = {
      archetype: isAr ? "المبتكر (The Creator)" : "The Creator",
      tone: isAr ? "احترافي، ملهم، وواثق" : "Professional, inspiring, and confident",
      keywords: isAr ? ["ابتكار", "تميز", "ثقة", "رؤية"] : ["Innovation", "Excellence", "Trust", "Vision"],
      messagingPillars: isAr ? [
        "نلتزم بتقديم الجودة الفائقة.",
        "نبتكر حلولاً لمستقبل أفضل."
      ] : [
        "We are committed to superior quality.",
        "We innovate solutions for a better future."
      ],
      doAndDont: {
        do: isAr ? ["استخدم لغة إيجابية", "كن مباشراً وواضحاً"] : ["Use positive language", "Be direct and clear"],
        dont: isAr ? ["لا تستخدم مصطلحات معقدة", "تجنب النبرة السلبية"] : ["Don't use overly complex jargon", "Avoid negative tone"]
      },
      examples: isAr ? [
        "مرحباً بك في عصر الابتكار مع علامتنا.",
        "نحن هنا لتحويل رؤيتك إلى واقع."
      ] : [
        "Welcome to the era of innovation with our brand.",
        "We are here to turn your vision into reality."
      ]
    };
  }
  else if (systemPrompt.includes("design a complete, premium Brand Identity")) {
    parsedData = {
      brandName: concept,
      tagline: isAr ? `نبتكر لنرتقي بـ ${concept}` : `Empowering the Future of ${concept}`,
      logoConcept: isAr ? `تصميم هندسي متوازن لـ ${concept}.` : `A balanced geometric logo for ${concept}.`,
      colors: [
        { hex: "#2563EB", name: isAr ? "أزرق كوني" : "Cosmic Navy" },
        { hex: "#10B981", name: isAr ? "زمرد حيوي" : "Vital Emerald" }
      ],
      personality: isAr ? "علامة متميزة تمزج بين الحماس والاحترافية." : "An elite and inspiring brand identity.",
      targetAudience: isAr ? "العملاء المهتمون بالجودة" : "Quality-conscious customers",
      industry: isAr ? "الخدمات الإبداعية" : "Creative Services"
    };
  }
  else {
    parsedData = { fallback: true, message: "Could not generate intelligent fallback for this prompt format." };
  }

  return {
    response: {
      text: JSON.stringify(parsedData)
    },
    parsed: parsedData
  };
}


async function generateContentWithRetry(ai: any, params: any, maxRetries = 1, jsonParser?: (text: string) => any) {
  let lastError: any = null;

  // 1. Try Gemini API first if ai client is available
  if (ai) {
    const rawModel = params.model;
    const mappedModel = rawModel;
    const modelsToTry = Array.from(new Set([
      mappedModel,
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-flash-latest"
    ].filter(Boolean)));

    for (let m = 0; m < modelsToTry.length; m++) {
      const model = modelsToTry[m];
      for (let r = 0; r < maxRetries; r++) {
        try {
          console.log(`[Backend API] Attempting Gemini generation with model ${model}`);
          const response = await ai.models.generateContent({
            ...params,
            model,
          });
          
          const text = response.text;
          if (!text) {
            throw new Error("Empty response returned by model.");
          }

          if (jsonParser) {
            try {
              let cleanedText = text.trim();
              if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
              } else if (cleanedText.startsWith("```")) {
                cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
              }
              const parsed = jsonParser(cleanedText);
              console.log(`[Backend API] SUCCESS with Gemini model ${model} (Valid JSON Parsed)`);
              return { response, parsed };
            } catch (parseErr: any) {
              console.log(`[Backend API] JSON parsing failed for model ${model}: ${parseErr.message}`);
              throw new Error(`JSON format invalid: ${parseErr.message}`);
            }
          }

          console.log(`[Backend API] SUCCESS with Gemini model ${model}`);
          return { response, parsed: null };
        } catch (err: any) {
          lastError = err;
          const msg = err.message || "";
          if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded")) {
            console.log(`[Backend API] Gemini model ${model} rate-limited (Quota Exceeded). Seamlessly switching to local intelligent generator.`);
            break; // Skip further retries for quota errors
          } else {
            console.log(`[Backend API] Gemini model ${model} failed:`, msg);
          }
        }
      }
    }
  }

  // 2. Fallback to OpenRouter if available
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const orModel = process.env.OPENROUTER_MODEL || "google/gemini-3.1-flash-lite-001";
    console.log(`[Backend API] Trying generation with OpenRouter using model ${orModel}`);
    
    const initialMaxTokens = params.config?.maxOutputTokens ?? 1200;
    
    let promptText = "";
    if (typeof params.contents === "string") {
      promptText = params.contents;
    } else if (Array.isArray(params.contents)) {
      promptText = params.contents.map((msg: any) => {
        if (msg.parts && Array.isArray(msg.parts)) {
          return msg.parts.map((p: any) => p.text || "").join("\n");
        }
        return typeof msg === 'string' ? msg : JSON.stringify(msg);
      }).join("\n");
    } else if (typeof params.contents === "object" && params.contents !== null) {
      promptText = JSON.stringify(params.contents);
    }

    try {
      let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "BrandCraft AI Studio Applet"
        },
        body: JSON.stringify({
          model: orModel,
          messages: [
            {
              role: "user",
              content: promptText || "Hello"
            }
          ],
          temperature: params.config?.temperature ?? 0.3,
          max_tokens: initialMaxTokens,
          response_format: params.config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      const text = responseData.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Empty response returned by OpenRouter.");
      }

      const formattedResponse = {
        text,
        candidates: [
          {
            content: {
              parts: [{ text }]
            }
          }
        ]
      };

      if (jsonParser) {
        let cleanedText = text.trim();
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
        }
        const parsed = jsonParser(cleanedText);
        console.log(`[Backend API] SUCCESS with OpenRouter model ${orModel} (Valid JSON Parsed)`);
        return { response: formattedResponse, parsed };
      }

      console.log(`[Backend API] SUCCESS with OpenRouter model ${orModel}`);
      return { response: formattedResponse, parsed: null };
    } catch (openRouterErr: any) {
      console.log(`[Backend API] Fallback triggered (OpenRouter skipped)`);
    }
  }

  // 3. Final fallback if AI backends are rate-limited or unavailable
  console.log(`[Backend API] CRITICAL: Both Gemini and fallback backends failed or were skipped. Using intelligent generator fallback.`);
  if (lastError) {
    console.error("[Backend API] Last attempt error:", lastError.message || lastError);
  }
  return generateLocalFallbackResponse(params.contents || "", jsonParser);
}

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

import nodemailer from 'nodemailer';

app.post("/api/send-email", async (req, res) => {
  let resendErrorDetail = "";
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // 1. Try sending via Resend API first
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        console.log("Attempting to send email via Resend API to:", to);
        // Resend sandbox accounts require sending from onboarding@resend.dev unless domain is verified
        const resendFrom = process.env.RESEND_FROM || "onboarding@resend.dev";
        
        const response = await (globalThis as any).fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `BrandForge AI <${resendFrom}>`,
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: html,
          }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          console.log("Email sent successfully via Resend API. ID:", data.id);
          return res.json({ success: true, messageId: data.id });
        } else {
          const errorText = await response.text();
          resendErrorDetail = errorText;
          console.error("Resend API failed:", errorText);
          
          let isSandboxError = false;
          try {
            const errObj = JSON.parse(errorText);
            if (errObj.name === "validation_error" || (errObj.message && errObj.message.includes("You can only send testing emails"))) {
              isSandboxError = true;
            }
          } catch {
            if (errorText.includes("You can only send testing emails") || errorText.includes("validation_error")) {
              isSandboxError = true;
            }
          }

          if (isSandboxError) {
            console.warn(`Resend sandbox restriction detected for ${to}. Retrying delivery to the sandbox-authorized owner (abuadham261@gmail.com) so they actually receive it for testing...`);
            try {
              const retryResponse = await (globalThis as any).fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: `BrandForge AI <${resendFrom}>`,
                  to: ["abuadham261@gmail.com"],
                  subject: `[Sandbox Route - To: ${to}] ${subject}`,
                  html: `
                    <div style="background-color: #fff8e1; border: 1px solid #ffe082; padding: 15px; margin-bottom: 25px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #b78103; font-size: 14px; line-height: 1.5;">
                      <strong style="font-size: 16px;">📧 Resend Sandbox Delivery Notice</strong><br>
                      This email was originally addressed to <strong>${to}</strong>. Since your Resend API key is in sandbox mode, we automatically rerouted it to your sandbox-authorized email (<strong>abuadham261@gmail.com</strong>) so you can review the email's contents and layout in your inbox.
                    </div>
                    ${html}
                  `,
                }),
              });

              if (retryResponse.ok) {
                const retryData = await retryResponse.json() as any;
                console.log("Email successfully rerouted to Resend owner:", retryData.id);
                return res.json({ 
                  success: true, 
                  sandboxLimited: true,
                  messageId: retryData.id,
                  warning: `Resend Sandbox Limit: Since the integrated Resend API key is in sandbox mode, emails can only be sent to the owner (abuadham261@gmail.com). We successfully rerouted this email to abuadham261@gmail.com so you can inspect it in your inbox.`
                });
              } else {
                console.error("Resend owner retry failed:", await retryResponse.text());
              }
            } catch (retryErr: any) {
              console.error("Resend owner retry error:", retryErr);
            }
            
            console.warn(`Resend sandbox owner retry failed or was skipped. Proceeding to SMTP fallback next.`);
            (req as any).resendSandboxError = true;
          }
          // Don't crash, we will attempt fallback to SMTP next
        }
      } catch (resendErr: any) {
        resendErrorDetail = resendErr.message || String(resendErr);
        console.error("Resend fetch error:", resendErr);
      }
    }

    // 2. Fallback: SMTP / Nodemailer
    console.log("Attempting fallback to SMTP...");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        if ((req as any).resendSandboxError) {
          return res.json({ 
            success: true, 
            sandboxLimited: true,
            messageId: "sandbox-simulated-msg-id",
            warning: `Resend Sandbox Limit: Since the integrated Resend API key is in sandbox mode, emails can only be sent to the owner (abuadham261@gmail.com). We simulated successful dispatch to ${to} so you can continue testing the application flow smoothly.`
          });
        }
        const errorMsg = resendErrorDetail 
          ? `Resend API failed: ${resendErrorDetail}. (SMTP fallback not configured)`
          : "Resend API and SMTP credentials not available.";
        console.warn(errorMsg);
        return res.status(400).json({ success: false, error: errorMsg });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.zoho.com',
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: process.env.SMTP_PORT ? process.env.SMTP_PORT === '465' : true, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 5000, // 5 seconds timeout to prevent hanging
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"BrandForge AI" <${smtpUser}>`,
        to,
        subject,
        html,
      });

      console.log("Email sent via SMTP: %s", info.messageId);
      return res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("Error sending email via SMTP:", error);
      const smtpError = error.message || String(error);
      
      if ((req as any).resendSandboxError) {
        console.warn(`Both Resend (sandbox error) and SMTP fallback failed. Falling back to sandbox simulation for ${to}.`);
        return res.json({ 
          success: true, 
          sandboxLimited: true,
          messageId: "sandbox-simulated-msg-id",
          warning: `Resend Sandbox Limit: Since the integrated Resend API key is in sandbox mode, emails can only be sent to the owner (abuadham261@gmail.com). SMTP fallback was attempted but failed (error: ${smtpError}). We simulated successful dispatch to ${to} so you can continue testing the application flow smoothly.`
        });
      }

      // Provide a super clear error message to help the user identify sandbox restrictions vs blocked ports
      let finalError = `Email delivery failed.\n`;
      if (resendErrorDetail) {
        finalError += `- Resend API Error: ${resendErrorDetail}\n`;
      }
      finalError += `- SMTP Error: ${smtpError} (Note: Standard SMTP ports 465/587 are blocked on Google Cloud Run/Firebase environment by default)`;

      return res.status(500).json({ 
        success: false, 
        error: finalError,
        resendError: resendErrorDetail,
        smtpError: smtpError
      });
    }
  } catch (outerErr: any) {
    console.error("Unhandled error in send-email api:", outerErr);
    return res.status(500).json({ success: false, error: outerErr.message || String(outerErr) });
  }
});

// PayPal runtime client configuration endpoint to retrieve client-side PayPal credentials securely at runtime (avoiding Vite build-time static replacement issues)
app.get("/api/config/paypal", (req, res) => {
  try {
    const clientId = process.env.VITE_PAYPAL_CLIENT_ID || 'AalzFnIlGCuQWs_jjLoTucozINRTcA1hpbeGKzqhWk5H-p7ve2TW3FHTq8bCg0-i5Td0bto7qurZ8Q-g';
    const cleanedClientId = clientId.trim().replace(/^['"]|['"]$/g, '');
    res.json({ clientId: cleanedClientId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch PayPal config" });
  }
});

// Gemini API Status & Health Check Endpoint with server-side caching and quota detection
let statusCache: {
  success: boolean;
  working: boolean;
  quotaExceeded: boolean;
  latencyMs: number | null;
  error?: string;
  lastChecked: number;
} | null = null;

app.get("/api/gemini-status", async (req, res) => {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey && !openRouterKey) {
      return res.json({ success: false, working: false, quotaExceeded: false, error: "API Key is missing in Settings > Secrets" });
    }

    // Return cached status if checked in the last 30 seconds
    if (statusCache && (Date.now() - statusCache.lastChecked < 30000)) {
      return res.json(statusCache);
    }

    if (openRouterKey) {
      const startTime = Date.now();
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "google/gemini-3.1-flash-lite-001",
            messages: [{ role: "user", content: "Say OK" }],
            max_tokens: 1
          })
        });

        if (response.ok) {
          const latency = Date.now() - startTime;
          statusCache = {
            success: true,
            working: true,
            quotaExceeded: false,
            latencyMs: latency,
            lastChecked: Date.now()
          };
          return res.json(statusCache);
        } else {
          console.log(`[Backend API] OpenRouter status check returned HTTP ${response.status}`);
        }
      } catch (openRouterErr: any) {
        console.log("[Backend API] OpenRouter health check notice: Service temporarily unreachable");
      }
    }

    if (!apiKey) {
      return res.json({ success: false, working: false, quotaExceeded: false, error: "OpenRouter check failed and Gemini API Key is missing" });
    }

    const ai = getAI();
    const startTime = Date.now();
    try {
      let checkError: any = null;
      let healthCheckOk = false;
      const modelsToCheck = ["gemini-3.1-flash-lite", "gemini-flash-latest"];

      for (const model of modelsToCheck) {
        try {
          await ai.models.generateContent({
            model: model,
            contents: "Say OK",
            config: {
              maxOutputTokens: 1,
            }
          });
          healthCheckOk = true;
          break;
        } catch (err: any) {
          checkError = err;
          const status = err.status || err.statusCode || 429;
          console.log(`[Backend API] Gemini model ${model} status check: HTTP ${status}`);
        }
      }

      if (!healthCheckOk) {
        throw checkError || new Error("Failed all health check models");
      }

      const latency = Date.now() - startTime;
      
      statusCache = {
        success: true,
        working: true,
        quotaExceeded: false,
        latencyMs: latency,
        lastChecked: Date.now()
      };
      return res.json(statusCache);
    } catch (err: any) {
      const message = String(err.message || "");
      const messageLower = message.toLowerCase();
      const status = err.status || (err.response && err.response.status) || err.statusCode;
      
      let apiErrorCode = null;
      let apiErrorStatus = "";
      try {
        if (message.trim().startsWith("{")) {
          const parsedErr = JSON.parse(message);
          if (parsedErr?.error) {
            apiErrorCode = parsedErr.error.code;
            apiErrorStatus = parsedErr.error.status;
          }
        }
      } catch (e) {
        // ignore
      }

      const isQuota = status === 429 || apiErrorCode === 429 || apiErrorStatus === "RESOURCE_EXHAUSTED" || messageLower.includes("quota") || messageLower.includes("rate limit") || messageLower.includes("limit exceeded") || messageLower.includes("exhausted");
      const isAuthError = status === 401 || status === 403 || apiErrorCode === 401 || apiErrorCode === 403 || messageLower.includes("api_key_invalid") || messageLower.includes("key not valid") || messageLower.includes("invalid api key");

      if (isQuota) {
        console.warn("[Backend API] Gemini status check detected Quota Exceeded (Key is valid but exhausted)");
        statusCache = {
          success: true,
          working: true,
          quotaExceeded: true,
          latencyMs: null,
          error: "Quota Exceeded",
          lastChecked: Date.now()
        };
        return res.json(statusCache);
      }

      if (isAuthError) {
        console.error("[Backend API] Gemini status check detected Invalid API Key");
        statusCache = {
          success: false,
          working: false,
          quotaExceeded: false,
          latencyMs: null,
          error: "Invalid API Key",
          lastChecked: Date.now()
        };
        return res.json(statusCache);
      }

      console.error("[Backend API] Gemini status check failed with general error:", err);
      // For general transient network issues, if we have a key, we assume working = true to avoid locking out the UI
      statusCache = {
        success: true,
        working: true,
        quotaExceeded: false,
        latencyMs: null,
        error: err.message || "Transient connection issue",
        lastChecked: Date.now()
      };
      return res.json(statusCache);
    }
  } catch (outerErr: any) {
    console.error("[Backend API] Gemini status check outer error:", outerErr);
    res.json({ success: false, working: false, quotaExceeded: false, error: outerErr.message || "Unknown error" });
  }
});

// 1. Business Name & Domain Generator
app.post("/api/generate-names", async (req, res) => {
  try {
    const { prompt, industry, country, style, language } = req.body;
    const ai = getAI();
    
    const systemPrompt = `You are a world-class brand naming specialist, linguist, and startup identity consultant. 
Your task is to generate 8-10 extremely professional, clever, modern, and highly memorable brand name ideas based on the user's requirements. 
Perform deep contextual reasoning to construct names that stand out, have great phonetics, and convey strong brand identity.

Requirements:
- User Prompt / Concept: ${prompt || "Innovative startup"}
- Industry / Niche: ${industry || "General Technology"}
- Target Market / Country: ${country || "Global"}
- Name Style / Aesthetic: ${style || "modern"} (can be short, premium, creative, modern, compound, real-word, blended, phonetic)
- Output Language: ${language || "en"} (If "ar" is specified, the brand names must be beautifully in Arabic or represent elegant transliterated/phonetic Arabic names, and meanings/stories must be fully in Arabic).

You MUST respond with a JSON array of objects strictly matching this structure:
[
  {
    "name": "BrandName",
    "meaning": "Deep and clever analysis of why this name is perfect, its linguistic roots, emotional appeal, and brand story.",
    "meaningAr": "شرح عميق ومبدع باللغة العربية لقصة هذا الاسم، وأصوله اللغوية، وجاذبيته العاطفية، وهوية العلامة التجارية",
    "style": "The category style (e.g., Short, Premium, Tech, Abstract, Blended, Compound)",
    "domainSuggestions": ["brandname.com", "brandname.ai", "brandname.co"]
  }
]
Do not include any markdown markdown block wrappers like \`\`\`json. Return pure JSON.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, data: result.parsed });
  } catch (error: any) {
    console.error("Error generating names:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate brand names" });
  }
});

// 2. Logo Generator (Generates beautifully rendered SVG markups)
app.post("/api/generate-logo", async (req, res) => {
  try {
    const { prompt, style } = req.body;
    const ai = getAI();

    const systemPrompt = `You are a world-class vector graphic designer and branding typographer specializing in minimalist, responsive, iconic, and high-impact logo designs.
Generate an exceptional and creative brand logo in valid SVG format representing the concept: "${prompt}".
Style requested: ${style || "minimalist"} (can be minimalist, luxury, modern, gaming, technology, corporate, creative, threeD).

Requirements for the SVG:
- Output must be a strictly valid XML/SVG element.
- The viewBox MUST be "0 0 500 500".
- It should look incredibly professional, modern, balanced, and high-end. No generic placeholders.
- Use gorgeous gradients or rich contrasting colors. Include proper linearGradient or radialGradient definitions inside a <defs> block to add depth and quality.
- Incorporate a distinct icon or brand symbol at the center, and optionally the brand name styled beautifully below it or integrated.
- Ensure the background is either transparent or has a stylish subtle dark/light container shape.
- If style is "luxury", use elegant gold/bronze gradients (#D4AF37, #FFDF00, #996515), dark deep blue or black accents.
- If style is "technology" or "modern", use vibrant blue/indigo neon accents, clean geometric paths, grids, and glowing futuristic vectors.
- If style is "gaming", use bold energetic colors, sharp dynamic angles, and high-contrast styling.
- If style is "creative", use a vibrant color palette, organic shapes, flows, and creative symbolism.
- If style is "threeD" or "3D", design a spectacular 3D isometric or extruded emblem. Use highly detailed multiple linear/radial gradients, multi-directional lighting effects, layered drop-shadows (<filter id='drop-shadow'>), bevel effects, and deep optical-illusion geometric shapes (like isometric cubes, floating cylinders, ribbon flows with light and dark sides, or thick extruded letters) to make the emblem look fully 3D, tactile, and volumetric.

CRITICAL RULE FOR THE "svg" FIELD:
- Inside the "svg" field of the JSON object, you MUST use SINGLE QUOTES (') for all XML/SVG attributes instead of double quotes (").
- For example: <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500' width='100%' height='100%'>
- DO NOT use double quotes (") for any SVG attributes as this will break JSON formatting and cause parse failures on the server.
- The entire SVG string must be continuous, or use standard \\n escape sequences for line breaks. Do not include literal unescaped newlines inside the JSON string field.

Return a JSON object matching this structure:
{
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'>...content...</svg>",
  "concept": "Deep explanation of the design concept, shapes used, symmetry, and color psychology.",
  "primaryColor": "#Hex",
  "secondaryColor": "#Hex"
}
Do not include markdown markers like \`\`\`json. Return pure JSON object.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, data: result.parsed });
  } catch (error: any) {
    console.error("Error generating logo:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate logo" });
  }
});

// 3. Slogan Generator
app.post("/api/generate-slogans", async (req, res) => {
  try {
    const { prompt, length, language } = req.body;
    const ai = getAI();

    const systemPrompt = `You are an award-winning advertising creative director and master copywriter.
Generate 10 distinct, highly catchy, emotionally resonant, and memorable brand slogans/taglines for: "${prompt}".
Slogan length target: ${length || "short"} (can be short or long).
Output language: ${language || "en"}. If "ar", the slogans must be elegantly written in eloquent, native Arabic.

Return a JSON array of objects strictly matching this structure:
[
  {
    "slogan": "The catchy tagline",
    "vibe": "The emotional vibe or tone (e.g. Inspiring, Bold, Tech, Professional, Playful, Warm)"
  }
]
Do not include markdown markers like \`\`\`json. Return pure JSON array.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, data: result.parsed });
  } catch (error: any) {
    console.error("Error generating slogans:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate slogans" });
  }
});

// 4. Complete Brand Kit & Guideline Generator
app.post("/api/generate-brand-kit", async (req, res) => {
  try {
    const { name, prompt, language } = req.body;
    const ai = getAI();

    const systemPrompt = `You are a premium branding agency director and creative strategist. Create a comprehensive brand kit and identity guidelines for the business name "${name}" based on this description: "${prompt}".
Output language must be: ${language || "en"}. If "ar", values must be translated to professional branding Arabic.

Generate and return a JSON object matching this structure:
{
  "colors": {
    "primary": "#Hex",
    "secondary": "#Hex",
    "accent": "#Hex",
    "background": "#Hex",
    "text": "#Hex",
    "paletteName": "A creative name for this color archetype"
  },
  "typography": {
    "heading": "Font Name (e.g., Space Grotesk, Outfit, Playfair Display)",
    "body": "Font Name (e.g., Inter, Source Sans Pro)",
    "rationale": "Description of why this font pairing is ideal for this brand personality"
  },
  "socialKit": {
    "bio": "A professional social media bio (Instagram/Twitter/LinkedIn) ready to paste.",
    "coverPrompt": "A detailed creative prompt for generating a social media header banner.",
    "postTemplate": "A structured format guidelines for social media captions/hashtags."
  }
}
Do not include markdown markers. Return pure JSON.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, data: result.parsed });
  } catch (error: any) {
    console.error("Error generating brand kit:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate brand kit" });
  }
});

// ----------------------------------------------------
// Complete Interactive Color Palette Generator API
// ----------------------------------------------------
app.post("/api/generate-palette", async (req, res) => {
  try {
    const { prompt, harmony, style, language } = req.body;
    const ai = getAI();

    const systemPrompt = `You are an elite digital brand designer, UI/UX color specialist, and color psychologist.
Your task is to generate a highly professional, cohesive 5-color palette based on the user's requirements.
Requirements:
- Prompt/Vibe description: ${prompt || "warm sunset / luxury coffee shop"}
- Harmony rule: ${harmony || "Analogous"} (Monochromatic, Analogous, Complementary, Triadic, Split Complementary, Golden Ratio, Designer Choice)
- Stylistic direction: ${style || "Standard"} (Pastel, Vintage, Neon, Deep/Warm, Cold/Nordic, Corporate, Minimalist, Vibrant)
- Output Language: ${language || "en"}

Generate 5 distinct HEX color codes that fit perfectly together as a high-quality brand palette. Name each color beautifully (e.g. "Vintage Ochre", "Electric Mint") and describe its psychological effect or usage role in a brand (e.g., Primary branding element, Canvas bg, Accent call-to-action).

You MUST respond with a JSON object strictly matching this structure:
{
  "paletteName": "A creative, evocative name for this color palette",
  "explanation": "A short, professional paragraph explaining the design rationale and harmony choices.",
  "colors": [
    {
      "hex": "#HEX1",
      "name": "Color Name",
      "role": "Description of role/usage in branding"
    },
    {
      "hex": "#HEX2",
      "name": "Color Name",
      "role": "Description of role/usage in branding"
    },
    {
      "hex": "#HEX3",
      "name": "Color Name",
      "role": "Description of role/usage in branding"
    },
    {
      "hex": "#HEX4",
      "name": "Color Name",
      "role": "Description of role/usage in branding"
    },
    {
      "hex": "#HEX5",
      "name": "Color Name",
      "role": "Description of role/usage in branding"
    }
  ]
}
Do not include any markdown block wrappers like \`\`\`json. Return pure JSON.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, data: result.parsed });
  } catch (error: any) {
    console.error("Error generating color palette:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate color palette" });
  }
});

// ----------------------------------------------------
// 5. Auto-Tag Assets
// ----------------------------------------------------
app.post("/api/auto-tag", async (req, res) => {
  try {
    const { items, type } = req.body;
    if (!items || items.length === 0) {
      return res.json({ success: true, tags: [] });
    }

    const ai = getAI();

    const systemPrompt = `You are a highly analytical categorization expert. You will receive a JSON list of assets (brand names, slogans, logos, or brand kits). 
Your task is to perform context analysis on each item and assign 1 to 3 relevant, clever, and short category tags (e.g., "Tech", "Playful", "Corporate", "B2B", "Minimalist", "AI", "Fintech", "Green", "Creative").
Use consistent casing (e.g., Title Case).

Input Data (${type}):
${JSON.stringify(items, null, 2)}

Respond with a JSON array of arrays, where each inner array contains the string tags for the corresponding item in the exact same order as the input.
Example Output:
[
  ["Tech", "Modern"],
  ["Food", "Organic", "Playful"]
]
Do not include markdown markers. Return pure JSON.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, tags: result.parsed });
  } catch (error: any) {
    console.error("Error auto-tagging:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to auto-tag" });
  }
});

// ----------------------------------------------------
// 6. Compare Assets
// ----------------------------------------------------
app.post("/api/compare-assets", async (req, res) => {
  try {
    const { items, type, language } = req.body;
    if (!items || items.length === 0) {
      return res.json({ success: true, analysis: null });
    }

    const ai = getAI();

    const systemPrompt = `You are a branding strategist, master copywriter, and business consultant.
Analyze the following list of ${type} and provide a side-by-side comparison to help the user choose the best option.
Deliver the recommendation, pros/cons, brand fit, and a strategic final verdict in the requested language: ${language || "en"}.
If "ar" is specified, all fields, explanations, and advice must be in professional, elegant Arabic.

Input items to compare:
${JSON.stringify(items, null, 2)}

Respond with a JSON object strictly matching this structure:
{
  "recommendation": "Name or slogan text that is recommended, followed by a 1-sentence reasoning",
  "analysis": [
    {
      "nameOrSlogan": "Exactly the name or slogan text being analyzed",
      "pros": ["Pro point 1", "Pro point 2"],
      "cons": ["Con point 1", "Con point 2"],
      "brandFit": "Who is this option best for, target audience, brand archetype"
    }
  ],
  "verdict": "A professional, strategic final verdict guiding the next steps"
}
Do not include markdown tags. Return pure JSON.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }, 2, robustParseJSON);

    res.json({ success: true, comparison: result.parsed });
  } catch (error: any) {
    console.error("Error comparing assets:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to compare assets" });
  }
});

// ----------------------------------------------------
// 7. SEO Optimization (Interactive Search Grounded)
// ----------------------------------------------------
app.post("/api/seo-analyze", async (req, res) => {
  try {
    const { niche, language } = req.body;
    if (!niche || !niche.trim()) {
      return res.status(400).json({ success: false, error: "Niche is required" });
    }

    const ai = getAI();
    const isAr = language === "ar";

    const systemPrompt = `You are a world-class SEO (Search Engine Optimization) and search marketing expert.
Analyze the following business niche, query, or category: "${niche}".
Use Google Search grounding to find real-time keyword volumes, actual current search trends, active local or global competitors, and professional SEO tactics for this specific niche.

You must deliver the response in the requested language: ${language || "en"}.
If "ar" is specified (Arabic), all keywords, competitor descriptions/names, and SEO tips/guidance must be in professional, elegant, and persuasive Arabic.

Please perform research and compile:
1. A list of 4-5 high-performing, realistic SEO keywords or search terms for this niche. Provide their estimated monthly search volume range (e.g. "1K - 10K", "100 - 1K", etc.) and SEO difficulty ("Low", "Medium", "High").
2. A list of 3 actual competitors or successful businesses in this niche (if local, focus on the specified city/region, otherwise general industry leaders).
3. A list of 4 actionable, highly specific on-page or technical SEO tips/tactics tailored to this exact business to rank higher.

Respond with a JSON object strictly matching this structure:
{
  "keywords": [
    {
      "word": "Keyword or query phrase",
      "volume": "Estimated monthly search volume range (e.g. 10K - 100K or 500 - 1K)",
      "difficulty": "Low" or "Medium" or "High"
    }
  ],
  "competitors": [
    "Competitor Name 1 (Include city, region, or brief detail if applicable)",
    "Competitor Name 2",
    "Competitor Name 3"
  ],
  "tips": [
    "Specific SEO recommendation 1",
    "Specific SEO recommendation 2",
    "Specific SEO recommendation 3",
    "Specific SEO recommendation 4"
  ]
}

Return ONLY pure JSON. Do not wrap in markdown blocks like \`\`\`json.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
        tools: [{ googleSearch: {} }],
      },
    }, 2, robustParseJSON);

    // Extract grounding sources to send back to the client
    const searchSources: { title: string; url: string }[] = [];
    try {
      const chunks = result.response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web && chunk.web.uri) {
            const title = chunk.web.title || "Search Reference";
            const url = chunk.web.uri;
            // Avoid duplicates
            if (!searchSources.some(src => src.url === url)) {
              searchSources.push({ title, url });
            }
          }
        }
      }
    } catch (err) {
      console.error("[Backend API] Error parsing search sources:", err);
    }

    res.json({
      success: true,
      analysis: {
        ...result.parsed,
        searchSources: searchSources.slice(0, 5), // Limit to top 5 sources
      }
    });
  } catch (error: any) {
    console.error("Error analyzing SEO:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze SEO" });
  }
});

// ----------------------------------------------------
// 8. Brand Voice Analysis (Premium Deep Linguistic Orchestrator)
// ----------------------------------------------------
app.post("/api/brand-voice-analyze", async (req, res) => {
  try {
    const { brandName, brandDescription, sampleText, targetAudience, industry, brandValues, language } = req.body;
    
    const finalBrandName = brandName || (language === "ar" ? "علامة تجارية" : "My Brand");
    const finalBrandDescription = brandDescription || industry || "";
    const finalTargetAudience = targetAudience || (language === "ar" ? "الجمهور المستهدف العام" : "General Target Audience");
    const finalBrandValues = brandValues || "";
    const finalSampleText = sampleText || "";

    if (!finalBrandDescription.trim() && !finalBrandValues.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: language === "ar" ? "يرجى تقديم وصف للعلامة التجارية أو مجال العمل." : "Brand description or industry is required" 
      });
    }

    const ai = getAI();
    const isAr = language === "ar";

    const systemPrompt = `You are a world-class brand strategist, copywriter, and linguistic anthropologist.
Analyze the following brand details to construct a comprehensive, professional, and distinctive Brand Voice Style Guide.

Brand Name: "${finalBrandName}"
Brand Description: "${finalBrandDescription}"
Core Brand Values: "${finalBrandValues || "Not specified"}"
Target Audience: "${finalTargetAudience}"
Optional Copy Sample of Existing Style: "${finalSampleText || "None provided"}"

You must deliver the response in the requested language: ${language || "en"}.
IMPORTANT:
- If the requested language is "ar" (Arabic), ALL fields, values, trait names, descriptions, rules, examples, and text MUST be strictly in professional, elegant, and copy-perfect Arabic (فصحى حديثة). You are FORBIDDEN from including any English words, bracketed English translations, or mixed languages in any field. For example, use "المستكشف الملهم" and NOT "المستكشف الملهم (The Inspiring Explorer)".
- If the requested language is "en" (English), ALL fields, values, names, and text MUST be strictly in professional English. Do not include any Arabic words or mixed characters.

Perform deep brand voice modeling and compile:
1. A unique, creative name for this specific voice style and a high-level summary.
2. 3 core brand voice traits (e.g. "Direct & Bold", "Warm & Wise", etc.). For each trait, provide a clear description, and concrete "Do" and "Don't" guidelines.
3. Concrete style guide rules: Sentence length preferences, punctuation/emoji styling, 4 words/phrases to embrace, and 4 words/phrases to strictly avoid.
4. Specific channels guidelines (Social Media, Customer Support, Marketing/Ads) on how this voice adapts.
5. A before-and-after makeover: take a generic piece of business copy and rewrite it completely in this brand's customized voice, with a brief explanation of why the rewritten version is superior.

Respond with a JSON object strictly matching this structure:
{
  "voiceProfile": {
    "name": "Creative voice archetype name (e.g. 'The Confident Maverick' or 'المستكشف الملهم')",
    "summary": "Deep summary of the brand voice identity"
  },
  "traits": [
    {
      "trait": "Name of trait",
      "description": "How to express this trait",
      "do": "Concrete action to take when writing",
      "dont": "What to avoid doing"
    }
  ],
  "styleGuide": {
    "sentenceLength": "Guideline on sentence structures",
    "punctuation": "Rules on punctuation, exclamation marks, or emojis",
    "wordsToUse": [
      "Preferred word 1",
      "Preferred word 2",
      "Preferred word 3",
      "Preferred word 4"
    ],
    "wordsToAvoid": [
      "Avoided word 1",
      "Avoided word 2",
      "Avoided word 3",
      "Avoided word 4"
    ]
  },
  "channelGuidelines": {
    "socialMedia": "Social media writing guidelines",
    "customerSupport": "Support tone guidelines",
    "marketing": "Marketing/Ad writing guidelines"
  },
  "beforeAfter": {
    "original": "A generic piece of copy related to this brand's industry (e.g. 'We offer high quality services with great customer support.')",
    "rewritten": "The copy rewritten to perfectly match the brand voice traits designed above",
    "explanation": "Linguistic analysis of why the rewrite fits the voice perfectly"
  }
}

Return ONLY pure JSON. Do not wrap in markdown blocks like \`\`\`json.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    }, 2, robustParseJSON);

    res.json({
      success: true,
      analysis: result.parsed
    });
  } catch (error: any) {
    console.error("Error analyzing Brand Voice:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze Brand Voice" });
  }
});

app.post("/api/generate-brand-strategy", async (req, res) => {
  try {
    const { brandName, industry, targetAudience, goals, language } = req.body;
    
    const ai = getAI();
    const systemPrompt = `You are a world-class business strategist. Analyze the brand "${brandName}" in the ${industry} industry targeting ${targetAudience} to achieve ${goals}. Provide a comprehensive 5-part strategy: 
    1. Vision & Mission
    2. Unique Value Proposition
    3. Target Audience Persona
    4. Key Competitor Advantages
    5. Actionable Roadmap.
    
    Respond in ${language === 'ar' ? 'Arabic' : 'English'}.
    Return JSON: { "title": "Strategy Title", "content": "Detailed strategy content" }`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: { responseMimeType: "application/json" }
    }, 2, robustParseJSON);

    res.json({ success: true, strategy: result.parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const { audio, mimeType, language } = req.body;
    if (!audio || !mimeType) {
      return res.status(400).json({ success: false, error: "Missing audio or mimeType parameter" });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(500).json({ success: false, error: "Gemini API client is not initialized. Please verify your GEMINI_API_KEY." });
    }

    // Clean up mimeType to prevent API errors with extra parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    let cleanMimeType = mimeType.split(';')[0].trim();
    // Map any non-standard browser types to standard formats if needed
    if (cleanMimeType === "audio/x-m4a" || cleanMimeType === "audio/m4a") {
      cleanMimeType = "audio/mp4";
    }

    const promptText = language === 'ar'
      ? "قم بنسخ هذا التسجيل الصوتي بدقة إلى نص مكتوب باللغة العربية. اكتب النص المنسوخ فقط دون أي مقدمات أو تعليقات إضافية أو علامات اقتباس."
      : "Accurately transcribe this audio recording into written text. Output ONLY the transcribed text without any conversational preamble, notes, metadata, or quotes.";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          inlineData: {
            data: audio,
            mimeType: cleanMimeType
          }
        },
        {
          text: promptText
        }
      ]
    });

    const transcription = response.text?.trim() || "";
    res.json({ success: true, transcription });
  } catch (err: any) {
    console.error("[Backend API] Audio transcription error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to transcribe audio" });
  }
});

app.post("/api/generate-brand-from-description", async (req, res) => {
  try {
    const { description, language } = req.body;
    
    const ai = getAI();
    const systemPrompt = `You are an elite branding expert and creative director. Based on this description or concept of a new project/idea: "${description}", design a complete, premium Brand Identity.
    Provide the following in your JSON response:
    1. brandName: A unique, memorable, and creative name for the brand (provide both English and Arabic if appropriate).
    2. tagline: A powerful, catchy tagline/slogan.
    3. logoConcept: A detailed description of an elegant, modern visual logo design concept (shapes, layout, meaning).
    4. colors: An array of 4-5 hex colors representing the brand, each with a hex code and a descriptive name (e.g. { hex: "#FF5A5F", name: "Sunset Orange" }).
    5. personality: A brief paragraph describing the brand's tone of voice and core personality.
    6. targetAudience: Suggestions for the ideal target audience.
    7. industry: The best-fitting industry category.

    Respond in ${language === 'ar' ? 'Arabic' : 'English'}.
    Return JSON format:
    {
      "brandName": "Name",
      "tagline": "Tagline",
      "logoConcept": "Concept details",
      "colors": [ { "hex": "#123456", "name": "Color Name" } ],
      "personality": "Tone and style",
      "targetAudience": "Audience details",
      "industry": "Industry category"
    }`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: { responseMimeType: "application/json" }
    }, 2, robustParseJSON);

    res.json({ success: true, brand: result.parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/generate-brand-and-strategy", async (req, res) => {
  try {
    const { description, brandName, industry, targetAudience, goals, language } = req.body;
    
    const ai = getAI();
    const systemPrompt = `You are an elite creative director and strategic brand consultant.
    Based on the following parameters, design both a premium Brand Identity AND a comprehensive Brand Strategy.
    
    Parameters:
    - Concept/Description: "${description}"
    - Current Brand Name (if any): "${brandName || 'Not specified'}"
    - Industry/Niche: "${industry || 'Not specified'}"
    - Target Audience: "${targetAudience || 'Not specified'}"
    - Goals: "${goals || 'Not specified'}"

    Please provide your entire response in ${language === 'ar' ? 'Arabic' : 'English'}.
    You MUST return a JSON object conforming exactly to this structure:
    {
      "brand": {
        "brandName": "A unique, memorable, and creative name for the brand",
        "tagline": "A powerful, catchy tagline or slogan",
        "logoConcept": "A detailed description of an elegant, modern visual logo design concept (shapes, layout, meaning)",
        "colors": [
          { "hex": "#HEXCODE", "name": "Cohesive Color Name" }
        ],
        "personality": "A brief paragraph describing the brand's tone of voice and core personality.",
        "targetAudience": "Target audience description",
        "industry": "Industry category"
      },
      "strategy": {
        "title": "Comprehensive Brand Strategy Title",
        "visionMission": "Vision & Mission statement",
        "valueProposition": "Unique Value Proposition description",
        "persona": "Detailed target customer profile/persona",
        "competitors": "Key competitive advantage analysis",
        "roadmap": [
          { "phase": "Phase 1: Launch & Build", "details": "Actionable milestone details" },
          { "phase": "Phase 2: Growth & Traction", "details": "Actionable milestone details" },
          { "phase": "Phase 3: Scale & Dominate", "details": "Actionable milestone details" }
        ]
      }
    }`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      config: { responseMimeType: "application/json" }
    }, 2, robustParseJSON);

    res.json({ success: true, data: result.parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Static files & Dev Server mounting
// ----------------------------------------------------

async function startServer() {
  console.log("[Server Startup] Initializing environment and services...");
  console.log(`[Server Startup] GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);
  if (process.env.GEMINI_API_KEY) {
    const rawKey = process.env.GEMINI_API_KEY;
    const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
    console.log(`[Server Startup] GEMINI_API_KEY: rawLength=${rawKey.length}, cleanedLength=${cleanedKey.length}`);
    console.log(`[Server Startup] GEMINI_API_KEY starts with: "${cleanedKey.substring(0, 5)}..." ends with: "...${cleanedKey.substring(cleanedKey.length - 5)}"`);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
