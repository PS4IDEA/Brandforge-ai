import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

(globalThis as any).fetch = fetch;

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say OK",
    });
    console.log("Success:", res.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
