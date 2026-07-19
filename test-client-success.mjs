import { GoogleGenAI } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "say hi",
      config: { responseMimeType: "application/json" }
    });
    console.log("Type of response.text:", typeof response.text);
    console.log("Value:", response.text);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}
test();
