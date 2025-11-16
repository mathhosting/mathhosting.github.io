// =====================
// CONFIG
// =====================
const API = "https://sardineisamazing.onrender.com";
let token = localStorage.getItem("token") || null;
let currentUser = JSON.parse(localStorage.getItem("chatUser")) || null;

// =====================
// SAFE FETCH HELPER
// =====================
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);

    const text = await res.text(); // read body once

    if (!res.ok) {
      let errorMsg;
      try {
        const data = JSON.parse(text);
        errorMsg = data.error || JSON.stringify(data);
      } catch {
        errorMsg = text;
      }
      throw new Error(`${res.status} ${res.statusText}: ${errorMsg}`);
    }

    // parse JSON if possible
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Response is not valid JSON");
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
    console.error(err);
    return null;
  }
}




// =====================
// DOM ELEMENTS
// =====================
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const usernameInput = document.getElementById("regUsername");
const passwordInput = document.getElementById("regPassword");
const profileInput = document.getElementById("regProfile");
const registerBtn = document.getElementById("registerBtn");

const logoutBtn = document.getElementById("logoutBtn");
const usersContainer = document.getElementById("usersContainer");
const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// =====================
// UI HANDLERS
// =====================
function showLoggedInUI() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("chatApp").style.display = "block";
  loadUsers();
}

function showLoggedOutUI() {
  document.getElementById("authContainer").style.display = "block";
  document.getElementById("chatApp").style.display = "none";
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("chatUser");
}

// =====================
// REGISTER
// =====================
registerBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const profile = profileInput.value.trim();
  if (!username || !password) return alert("Username and password required");

  const data = await safeFetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, profile_picture: profile })
  });

  if (!data) return;
  alert("Registered! You can now log in.");
};

// =====================
// LOGIN
// =====================
loginBtn.onclick = async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert("Username and password required");
        return;
    }

    try {
        const response = await safeFetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response) {
            alert("Login failed");
            return;
        }

        // ===== LOGIN SUCCESS =====
        const token = response.token;
        const user = response.user;  // expected: { id, username, profile_picture }

        localStorage.setItem("token", token);
        currentUser = user;

        // Update UI for logged-in user
        showLoggedInUI();        // your existing function to show chat container, hide login/register
        updateUserPanel(user);   // shows bottom-left profile panel

        // Load the list of users
        await loadUsers();

        // Optionally: select first user or last active chat
        if (users.length > 0) {
            selectUser(users[0]); // function to select user to chat with
        }

    } catch (err) {
        console.error(err);
        alert("An error occurred while logging in");
    }
};


function updateUserPanel(user) {
    const panel = document.getElementById("userPanel");
    const name = document.getElementById("panelName");
    const pfp = document.getElementById("panelPfp");

    name.textContent = user.username;
    pfp.src = user.profile_picture || 'https://via.placeholder.com/45';

    panel.classList.remove("hidden");

    document.getElementById("logoutBtn").onclick = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };
}


// =====================
// LOGOUT
// =====================
logoutBtn.onclick = async () => {
  await safeFetch(`${API}/logout`, {
    method: "POST",
    headers: { Authorization: token }
  });
  showLoggedOutUI();
};

// =====================
// LOAD USERS
// =====================
async function loadUsers(query = "") {
  const users = await safeFetch(`${API}/users?search=${encodeURIComponent(query)}`, {
    headers: { Authorization: token }
  });
  usersContainer.innerHTML = "";
  if (!users) return;
  users.forEach(u => {
    if (u.id === currentUser.id) return; // skip self
    const div = document.createElement("div");
    div.className = "userItem";
    div.innerHTML = `<img src="${u.profile_picture || './download.jpg'}" width="35"> ${u.username}`;
    div.onclick = () => selectUser(u);
    usersContainer.appendChild(div);
  });
}

let selectedUser = null;
function selectUser(user) {
  selectedUser = user;
  chatContainer.innerHTML = "";
  loadMessages();
}

// =====================
// LOAD MESSAGES
// =====================
async function loadMessages() {
  if (!selectedUser) return;

  const messages = await safeFetch(`${API}/messages?user2=${selectedUser.id}`, {
    headers: { Authorization: token }
  });

  if (!messages) return;

  chatContainer.innerHTML = "";

  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = m.from_user === currentUser.id ? "msgOut" : "msgIn";

    div.innerHTML = `
      <img src="${m.from_profile || 'https://via.placeholder.com/35'}">
      <strong>${m.from_username}</strong>: ${m.text}
    `;

    chatContainer.appendChild(div);
  });

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}


// =====================
// SEND MESSAGE
// =====================
sendBtn.onclick = async () => {
  if (!selectedUser) return alert("Select a user first");
  const text = messageInput.value.trim();
  if (!text) return;

  const res = await safeFetch(`${API}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ to_user: selectedUser.id, text })
  });

  if (!res) return;
  messageInput.value = "";
  loadMessages(); // append new message at bottom
};


// =====================
// DELETE MESSAGE
// =====================
async function deleteMessage(msgId) {
  const res = await safeFetch(`${API}/messages/${msgId}`, {
    method: "DELETE",
    headers: { Authorization: token }
  });
  if (res) loadMessages();
}

// =====================
// INIT
// =====================
if (token && currentUser) {
  showLoggedInUI();
} else {
  showLoggedOutUI();
}
