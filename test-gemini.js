import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "Say hello!" });
    console.log("SUCCESS:", res.text);
  } catch (err) {
    console.error("FAIL", err);
  }
}
run();
