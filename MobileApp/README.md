# Digit Recognition Mobile App

A React Native Expo mobile application for digit recognition using voice and finger counting features.

## 📱 Features

1. **Voice Recognition** - Record or upload audio files to recognize spoken digits (0-9)
2. **Finger Counting** - Use camera to count fingers using AI-powered hand detection

## 🛠 Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)
- Expo Go app on your mobile device (for testing)

## 📦 Installation

### 1. Navigate to the MobileApp directory

```bash
cd MobileApp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure API URL

Edit the file `src/config/api.js` and update the `BASE_URL` to your backend server address:

```javascript
const BASE_URL = 'http://YOUR_COMPUTER_IP:8000';
```

**Important:** Use your computer's actual IP address, not `localhost` or `127.0.0.1`, as your mobile device needs to connect over the network.

To find your IP:
- **Windows:** Run `ipconfig` in Command Prompt
- **macOS/Linux:** Run `ifconfig` or `ip addr`

## 🚀 Running the App

### Start the development server

```bash
npx expo start
```

### Running on devices

After starting the Expo server, you have several options:

#### Option 1: Expo Go (Recommended for testing)
1. Install "Expo Go" app from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the terminal with:
   - iOS: Camera app
   - Android: Expo Go app

#### Option 2: Android Emulator
```bash
npx expo start --android
```

#### Option 3: iOS Simulator (macOS only)
```bash
npx expo start --ios
```

#### Option 4: Development Build
For features requiring native modules, create a development build:
```bash
npx expo run:android
# or
npx expo run:ios
```

## 📁 Project Structure

```
MobileApp/
├── App.js                          # Main app with navigation
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
└── src/
    ├── config/
    │   └── api.js                  # API configuration
    └── screens/
        ├── HomeScreen.js           # Home screen with navigation
        ├── VoiceScreen.js          # Voice recording & recognition
        └── FingerCountScreen.js    # Finger counting with camera
```

## 📋 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.0 | Expo SDK |
| react | 19.1.0 | React framework |
| react-native | 0.81.5 | React Native framework |
| expo-camera | ~16.1.6 | Camera access |
| expo-av | ~15.1.4 | Audio recording |
| expo-document-picker | ~13.1.5 | File picking |
| expo-linear-gradient | ~14.1.4 | Gradient backgrounds |
| @react-navigation/native | ^7.1.9 | Navigation |
| @react-navigation/stack | ^7.2.9 | Stack navigation |
| @expo/vector-icons | ^14.1.0 | Icons |

## 🔌 API Endpoints Used

### Voice Recognition
- **URL:** `POST /api/voice/predict/`
- **Body:** `FormData` with `audio` file
- **Response:**
```json
{
  "success": true,
  "prediction": 5,
  "confidence": 98.5,
  "probabilities": {
    "0": 0.1,
    "1": 0.2,
    ...
  }
}
```

### Finger Counting
- **URL:** `POST /api/finger/count/`
- **Body:** JSON with `image_data` (base64)
- **Response:**
```json
{
  "success": true,
  "finger_count": 3,
  "hand_detected": true,
  "message": "Detected 3 fingers"
}
```

## 📱 Feature Details

### Voice Recognition Screen

1. **Record Audio:** Tap the microphone button to start recording, tap again to stop
2. **Upload Audio:** Tap "Upload Audio File" to select an existing audio file
3. **Results:** View the predicted digit with confidence score and probability bars

**Supported Audio Formats:**
- M4A (recommended)
- WAV
- MP3

**Tips for Best Recognition:**
- Speak clearly in a quiet environment
- Say only one digit at a time
- Keep recordings 1-3 seconds long

### Finger Counting Screen

1. **Manual Capture:** Tap the camera button to capture and count
2. **Auto Mode:** Toggle auto mode for continuous counting
3. **Camera Flip:** Switch between front and back camera

**Tips for Accurate Counting:**
- Ensure good lighting
- Spread fingers apart
- Keep hand steady
- Position hand within the guide overlay

## 🔧 Troubleshooting

### "Network request failed" error
- Check that the backend server is running
- Verify the API URL in `src/config/api.js`
- Ensure your phone and computer are on the same WiFi network
- Check if your computer's firewall is blocking connections

### Camera/Microphone not working
- Grant permissions when prompted
- Check device settings for app permissions
- Try reinstalling the app

### Audio recording not recognized
- Ensure FFmpeg is installed on the backend server
- Check that the voice model is loaded
- Try speaking more clearly or use a quieter environment

### Finger counting inaccurate
- Improve lighting conditions
- Keep your hand steady
- Make sure all fingers are visible
- Try the front camera for better positioning

### Expo errors
- Clear Expo cache: `npx expo start --clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Update Expo: `npx expo upgrade`

## 📱 Building for Production

### Android APK
```bash
npx eas build --platform android --profile preview
```

### iOS (requires Apple Developer account)
```bash
npx eas build --platform ios
```

### Configure EAS Build
```bash
npx eas build:configure
```

## 🔒 Permissions Required

| Permission | Platform | Purpose |
|------------|----------|---------|
| Camera | Both | Finger counting feature |
| Microphone | Both | Voice recording |
| Storage | Android | Audio file upload |

## 📄 License

MIT License

## 👥 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Ensure the backend server is running correctly
3. Verify network connectivity between your device and server

---

Made with ❤️ using React Native and Expo
