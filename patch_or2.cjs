const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `                 model: "google/gemma-4-26b-a4b-it:free",
                 messages: [{ role: "user", content: params.contents || "" }]
               })
             });`;

const replStr = `                 model: "google/gemma-4-26b-a4b-it:free",
                 messages: [{ role: "user", content: params.contents || "" }],
                 temperature: params.config?.temperature ?? 0.3,
                 max_tokens: initialMaxTokens,
                 response_format: params.config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
               })
             });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replStr);
  fs.writeFileSync('server.ts', content);
  console.log("Patched server.ts with options");
} else {
  console.log("Could not find targetStr");
}
