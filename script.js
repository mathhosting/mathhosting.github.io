const API = "https://sardineisamazing.onrender.com"; // your Render URL

// DOM elements
const usernameInput = document.getElementById("usernameInput");
const profileInput = document.getElementById("profileInput");
const registerBtn = document.getElementById("registerBtn");
const userListDiv = document.getElementById("userList");
const searchInput = document.getElementById("searchInput");
const chatHeader = document.getElementById("chatHeader");
const chatDiv = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// State
let currentUser = JSON.parse(localStorage.getItem("chatUser")) || null;
let currentChatUser = null;

// --- Register / Login ---
registerBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const profile = profileInput.value.trim();
  if (!username) return alert("Username required");

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, profile_picture: profile })
  });
  const data = await res.json();
  if (data.error) return alert(data.error);

  currentUser = data.user;
  localStorage.setItem("chatUser", JSON.stringify(currentUser));
  usernameInput.value = "";
  profileInput.value = "";
  loadUsers();
};

// --- Load / Search Users ---
async function loadUsers(query = "") {
  if (!currentUser) return;
  const res = await fetch(`${API}/users?search=${encodeURIComponent(query)}`);
  const users = await res.json();
  userListDiv.innerHTML = "";
  users.forEach(u => {
    if (u.id === currentUser.id) return; // skip self
    const div = document.createElement("div");
    div.classList.add("userItem");
    div.innerHTML = `<img src="${u.profile_picture || 'https://via.placeholder.com/30'}"><span>${u.username}</span>`;
    div.onclick = () => selectChat(u);
    userListDiv.appendChild(div);
  });
}

searchInput.addEventListener("input", () => {
  loadUsers(searchInput.value);
});

// --- Select Chat ---
function selectChat(user) {
  currentChatUser = user;
  chatHeader.textContent = user.username;
  loadMessages();
}

// --- Load Messages ---
async function loadMessages() {
  if (!currentUser || !currentChatUser) return;
  const res = await fetch(`${API}/messages?user1=${currentUser.id}&user2=${currentChatUser.id}`);
  const messages = await res.json();
  chatDiv.innerHTML = "";

  messages.forEach(m => {
    const div = document.createElement("div");
    div.classList.add("message");

    const img = document.createElement("img");
    img.src = m.from_profile || './download.jpg';

    const content = document.createElement("div");
    content.classList.add("messageContent");
    content.textContent = m.text;

    // delete button if message is from current user
    if (m.from_user === currentUser.id) {
      const delBtn = document.createElement("span");
      delBtn.textContent = "×";
      delBtn.classList.add("deleteBtn");
      delBtn.onclick = async () => {
        await fetch(`${API}/messages/${m.id}`, { method: "DELETE" });
        loadMessages();
      };
      content.appendChild(delBtn);
    }

    div.appendChild(img);
    div.appendChild(content);
    chatDiv.appendChild(div);
  });

  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// --- Send Message ---
sendBtn.onclick = async () => {
  if (!currentChatUser || !messageInput.value.trim()) return;
  await fetch(`${API}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_user: currentUser.id,
      to_user: currentChatUser.id,
      text: messageInput.value.trim()
    })
  });
  messageInput.value = "";
  loadMessages();
};

messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendBtn.onclick();
});

// --- Auto-refresh messages ---
setInterval(loadMessages, 1000);

// --- Auto-load users ---
if (currentUser) loadUsers();
