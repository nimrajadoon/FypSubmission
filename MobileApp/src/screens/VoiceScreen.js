import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';
import { getApiUrl } from '../config/api';

export default function VoiceScreen({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed 🎤', 'Please allow microphone access to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use compatible recording options for Android and iOS
      // Note: Android doesn't support true WAV recording in Expo, so we use AAC which is more reliable
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      setRecording(recording);
      setIsRecording(true);
      setRecordingUri(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error 😢', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error 😢', 'Failed to stop recording');
    }
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setRecordingUri(file.uri);
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error 😢', 'Failed to pick audio file');
    }
  };

  const uploadAndPredict = async () => {
    if (!recordingUri) {
      Alert.alert('Oops! 🤔', 'Please record or select an audio file first!');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Get filename from URI and determine MIME type
      const fileName = recordingUri.split('/').pop() || 'recording.m4a';
      const extension = fileName.split('.').pop().toLowerCase();
      
      // Map extensions to MIME types
      const mimeTypes = {
        'wav': 'audio/wav',
        'm4a': 'audio/mp4',
        'mp3': 'audio/mpeg',
        'mp4': 'audio/mp4',
        'aac': 'audio/aac',
        'ogg': 'audio/ogg',
        'webm': 'audio/webm',
        '': 'audio/mp4',  // Default if no extension
      };
      
      const mimeType = mimeTypes[extension] || 'audio/mp4';
      
      // Ensure filename has extension
      const finalFileName = extension ? fileName : `${fileName}.m4a`;
      
      formData.append('audio', {
        uri: recordingUri,
        type: mimeType,
        name: finalFileName,
      });

      console.log('Uploading audio:', { fileName: finalFileName, mimeType, uri: recordingUri });

      const response = await fetch(getApiUrl('PREDICT_VOICE'), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log('Voice prediction result:', result);

      if (result.success) {
        navigation.navigate('Result', {
          prediction: [result.prediction],
          probabilities: result.probabilities,
          type: 'voice',
        });
      } else {
        Alert.alert('Error 😢', result.message || 'Failed to predict from audio');
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <Text style={styles.title}>🎤 Voice Detective 🎤</Text>
          <Text style={styles.subtitle}>Say a number and let AI guess it!</Text>
        </View>

        {/* Recording Area */}
        <View style={styles.recordingArea}>
          {/* Microphone Icon */}
          <View style={[styles.micContainer, isRecording && styles.micRecording]}>
            <Text style={styles.micIcon}>{isRecording ? '🔴' : '🎤'}</Text>
            {isRecording && (
              <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
            )}
          </View>

          {/* Recording Status */}
          <Text style={styles.statusText}>
            {isRecording
              ? 'Recording... Say a number (0-9)!'
              : recordingUri
              ? '✅ Audio ready! Tap Predict!'
              : 'Tap the button to start recording'}
          </Text>

          {/* Record Button */}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isRecording ? ['#ff6b6b', '#ee5a5a'] : GRADIENTS.button}
              style={styles.recordButtonGradient}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? '⏹️ Stop Recording' :'🎙️ Start recording'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Upload File Button */}
          {/* <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickAudioFile}
            disabled={isLoading || isRecording}
          >
            <Text style={styles.uploadButtonText}>📁 Choose Audio File</Text>
          </TouchableOpacity> */}
        </View>

        {/* Predict Button */}
        {recordingUri && (
          <TouchableOpacity
            style={styles.predictButton}
            onPress={uploadAndPredict}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#1dd1a1', '#10ac84']}
              style={styles.predictButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.predictButtonText}>🔮 Predict Number!</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipsText}>• Speak clearly and loudly</Text>
          <Text style={styles.tipsText}>• Say one number at a time</Text>
          <Text style={styles.tipsText}>• Record in a quiet environment</Text>
          <Text style={styles.tipsText}>• Keep recordings 1-3 seconds</Text>
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
    marginBottom: SPACING.xl,
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
  recordingArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  micContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  micRecording: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  micIcon: {
    fontSize: 48,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  recordButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  recordButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  uploadButton: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  predictButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  predictButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  predictButtonText: {
    fontSize: 20,
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
