const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        if (status === 402) {
          if (process.env.GEMINI_API_KEY) {
             console.warn("[Backend API] OpenRouter 402 Insufficient credits. Falling back to Gemini.");
             throw new Error("FALLBACK_TO_GEMINI");
          } else {
             throw new Error("HARD_FAIL: OpenRouter API error: Insufficient credits. Please top up your account at openrouter.ai/settings/credits.");
          }
        }`;

const replStr = `        if (status === 402) {
          if (process.env.GEMINI_API_KEY) {
             console.warn("[Backend API] OpenRouter 402 Insufficient credits. Falling back to Gemini.");
             throw new Error("FALLBACK_TO_GEMINI");
          } else {
             console.warn("[Backend API] OpenRouter 402 Insufficient credits. Falling back to free model.");
             response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
               method: "POST",
               headers: {
                 "Authorization": \`Bearer \${openRouterKey}\`,
                 "Content-Type": "application/json",
                 "HTTP-Referer": "https://ai.studio/build",
                 "X-Title": "BrandCraft AI Studio Applet"
               },
               body: JSON.stringify({
                 model: "google/gemma-4-26b-a4b-it:free",
                 messages: [{ role: "user", content: params.contents || "" }],
                 temperature: params.config?.temperature ?? 0.3,
                 max_tokens: initialMaxTokens,
                 response_format: params.config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
               })
             });
             
             if (!response.ok) {
                 const errFree = await response.text();
                 throw new Error("HARD_FAIL: OpenRouter API error: Insufficient credits. Please top up your account at openrouter.ai/settings/credits. (Free fallback also failed: " + errFree + ")");
             }
          }
        }`;

if (content.includes(targetStr)) {
   content = content.replace(targetStr, replStr);
   fs.writeFileSync('server.ts', content);
   console.log("Patched server.ts with free fallback!");
} else {
   console.log("Could not find targetStr!");
}
