document.addEventListener("DOMContentLoaded", () => {
  const API = "https://sardineisamazing.onrender.com"; // your backend URL
  const defaultAvatar = "./download.jpg";
  
  // DOM elements
  const regUsername = document.getElementById("regUsername");
  const regPassword = document.getElementById("regPassword");
  const regProfile = document.getElementById("regProfile");
  const registerBtn = document.getElementById("registerBtn");
  
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  
  const authForm = document.getElementById("authForm");
  const loggedInUI = document.getElementById("loggedInUI");
  const logoutBtn = document.getElementById("logoutBtn");
  
  const searchInput = document.getElementById("searchInput");
  const userListDiv = document.getElementById("userList");
  
  const chatHeader = document.getElementById("chatHeader");
  const chatDiv = document.getElementById("chat");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  
  // State
  let currentUser = JSON.parse(localStorage.getItem("chatUser")) || null;
  let token = localStorage.getItem("token") || null;
  let currentChatUser = null;
  
  // ---------- Auth ----------
  
  // Register
  registerBtn.onclick = async () => {
    const username = regUsername.value.trim();
    const password = regPassword.value.trim();
    const profile = regProfile.value.trim();
    if (!username || !password) return alert("Fill username & password");
  
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, profile_picture: profile })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);
    alert("Registered! Please log in.");
    regUsername.value = regPassword.value = regProfile.value = "";
  };
  
  // Login
  loginBtn.onclick = async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    if (!username || !password) return alert("Fill username & password");
  
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);
  
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("chatUser", JSON.stringify(currentUser));
    loginUsername.value = loginPassword.value = "";
    showLoggedInUI();
    loadUsers();
  };
  
  // Logout
  logoutBtn.onclick = async () => {
    await fetch(`${API}/logout`, { method: "POST", headers: { Authorization: token } });
    localStorage.removeItem("token");
    localStorage.removeItem("chatUser");
    token = null;
    currentUser = null;
    currentChatUser = null;
    chatHeader.textContent = "";
    chatDiv.innerHTML = "";
    showAuthUI();
  };
  
  // ---------- UI ----------
  
  function showLoggedInUI() {
    authForm.style.display = "none";
    loggedInUI.style.display = "block";
  }
  
  function showAuthUI() {
    authForm.style.display = "block";
    loggedInUI.style.display = "none";
  }
  
  // ---------- Load Users ----------
  
  async function loadUsers(query = "") {
    if (!token) return;
    const res = await fetch(`${API}/users?search=${encodeURIComponent(query)}`, {
      headers: { Authorization: token }
    });
    const users = await res.json();
    userListDiv.innerHTML = "";
    users.forEach(u => {
      if (u.id === currentUser.id) return;
      const div = document.createElement("div");
      div.classList.add("userItem");
      div.innerHTML = `<img src="${u.profile_picture || defaultAvatar}"><span>${u.username}</span>`;
      div.onclick = () => selectChat(u);
      userListDiv.appendChild(div);
    });
  }
  
  searchInput.addEventListener("input", () => {
    loadUsers(searchInput.value);
  });
  
  // ---------- Chat ----------
  
  function selectChat(user) {
    currentChatUser = user;
    chatHeader.textContent = user.username;
    loadMessages();
  }
  
  async function loadMessages() {
    if (!token || !currentChatUser) return;
    const res = await fetch(`${API}/messages?user2=${currentChatUser.id}`, {
      headers: { Authorization: token }
    });
    const messages = await res.json();
    chatDiv.innerHTML = "";
    messages.forEach(m => {
      const div = document.createElement("div");
      div.classList.add("message");
  
      const img = document.createElement("img");
      img.src = m.from_profile || defaultAvatar;
  
      const content = document.createElement("div");
      content.classList.add("messageContent");
      content.textContent = m.text;
  
      if (m.from_user === currentUser.id) {
        const delBtn = document.createElement("span");
        delBtn.textContent = "×";
        delBtn.classList.add("deleteBtn");
        delBtn.onclick = async () => {
          await fetch(`${API}/messages/${m.id}`, {
            method: "DELETE",
            headers: { Authorization: token }
          });
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
  
  sendBtn.onclick = async () => {
    if (!currentChatUser || !messageInput.value.trim()) return;
    await fetch(`${API}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ to_user: currentChatUser.id, text: messageInput.value.trim() })
    });
    messageInput.value = "";
    loadMessages();
  };
  
  messageInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendBtn.onclick();
  });
  
  // ---------- Auto-refresh messages ----------
  setInterval(loadMessages, 1000);
  
  // ---------- Initialize ----------
  if (currentUser && token) showLoggedInUI();
  if (currentUser && token) loadUsers();
});
