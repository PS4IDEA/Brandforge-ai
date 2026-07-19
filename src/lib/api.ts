import { GoogleGenAI } from '@google/genai';

// Helpers to read/write API key from localStorage
export function getClientGeminiKey(): string {
  return localStorage.getItem('brandforge_client_gemini_key') || '';
}

export function setClientGeminiKey(key: string): void {
  if (key) {
    localStorage.setItem('brandforge_client_gemini_key', key.trim());
  } else {
    localStorage.removeItem('brandforge_client_gemini_key');
  }
}

export function isClientGeminiModeActive(): boolean {
  return !!getClientGeminiKey();
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
    console.log("[Client API] Standard JSON parse did not match perfectly. Applying advanced sanitization...");
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
        console.log("[Client API] Advanced sanitization did not resolve perfectly. Trying auto-repair on truncated JSON...");
      }
    }
    
    // Fall back to auto-repairing the truncated/incomplete JSON
    try {
      console.log("[Client API] Running intelligent truncated JSON auto-repair...");
      const repaired = repairTruncatedJSON(cleaned);
      return JSON.parse(repaired);
    } catch (repairErr: any) {
      console.log("[Client API] Truncated JSON auto-repair did not resolve.", repairErr?.message || repairErr);
      throw e;
    }
  }
}

// Client-side helper to try multiple Gemini models in sequence with exponential retry
async function generateClientContentWithRetry(ai: any, systemPrompt: string, config: any = {}): Promise<any> {
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest"
  ];
  let lastError: any = null;
  for (const model of modelsToTry) {
    for (let r = 0; r < 2; r++) {
      try {
        console.log(`[Client API] Attempting generation with model ${model} (attempt ${r + 1}/2)`);
        const response = await ai.models.generateContent({
          model,
          contents: systemPrompt,
          config: {
            responseMimeType: "application/json",
            ...config
          }
        });
        console.log(`[Client API] SUCCESS with model ${model}`);
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Client API] Attempt with model ${model} (attempt ${r + 1}/2) failed:`, err);
        
        const message = err.message || "";
        const status = err.status || err.statusCode;
        
        // If it is a clear authentication/API key error, abort early since no model will work with an invalid key
        const isAuthError = status === 401 || status === 403 || message.includes("API_KEY_INVALID") || message.includes("API key not valid") || message.includes("invalid API key");
        if (isAuthError) {
          console.error(`[Client API] Auth Error! Aborting fallback loop.`);
          throw err;
        }

        const isQuotaError = status === 429 || message.includes("Quota") || message.includes("quota");
        if (isQuotaError) {
          console.warn(`[Client API] Quota exhausted or rate limited for ${model}. Breaking retry loop to try next model.`);
          break; // Skip retries for this model, try the next one
        }

        // If it is a different 400 (like bad request due to invalid parameters other than model), we only abort if it's not a model-not-found error
        const isModelNotFoundError = message.includes("not found") || message.includes("not supported") || message.includes("unsupported") || message.includes("model");
        if ((status === 400 || message.includes("INVALID_ARGUMENT")) && !isModelNotFoundError) {
          console.error(`[Client API] Bad Request (non-model error). Aborting fallback loop.`);
          throw err;
        }

        if (r === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }
  throw lastError || new Error("Failed to generate content with any available client-side model");
}

// Interceptor function to generate content on the client side using their Gemini API key
async function runClientSideGemini(url: string, body: any): Promise<any> {
  const apiKey = getClientGeminiKey();
  if (!apiKey) {
    throw new Error('MISSING_CLIENT_KEY');
  }

  // Initialize the Gemini Client
  const ai = new GoogleGenAI({ apiKey });

  if (url.endsWith('/api/generate-names')) {
    const { prompt, industry, country, style, language } = body;
    const systemPrompt = `You are a world-class brand naming specialist, linguist, and startup identity consultant. 
Your task is to generate 8-10 extremely professional, clever, modern, and highly memorable brand name ideas based on the user's requirements. 
Perform deep contextual reasoning to construct names that stand out, have great phonetics, and convey strong brand identity. 
Ensure the names are highly innovative, marketable, and not generic. Use creative techniques like portmanteaus, linguistic twists, evocative real words, or abstract concepts that perfectly capture the essence of the brand.

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

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "[]";
    const data = robustParseJSON(text);
    return { success: true, data };
  }

  if (url.endsWith('/api/generate-logo')) {
    const { prompt, style } = body;
    const systemPrompt = `You are a world-class vector graphic designer and branding typographer specializing in minimalist, responsive, iconic, and high-impact logo designs.
Generate an exceptional, premium, and breathtaking brand logo in valid SVG format representing the concept: "${prompt}".
Style requested: ${style || "minimalist"} (can be minimalist, luxury, modern, gaming, technology, corporate, creative, threeD).

Requirements for the SVG:
- Output must be a strictly valid XML/SVG element.
- The viewBox MUST be "0 0 500 500".
- The design must be incredibly professional, visually striking, balanced, and high-end. Avoid generic clipart shapes. Think like a top-tier design agency.
- Use gorgeous gradients, rich contrasting colors, or elegant monochrome based on the style. Include proper linearGradient or radialGradient definitions inside a <defs> block to add depth and professional quality.
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
- The entire SVG string must be continuous, or use standard \n escape sequences for line breaks. Do not include literal unescaped newlines inside the JSON string field.

Return a JSON object matching this structure:
{
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'>...content...</svg>",
  "concept": "Deep explanation of the design concept, shapes used, symmetry, and color psychology.",
  "primaryColor": "#Hex",
  "secondaryColor": "#Hex"
}
Do not include markdown markers like \`\`\`json. Return pure JSON object.`;

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "{}";
    const data = robustParseJSON(text);
    return { success: true, data };
  }

  if (url.endsWith('/api/generate-slogans')) {
    const { prompt, length, language } = body;
    const systemPrompt = `You are an award-winning advertising creative director and master copywriter.
Generate 10 distinct, highly catchy, emotionally resonant, and memorable brand slogans/taglines for: "${prompt}".
Slogan length target: ${length || "short"} (can be short or long).
Output language: ${language || "en"}. If "ar", the slogans must be elegantly written in eloquent, native, and highly persuasive Arabic.
Ensure the slogans are punchy, original, and deeply connect with the target audience's aspirations. Avoid clichés.

Return a JSON array of objects strictly matching this structure:
[
  {
    "slogan": "The catchy tagline",
    "vibe": "The emotional vibe or tone (e.g. Inspiring, Bold, Tech, Professional, Playful, Warm)"
  }
]
Do not include markdown markers like \`\`\`json. Return pure JSON array.`;

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "[]";
    const data = robustParseJSON(text);
    return { success: true, data };
  }

  if (url.endsWith('/api/generate-brand-kit')) {
    const { name, prompt, language } = body;
    const systemPrompt = `You are a premium branding agency director and creative strategist. Create a comprehensive, top-tier brand kit and identity guidelines for the business name "${name}" based on this description: "${prompt}".
Output language must be: ${language || "en"}. If "ar", values must be translated to professional branding Arabic.
Provide deeply considered color combinations and typography pairings that reflect modern luxury, tech-forwardness, or the exact vibe requested.

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

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "{}";
    const data = robustParseJSON(text);
    return { success: true, data };
  }

  if (url.endsWith('/api/generate-palette')) {
    const { prompt, harmony, style, language } = body;
    const systemPrompt = `You are an elite digital brand designer, UI/UX color specialist, and color psychologist.
Your task is to generate a highly professional, cohesive 5-color palette based on the user's requirements.
Requirements:
- Prompt/Vibe description: ${prompt || "warm sunset / luxury coffee shop"}
- Harmony rule: ${harmony || "Analogous"} (Monochromatic, Analogous, Complementary, Triadic, Split Complementary, Golden Ratio, Designer Choice)
- Stylistic direction: ${style || "Standard"} (Pastel, Vintage, Neon, Deep/Warm, Cold/Nordic, Corporate, Minimalist, Vibrant)
- Output Language: ${language || "en"}

Generate 5 distinct HEX color codes that fit perfectly together as a high-quality, aesthetically stunning brand palette. Name each color beautifully (e.g. "Vintage Ochre", "Electric Mint") and deeply describe its psychological effect or usage role in a brand UI (e.g., Primary branding element, Canvas bg, Accent call-to-action).

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

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "{}";
    const data = robustParseJSON(text);
    return { success: true, data };
  }

  if (url.endsWith('/api/auto-tag')) {
    const { items, type } = body;
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

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "[]";
    const data = robustParseJSON(text);
    return { success: true, tags: data };
  }

  if (url.endsWith('/api/compare-assets')) {
    const { items, type, language } = body;
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

    const response = await generateClientContentWithRetry(ai, systemPrompt);

    const text = response.text || "{}";
    const data = robustParseJSON(text);
    return { success: true, comparison: data };
  }

  throw new Error(`Unsupported client-side API endpoint: ${url}`);
}

export async function fetchAPI(url: string, options: RequestInit = {}): Promise<any> {
  const body = options.body ? JSON.parse(options.body as string) : {};

  // If we have a custom client-side Gemini key set, always prefer calling it client-side
  // for rapid response and offline capability, or to avoid server resource limits!
  if (isClientGeminiModeActive()) {
    try {
      return await runClientSideGemini(url, body);
    } catch (err: any) {
      if (err.message && err.message.includes("Unsupported client-side API endpoint")) {
        console.log(`Endpoint ${url} not supported client-side, falling back to server...`);
      } else {
        console.error('Client-side Gemini execution failed:', err);
        throw new Error(`Client-side API Error: ${err.message}. Please check your Gemini API Key.`);
      }
    }
  }

  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      const contentType = response.headers.get('content-type') || '';
      
      // Check if response is HTML (which happens when rewrites fall back to index.html on static environments)
      if (contentType.includes('text/html')) {
        const text = await response.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.includes('<html')) {
          const lang = (typeof window !== 'undefined' && localStorage.getItem('brandforge_language')) === 'ar' ? 'ar' : 'en';
          if (lang === 'ar') {
            throw new Error("تنبيه: الخادم الخلفي غير متاح. إذا كنت تستخدم Render، يرجى التأكد من تكوين التطبيق كـ Web Service وتعيين مفاتيح البيئة (OPENROUTER_API_KEY) أو (GEMINI_API_KEY) في إعدادات البيئة هناك. لتشغيل التطبيق فوراً، يرجى الضغط على زر المفتاح 🔑 في شريط التنقل العلوي وإدخال مفتاح Gemini API الخاص بك.");
          } else {
            throw new Error("Notice: The backend server is currently unavailable. If you are hosting on Render, please make sure you configured a 'Web Service' (not a Static Site) and set 'OPENROUTER_API_KEY' or 'GEMINI_API_KEY' in Render's Environment Variables. To run immediately, please click the Key 🔑 icon in the top navigation bar and enter your own Gemini API Key.");
          }
        }
      }

      if (!response.ok) {
        let errorMessage = "Unknown server error";
        try {
          const errorJson = await response.clone().json();
          errorMessage = errorJson.error || JSON.stringify(errorJson);
        } catch (jsonErr) {
          try {
            errorMessage = await response.text();
          } catch (textErr) {
            errorMessage = response.statusText || `${response.status}`;
          }
        }
        console.error(`[API Connection Error] Failed to call ${url}: Status ${response.status} - ${errorMessage}`);
        throw new Error(`API Error: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      lastError = error;
      console.warn(`[API Network Warning] Attempt ${attempt + 1}/${maxRetries + 1} to fetch ${url} failed:`, error);
      
      const errMsg = String(error.message || "");
      if (errMsg.includes("maintenance") || errMsg.includes("اصلاحات") || errMsg.includes("API Error") || errMsg.includes("Quota") || errMsg.includes("Key") || errMsg.includes("Notice") || errMsg.includes("تنبيه")) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  console.error(`[API Network Error] Network request to ${url} failed after ${maxRetries + 1} attempts:`, lastError);
  throw lastError;
}
