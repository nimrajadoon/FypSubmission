# 🎯 Digitify Backend API

A Django REST API for digit recognition using voice and finger counting using computer vision.

## 📋 Features

1. **Voice Recognition** - Recognizes spoken digits (0-9) using a CNN model trained on MFCC features
2. **Finger Counting** - Counts fingers shown to camera using MediaPipe Hands

---

## 🛠️ Installation

### Prerequisites

- **Python 3.12** (recommended for MediaPipe compatibility)
- **FFmpeg** (required for audio format conversion)

### Step 1: Install Python 3.12

```bash
# Windows (using winget)
winget install Python.Python.3.12

# Or download from https://www.python.org/downloads/
```

### Step 2: Install FFmpeg

```bash
# Windows (using winget)
winget install Gyan.FFmpeg

# Or download from https://ffmpeg.org/download.html
# Make sure ffmpeg is added to your PATH
```

### Step 3: Clone/Navigate to the Project

```bash
cd C:\Users\user\Documents\Django\Backend
```

### Step 4: Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Or for CMD:
.\venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 6: Setup Voice Model

You need to provide the trained voice recognition model:

**Option A: Copy existing model**
```bash
# If you have the mnist_sound.h5 file from the original project:
mkdir models
copy "path\to\mnist_sound.h5" "models\mnist_sound_legacy.h5"

# Then convert it:
python api/model_converter.py
```

**Option B: Use pre-converted model**
```bash
# If you have voice_model.keras already:
mkdir models
copy "path\to\voice_model.keras" "models\voice_model.keras"
```

### Step 7: Initialize Database

```bash
python manage.py migrate
```

### Step 8: Run the Server

```bash
# Run on all interfaces (for mobile app access)
python manage.py runserver 0.0.0.0:8000

# Or run on localhost only
python manage.py runserver
```

---

## 🌐 API Documentation

### Base URL

```
http://<your-ip>:8000/api/
```

Find your IP address:
```bash
# Windows
ipconfig
# Look for IPv4 Address under your network adapter
```

---

### 1. Health Check

Check if the API is running.

**Endpoint:** `GET /api/health/`

**Response:**
```json
{
    "status": "ok",
    "message": "Digitify API is running",
    "version": "1.0.0",
    "endpoints": {
        "voice_predict": "/api/voice/predict/",
        "finger_count": "/api/finger/count/"
    }
}
```

---

### 2. Voice Recognition

Recognize spoken digits from audio files.

**Endpoint:** `POST /api/voice/predict/`

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Description |
|-------|------|-------------|
| audio | File | Audio file (WAV, M4A, MP3 supported) |

**Example (curl):**
```bash
curl -X POST \
  http://192.168.1.100:8000/api/voice/predict/ \
  -F "audio=@recording.wav"
```

**Example (Python):**
```python
import requests

url = "http://192.168.1.100:8000/api/voice/predict/"
files = {"audio": open("recording.wav", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

**Success Response:**
```json
{
    "success": true,
    "prediction": 5,
    "confidence": 98.52,
    "probabilities": {
        "0": 0.01,
        "1": 0.02,
        "2": 0.05,
        "3": 0.12,
        "4": 0.25,
        "5": 98.52,
        "6": 0.45,
        "7": 0.32,
        "8": 0.18,
        "9": 0.08
    },
    "message": "Predicted digit: 5"
}
```

**Error Response:**
```json
{
    "success": false,
    "error": "No audio file provided",
    "message": "Please upload an audio file with key \"audio\""
}
```

---

### 3. Finger Counting

Count fingers shown in an image using MediaPipe.

**Endpoint:** `POST /api/finger/count/`

**Content-Type:** `application/json`

**Request Body:**
```json
{
    "image_data": "<base64 encoded image>"
}
```

**Example (curl):**
```bash
curl -X POST \
  http://192.168.1.100:8000/api/finger/count/ \
  -H "Content-Type: application/json" \
  -d '{"image_data": "base64encodedimage..."}'
```

**Example (Python):**
```python
import requests
import base64

url = "http://192.168.1.100:8000/api/finger/count/"

# Read and encode image
with open("hand.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

response = requests.post(url, json={"image_data": image_data})
print(response.json())
```

**Success Response:**
```json
{
    "success": true,
    "hand_detected": true,
    "finger_count": 5,
    "hands": [
        {
            "hand_type": "Right",
            "finger_count": 5,
            "fingers": [1, 1, 1, 1, 1]
        }
    ],
    "message": "Detected 5 finger(s)"
}
```

**No Hand Detected Response:**
```json
{
    "success": true,
    "hand_detected": false,
    "finger_count": 0,
    "hands": [],
    "message": "No hand detected"
}
```

---

## 📁 Project Structure

```
Backend/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── db.sqlite3               # SQLite database
│
├── config/                  # Django configuration
│   ├── __init__.py
│   ├── settings.py          # Django settings
│   ├── urls.py              # Root URL configuration
│   └── wsgi.py              # WSGI application
│
├── api/                     # API application
│   ├── __init__.py
│   ├── apps.py              # App configuration
│   ├── urls.py              # API URL routes
│   ├── views.py             # API views/endpoints
│   └── model_converter.py   # Voice model converter
│
├── models/                  # ML models directory
│   ├── voice_model.keras    # Converted voice model
│   └── mnist_sound_legacy.h5  # Original model (optional)
│
├── media/                   # Uploaded files (temporary)
│
└── static/                  # Static files
```

---

## 🔧 Configuration

### CORS Settings

By default, the API allows all origins (for development). To restrict in production, edit `config/settings.py`:

```python
# Allow specific origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://192.168.1.100:8081",
]

# Or allow all (development only)
CORS_ALLOW_ALL_ORIGINS = True
```

### File Upload Limits

Default is 10MB. To change, edit `config/settings.py`:

```python
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
```

---

## 🐛 Troubleshooting

### 1. "Voice model not found"

```bash
# Make sure models directory exists and has the model
mkdir models
# Copy and convert the model
python api/model_converter.py
```

### 2. "pydub can't find ffmpeg"

```bash
# Install ffmpeg
winget install Gyan.FFmpeg

# Restart your terminal to refresh PATH
# Or add ffmpeg to PATH manually
```

### 3. "MediaPipe not working"

```bash
# MediaPipe requires Python 3.12 or lower
# Check your Python version
python --version

# If using Python 3.13, downgrade to 3.12
```

### 4. "Request body exceeded DATA_UPLOAD_MAX_MEMORY_SIZE"

Increase the limit in `config/settings.py`:
```python
DATA_UPLOAD_MAX_MEMORY_SIZE = 20971520  # 20 MB
```

---

## 📱 Testing with Mobile App

1. Start the backend server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

2. Find your computer's IP address:
   ```bash
   ipconfig  # Windows
   ```

3. Update the mobile app's API configuration with your IP address

4. Make sure both devices are on the same network

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 👤 Author

Digitify Team
