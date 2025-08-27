const BACKEND_URL = "https://mathhosting-github-io.onrender.com/chat";

let sessionId = null;
let sessionUA = null;

// Custom unique User-Agent generator
function generateUniqueUserAgent() {
  const osList = [
    "Windows NT 10.0; Win64; x64",
    "Macintosh; Intel Mac OS X 10_15_7",
    "X11; Linux x86_64",
    "iPhone; CPU iPhone OS 14_0 like Mac OS X",
    "Android 12; Mobile"
  ];

  const browsers = ["Chrome", "Firefox", "Edge", "Safari"];
  const major = Math.floor(Math.random() * 100) + 1;
  const minor = Math.floor(Math.random() * 50);
  const build = Math.floor(Math.random() * 4000) + 1000;
  const patch = Math.floor(Math.random() * 100) + 1;

  const os = osList[Math.floor(Math.random() * osList.length)];
  const browser = browsers[Math.floor(Math.random() * browsers.length)];

  switch (browser) {
    case "Chrome":
      return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.${build}.${patch} Safari/537.36`;
    case "Firefox":
      return `Mozilla/5.0 (${os}; rv:${major}.0) Gecko/20100101 Firefox/${major}.0`;
    case "Edge":
      return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.${build}.${patch} Safari/537.36 Edg/${major}.0.${build}.${patch}`;
    case "Safari":
      return `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${major}.0 Safari/605.1.15`;
  }
}

async function startNewChat() {
    const res = await fetch(BACKEND_URL.replace("/chat","/new_session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_session_id: sessionId })
    });
    const data = await res.json();
    sessionId = data.session_id;              // new session ID
    document.getElementById("chat-box").innerHTML = ""; // wipe chat UI
}


// Send a message
async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        user_agent: sessionUA
      })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");
  } catch (err) {
    console.error("Error sending message:", err);
    addMessage("⚠️ Error sending message. Try again.", "bot");
  }
}

// Add message to chat UI
function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;  // plain text (no marked)
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Event listeners
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});
document.getElementById("new-chat-btn").addEventListener("click", startNewChat);

// Initialize first chat on page load
startNewChat();
