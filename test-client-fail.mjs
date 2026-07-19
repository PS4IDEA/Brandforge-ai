import { GoogleGenAI } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({ apiKey: "INVALID_KEY_12345" });
  try {
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "hello",
      config: { responseMimeType: "application/json" }
    });
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}
test();
