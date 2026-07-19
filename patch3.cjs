const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const errPattern = 'throw new Error("DEBUG_OPENROUTER_ERROR: " + openRouterErr.message + "\\\\n" + openRouterErr.stack);';

if (content.includes(errPattern)) {
  content = content.replace(errPattern, `
      if (openRouterErr.message && openRouterErr.message.includes("HARD_FAIL")) {
        throw new Error(openRouterErr.message.replace("HARD_FAIL: ", ""));
      }
      // Re-throw any other OpenRouter error so it reaches the client instead of silently failing
      throw openRouterErr;
  `);
  fs.writeFileSync('server.ts', content);
  console.log("Patched catch block");
} else {
  console.log("Pattern not found");
}
