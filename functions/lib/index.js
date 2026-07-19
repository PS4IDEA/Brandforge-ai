"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const genai_1 = require("@google/genai");
const nodemailer_1 = __importDefault(require("nodemailer"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.post("/api/send-email", async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.zoho.com',
            port: parseInt(process.env.SMTP_PORT || '465', 10),
            secure: process.env.SMTP_PORT ? process.env.SMTP_PORT === '465' : true,
            auth: {
                user: process.env.SMTP_USER || 'brandforge-ai@zohomail.com',
                pass: process.env.SMTP_PASS || 'MkXZGzepdgtf',
            },
        });
        const smtpUser = process.env.SMTP_USER || 'brandforge-ai@zohomail.com';
        const smtpPass = process.env.SMTP_PASS || 'MkXZGzepdgtf';
        if (!smtpUser || !smtpPass) {
            console.warn("SMTP credentials not provided.");
            return res.json({ success: true, message: "Simulated email send." });
        }
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"BrandForge AI" <${smtpUser}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent: %s", info.messageId);
        res.json({ success: true, messageId: info.messageId });
    }
    catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Lazy-loaded GoogleGenAI client to prevent crash if key is missing
let aiInstance = null;
function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set. Please configure it in your Secrets/Settings panel.");
    }
    if (!aiInstance) {
        aiInstance = new genai_1.GoogleGenAI({
            apiKey,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build',
                }
            }
        });
    }
    return aiInstance;
}
function cleanJSON(text) {
    let cleaned = text.trim();
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    return cleaned;
}
async function generateContentWithRetry(ai, params, maxRetries = 2) {
    const modelsToTry = [
        params.model || "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash"
    ];
    let lastError = null;
    for (const model of modelsToTry) {
        for (let r = 0; r < maxRetries; r++) {
            try {
                console.log(`Attempting generation with model ${model} (attempt ${r + 1}/${maxRetries})`);
                const response = await ai.models.generateContent({
                    ...params,
                    model,
                });
                return response;
            }
            catch (err) {
                lastError = err;
                console.error(`Error with model ${model} on attempt ${r + 1}:`, err);
                const status = err.status || (err.response && err.response.status) || err.statusCode;
                const message = err.message || "";
                // If it's a 400 (bad request), don't retry or fall back, just throw
                if (status === 400 || message.includes("INVALID_ARGUMENT") || message.includes("400")) {
                    throw err;
                }
                // Wait with exponential backoff before retrying
                if (r < maxRetries - 1) {
                    const delay = Math.pow(2, r) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
    }
    // If we exhausted all options, throw a clear error with details
    throw new Error(`All model endpoints are currently experiencing high demand. Details: ${lastError?.message || "Unavailable"}`);
}
// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------
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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "[]";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, data });
    }
    catch (error) {
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
Style requested: ${style || "minimalist"} (can be minimalist, luxury, modern, gaming, technology, corporate, creative).

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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "{}";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, data });
    }
    catch (error) {
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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "[]";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, data });
    }
    catch (error) {
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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "{}";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error("Error generating brand kit:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to generate brand kit" });
    }
});
// Complete Interactive Color Palette Generator API
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
Do not include any markdown block wrappers like \\\`\\\`\\\`json. Return pure JSON.`;
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "{}";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error("Error generating color palette:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to generate color palette" });
    }
});
// 5. Auto-Tag Assets
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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "[]";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, tags: data });
    }
    catch (error) {
        console.error("Error auto-tagging:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to auto-tag" });
    }
});
// 6. Compare Assets
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
        const response = await generateContentWithRetry(ai, {
            model: "gemini-3.5-flash",
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const text = response.text || "{}";
        const data = JSON.parse(cleanJSON(text));
        res.json({ success: true, comparison: data });
    }
    catch (error) {
        console.error("Error comparing assets:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to compare assets" });
    }
});
// Export the Express app as a Firebase Cloud Function named 'api'
exports.api = (0, https_1.onRequest)({ secrets: ["GEMINI_API_KEY"], cors: true }, app);
//# sourceMappingURL=index.js.map