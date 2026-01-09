import fs from "fs";

const scenario = JSON.parse(
  fs.readFileSync("test-scenarios/basic.json", "utf8")
);

async function run() {
  let messages = [];

  for (const turn of scenario.turns) {
    messages.push({ role: "user", content: turn });

    const res = await fetch(process.env.CHATBOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: scenario.session_id,
        messages
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    if (!json.answer || typeof json.answer !== "string") {
      throw new Error("Svar mangler eller er ikke string");
    }
  }

  console.log("PASS: chatbot svarer korrekt på alle turns");
}

run().catch(err => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
