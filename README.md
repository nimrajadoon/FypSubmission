🌟 Digitify Learn

AI-Powered Interactive Digit Learning App for Children

Digitify Learn is an Android educational application that makes early number learning interactive, practical, and fun. Children can learn digits through writing, speaking, finger counting, camera scanning, and real-world object activities.

🎓 Final Year Project

BS Software Engineering — COMSATS University Islamabad, Abbottabad Campus

✨ Features

Module

What the child can do

✍️ Canvas Digit Recognition

Draw a digit 0–9 and get instant recognition

🎙️ Voice Recognition

Speak a digit and get the predicted number

✋ Finger Counting

Show fingers to the camera and count them

📷 Camera Digit Scanning

Scan a handwritten/printed single digit

🍎 Object Detection

Detect objects/fruits using the camera

🔢 Object Counting

Detect and count multiple objects

🧠 How It Works

                    DIGITIFY LEARN
                          │
              ┌───────────┴───────────┐
              │   React Native + Expo │
              └───────────┬───────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
     ✍️ Canvas          🎙️ Voice          📷 Camera
        │                 │                 │
   Digit Input       Audio Input      ┌─────┴─────┐
                                      │           │
                                   ✋ Fingers   🍎 Objects
                                      │           │
                                      └─────┬─────┘
                                            │
                                   Django REST API
                                            │
                                AI / ML / Computer Vision
                                            │
                                      Result + Feedback

📱 Frontend

Built with React Native + Expo.

🛠️ Main Technologies

React Native

Expo SDK ~52

React 18.3.1

React Native 0.76.5

Expo Camera

Expo AV

Expo Document Picker

React Navigation

React Native Screens

Safe Area Context

Vector Icons

📂 Frontend Structure

Frontend/
├── App.js
├── package.json
├── app.json
├── babel.config.js
│
└── src/
    ├── config/
    │   └── api.js
    ├── screens/
    ├── components/
    └── assets/

🚀 Frontend Installation

cd Frontend
npm install

Start Expo:

npx expo start

For Android:

npx expo start --android

For a development build:

npx expo run:android

📡 Backend URL

Open:

src/config/api.js

Set your computer's local IP:

const BASE_URL = "http://YOUR_COMPUTER_IP:8000";

Example:

const BASE_URL = "http://192.168.1.55:8000";

⚠️ When testing on a physical Android phone, don't use localhost. Your phone and computer must be connected to the same Wi-Fi.

⚙️ Backend

Built with Django REST Framework and Python.

🛠️ Main Technologies

Python 3.12

Django

Django REST API

TensorFlow / Keras

OpenCV

MediaPipe Hands

Librosa

Pydub

SciPy

SoundFile

NumPy

FFmpeg

SQLite

📂 Backend Structure

Backend/
├── manage.py
├── requirements.txt
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── api/
│   ├── urls.py
│   ├── views.py
│   └── model_converter.py
│
├── models/
└── media/

🚀 Backend Installation

Create virtual environment:

python -m venv venv

Windows PowerShell:

.env\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Run migrations:

python manage.py migrate

Start server:

python manage.py runserver 0.0.0.0:8000

🤖 AI & Recognition

🎙️ Voice Recognition

Audio
  ↓
Preprocessing
  ↓
MFCC Features
  ↓
CNN Model
  ↓
Digit Prediction
  ↓
Confidence + Result

The system recognizes spoken digits from 0–9.

✋ Finger Counting

Camera Image
     ↓
MediaPipe Hands
     ↓
Hand Landmarks
     ↓
Raised Finger Analysis
     ↓
Finger Count

✍️ Digit Recognition

Drawing / Camera Image
        ↓
Preprocessing
        ↓
Digit Recognition
        ↓
Predicted Digit
        ↓
Confidence

🍎 Object Detection & Counting

Camera
  ↓
Object Detection
  ↓
Object Identification
  ↓
Object Counting
  ↓
Learning Feedback

The current project documentation focuses the object-learning activity on fruit detection and counting.

🔌 API

Health Check

GET

/api/health/

Voice Prediction

POST

/api/voice/predict/

Request:

multipart/form-data
audio = audio file

Example:

curl -X POST http://YOUR_IP:8000/api/voice/predict/   -F "audio=@recording.wav"

Finger Counting

POST

/api/finger/count/

Request:

{
  "image_data": "<BASE64_IMAGE>"
}

Example response:

{
  "success": true,
  "hand_detected": true,
  "finger_count": 5
}

🔐 Permissions

The application may request:

📷 Camera — finger counting, digit scanning, object detection/counting

🎙️ Microphone — voice recognition

📁 Media/File Access — selecting audio files

🧪 Testing

The project covers testing of:

Application launch

Canvas digit recognition

Voice recognition

Finger counting

Camera digit scanning

Object detection

Object counting

Invalid input handling

Navigation

Frontend ↔ Backend integration

Application exit

🛠️ Troubleshooting

Backend not connecting?

Check:

✓ Django server is running
✓ Backend uses 0.0.0.0:8000
✓ Correct computer IP is in api.js
✓ Phone and computer are on the same Wi-Fi
✓ Windows Firewall allows port 8000

Voice recognition not working?

Check:

✓ FFmpeg is installed
✓ Voice model exists
✓ Backend is running
✓ Audio contains one spoken digit

MediaPipe issue?

Use:

Python 3.12

Expo issue?

Clear cache:

npx expo start --clear

📦 GitHub

Keep unnecessary/generated files out of the repository:

venv/
node_modules/
__pycache__/
*.pyc
.env
*.log
media/
.expo/

For large ML models, consider Git LFS instead of storing large files directly in Git.

🔮 Future Enhancements

📊 Learning progress tracking

🌍 Multiple languages

🎮 Interactive games and quizzes

🔤 Alphabet learning

➕ Mathematical operations

🎨 Colors and shapes

🍌 More object categories

👩‍💻 Project Team

Digitify Learn
BS Software Engineering
COMSATS University Islamabad — Abbottabad Campus

Developed by

Nimra Jadoon

Zoya Kayani

Supervisor

Mam Sadaf Riaz

