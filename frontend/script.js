const BACKEND_URL = "https://mathhosting-github-io.onrender.com/chat"; // your backend URL

document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Theme switching
const themeToggle = document.getElementById("theme-toggle");
const themes = ["light", "dark", "galaxy"];
let currentTheme = 0;

themeToggle.addEventListener("click", () => {
  currentTheme = (currentTheme + 1) % themes.length;
  document.body.className = themes[currentTheme];
  themeToggle.textContent =
    themes[currentTheme] === "light"
      ? "🌙 Dark Mode"
      : themes[currentTheme] === "dark"
      ? "🌌 Galaxy Mode"
      : "☀️ Light Mode";
});

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
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();

    // Parse Markdown
    const botReply = marked.parse(data.reply);
    addMessage(botReply, "bot", true);
  } catch (err) {
    addMessage("**Error:** Could not reach AI.", "bot", true);
    console.error(err);
  }
}

function addMessage(text, sender, isHTML = false) {
  const chatBox = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  if (isHTML) {
    msg.innerHTML = text;
  } else {
    msg.innerText = text;
  }
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
