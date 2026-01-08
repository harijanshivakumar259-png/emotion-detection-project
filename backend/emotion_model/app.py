from flask import Flask, request, jsonify
import random
import os

app = Flask(__name__)

EMOTIONS = ["Happy", "Sad", "Angry", "Neutral", "Fear", "Disgust", "Surprise"]

# Create uploads folder if it doesn't exist
os.makedirs("uploads", exist_ok=True)

@app.route("/predict", methods=["POST"])
def predict():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files["audio"]
    
    if audio_file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # Save the file temporarily
    filename = audio_file.filename
    audio_file.save(os.path.join("uploads", filename))
    
    # Dummy emotion recognizer (replace with ML model later)
    emotion = random.choice(EMOTIONS)
    
    return jsonify({
        "emotion": emotion,
        "file_received": filename
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)