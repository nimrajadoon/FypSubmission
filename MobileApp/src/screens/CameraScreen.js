import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { getApiUrl } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [facing, setFacing] = useState('back');
  const cameraRef = useRef(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={GRADIENTS.background}
        style={styles.container}
      >
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📸</Text>
          <Text style={styles.permissionTitle}>Camera Access Needed!</Text>
          <Text style={styles.permissionText}>
            We need your camera to recognize digits. This is going to be super cool! 🌟
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              style={styles.permissionButtonGradient}
            >
              <Text style={styles.permissionButtonText}>Allow Camera 📷</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const captureAndPredict = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);

    try {
      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      // Send to API
      const response = await fetch(getApiUrl('PREDICT_CAMERA'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: `data:image/jpeg;base64,${photo.base64}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        navigation.navigate('Result', {
          prediction: [result.prediction],
          probabilities: result.probabilities,
          type: 'camera',
        });
      } else {
        Alert.alert('Error 😢', result.message || 'Failed to recognize digit');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Connection Error 🔌',
        'Could not connect to the server. Make sure the backend is running!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />
      
      {/* Overlay with guide box - positioned absolutely over camera */}
      <View style={styles.overlay}>
        {/* Top Info */}
        <View style={styles.topInfo}>
          <Text style={styles.infoText}>📸 Point camera at a digit (0-9)</Text>
        </View>

        {/* Center Guide Box */}
        <View style={styles.guideBoxContainer}>
          <View style={styles.guideBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.guideText}>Place digit here</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          {/* Flip Camera Button */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={captureAndPredict}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.primary} size="large" />
            ) : (
              <View style={styles.captureButtonInner}>
                <Text style={styles.captureButtonText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Placeholder for symmetry */}
          <View style={styles.flipButton}>
            <Text style={styles.flipButtonText}>💡</Text>
          </View>
        </View>
      </View>

      {/* Tips at bottom */}
      <View style={styles.tipsBar}>
        <Text style={styles.tipsBarText}>
          💡 Write digit on paper • Good lighting • Hold steady
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permissionEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  permissionButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  permissionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guideBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBox: {
    width: width * 0.6,
    height: width * 0.6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.green,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BORDER_RADIUS.lg,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  guideText: {
    color: 'white',
    fontSize: 14,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonText: {
    fontSize: 32,
  },
  tipsBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  tipsBarText: {
    color: 'white',
    fontSize: 14,
  },
});
