async function test() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const systemPrompt = `You are a world-class vector graphic designer and branding typographer specializing in minimalist, responsive, iconic, and high-impact logo designs.
Generate an exceptional and creative brand logo in valid SVG format representing the concept: "A cool tech logo".
Style requested: technology (can be minimalist, luxury, modern, gaming, technology, corporate, creative, threeD).

Requirements for the SVG:
- Output must be a strictly valid XML/SVG element.
- Do NOT output any \`\`\`xml or \`\`\`svg markdown blocks, ONLY the raw valid JSON.
- Embed a descriptive <defs> gradient and professional color combinations.
- Provide a conceptual explanation.

Return a JSON object matching this structure:
{
  "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'>...content...</svg>",
  "concept": "Deep explanation of the design concept, shapes used, symmetry, and color psychology.",
  "primaryColor": "#Hex",
  "secondaryColor": "#Hex"
}
Do not include markdown markers like \`\`\`json. Return pure JSON object.`;

  let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ai.studio/build",
      "X-Title": "BrandCraft AI Studio Applet"
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [{ role: "user", content: systemPrompt }],
      response_format: { type: "json_object" }
    })
  });
  console.log(response.status, await response.text());
}
test();
