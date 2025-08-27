from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from gradio_client import Client
from fake_useragent import UserAgent
import uuid
import re

# Initialize Flask
app = Flask(
    __name__,
    static_folder="../frontend",   # path to your frontend folder
    static_url_path=""
)
CORS(app)

# Initialize Gradio client
client = Client("amd/gpt-oss-120b-chatbot")

# In-memory session storage
sessions = {}

# Serve frontend
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# Chat endpoint
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    session_id = data.get("session_id")

    # Create new session if it doesn't exist
    if not session_id or session_id not in sessions:
        session_id = str(uuid.uuid4())
        sessions[session_id] = []

    # Generate a random User-Agent
    ua = UserAgent()
    random_ua = ua.random

    # Call GPT model
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

    # Clean markdown (optional)
    answer = answer.split("Response:", 1)[-1].strip()
    answer = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', answer)
    answer = re.sub(r'[`#*_>]', '', answer)

    # Store in session
    sessions[session_id].append({"user": user_input, "bot": answer, "user_agent": random_ua})

    return jsonify({
        "reply": answer,
        "session_id": session_id,
        "user_agent": random_ua
    })

if __name__ == "__main__":
    # Use 0.0.0.0 so external services (Render) can access
    app.run(host="0.0.0.0", port=5000)
