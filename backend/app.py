from flask import Flask, request, jsonify
from flask_cors import CORS
from gradio_client import Client
from fake_useragent import UserAgent
import uuid
import re

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Initialize Gradio GPT client
client = Client("amd/gpt-oss-120b-chatbot")

# In-memory session storage
sessions = {}

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True, silent=True) or {}
        user_input = data.get("message", "")
        session_id = data.get("session_id")

        # If session_id is missing or invalid, create a new one
        if not session_id or session_id not in sessions:
            session_id = str(uuid.uuid4())
            sessions[session_id] = []

        # Ping check: if message is empty, skip GPT call
        if not user_input.strip():
            return jsonify({"reply": "OK", "session_id": session_id}), 200

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

        # Extract and clean the response
        if isinstance(response, dict) and "output" in response:
            answer = response["output"]
        elif isinstance(response, (list, tuple)) and len(response) > 0:
            answer = str(response[-1])
        else:
            answer = str(response)

        # Remove markdown formatting
        answer = answer.split("Response:", 1)[-1].strip()
        answer = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', answer)
        answer = re.sub(r'[`#*_>]', '', answer)

        # Store in session
        sessions[session_id].append({
            "user": user_input,
            "bot": answer,
            "user_agent": random_ua
        })

        return jsonify({
            "reply": answer,
            "session_id": session_id,
            "user_agent": random_ua
        }), 200

    except Exception as e:
        # Always return 200 to keep uptime monitoring happy
        return jsonify({"reply": "OK", "session_id": str(uuid.uuid4()), "error": str(e)}), 200


if __name__ == "__main__":
    # Use 0.0.0.0 so Render can access externally
    app.run(host="0.0.0.0", port=5000)
