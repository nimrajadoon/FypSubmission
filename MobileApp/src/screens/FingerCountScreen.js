import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getApiUrl } from "../config/api";

const { width, height } = Dimensions.get("window");

export default function FingerCountScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("front");
  const [fingerCount, setFingerCount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [message, setMessage] = useState("Show your hand to the camera");
  const [handDetected, setHandDetected] = useState(false);
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAutoMode) {
      // Auto capture every 1.5 seconds
      intervalRef.current = setInterval(() => {
        captureAndCount();
      }, 1500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoMode]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="hand-wave" size={80} color="#667eea" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to count your fingers using AI
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const captureAndCount = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3, // Lower quality for faster upload
        skipProcessing: true,
        exif: false,
        imageType: "jpg",
      });

      const response = await fetch(getApiUrl("FINGER_COUNT"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_data: photo.base64,
        }),
      });

      const result = await response.json();
      console.log("Finger count result:", result);

      if (result.success) {
        setFingerCount(result.finger_count);
        setHandDetected(result.hand_detected);
        setMessage(result.message);
      } else {
        setMessage(result.message || "Error processing image");
        setHandDetected(false);
      }
    } catch (error) {
      console.error("Finger count error:", error);
      setMessage("Connection error. Check your server.");
      setHandDetected(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleAutoMode = () => {
    setIsAutoMode(!isAutoMode);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finger Counting</Text>
        <TouchableOpacity
          onPress={toggleCameraFacing}
          style={styles.flipButton}
        >
          <MaterialCommunityIcons name="camera-flip" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* Hand Guide Overlay */}
          <View style={styles.overlay}>
            <View style={styles.handGuide}>
              <MaterialCommunityIcons
                name="hand-back-right-outline"
                size={150}
                color={
                  handDetected
                    ? "rgba(102, 126, 234, 0.5)"
                    : "rgba(255, 255, 255, 0.3)"
                }
              />
            </View>
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.processingText}>Analyzing...</Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Result Display */}
      <View style={styles.resultContainer}>
        <View
          style={[styles.resultBox, handDetected && styles.resultBoxActive]}
        >
          <Text style={styles.resultLabel}>Fingers Detected</Text>
          <Text style={styles.resultNumber}>
            {fingerCount !== null ? fingerCount : "-"}
          </Text>
          <Text style={styles.resultMessage}>{message}</Text>
        </View>

        {/* Auto Mode Toggle */}
        <TouchableOpacity
          style={[
            styles.autoModeButton,
            isAutoMode && styles.autoModeButtonActive,
          ]}
          onPress={toggleAutoMode}
        >
          <MaterialCommunityIcons
            name={isAutoMode ? "pause-circle" : "play-circle"}
            size={24}
            color="#fff"
          />
          <Text style={styles.autoModeText}>
            {isAutoMode ? "Auto Mode ON" : "Auto Mode OFF"}
          </Text>
        </TouchableOpacity>

        {/* Manual Capture Button */}
        {!isAutoMode && (
          <TouchableOpacity
            style={[
              styles.captureButton,
              isProcessing && styles.captureButtonDisabled,
            ]}
            onPress={captureAndCount}
            disabled={isProcessing}
          >
            <MaterialCommunityIcons
              name="hand-pointing-up"
              size={32}
              color="#fff"
            />
            <Text style={styles.captureButtonText}>Count Fingers</Text>
          </TouchableOpacity>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Tips:</Text>
          <Text style={styles.instructionText}>
            • Hold your hand clearly in front of the camera
          </Text>
          <Text style={styles.instructionText}>
            • Spread your fingers apart for better detection
          </Text>
          <Text style={styles.instructionText}>
            • Good lighting helps accuracy
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#16213e",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  flipButton: {
    padding: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cameraContainer: {
    height: height * 0.45,
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  handGuide: {
    opacity: 0.5,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultBox: {
    backgroundColor: "#16213e",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#333",
  },
  resultBoxActive: {
    borderColor: "#667eea",
  },
  resultLabel: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 8,
  },
  resultNumber: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#667eea",
  },
  resultMessage: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  autoModeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  autoModeButtonActive: {
    backgroundColor: "#667eea",
  },
  autoModeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#667eea",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  captureButtonDisabled: {
    backgroundColor: "#555",
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  instructions: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 4,
  },
});
