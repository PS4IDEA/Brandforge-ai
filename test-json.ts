import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const systemPrompt = `You are a world-class brand naming specialist, linguist, and startup identity consultant. Your task is to generate 8-10 extremely professional, clever, modern, and highly memorable brand name ideas based on the user's requirements. Perform deep contextual reasoning to construct names that stand out, have great phonetics, and convey strong brand identity.

Requirements:
- User Prompt / Concept: tech
- Industry/Niche: tech
- Style Preference: Modern
- Language/Localization: en

CRITICAL: Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json. The JSON array must exactly match this structure:
[
  {
    "name": "BrandName",
    "meaning": "Deep and clever analysis of why this name is perfect, its linguistic roots, emotional appeal, and brand story.",
    "meaningAr": "شرح عميق ومبدع باللغة العربية لقصة هذا الاسم",
    "style": "The category style",
    "domainSuggestions": ["brandname.com", "brandname.ai"]
  }
]`;

  try {
    const res = await ai.models.generateContent({ 
      model: "gemini-2.5-flash", 
      contents: systemPrompt,
      config: { responseMimeType: "application/json" }
    });
    console.log("RAW TEXT:");
    console.log(res.text);
  } catch (err) {
    console.error("FAIL", err);
  }
}
run();
