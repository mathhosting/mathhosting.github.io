from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from gradio_client import Client
from fake_useragent import UserAgent
import re, uuid, os

# Flask app
app = Flask(
    __name__, 
    static_folder="../frontend",   # frontend folder
    static_url_path=""
)
CORS(app)

client = Client("amd/gpt-oss-120b-chatbot")
sessions = {}  # store active chat sessions

# Serve index.html
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# Chat endpoint
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    session_id = data.get("session_id")

    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400

    # generate random user-agent per message
    ua = UserAgent()
    random_ua = ua.random

    response = client.predict(
        message=user_input,
        system_prompt="You are a helpful assistant.",
        temperature=0.7,
        reasoning_effort="medium",
        enable_browsing=True,
        api_name="/chat",
        headers={"User-Agent": random_ua}
    )

    # Extract answer
    if isinstance(response, dict) and "output" in response:
        answer = response["output"]
    elif isinstance(response, (list, tuple)) and len(response) > 0:
        answer = str(response[-1])
    else:
        answer = str(response)

    # Clean markdown
    answer = answer.split("Response:", 1)[-1].strip()
    answer = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', answer)
    answer = re.sub(r'[`#*_>]', '', answer)

    sessions[session_id].append({"user": user_input, "bot": answer})
    return jsonify({"reply": answer, "user_agent": random_ua})

# New session endpoint
@app.route("/new_session", methods=["POST"])
def new_session():
    data = request.get_json(silent=True) or {}
    old_id = data.get("old_session_id")

    if old_id and old_id in sessions:
        del sessions[old_id]

    new_id = str(uuid.uuid4())
    sessions[new_id] = []

    return jsonify({"session_id": new_id})

if __name__ == "__main__":
    # Use 0.0.0.0 so Replit/Render can access it externally
    app.run(host="0.0.0.0", port=5000)
