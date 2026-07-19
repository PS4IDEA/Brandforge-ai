const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf8');

const targetStr = `  if (isClientGeminiModeActive()) {
    try {
      return await runClientSideGemini(url, body);
    } catch (err: any) {
      console.error('Client-side Gemini execution failed, attempting server fallback:', err);
    }
  }`;

const replStr = `  if (isClientGeminiModeActive()) {
    try {
      return await runClientSideGemini(url, body);
    } catch (err: any) {
      if (err.message && err.message.includes("Unsupported client-side API endpoint")) {
        console.log(\`Endpoint \${url} not supported client-side, falling back to server...\`);
      } else {
        console.error('Client-side Gemini execution failed:', err);
        throw new Error(\`Client-side API Error: \${err.message}. Please check your Gemini API Key.\`);
      }
    }
  }`;

if (content.includes(targetStr)) {
   content = content.replace(targetStr, replStr);
   fs.writeFileSync('src/lib/api.ts', content);
   console.log("Patched api.ts successfully");
} else {
   console.log("Could not find targetStr");
}
