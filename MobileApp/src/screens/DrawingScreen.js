import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { getApiUrl } from '../config/api';

const { width } = Dimensions.get('window');

export default function DrawingScreen({ navigation }) {
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);
  const pathsRef = useRef([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const newPath = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setCurrentPath(newPath);
        setHasDrawn(true);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        setCurrentPath((prevPath) => {
          if (prevPath && prevPath.length > 0) {
            setPaths((prevPaths) => {
              const newPaths = [...prevPaths, prevPath];
              pathsRef.current = newPaths;
              return newPaths;
            });
          }
          return '';
        });
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    setHasDrawn(false);
    pathsRef.current = [];
  };

  const handleSubmit = async () => {
    if (!hasDrawn || (paths.length === 0 && !currentPath)) {
      Alert.alert('Oops! 🤔', 'Please draw a number first!');
      return;
    }

    setIsLoading(true);

    try {
      // Capture the canvas as base64 image
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
      });

      const imageData = `data:image/png;base64,${uri}`;

      console.log('Sending image to API...');
      
      const response = await fetch(getApiUrl('PREDICT_DIGIT'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: imageData,
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        navigation.navigate('Result', {
          prediction: result.predictions,
          probabilities: result.probabilities,
          type: 'digit',
        });
      } else {
        Alert.alert('Error 😢', result.message || 'Failed to predict digit');
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
    <LinearGradient
      colors={GRADIENTS.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>✨ Draw a Number! ✨</Text>
          <Text style={styles.subtitle}>Use your finger to draw any digit (0-9)</Text>
        </View>

        {/* Canvas Container */}
        <View style={styles.canvasContainer}>
          <View
            ref={canvasRef}
            style={styles.canvas}
            collapsable={false}
            {...panResponder.panHandlers}
          >
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              {paths.map((path, index) => (
                <Path
                  key={`path-${index}`}
                  d={path}
                  stroke="black"
                  strokeWidth={15}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath ? (
                <Path
                  d={currentPath}
                  stroke="black"
                  strokeWidth={15}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={isLoading}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>🔮 Recognize!</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipsText}>• Draw large and centered</Text>
          <Text style={styles.tipsText}>• Use thick strokes</Text>
          <Text style={styles.tipsText}>• One digit at a time works best!</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.xs,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.primary,
    ...SHADOWS.large,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  clearButton: {
    backgroundColor: 'white',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  submitButton: {
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginVertical: 2,
  },
});
