const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  'fs.writeFileSync("or-error.log", openRouterErr.message + "\\n" + openRouterErr.stack); console.log(`[Backend API] OpenRouter generation unavailable: ${openRouterErr.message}. Falling back to standard Gemini API client or local mock generator.`);',
  'throw new Error("DEBUG_OPENROUTER_ERROR: " + openRouterErr.message + "\\n" + openRouterErr.stack);'
);
fs.writeFileSync('server.ts', content);
