async function test() {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemma-4-26b-a4b-it:free",
      messages: [{ role: "user", content: "Say OK" }],
      response_format: { type: "json_object" }
    })
  });
  console.log(response.status, await response.text());
}
test();
