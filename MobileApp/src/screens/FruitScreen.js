import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { getApiUrl } from '../config/api';

const SUPPORTED_FRUITS = [
  'Apple', 'Banana', 'Mango', 'Orange', 'Grapes',
  'Watermelon', 'Strawberry', 'Pineapple', 'Peach', 'Pear',
];

const FRUIT_EMOJI = {
  Apple: '🍎',
  Banana: '🍌',
  Mango: '🥭',
  Orange: '🍊',
  Grapes: '🍇',
  Watermelon: '🍉',
  Strawberry: '🍓',
  Pineapple: '🍍',
  Peach: '🍑',
  Pear: '🍐',
};

export default function FruitScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={GRADIENTS.background} style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>🍎</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need your camera to detect fruits in your photo.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <LinearGradient colors={GRADIENTS.button} style={styles.permissionButtonGradient}>
            <Text style={styles.permissionButtonText}>Allow Camera 📷</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const captureAndDetect = async () => {
    if (!cameraRef.current) return;
    setIsLoading(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);

      const response = await fetch(getApiUrl('PREDICT_FRUIT'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: `data:image/jpeg;base64,${photo.base64}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to detect fruits');
      }
    } catch (error) {
      console.error('Fruit detection error:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to the server. Make sure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setResult(null);
  };

  const renderResults = () => {
    if (!result) return null;

    const entries = Object.entries(result.counts || {});

    if (entries.length === 0) {
      return (
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>🤔</Text>
          <Text style={styles.resultTitle}>No supported fruit detected.</Text>
          <Text style={styles.resultHint}>
            Try a clearer photo with a plain background.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Detected Fruits</Text>
        {entries.map(([name, count]) => (
          <View key={name} style={styles.resultRow}>
            <Text style={styles.resultEmojiSmall}>{FRUIT_EMOJI[name] || '🍽️'}</Text>
            <Text style={styles.resultText}>
              {name}: <Text style={styles.resultCount}>{count}</Text>
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total: {result.total}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.header}>🍎 Fruit Detector 🍌</Text>
          <Text style={styles.subheader}>
            Capture a photo and I'll count the fruits!
          </Text>

          <View style={styles.cameraCard}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.preview} />
            ) : (
              <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
            )}
          </View>

          {!capturedImage ? (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.smallButton} onPress={toggleCameraFacing}>
                <Text style={styles.smallButtonText}>🔄 Flip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={captureAndDetect}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <Text style={styles.captureButtonText}>📷 Capture</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.retakeButton} onPress={retake}>
                <Text style={styles.retakeButtonText}>🔁 Retake</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && !result && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="white" />
              <Text style={styles.loadingText}>Detecting fruits...</Text>
            </View>
          )}

          {renderResults()}

          <View style={styles.supportedCard}>
            <Text style={styles.supportedTitle}>Supported Fruits</Text>
            <Text style={styles.supportedList}>
              {SUPPORTED_FRUITS.map((f) => `${FRUIT_EMOJI[f]} ${f}`).join('   ')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white',
  },
  permissionContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl,
  },
  permissionEmoji: { fontSize: 80, marginBottom: SPACING.lg },
  permissionTitle: {
    fontSize: 26, fontWeight: 'bold', color: 'white',
    marginBottom: SPACING.md, textAlign: 'center',
  },
  permissionText: {
    fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center',
    marginBottom: SPACING.xl, lineHeight: 24,
  },
  permissionButton: {
    borderRadius: BORDER_RADIUS.round, overflow: 'hidden', ...SHADOWS.medium,
  },
  permissionButtonGradient: {
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  permissionButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },

  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: {
    fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center',
    marginTop: SPACING.sm,
  },
  subheader: {
    fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center',
    marginBottom: SPACING.lg, marginTop: SPACING.xs,
  },

  cameraCard: {
    height: 340,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: 'black',
    ...SHADOWS.medium,
  },
  camera: { flex: 1 },
  preview: { width: '100%', height: '100%' },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  smallButton: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
  },
  smallButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  captureButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.medium,
    minWidth: 160,
    alignItems: 'center',
  },
  captureButtonText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  retakeButton: {
    backgroundColor: 'white',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.small,
  },
  retakeButtonText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },

  loadingRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.lg, gap: SPACING.sm,
  },
  loadingText: { color: 'white', fontSize: 15, marginLeft: SPACING.sm },

  resultCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.medium,
  },
  resultTitle: {
    fontSize: 20, fontWeight: 'bold', color: COLORS.primary,
    textAlign: 'center', marginBottom: SPACING.md,
  },
  resultEmoji: { fontSize: 56, textAlign: 'center', marginBottom: SPACING.sm },
  resultHint: {
    fontSize: 14, color: COLORS.textLight, textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  resultEmojiSmall: { fontSize: 26, marginRight: SPACING.md },
  resultText: { fontSize: 18, color: COLORS.text, flex: 1 },
  resultCount: { fontWeight: 'bold', color: COLORS.primary, fontSize: 20 },
  totalRow: {
    marginTop: SPACING.md, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center',
  },
  totalText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },

  supportedCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  supportedTitle: {
    fontSize: 15, fontWeight: 'bold', color: COLORS.primary,
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  supportedList: {
    fontSize: 14, color: COLORS.text, textAlign: 'center', lineHeight: 24,
  },
});
