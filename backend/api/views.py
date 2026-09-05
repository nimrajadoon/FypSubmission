"""
Digitify API Views

This module contains the API endpoints for:
1. Voice Recognition - Recognizes spoken digits (0-9) from audio
2. Finger Counting - Counts fingers shown to camera using MediaPipe
3. Digit Prediction - Recognizes drawn digits from canvas image
4. Camera Prediction - Recognizes digits from camera photo
5. Math Prediction - Recognizes drawn math answers
6. Fruit Detection - Detects and counts supported fruits in a photo
"""

import os
import json
import base64
import wave
import numpy as np
import cv2
import librosa
import mediapipe as mp
import tensorflow as tf

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.core.files.storage import FileSystemStorage


# ============================================================================
# HEALTH CHECK
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint to verify API is running.
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'Digitify API is running',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
            'predict_digit': '/api/predict/digit/',
            'predict_voice': '/api/voice/predict/',
            'predict_camera': '/api/predict/camera/',
            'predict_math': '/api/predict/math/',
            'finger_count': '/api/finger/count/',
            'predict_fruit': '/api/predict/fruit/',
        }
    })


# ============================================================================
# VOICE RECOGNITION API
# ============================================================================

_voice_model = None


def get_voice_model():
    """Load and cache the voice recognition model."""
    global _voice_model
    if _voice_model is None:
        model_path = os.path.join(settings.BASE_DIR, 'models', 'voice_model.keras')
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Voice model not found at {model_path}. "
                "Please run 'python api/model_converter.py' first."
            )
        _voice_model = tf.keras.models.load_model(model_path, compile=False)
        print(f"[Voice API] Model loaded from {model_path}")
    return _voice_model


def extract_mfcc_features(audio_data, sample_rate=8000):
    """Extract MFCC features from audio data. Returns (1, 40, 40, 1) array."""
    mfcc = librosa.feature.mfcc(y=audio_data, sr=sample_rate, n_mfcc=40)
    if mfcc.shape[1] > 40:
        mfcc = mfcc[:, :40]
    else:
        mfcc = np.pad(mfcc, ((0, 0), (0, 40 - mfcc.shape[1])), mode='constant')
    return mfcc.reshape((1, 40, 40, 1))


def load_audio_file(file_path):
    """Load audio file → (audio_data, sample_rate=8000) mono float32."""
    sample_rate = 8000
    audio_data = None

    try:
        with wave.open(file_path, 'rb') as wav_file:
            n_channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            framerate = wav_file.getframerate()
            n_frames = wav_file.getnframes()
            raw_data = wav_file.readframes(n_frames)

            if sample_width == 2:
                audio_data = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            elif sample_width == 4:
                audio_data = np.frombuffer(raw_data, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                audio_data = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128) / 128.0

            if n_channels == 2:
                audio_data = audio_data.reshape(-1, 2).mean(axis=1)

            if framerate != sample_rate:
                import scipy.signal as signal
                num_samples = int(len(audio_data) * sample_rate / framerate)
                audio_data = signal.resample(audio_data, num_samples)

            print(f"[Voice API] Loaded WAV: {len(audio_data)/sample_rate:.2f}s")
            return audio_data, sample_rate
    except Exception as e:
        print(f"[Voice API] WAV read failed: {e}")

    if audio_data is None:
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(file_path)
            audio = audio.set_channels(1).set_frame_rate(sample_rate)
            temp_wav = file_path + '_temp.wav'
            audio.export(temp_wav, format='wav')
            with wave.open(temp_wav, 'rb') as wav_file:
                raw_data = wav_file.readframes(wav_file.getnframes())
                audio_data = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
            os.remove(temp_wav)
            print(f"[Voice API] Loaded via pydub: {len(audio_data)/sample_rate:.2f}s")
            return audio_data, sample_rate
        except Exception as e:
            print(f"[Voice API] Pydub failed: {e}")

    if audio_data is None:
        try:
            audio_data, _ = librosa.load(file_path, sr=sample_rate, mono=True)
            print(f"[Voice API] Loaded via librosa: {len(audio_data)/sample_rate:.2f}s")
            return audio_data, sample_rate
        except Exception as e:
            print(f"[Voice API] Librosa failed: {e}")

    raise ValueError("Could not load audio file. Supported formats: WAV, M4A, MP3")


@csrf_exempt
@require_http_methods(["POST"])
def voice_predict(request):
    """Voice Recognition API Endpoint - accepts audio file, predicts digit 0-9."""
    try:
        if 'audio' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No audio file provided',
                'message': 'Please upload an audio file with key "audio"'
            }, status=400)

        uploaded_file = request.FILES['audio']
        fs = FileSystemStorage(location=settings.MEDIA_ROOT)
        filename = fs.save(uploaded_file.name, uploaded_file)
        file_path = fs.path(filename)

        print(f"[Voice API] Received: {uploaded_file.name} ({os.path.getsize(file_path)} bytes)")

        try:
            audio_data, sample_rate = load_audio_file(file_path)
            duration = len(audio_data) / sample_rate
            if duration < 0.1:
                raise ValueError(f"Audio too short ({duration:.2f}s). Please record at least 0.5 seconds.")

            mfcc = extract_mfcc_features(audio_data, sample_rate)
            print(f"[Voice API] MFCC shape: {mfcc.shape}")

            model = get_voice_model()
            prediction = model.predict(mfcc, verbose=0)

            predicted_digit = int(np.argmax(prediction[0]))
            confidence = float(prediction[0][predicted_digit] * 100)
            probabilities = {str(i): round(float(prediction[0][i] * 100), 2) for i in range(10)}

            print(f"[Voice API] Predicted: {predicted_digit} (confidence: {confidence:.1f}%)")

            return JsonResponse({
                'success': True,
                'prediction': predicted_digit,
                'confidence': round(confidence, 2),
                'probabilities': probabilities,
                'message': f'Predicted digit: {predicted_digit}'
            })
        finally:
            try:
                fs.delete(filename)
            except Exception:
                pass
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e),
            'message': f'Error processing audio: {str(e)}'
        }, status=400)


# ============================================================================
# FINGER COUNTING API
# ============================================================================

def count_fingers(image):
    """Count fingers using MediaPipe Hands. Returns hand_detected/finger_count/hands."""
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    total_finger_count = 0
    hands_data = []

    if results.multi_hand_landmarks:
        for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            h, w, _ = image.shape
            lm_list = [[int(lm.x * w), int(lm.y * h)] for lm in hand_landmarks.landmark]
            tip_ids = [4, 8, 12, 16, 20]

            if len(lm_list) >= 21:
                hand_type = "Right"
                if results.multi_handedness:
                    hand_type = results.multi_handedness[hand_idx].classification[0].label

                fingers = []
                if hand_type == "Right":
                    fingers.append(1 if lm_list[tip_ids[0]][0] > lm_list[tip_ids[0] - 1][0] else 0)
                else:
                    fingers.append(1 if lm_list[tip_ids[0]][0] < lm_list[tip_ids[0] - 1][0] else 0)

                for i in range(1, 5):
                    fingers.append(1 if lm_list[tip_ids[i]][1] < lm_list[tip_ids[i] - 2][1] else 0)

                finger_count = sum(fingers)
                total_finger_count += finger_count
                hands_data.append({
                    'hand_type': hand_type,
                    'fingers': fingers,
                    'finger_count': finger_count
                })

    hands.close()

    return {
        'hand_detected': len(hands_data) > 0,
        'finger_count': total_finger_count,
        'hands': hands_data
    }


@csrf_exempt
@require_http_methods(["POST"])
def finger_count(request):
    """Finger Counting API Endpoint - accepts base64 image, returns finger count."""
    try:
        data = json.loads(request.body)
        image_data = data.get('image_data', '')

        if not image_data:
            return JsonResponse({
                'success': False,
                'error': 'No image data provided',
                'message': 'Please provide base64 encoded image in "image_data" field'
            }, status=400)

        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return JsonResponse({
                'success': False,
                'error': 'Invalid image',
                'message': 'Could not decode image data'
            }, status=400)

        print(f"[Finger API] Image size: {image.shape}")

        result = count_fingers(image)
        message = f"Detected {result['finger_count']} finger(s)" if result['hand_detected'] else "No hand detected"
        print(f"[Finger API] {message}")

        return JsonResponse({
            'success': True,
            'hand_detected': result['hand_detected'],
            'finger_count': result['finger_count'],
            'hands': result['hands'],
            'message': message
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
            'message': 'Request body must be valid JSON'
        }, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e),
            'message': 'Error processing image'
        }, status=400)


# ============================================================================
# DIGIT RECOGNITION (DRAWING CANVAS)
# ============================================================================

def get_img_reshape_by_cv2(img_data):
    """Extract individual digit regions from a drawn canvas image (multi-digit)."""
    image = img_data
    grey = cv2.cvtColor(image.copy(), cv2.COLOR_BGR2GRAY)
    ret, thresh = cv2.threshold(grey.copy(), 200, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=lambda x: cv2.boundingRect(x)[0])

    preprocessed_digits = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        digit = thresh[y:y + h, x:x + w]

        resized_digit = cv2.resize(digit, (500, 500))
        for size in (400, 300, 200, 100, 50, 40, 25, 18):
            resized_digit = cv2.resize(resized_digit, (size, size))

        padded_digit = np.pad(resized_digit, ((5, 5), (5, 5)), "constant", constant_values=0)
        preprocessed_digits.append(padded_digit)

    return np.array(preprocessed_digits)


_digit_model = None


def get_digit_model():
    """Load and cache the digit recognition model (saved_model.h5)."""
    global _digit_model
    if _digit_model is None:
        model_path = os.path.join(settings.BASE_DIR, 'models', 'saved_model.h5')
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Digit model not found at {model_path}. "
                "Please place saved_model.h5 in Backend/models/"
            )
        _digit_model = tf.keras.models.load_model(model_path, compile=False)
        print(f"[Digit API] Model loaded from {model_path}")
    return _digit_model


@csrf_exempt
@require_http_methods(["POST"])
def predict_digit(request):
    """Digit Prediction from Canvas Drawing."""
    try:
        data = json.loads(request.body)
        image_data = data.get('image_data', '')

        if not image_data:
            return JsonResponse({'success': False, 'error': 'No image data', 'message': 'Provide image_data'}, status=400)

        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_cv is None:
            return JsonResponse({'success': False, 'error': 'Invalid image', 'message': 'Could not decode image'}, status=400)

        img_pil_bytes = base64.b64decode(data.get('image_data', '').split('base64,')[-1])
        from PIL import Image as PILImage
        import io as _io
        im = PILImage.open(_io.BytesIO(img_pil_bytes)).convert('RGBA')
        bg = PILImage.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        tmp_buf = _io.BytesIO()
        bg.save(tmp_buf, format='JPEG')
        tmp_buf.seek(0)
        img_arr = np.frombuffer(tmp_buf.read(), np.uint8)
        img_cv = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

        crop_imgs = get_img_reshape_by_cv2(img_cv)
        model = get_digit_model()

        predictions = []
        probabilities = {}
        for i in range(len(crop_imgs)):
            inp = crop_imgs[i].reshape(1, 28, 28) if len(crop_imgs) > 1 else crop_imgs
            pred = model.predict(inp, verbose=0)
            predictions.append(int(np.argmax(pred)))
            for j in range(10):
                probabilities[str(j)] = float(round(pred[0][j] * 100, 2))

        return JsonResponse({
            'success': True,
            'predictions': predictions,
            'probabilities': probabilities,
            'message': f'Predicted digit(s): {predictions}'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e), 'message': 'Error processing image'}, status=400)


# ============================================================================
# CAMERA DIGIT RECOGNITION
# ============================================================================

_camera_model = None


def get_camera_model():
    """Load and cache the camera digit recognition model (camera_model.keras)."""
    global _camera_model
    if _camera_model is None:
        model_path = os.path.join(settings.BASE_DIR, 'models', 'camera_model.keras')
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Camera model not found at {model_path}. "
                "Please place camera_model.keras in Backend/models/"
            )
        _camera_model = tf.keras.models.load_model(model_path, compile=False)
        print(f"[Camera API] Model loaded from {model_path}")
    return _camera_model


@csrf_exempt
@require_http_methods(["POST"])
def predict_camera(request):
    """Digit Prediction from Camera Photo."""
    try:
        data = json.loads(request.body)
        image_data = data.get('image_data', '')

        if not image_data:
            return JsonResponse({'success': False, 'error': 'No image data', 'message': 'Provide image_data'}, status=400)

        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return JsonResponse({'success': False, 'error': 'Invalid image', 'message': 'Could not decode image'}, status=400)

        model = get_camera_model()

        h, w = frame.shape[:2]
        crop_size = int(min(h, w) * 0.6)
        cx, cy = w // 2, h // 2
        x1 = max(cx - crop_size // 2, 0)
        y1 = max(cy - crop_size // 2, 0)
        x2 = min(cx + crop_size // 2, w)
        y2 = min(cy + crop_size // 2, h)
        frame = frame[y1:y2, x1:x2]

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            contours = [c for c in contours if cv2.boundingRect(c)[2] > 10 and cv2.boundingRect(c)[3] > 10]

        if contours:
            bx, by, bw, bh = cv2.boundingRect(np.vstack(contours))
            pad = int(max(bw, bh) * 0.2)
            bx = max(bx - pad, 0)
            by = max(by - pad, 0)
            bw = min(bw + 2 * pad, thresh.shape[1] - bx)
            bh = min(bh + 2 * pad, thresh.shape[0] - by)
            digit_crop = thresh[by:by + bh, bx:bx + bw]
        else:
            digit_crop = thresh

        dh, dw = digit_crop.shape
        side = max(dh, dw)
        canvas = np.zeros((side, side), dtype=np.uint8)
        offset_y = (side - dh) // 2
        offset_x = (side - dw) // 2
        canvas[offset_y:offset_y + dh, offset_x:offset_x + dw] = digit_crop

        image = cv2.resize(canvas, (28, 28), interpolation=cv2.INTER_AREA)
        image = image.reshape(1, 28, 28, 1).astype('float32') / 255.0

        prediction = model.predict(image, verbose=0)
        predicted_digit = int(np.argmax(prediction[0]))
        probabilities = {str(i): float(round(prediction[0][i] * 100, 2)) for i in range(10)}

        return JsonResponse({
            'success': True,
            'prediction': predicted_digit,
            'probabilities': probabilities,
            'message': f'Predicted digit: {predicted_digit}'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e), 'message': 'Error processing camera image'}, status=400)


# ============================================================================
# MATH GAME PREDICTION
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def predict_math(request):
    """Math Answer Prediction from Canvas Drawing (supports multi-digit)."""
    try:
        data = json.loads(request.body)
        image_data = data.get('image_data', '')

        if not image_data:
            return JsonResponse({'success': False, 'error': 'No image data', 'message': 'Provide image_data'}, status=400)

        raw_b64 = image_data.split('base64,')[-1]

        from PIL import Image as PILImage
        import io as _io
        im = PILImage.open(_io.BytesIO(base64.b64decode(raw_b64))).convert('RGBA')
        bg = PILImage.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        tmp_buf = _io.BytesIO()
        bg.save(tmp_buf, format='JPEG')
        tmp_buf.seek(0)
        img_arr = np.frombuffer(tmp_buf.read(), np.uint8)
        img_cv = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

        if img_cv is None:
            return JsonResponse({'success': False, 'error': 'Invalid image', 'message': 'Could not decode image'}, status=400)

        crop_imgs = get_img_reshape_by_cv2(img_cv)
        model = get_digit_model()

        predictions = []
        for i in range(len(crop_imgs)):
            inp = crop_imgs[i].reshape(1, 28, 28) if len(crop_imgs) > 1 else crop_imgs
            pred = model.predict(inp, verbose=0)
            predictions.append(int(np.argmax(pred)))

        final = int(''.join(map(str, predictions))) if len(predictions) > 1 else (predictions[0] if predictions else 0)

        return JsonResponse({
            'success': True,
            'prediction': final,
            'predictions': predictions,
            'message': f'Predicted answer: {final}'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e), 'message': 'Error processing math answer'}, status=400)


# ============================================================================
# FRUIT OBJECT DETECTION
# ============================================================================
#
# Detection pipeline:
#   1. Segmentation — high-saturation regions of the image become candidate
#      fruit blobs (real fruit is a coloured object on a paler background).
#   2. Classification — each blob is fed to a MobileNetV2 head trained via
#      transfer learning on Fruits-360 (all 10 supported fruit classes) with
#      aggressive augmentation for real-world robustness.
#   3. Counting — per-blob predictions are aggregated into per-fruit counts.
#      If no blob passes the confidence threshold, we fall back to a single
#      whole-image classification.
#
# Model file:  Backend/models/fruit_classifier.keras
# Trained by:  Backend/model_training/fruit_classifier_trainer.py

_fruit_classifier = None
_fruit_labels = None
_fruit_input_size = None

# Whole-image classification must clear this to accept a fruit type.
# Kept modest because the model is a bit less confident on Apple than other
# classes (varieties + red/green split); the whole-image approach picks a
# SINGLE top-label so we no longer risk mixing Apple + Strawberry.
FRUIT_TYPE_THRESHOLD = 0.45
# Once the fruit type is known, blob classification threshold for counting
# each additional instance can be softer (we already know what to expect).
FRUIT_COUNT_THRESHOLD = 0.35

# Color-signature ranges for counting instances AFTER the fruit type has
# been determined. Only one fruit type is active per image, so overlaps
# between fruits are not a problem here.
FRUIT_HSV_RANGES = {
    'Apple': [
        ((0, 80, 50), (14, 255, 255)),      # red apple low hue
        ((160, 80, 50), (180, 255, 255)),   # red apple high hue (wrap)
        ((32, 40, 40), (88, 255, 220)),     # green apple
    ],
    'Banana':     [((16, 80, 100), (38, 255, 255))],
    'Mango':      [((10, 90, 100), (32, 255, 255))],
    'Orange':     [((5, 130, 130), (22, 255, 255))],
    'Grapes':     [((110, 30, 20), (170, 255, 210))],
    'Watermelon': [((32, 40, 30), (90, 255, 220))],
    'Strawberry': [((0, 130, 80), (10, 255, 255)), ((168, 130, 80), (180, 255, 255))],
    'Pineapple':  [((15, 70, 70), (36, 220, 230))],
    'Peach':      [((3, 60, 150), (22, 210, 255))],
    'Pear':       [((22, 40, 90), (50, 220, 245))],
}


def get_fruit_classifier():
    """Load the trained fruit classifier and its label list. Cached globally."""
    global _fruit_classifier, _fruit_labels, _fruit_input_size
    if _fruit_classifier is None:
        model_path = os.path.join(settings.BASE_DIR, 'models', 'fruit_classifier.keras')
        labels_path = os.path.join(settings.BASE_DIR, 'models', 'fruit_classifier_labels.json')
        if not os.path.exists(model_path) or not os.path.exists(labels_path):
            raise FileNotFoundError(
                f"Fruit classifier not found. Expected:\n  {model_path}\n  {labels_path}\n"
                "Run: python Backend/model_training/fruit_classifier_trainer.py"
            )
        _fruit_classifier = tf.keras.models.load_model(model_path, compile=False)
        with open(labels_path, 'r') as f:
            _fruit_labels = json.load(f)
        _fruit_input_size = _fruit_classifier.input_shape[1]
        print(f"[Fruit API] Classifier loaded: {_fruit_input_size}x{_fruit_input_size} "
              f"input, {len(_fruit_labels)} classes -> {_fruit_labels}")
    return _fruit_classifier, _fruit_labels, _fruit_input_size


def _classify_patch(image_bgr):
    """Return (label, confidence, probs_dict) for one BGR image or patch."""
    model, labels, in_size = get_fruit_classifier()
    img = cv2.resize(image_bgr, (in_size, in_size), interpolation=cv2.INTER_AREA)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    preds = model.predict(np.expand_dims(img_rgb, 0), verbose=0)[0]
    idx = int(np.argmax(preds))
    return labels[idx], float(preds[idx]), {labels[i]: float(preds[i]) for i in range(len(labels))}


def _find_fruit_blobs(image_bgr):
    """
    Saturation-based segmentation. High saturation isolates coloured fruit
    from paler backgrounds regardless of hue. Returns list of (x, y, w, h).
    """
    h, w = image_bgr.shape[:2]
    hsv = cv2.cvtColor(cv2.GaussianBlur(image_bgr, (9, 9), 0), cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1]

    _, mask = cv2.threshold(sat, 60, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_area = max(1500, int(h * w * 0.015))

    boxes = []
    for c in contours:
        if cv2.contourArea(c) < min_area:
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        pad = int(0.06 * max(bw, bh))
        x0 = max(x - pad, 0); y0 = max(y - pad, 0)
        x1 = min(x + bw + pad, w); y1 = min(y + bh + pad, h)
        boxes.append((x0, y0, x1 - x0, y1 - y0))
    return boxes


def _count_by_color_mask(image_bgr, fruit_name):
    """
    Once the fruit TYPE is known, count how many instances appear.

    Two independent estimators are combined:

      A. **Contour count** — cheap; correct when fruits are visually separated.
      B. **Area / single-fruit-area estimate** — the distance transform's peak
         inside the mask equals the *radius of the largest inscribed circle*,
         i.e. ~ radius of one fruit. Dividing total masked area by that
         estimated single-fruit area recovers the true count when N fruits are
         touching and share one contour (which is what breaks contour-count).

    Returns max(contour, area_est) so we get separated fruits AND touching
    fruits right.
    """
    if fruit_name not in FRUIT_HSV_RANGES:
        return 1

    h, w = image_bgr.shape[:2]
    blurred = cv2.GaussianBlur(image_bgr, (9, 9), 0)
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

    mask = np.zeros((h, w), dtype=np.uint8)
    for lower, upper in FRUIT_HSV_RANGES[fruit_name]:
        m = cv2.inRange(hsv, np.array(lower, dtype=np.uint8), np.array(upper, dtype=np.uint8))
        mask = cv2.bitwise_or(mask, m)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=3)

    total_area = int(cv2.countNonZero(mask))
    if total_area < max(2000, int(h * w * 0.008)):
        print(f"[Fruit API]     count: total_area={total_area} too small -> 1")
        return 1

    # A) Contour count — reliable when fruits are visually separated.
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_area = max(3000, int(h * w * 0.008))
    big_contours = [c for c in contours if cv2.contourArea(c) >= min_area]
    contour_count = len(big_contours)

    # B) Area-based estimate — for touching fruits sharing one contour.
    dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    max_r = float(dist.max())
    area_est = 0
    if max_r > 0:
        single_area = 3.4 * (max_r ** 2)
        if single_area > 0:
            area_est = int(round(total_area / single_area))

    # Prefer contour count when we can actually SEE separate fruits (>=2
    # visually distinct blobs). This avoids the area estimate over-counting
    # when the mask accidentally includes non-fruit coloured pixels (leaves,
    # highlights, background) that inflate total_area without adding fruits.
    #
    # Fall back to area estimate only when the contour is a single big blob
    # (real touching-fruits case), and only if area_est is a plausible small
    # multiplier of the contour count (2-6). Larger area estimates from a
    # single contour usually mean the mask leaked into background.
    if contour_count >= 2:
        count = contour_count
        reason = "contour>=2"
    elif contour_count == 1 and 2 <= area_est <= 6:
        count = area_est
        reason = "area_est(touching)"
    else:
        count = max(contour_count, 1)
        reason = "contour"

    print(f"[Fruit API]     count: contour={contour_count} area_est={area_est} "
          f"(area={total_area}, r={max_r:.1f}) -> {count} [{reason}]")
    return min(count, 20)  # sanity cap


def _merge_boxes(boxes, iou_thresh=0.15, gap=20):
    """Merge overlapping or nearby boxes so touching fruits stay as one region
    when identifying TYPE (they'll be re-split for counting via colour mask)."""
    if not boxes:
        return []
    boxes = [list(b) for b in boxes]
    changed = True
    while changed:
        changed = False
        merged = []
        used = [False] * len(boxes)
        for i, b1 in enumerate(boxes):
            if used[i]:
                continue
            x1, y1, w1, h1 = b1
            for j in range(i + 1, len(boxes)):
                if used[j]:
                    continue
                x2, y2, w2, h2 = boxes[j]
                # Do they overlap or lie within `gap` pixels of each other?
                if (x1 < x2 + w2 + gap and x2 < x1 + w1 + gap and
                        y1 < y2 + h2 + gap and y2 < y1 + h1 + gap):
                    nx = min(x1, x2); ny = min(y1, y2)
                    nx2 = max(x1 + w1, x2 + w2); ny2 = max(y1 + h1, y2 + h2)
                    x1, y1, w1, h1 = nx, ny, nx2 - nx, ny2 - ny
                    used[j] = True
                    changed = True
            used[i] = True
            merged.append([x1, y1, w1, h1])
        boxes = merged
    return [tuple(b) for b in boxes]


def _remove_green_leaves(image_bgr):
    """
    Return a copy of the image with green-leaf pixels turned white (background).
    Used before classification so leaves don't pull the classifier toward Pear
    (which is the greenest supported fruit).

    Watermelon is also mostly green so this is skipped for watermelon detection
    (but we don't know the type yet — so we classify BOTH the raw image and the
    leaves-removed image and pick whichever gives a more confident supported
    fruit).
    """
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    # Deep-saturated green (typical leaves are hue 35-90, sat > 60).
    green_mask = cv2.inRange(hsv, np.array([30, 60, 30]), np.array([90, 255, 220]))
    out = image_bgr.copy()
    out[green_mask > 0] = (255, 255, 255)
    return out


def detect_fruits(image):
    """
    Pipeline:
      1. Segment fruit-like regions (saturated colour on paler background)
         and merge overlapping regions into candidate subject blobs.
      2. Test-time augmentation: classify several candidate crops and pick
         the prediction with the highest confidence. Crops include:
           - the whole image
           - the tightest merged-blob crop
           - a leaves-removed variant of the crop (kills the "green leaves →
             Pear" failure mode)
           - a centre-70% crop (fallback when segmentation is off)
      3. Count instances by colour-mask contour analysis (with distance-
         transform based area fallback for touching fruits).
    """
    h_in, w_in = image.shape[:2]
    max_side = 900
    if max(h_in, w_in) > max_side:
        scale = max_side / float(max(h_in, w_in))
        image = cv2.resize(image, (int(w_in * scale), int(h_in * scale)), interpolation=cv2.INTER_AREA)
    h, w = image.shape[:2]

    raw_boxes = _find_fruit_blobs(image)
    merged = _merge_boxes(raw_boxes)
    print(f"[Fruit API]   segmentation: raw={len(raw_boxes)} merged={len(merged)} in {w}x{h}")

    # Build the list of candidate crops for test-time augmentation.
    candidates = [("whole", image)]

    if merged:
        merged.sort(key=lambda b: b[2] * b[3], reverse=True)
        x, y, bw, bh = merged[0]
        if bw * bh >= 0.04 * w * h:
            crop = image[y:y + bh, x:x + bw]
            candidates.append((f"crop({bw}x{bh})", crop))
            # Leaves-removed variant only for larger real-world crops. On
            # tiny Fruits-360 studio shots it can eat parts of the fruit
            # (green grapes / green apples).
            if min(bw, bh) >= 300:
                candidates.append((f"crop-nogreen({bw}x{bh})", _remove_green_leaves(crop)))

    # Centre-70% crop — only for large real-world photos (>= 400px). Small
    # Fruits-360-style images (100x100) already fill the frame and cropping
    # further discards useful pixels.
    if min(h, w) >= 400:
        cx0, cy0 = int(0.15 * w), int(0.15 * h)
        cx1, cy1 = int(0.85 * w), int(0.85 * h)
        centre = image[cy0:cy1, cx0:cx1]
        candidates.append(("center70", centre))
        candidates.append(("center70-nogreen", _remove_green_leaves(centre)))

    # Classify each candidate; keep the highest-confidence prediction that
    # clears the acceptance threshold.
    best_label = None
    best_conf = 0.0
    best_source = None
    best_top3 = []
    for name, crop in candidates:
        label, conf, probs = _classify_patch(crop)
        top3 = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)[:3]
        top3_str = ", ".join(f"{n}={p:.3f}" for n, p in top3)
        print(f"[Fruit API]   TTA {name}: top3=[{top3_str}]")
        if conf > best_conf:
            best_conf = conf
            best_label = label
            best_source = name
            best_top3 = top3

    if best_label is None or best_conf < FRUIT_TYPE_THRESHOLD:
        print(f"[Fruit API]   REJECT: best confidence {best_conf:.3f} < {FRUIT_TYPE_THRESHOLD}")
        return {
            'counts': {}, 'total': 0, 'method': None,
            'confidence': round(float(best_conf), 4),
            'debug': [{'top3': [{'label': n, 'prob': round(p, 4)} for n, p in best_top3],
                       'source': best_source,
                       'reason': 'below_type_threshold'}],
        }

    count = _count_by_color_mask(image, best_label)
    print(f"[Fruit API]   ACCEPT {best_label}: count = {count} "
          f"(conf={best_conf:.3f}, source={best_source})")

    return {
        'counts': {best_label: count},
        'total': count,
        'method': f'tta:{best_source}',
        'confidence': round(float(best_conf), 4),
        'debug': [{'top3': [{'label': n, 'prob': round(p, 4)} for n, p in best_top3],
                   'source': best_source}],
    }


@csrf_exempt
@require_http_methods(["POST"])
def predict_fruit(request):
    """
    Fruit Object Detection API Endpoint.

    Request:
        POST /api/predict/fruit/
        Content-Type: application/json
        Body: {"image_data": "<base64 jpeg>"}

    Response:
        {
            "success": true,
            "counts": {"Apple": 2, "Banana": 3},
            "total": 5,
            "method": "blob" | "whole",
            "confidence": 0.9231,
            "message": "Apple: 2\nBanana: 3"
        }
    """
    try:
        data = json.loads(request.body)
        image_data = data.get('image_data', '')

        if not image_data:
            return JsonResponse({
                'success': False,
                'error': 'No image data',
                'message': 'Please provide base64 encoded image in "image_data" field',
            }, status=400)

        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return JsonResponse({
                'success': False,
                'error': 'Invalid image',
                'message': 'Could not decode image data',
            }, status=400)

        print(f"[Fruit API] Image size: {image.shape}")

        result = detect_fruits(image)
        counts = result['counts']

        if not counts:
            message = 'No supported fruit detected.'
        else:
            message = '\n'.join(f'{name}: {n}' for name, n in counts.items())

        print(f"[Fruit API] {message.replace(chr(10), ' | ')}  method={result.get('method')} conf={result.get('confidence')}")

        return JsonResponse({
            'success': True,
            'counts': counts,
            'total': result['total'],
            'method': result.get('method'),
            'confidence': result.get('confidence'),
            'debug': result.get('debug'),
            'message': message,
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
            'message': 'Request body must be valid JSON',
        }, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e),
            'message': 'Error processing fruit image',
        }, status=400)
