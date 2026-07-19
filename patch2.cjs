const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `        // Handle 402 Payment Required by retrying with a free model
        if (status === 402) {
          console.log(\`[Backend API] OpenRouter returned 402. Insufficient credits. Retrying with openrouter/free model.\`);
          response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": \`Bearer \${openRouterKey}\`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ai.studio/build",
              "X-Title": "BrandCraft AI Studio Applet"
            },
            body: JSON.stringify({
              model: "openrouter/free",
              messages: [
                {
                  role: "user",
                  content: params.contents || ""
                }
              ],
              temperature: params.config?.temperature ?? 0.3,
              max_tokens: initialMaxTokens,
              response_format: params.config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
            })
          });
        }`;

const replacementStr = `        if (status === 402) {
          if (process.env.GEMINI_API_KEY) {
             console.warn("[Backend API] OpenRouter 402 Insufficient credits. Falling back to Gemini.");
             throw new Error("FALLBACK_TO_GEMINI");
          } else {
             throw new Error("HARD_FAIL: OpenRouter API error: Insufficient credits. Please top up your account at openrouter.ai/settings/credits.");
          }
        }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
}

const catchStr = `    } catch (openRouterErr: any) {
      throw new Error("DEBUG_OPENROUTER_ERROR: " + openRouterErr.message + "\\n" + openRouterErr.stack);
    }`;

const catchRepl = `    } catch (openRouterErr: any) {
      if (openRouterErr.message && openRouterErr.message.includes("HARD_FAIL")) {
        throw new Error(openRouterErr.message.replace("HARD_FAIL: ", ""));
      }
      console.log(\`[Backend API] OpenRouter generation unavailable: \${openRouterErr.message}. Falling back to standard Gemini API client.\`);
    }`;

if (content.includes(catchStr)) {
  content = content.replace(catchStr, catchRepl);
}

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts successfully");
