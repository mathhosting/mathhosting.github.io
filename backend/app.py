from flask import Flask, request, jsonify
from flask_cors import CORS
from gradio_client import Client
import re

app = Flask(__name__)
CORS(app)  # allow frontend to call backend

client = Client("amd/gpt-oss-120b-chatbot")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message", "")

    response = client.predict(
        message=user_input,
        system_prompt="You are a helpful assistant.",
        temperature=0.7,
        reasoning_effort="medium",
        enable_browsing=True,
        api_name="/chat"
    )

    # Extract answer
    if isinstance(response, dict) and "output" in response:
        answer = response["output"]
    elif isinstance(response, (list, tuple)) and len(response) > 0:
        answer = str(response[-1])
    else:
        answer = str(response)

    # Clean Markdown
    answer = answer.split("Response:", 1)[-1].strip()
    answer = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', answer)
    answer = re.sub(r'[`#*_>]', '', answer)

    return jsonify({"reply": answer})

if __name__ == "__main__":
    app.run(debug=True)
