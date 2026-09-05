"""
API URL Configuration

Endpoints:
- /api/health/           - Health check
- /api/predict/digit/    - Digit recognition from drawn canvas image
- /api/voice/predict/    - Voice digit recognition
- /api/predict/camera/   - Digit recognition from camera photo
- /api/predict/math/     - Math answer recognition from drawn canvas
- /api/finger/count/     - Finger counting via MediaPipe
- /api/predict/fruit/    - Fruit detection and counting from camera photo
"""

from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),

    # Digit Recognition
    path('predict/digit/', views.predict_digit, name='predict_digit'),

    # Voice Recognition
    path('voice/predict/', views.voice_predict, name='voice_predict'),

    # Camera Digit Recognition
    path('predict/camera/', views.predict_camera, name='predict_camera'),

    # Math Game Prediction
    path('predict/math/', views.predict_math, name='predict_math'),

    # Finger Counting
    path('finger/count/', views.finger_count, name='finger_count'),

    # Fruit Detection
    path('predict/fruit/', views.predict_fruit, name='predict_fruit'),
]
