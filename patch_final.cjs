const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const catchStr = `    } catch (openRouterErr: any) {
      if (openRouterErr.message && openRouterErr.message.includes("HARD_FAIL")) {
        throw new Error(openRouterErr.message.replace("HARD_FAIL: ", ""));
      }
      console.log(\`[Backend API] OpenRouter generation unavailable: \${openRouterErr.message}. Falling back to standard Gemini API client.\`);
    }`;

const catchRepl = `    } catch (openRouterErr: any) {
      if (openRouterErr.message && openRouterErr.message.includes("HARD_FAIL")) {
        throw new Error(openRouterErr.message.replace("HARD_FAIL: ", ""));
      }
      if (!ai) {
        // If we don't have a fallback Gemini client, throw the OpenRouter error instead of returning mock data
        throw openRouterErr;
      }
      console.log(\`[Backend API] OpenRouter generation unavailable: \${openRouterErr.message}. Falling back to standard Gemini API client.\`);
    }`;

if (content.includes(catchStr)) {
  content = content.replace(catchStr, catchRepl);
  fs.writeFileSync('server.ts', content);
  console.log("Patched catch block correctly");
} else {
  console.log("Not found catch block");
}
