import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = `You are a world-class vector graphic designer and branding typographer specializing in minimalist, responsive, iconic, and high-impact logo designs.
Generate an exceptional, premium, and breathtaking brand logo in valid SVG format representing the concept: "Tech logo".
Style requested: minimalist.

Return a JSON object matching this structure:
{
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'>...content...</svg>",
  "concept": "Deep explanation of the design concept, shapes used, symmetry, and color psychology.",
  "primaryColor": "#Hex",
  "secondaryColor": "#Hex"
}
Do not include markdown markers like \`\`\`json. Return pure JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
