const API = "https://sardineisamazing.onrender.com"; // your Render URL

const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Send message
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  await fetch(`${API}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  input.value = "";
  loadMessages();
}

// Load messages from backend
async function loadMessages() {
  const res = await fetch(`${API}/messages`);
  const msgs = await res.json();

  chat.innerHTML = "";
  msgs.forEach(m => {
    const div = document.createElement("div");
    div.textContent = m.text;
    chat.appendChild(div);
  });

  chat.scrollTop = chat.scrollHeight;
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// Auto-refresh chat every 0.8s
setInterval(loadMessages, 800);

// Initial load
loadMessages();
