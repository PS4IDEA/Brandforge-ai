async function test() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemma-2-9b-it:free",
      messages: [{ role: "user", content: "hello" }],
      response_format: { type: "json_object" }
    })
  });
  console.log(response.status, await response.text());
}
test();
