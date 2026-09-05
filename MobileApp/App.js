import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import DrawingScreen from "./src/screens/DrawingScreen";
import VoiceScreen from "./src/screens/VoiceScreen";
import CameraScreen from "./src/screens/CameraScreen";
import ResultScreen from "./src/screens/ResultScreen";
import FingerCountScreen from "./src/screens/FingerCountScreen";
import FruitScreen from "./src/screens/FruitScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#667eea",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 20,
            },
            headerTitleAlign: "center",
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: "✨ Digitify Learn ✨",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Drawing"
            component={DrawingScreen}
            options={{ title: "✏️ Magic Drawing" }}
          />
          <Stack.Screen
            name="Voice"
            component={VoiceScreen}
            options={{ title: "🎤 Voice Detective" }}
          />
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{ title: "📸 Camera Magic" }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: "🎯 Results" }}
          />
          <Stack.Screen
            name="FingerCount"
            component={FingerCountScreen}
            options={{
              title: "✋ Finger Counting",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Fruit"
            component={FruitScreen}
            options={{ title: "🍎 Fruit Detector" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
