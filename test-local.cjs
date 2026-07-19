async function test() {
  const response = await fetch("http://localhost:3000/api/generate-logo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "A cool tech logo", style: "technology" })
  });
  console.log(response.status, await response.text());
}
test();
