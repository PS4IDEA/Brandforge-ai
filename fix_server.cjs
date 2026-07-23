const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `      strategy: {
        title: isAr ? \`استراتيجية التوسع الشاملة لـ \${concept}\` : \`The Complete Scaling Strategy for \${concept}\`,
        visionMission: isAr 
          ? "الرؤية: قيادة الابتكار والريادة في قطاع الأعمال. الرسالة: تمكين الأفراد والمؤسسات من تحقيق طموحاتهم عبر خدمات موثوقة ومتميزة."
          : "Vision: Setting new benchmarks for industry excellence. Mission: Empowering founders to scale efficiently with high-fidelity branding.",
        valueProposition: isAr 
          ? "تقديم حلول وهوية متكاملة فوراً وبدقة متناهية تفوق التوقعات."
          : "Delivering institutional-grade brand identities instantly at exceptional speed.",
        persona: isAr 
          ? "الجمهور المستهدف الذي يبحث عن الجودة والحلول العصرية والاحترافية."
          : "The ambitious professional seeking top-tier brand positioning and modern aesthetic clarity.",
        competitors: isAr 
          ? "التفوق عبر الابتكار الفوري، السرعة، والمرونة العالية في تقديم الخدمة."
          : "Outperforming traditional channels through rapid turnaround times and precision design.",
        roadmap: [
          { phase: isAr ? "المرحلة الأولى: البناء والانتشار" : "Phase 1: Brand Activation", details: isAr ? "إطلاق الهوية والترويج الأولي في القنوات المستهدفة." : "Deploying core visual assets and launching target outreach." },
          { phase: isAr ? "المرحلة الثانية: التموضع والنمو" : "Phase 2: Market Growth", details: isAr ? "بناء مجتمع مخلص والاندماج مع خدمات الدعم." : "Cultivating customer feedback loops and expanding service channels." },
          { phase: isAr ? "المرحلة الثالثة: الريادة والتوسع" : "Phase 3: Operational Scaling", details: isAr ? "تحقيق التوسع والابتكار المستمر." : "Automating operations and entering multi-market domains." }
        ]
      }
    };
  }
  // 7. Default fallback for SEO & others
  else {
    parsedData = {
      keywords: isAr ? [
        { word: \`أفضل حلول \${concept}\`, volume: "10K - 100K", difficulty: "Medium" },
        { word: \`تصميم هوية \${concept} احترافية\`, volume: "1K - 10K", difficulty: "Low" },
        { word: \`خدمات ومميزات \${concept}\`, volume: "500 - 1K", difficulty: "Low" }
      ] : [
        { word: \`best \${concept} solutions\`, volume: "10K - 100K", difficulty: "Medium" },
        { word: \`professional \${concept} branding\`, volume: "1K - 10K", difficulty: "Low" },
        { word: \`top \${concept} strategy\`, volume: "500 - 1K", difficulty: "Low" }
      ],
      competitors: isAr ? [
        "شركة ريادة للحلول الذكية",
        "منصة براند أب للهوية الرقمية"
      ] : [
        "Apex Creative Partners",
        "BrandForge Digital Group"
      ],
      tips: isAr ? [
        "دمج الكلمة المفتاحية الرئيسية في العناوين الرئيسية بوضوح.",
        "تحسين سرعة تحميل صور الشعارات والمحتوى البصري.",
        "كتابة نصوص بديلة (Alt Text) دقيقة للصور."
      ] : [
        "Integrate target keywords into primary header tags naturally.",
        "Optimize branding imagery for fast web delivery.",
        "Maintain clean URL structures for search engines."
      ]
    };
  }

  return {
    response: {
      text: () => JSON.stringify(parsedData)
    },
    parsed: parsedData
  };
}

async function generateContentWithRetry(ai, params, maxRetries = 1, jsonParser) {
  let lastError = null;

  // 1. Try Gemini API first if ai client is available
  if (ai) {
    const rawModel = params.model;
    const mappedModel = rawModel === "gemini-2.0-flash-exp" ? "gemini-2.0-flash" : rawModel;
    
    const modelsToTry = Array.from(new Set([
      mappedModel,
      "gemini-2.0-flash",
      "gemini-2.5-flash"
    ].filter(Boolean)));

    for (let m = 0; m < modelsToTry.length; m++) {
      const model = modelsToTry[m];
      for (let r = 0; r < maxRetries; r++) {
        try {
          console.log(\`[Backend API] Attempting Gemini generation with model \${model}\`);
          const response = await ai.models.generateContent({
            ...params,
            model,
            config: {
              ...params.config,
              // Never pass maxOutputTokens=0 as it crashes the API. Default to 1200 if not set.
              maxOutputTokens: params.config?.maxOutputTokens > 0 ? params.config.maxOutputTokens : 1200
            }
          });

          if (jsonParser) {
            const text = response.text();
            try {
              const parsed = jsonParser(text);
              console.log(\`[Backend API] SUCCESS with Gemini model \${model} (Valid JSON Parsed)\`);
              return { response, parsed };
            } catch (parseErr) {
              console.log(\`[Backend API] JSON parsing failed for model \${model}: \${parseErr.message}\`);
              throw new Error(\`JSON format invalid: \${parseErr.message}\`);
            }
          }
          console.log(\`[Backend API] SUCCESS with Gemini model \${model}\`);
          return { response, parsed: null };
        } catch (err) {
          lastError = err;
          const msg = err.message || "";
          if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded")) {
            console.log(\`[Backend API] Gemini model \${model} rate-limited (Quota Exceeded). Seamlessly switching to local intelligent generator.\`);
            break; // Skip further retries for quota errors
          } else {
            console.log(\`[Backend API] Gemini model \${model} failed:\`, msg);
          }
        }
      }
    }
  }

  // 2. Fallback to OpenRouter if available
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const orModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
    console.log(\`[Backend API] Trying generation with OpenRouter using model \${orModel}\`);
    
    const initialMaxTokens = params.config?.maxOutputTokens ?? 1200;
    
    let promptText = "";
    if (typeof params.contents === "string") {
      promptText = params.contents;
    } else if (Array.isArray(params.contents)) {
      promptText = params.contents.map((msg) => {
        if (msg.parts && Array.isArray(msg.parts)) {
          return msg.parts.map((p) => p.text || "").join("\\n");
        }
        return typeof msg === 'string' ? msg : JSON.stringify(msg);
      }).join("\\n");
    } else if (typeof params.contents === "object" && params.contents !== null) {
      promptText = JSON.stringify(params.contents);
    }

    try {
      let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${openRouterKey}\`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "BrandCraft AI Studio Applet"
        },
        body: JSON.stringify({
          model: orModel,
          messages: [
            {
              role: "user",
              content: promptText || "Hello"
            }
          ],
          temperature: params.config?.temperature ?? 0.3,
          max_tokens: Math.min(initialMaxTokens, 500)
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(\`OpenRouter API status \${response.status}: \${errorData}\`);
      }

      const data = await response.json();
      const textResponse = data.choices?.[0]?.message?.content || "";
      
      const formattedResponse = {
        text: () => textResponse
      };

      if (jsonParser) {
        try {
          const parsed = jsonParser(textResponse);
          console.log(\`[Backend API] SUCCESS with OpenRouter model \${orModel} (Valid JSON Parsed)\`);
          return { response: formattedResponse, parsed };
        } catch (parseErr) {
          console.log(\`[Backend API] JSON parsing failed for OpenRouter model \${orModel}: \${parseErr.message}\`);
          throw new Error(\`JSON format invalid: \${parseErr.message}\`);
        }
      }

      console.log(\`[Backend API] SUCCESS with OpenRouter model \${orModel}\`);
      return { response: formattedResponse, parsed: null };
    } catch (openRouterErr) {
      console.log(\`[Backend API] OpenRouter generation skipped: \${openRouterErr.message}\`);
    }
  }

  // 3. Final fallback if AI backends are rate-limited or unavailable`;

const startIndex = content.indexOf('      strategy: {');
const endIndex = content.indexOf('  // 3. Final fallback if AI backends are rate-limited or unavailable') + '  // 3. Final fallback if AI backends are rate-limited or unavailable'.length;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('server.ts', content, 'utf8');
