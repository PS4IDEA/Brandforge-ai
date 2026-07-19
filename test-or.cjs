async function test() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
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
      messages: [{ role: "user", content: "hello" }],
      response_format: { type: "json_object" }
    })
  });
  console.log(response.status, await response.text());
}
test();
