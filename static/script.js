import { Client } from "https://unpkg.com/@gradio/client/dist/client.mjs";

let client;
(async () => {
  client = await Client.connect("amd/gpt-oss-120b-chatbot");
})();

document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text || !client) return;

  addMessage(text, "user");
  input.value = "";

  try {
    const result = await client.predict("/chat", {
      message: text,
      system_prompt: "You are a helpful assistant.",
      temperature: 0.7,
      reasoning_effort: "medium",
      enable_browsing: true
    });

    let answer = result.data;
    answer = answer.replace(/\*+/g, "").replace(/[`#_>]/g, ""); // clean markdown

    addMessage(answer, "bot");
  } catch (err) {
    addMessage("Error: Could not connect to AI.", "bot");
    console.error(err);
  }
}

function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
