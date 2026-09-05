Digitify Learn

<p align="center">
  <b>AI-Powered Interactive Digit Learning Android Application</b>
</p>

Digitify Learn is an educational Android mobile application designed to help children learn digits through interactive, AI-based activities. The application combines writing, voice, hand gestures, camera scanning, object detection, and object counting into one child-friendly learning platform.

The project is developed using React Native with Expo for the mobile frontend and Django REST API with Python for backend and AI/computer-vision services.

Project Modules

Digitify Learn contains the following learning modules:

Canvas Digit Recognition — child draws a digit 0–9 and receives the recognized digit with confidence.

Voice Recognition — child speaks a digit 0–9; the audio is processed and classified by the voice model.

Finger Counting — camera detects a hand and counts raised fingers.

Camera Digit Scanning — camera scans a handwritten/printed single digit and recognizes it.

Object Detection — camera identifies visible objects/categories.

Object Counting — camera detects and counts multiple visible objects.

The project report describes the current object-learning implementation as focused on fruits.

System Architecture

                    DIGITIFY LEARN
                          |
                  React Native + Expo
                          |
          +---------------+----------------+
          |               |                |
       Canvas           Camera           Voice
          |               |                |
     Digit Input    +------+-------+     Audio Input
                    |              |
                 Finger         Object
                 Counting     Detection/Counting
                    |              |
                    +------+-------+
                           |
                    Django REST API
                           |
                 AI / ML / CV Processing
                           |
                  Recognition Result
                           |
                  React Native UI
                           |
                    Instant Feedback

The mobile application provides the user interface and captures input. Server-side recognition requests are sent to the Django REST API, which performs the required processing and returns the result.

Repository Structure

A recommended GitHub repository structure is:

Digitify-Learn/
│
├── Backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── README.md
│   ├── config/
│   ├── api/
│   ├── models/
│   ├── media/
│   └── ...
│
├── Frontend/
│   ├── App.js
│   ├── package.json
│   ├── app.json
│   ├── babel.config.js
│   ├── src/
│   │   ├── config/
│   │   ├── screens/
│   │   ├── components/
│   │   └── assets/
│   └── ...
│
└── README.md

Keep your actual folder/file names if they differ. This structure is a documentation guide for the complete project.

Technology Stack

Frontend

Technology / Package

Purpose

React Native

Mobile application framework

Expo SDK

Development and Android tooling

React

UI layer

Expo Camera

Camera access

Expo AV

Audio recording

Expo Document Picker

Selecting audio files

Expo Asset

Asset management

Expo Linear Gradient

UI backgrounds

React Navigation

Screen navigation

React Native Screens

Native navigation support

Safe Area Context

Safe-area handling

Vector Icons

UI icons

Project versions

Expo SDK       ~52.0.0
React           18.3.1
React Native    0.76.5
expo-camera     ~16.0.0
expo-av         ~15.0.1
expo-document-picker ~13.0.1
expo-asset      ~11.0.5
expo-linear-gradient ~14.0.1
expo-status-bar ~2.0.0
@react-navigation/native ^7.0.0
@react-navigation/native-stack ^7.0.0
@expo/vector-icons ^14.0.0
react-native-screens ~4.1.0
react-native-safe-area-context 4.12.0

Backend / AI

Technology

Purpose

Python 3.12

Backend and AI/computer-vision environment

Django

Backend web framework

Django REST API

Mobile-to-backend communication

TensorFlow / Keras

Machine-learning model processing

OpenCV

Image/computer-vision processing

MediaPipe Hands

Hand landmark detection and finger counting

Librosa

Audio feature extraction

Pydub

Audio conversion/processing

SciPy / SoundFile

Audio processing support

NumPy

Numerical processing

FFmpeg

Audio format conversion

SQLite

Development database

1. Canvas Digit Recognition

The child draws a single digit from 0–9 on the mobile canvas.

Flow

Draw digit
   ↓
Capture drawing
   ↓
Resize / grayscale / normalize
   ↓
Send image for recognition
   ↓
Digit recognition model
   ↓
Recognized digit + confidence
   ↓
Display result

The user can clear the canvas and draw another digit.

2. Voice Digit Recognition

The child speaks a single digit.

Flow

Speak digit
   ↓
Record audio
   ↓
Process audio
   ↓
Extract MFCC features
   ↓
Send audio to Django API
   ↓
CNN voice model
   ↓
Predicted digit + confidence
   ↓
Display result

Features

Start/stop recording

Select an existing audio file

WAV, M4A and MP3 support

Spoken digit classification

Confidence score

Probability information

Repeat recognition

For better results:

Speak clearly.

Say one digit at a time.

Prefer a quiet environment.

Keep the recording short.

3. Finger Counting

The child shows one hand to the camera.

Flow

Open camera
   ↓
Capture camera frame
   ↓
Detect hand
   ↓
Extract hand landmarks
   ↓
Determine raised fingers
   ↓
Count fingers
   ↓
Display count

The implementation uses MediaPipe Hands for hand landmark detection and analyzes the landmarks to determine raised fingers.

Tips

Use good lighting.

Keep the complete hand visible.

Spread fingers apart.

Avoid rapid movement.

4. Camera Digit Scanning

The child shows a handwritten or printed single digit to the camera.

Flow

Open camera
   ↓
Show one digit
   ↓
Detect / isolate digit
   ↓
Preprocess image
   ↓
Digit recognition model
   ↓
Recognized digit + confidence
   ↓
Display result

For reliable recognition:

Show one digit at a time.

Keep it centered.

Avoid blur and shadows.

Use adequate lighting.

5. Object Detection

The child points the camera toward a physical object.

Flow

Open camera
   ↓
Capture frame
   ↓
Detect object
   ↓
Identify object/category
   ↓
Display object name

The current project report describes the object-learning implementation as recognizing objects such as fruits.

6. Object Counting

The child points the camera toward multiple objects.

Flow

Camera input
     ↓
Detect visible objects
     ↓
Separate detected objects
     ↓
Count objects
     ↓
Verify result
     ↓
Display total count

This module connects real-world objects with practical number learning.

Backend Setup

Requirements

Python 3.12 recommended

pip

Git

FFmpeg

Android device/emulator for end-to-end testing

Phone and computer on the same Wi-Fi when testing locally

1. Enter Backend Directory

cd Backend

2. Create Virtual Environment

Windows PowerShell

python -m venv venv
.\venv\Scripts\Activate.ps1

Windows CMD

python -m venv venv
.\venv\Scripts\activate.bat

Linux/macOS

python -m venv venv
source venv/bin/activate

3. Install Dependencies

pip install -r requirements.txt

4. Install FFmpeg

Windows:

winget install Gyan.FFmpeg

Verify:

ffmpeg -version

FFmpeg is required for audio format conversion/processing.

5. Database Setup

python manage.py migrate

6. Run Backend

For local development:

python manage.py runserver

For Android physical-device testing:

python manage.py runserver 0.0.0.0:8000

Machine-Learning Model Setup

The voice recognition API expects the trained model in:

Backend/models/

If the original model is available:

mnist_sound.h5

it can be converted using:

python api/model_converter.py

The converted model is expected as:

models/voice_model.keras

Large ML model files can make a GitHub repository heavy. Consider Git LFS or separate model distribution if the model is too large.

Backend API

Health Check

GET

/api/health/

Example:

curl http://<YOUR_COMPUTER_IP>:8000/api/health/

Example response:

{
  "status": "ok",
  "message": "Digitify API is running",
  "version": "1.0.0",
  "endpoints": {
    "voice_predict": "/api/voice/predict/",
    "finger_count": "/api/finger/count/"
  }
}

Voice Prediction

POST

/api/voice/predict/

Content type:

multipart/form-data

Request:

Field

Type

Description

audio

File

Audio containing one spoken digit

Example:

curl -X POST \
  http://<YOUR_COMPUTER_IP>:8000/api/voice/predict/ \
  -F "audio=@recording.wav"

Example response:

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

Finger Counting

POST

/api/finger/count/

Content type:

application/json

Request:

{
  "image_data": "<BASE64_ENCODED_IMAGE>"
}

Example response:

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

If no hand is detected:

{
  "success": true,
  "hand_detected": false,
  "finger_count": 0,
  "hands": [],
  "message": "No hand detected"
}

Frontend Setup

Requirements

Node.js 18+ recommended

npm or yarn

Expo tooling

Android phone with Expo Go or Android Studio/emulator

Digitify Learn backend running for server-based recognition

Same Wi-Fi network for physical-device/local backend testing

1. Enter Frontend Directory

cd Frontend

2. Install Dependencies

npm install

If required:

npx expo install expo-asset

3. Configure Backend URL

Open:

src/config/api.js

Set:

const BASE_URL = "http://YOUR_COMPUTER_IP:8000";

Example:

const BASE_URL = "http://192.168.1.55:8000";

Important

When using a physical Android phone, do not use:

http://localhost:8000

or:

http://127.0.0.1:8000

Use the computer's local IPv4 address.

Find it on Windows:

ipconfig

Use the IPv4 address of the active Wi-Fi/network adapter.

Start Frontend

npx expo start

Expo Go

Install Expo Go on the Android device.

Start the Expo development server.

Scan the QR code.

Open Digitify Learn.

Android Emulator

npx expo start --android

Development Build

For native functionality requiring a development build:

npx expo run:android

Frontend Navigation

Welcome / Home
      |
      +--> Canvas Digit Recognition
      |
      +--> Voice Recognition
      |
      +--> Finger Counting
      |
      +--> Camera Digit Scanning
      |
      +--> Object Detection & Counting
      |
      +--> Exit

Permissions

The application may require:

Permission

Purpose

Camera

Finger counting, camera digit scanning, object detection/counting

Microphone

Voice digit recognition

File/Media access

Selecting existing audio

Grant the required permissions when prompted.

End-to-End Communication

Mobile App
   |
   | HTTP / REST
   v
Django REST API
   |
   +--> Voice API
   |      |
   |      +--> Audio preprocessing
   |      +--> MFCC extraction
   |      +--> CNN model
   |
   +--> Finger API
          |
          +--> Image decoding
          +--> MediaPipe Hands
          +--> Finger analysis
   |
   v
Result
   |
   v
React Native App
   |
   v
Instant Feedback

CORS Configuration

For local development, the backend may use:

CORS_ALLOW_ALL_ORIGINS = True

For production, restrict allowed origins:

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://<YOUR_COMPUTER_IP>:8081",
]

Testing

The project includes testing of the major application functionality, including:

Application launch

Canvas digit recognition

Voice recognition

Finger counting

Camera-based digit scanning

Object detection and counting

Invalid input handling

Navigation

Application exit

Frontend/backend integration

Troubleshooting

Backend does not start

Check Python:

python --version

Python 3.12 is recommended for the project's MediaPipe environment.

Install dependencies:

pip install -r requirements.txt

Voice recognition fails

Check:

1. FFmpeg is installed.
2. Voice model exists.
3. Django backend is running.
4. Correct BASE_URL is configured.
5. Audio contains one clearly spoken digit.

MediaPipe problems

Use Python 3.12 and verify:

python --version

Phone cannot connect to backend

Check:

1. Backend is running on 0.0.0.0:8000.
2. BASE_URL contains the computer's IPv4 address.
3. Phone and computer are on the same Wi-Fi.
4. Windows Firewall allows port 8000.

Start backend:

python manage.py runserver 0.0.0.0:8000

Camera does not work

Grant camera permission.

Check Android app permissions.

Close other apps using the camera.

Restart the application if necessary.

Microphone does not work

Grant microphone permission.

Check Android microphone permissions.

Use a short recording in a quiet environment.

Finger counting is inaccurate

Improve:

Lighting

Hand position

Camera stability

Finger visibility

Expo cache problems

npx expo start --clear

GitHub / .gitignore Recommendations

Do not commit unnecessary generated or local files:

venv/
node_modules/
__pycache__/
*.pyc
.env
*.log
media/
.expo/

Avoid committing:

Python virtual environments

Node modules

Local environment secrets

Temporary files

Generated caches

Unnecessary uploaded media

Large ML models should preferably use Git LFS or separate model hosting if they make the repository too large.

Production Android Build

Configure EAS:

npx eas build:configure

Build Android:

npx eas build --platform android --profile preview

For a production release, configure the appropriate EAS profile and Android application settings.

Project Scope

Digitify Learn focuses on early digit learning through practical and interactive activities:

Writing
   +
Speaking
   +
Finger Counting
   +
Camera Scanning
   +
Object Recognition
   +
Object Counting

The project aims to make number learning more engaging by providing immediate feedback through AI and computer-vision-based interactions.

Future Enhancements

Potential future improvements include:

More object categories

Progress tracking

Multiple languages

Interactive games and quizzes

Additional learning topics

Alphabet learning

Mathematical operations

Colors and shapes

Development Methodology

The project report specifies:

Design Methodology: Procedural Approach

Software Process Model: Agile

The system follows a modular design where individual learning activities work as separate modules while forming one complete educational learning platform.

Project Information

Project: Digitify Learn
Degree: BS Software Engineering
University: COMSATS University Islamabad, Abbottabad Campus
Academic Session: 2022–2026

Developed By

Nimra Jadoon

Zoya Kayani

Supervisor

Mam Sadaf Riaz

