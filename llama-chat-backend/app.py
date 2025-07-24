from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import json
from PIL import Image
import io
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL_VISION = "llava:latest"
DEFAULT_MODEL_TEXT = "llama3:latest"

class LlamaVisionAPI:
    def __init__(self, base_url=OLLAMA_BASE_URL):
        self.base_url = base_url

    def encode_image_to_base64(self, image_file):
        """Convert uploaded image to base64 for Ollama"""
        try:
            image = Image.open(image_file.stream)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='JPEG', quality=85)
            img_byte_arr = img_byte_arr.getvalue()
            base64_encoded = base64.b64encode(img_byte_arr).decode('utf-8')
            return base64_encoded
        except Exception as e:
            print(f"Error encoding image: {str(e)}")
            return None

    def generate_response(self, prompt, model, images=None, chat_history=None):
        """Generate response from Ollama with dynamic model, optional images, and chat history"""
        try:
            # Use different endpoints and payload structures based on whether we have chat history
            if chat_history:
                # Use chat endpoint for conversation history
                payload = {
                    "model": model,
                    "messages": chat_history,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                    }
                }
                
                # Add images to the last message if provided
                if images and len(images) > 0 and self._is_vision_model(model):
                    if payload["messages"] and len(payload["messages"]) > 0:
                        payload["messages"][-1]["images"] = images
                
                endpoint = "/api/chat"
            else:
                # Use generate endpoint for single prompts
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                    }
                }
                
                # Only add images if provided and model supports it
                if images and len(images) > 0 and self._is_vision_model(model):
                    payload["images"] = images
                
                endpoint = "/api/generate"
            
            response = requests.post(
                f"{self.base_url}{endpoint}",
                json=payload,
                timeout=300
            )
            
            if response.status_code == 200:
                result = response.json()
                # Handle different response formats
                if endpoint == "/api/chat":
                    return result.get("message", {}).get("content", "Sorry, I couldn't generate a response.")
                else:
                    return result.get("response", "Sorry, I couldn't generate a response.")
            else:
                return f"Error: API returned status code {response.status_code} - {response.text}"
                
        except requests.exceptions.RequestException as e:
            return f"Error connecting to Ollama: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"

    def _is_vision_model(self, model):
        """Check if model supports vision/images"""
        vision_models = [
            DEFAULT_MODEL_VISION, 
            "llava", 
            "llava:latest", 
            "llama3.2-vision", 
            "llama3.2-vision:latest",
            "llava:7b",
            "llava:13b",
            "llava:34b"
        ]
        return any(vm in model.lower() for vm in vision_models)

    def check_model_availability(self, model=DEFAULT_MODEL_VISION):
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get("models", [])
                available_models = [m["name"] for m in models]
                return model in available_models
            return False
        except Exception as e:
            print(f"Error checking model availability: {e}")
            return False

# Initialize the API
llama_api = LlamaVisionAPI()

@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "model": DEFAULT_MODEL_VISION
    })

@app.route("/api/check-model", methods=["GET"])
def check_model():
    """Check if Ollama and the model are available"""
    try:
        # Check if Ollama is running
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code != 200:
            return jsonify({
                "available": False,
                "error": "Ollama server not responding"
            })
        
        # Check if model is available
        models = response.json().get("models", [])
        available_models = [model["name"] for model in models]
        model_available = DEFAULT_MODEL_VISION in available_models
        
        return jsonify({
            "available": model_available,
            "ollama_running": True,
            "available_models": available_models,
            "target_model": DEFAULT_MODEL_VISION
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            "available": False,
            "ollama_running": False,
            "error": f"Cannot connect to Ollama server: {str(e)}"
        })

@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint with user-selectable mode and chat history support"""
    try:
        # Get message and mode from form data
        message = request.form.get("message", "").strip()
        mode = request.form.get("mode", "best").strip().lower()  # default to 'best'
        uploaded_files = request.files.getlist("images")
        chat_history_raw = request.form.get("chat_history")
        
        chat_history = None
        if chat_history_raw:
            try:
                chat_history = json.loads(chat_history_raw)
                # Validate chat history structure
                if not isinstance(chat_history, list):
                    chat_history = None
            except Exception as e:
                print(f"Error parsing chat_history: {e}")
                chat_history = None

        # Validate input
        if not message and not uploaded_files and not (chat_history and len(chat_history) > 0):
            return jsonify({
                "error": "Please provide a message or upload an image"
            }), 400

        # Process images
        encoded_images = []
        if uploaded_files:
            for file in uploaded_files:
                if file.filename and file.content_type.startswith('image/'):
                    encoded_image = llama_api.encode_image_to_base64(file)
                    if encoded_image:
                        encoded_images.append(encoded_image)

        # Model selection logic
        if mode == "text":
            selected_model = DEFAULT_MODEL_TEXT
            images_for_model = None  # Force no images for text mode
        elif mode == "image":
            selected_model = DEFAULT_MODEL_VISION
            images_for_model = encoded_images if encoded_images else None
        else:  # 'best' mode
            if encoded_images:
                selected_model = DEFAULT_MODEL_VISION
                images_for_model = encoded_images
            else:
                selected_model = DEFAULT_MODEL_TEXT
                images_for_model = None

        # Set default prompt if only images provided
        if not message and images_for_model and not chat_history:
            message = "What do you see in this image? Please describe it in detail."

        # Ensure we have a message when using chat history
        if chat_history and not message:
            # Extract the last user message if no new message provided
            for msg in reversed(chat_history):
                if msg.get("role") == "user":
                    message = msg.get("content", "")
                    break

        # Generate response
        response = llama_api.generate_response(
            prompt=message,
            model=selected_model,
            images=images_for_model,
            chat_history=chat_history
        )

        return jsonify({
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "images_processed": len(encoded_images) if encoded_images else 0,
            "model_used": selected_model
        })

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": f"Server error: {str(e)}"
        }), 500

@app.route("/api/models", methods=["GET"])
def get_available_models():
    """Get list of available models"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get("models", [])
            return jsonify({
                "models": [{"name": model["name"], "size": model.get("size", 0)} for model in models]
            })
        else:
            return jsonify({"error": f"Could not fetch models: {response.status_code}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🦙 Starting Llama Vision API Server...")
    print(f"Vision Model: {DEFAULT_MODEL_VISION}")
    print(f"Text Model: {DEFAULT_MODEL_TEXT}")
    print(f"Ollama URL: {OLLAMA_BASE_URL}")
    
    # Check if models are available on startup
    if llama_api.check_model_availability(DEFAULT_MODEL_VISION):
        print("✅ Vision model is available!")
    else:
        print(f"⚠️  Warning: Vision model '{DEFAULT_MODEL_VISION}' not found.")
        
    if llama_api.check_model_availability(DEFAULT_MODEL_TEXT):
        print("✅ Text model is available!")
    else:
        print(f"⚠️  Warning: Text model '{DEFAULT_MODEL_TEXT}' not found.")
    
    print("Server running on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)