const BACKEND_URL = "https://mathhosting-github-io.onrender.com/chat";  // backend serves frontend + API

let sessionId = null;

async function startNewSession() {
  const res = await fetch(`${BACKEND_URL}new_session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_session_id: sessionId })
  });
  const data = await res.json();
  sessionId = data.session_id;
  document.getElementById("chat-box").innerHTML = "";
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const res = await fetch(`${BACKEND_URL}chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, session_id: sessionId })
  });
  const data = await res.json();
  addMessage(data.reply + `\n(User-Agent: ${data.user_agent})`, "bot");
}

function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
document.getElementById("new-chat-btn").addEventListener("click", startNewSession);

// start a fresh session when page loads
startNewSession();
