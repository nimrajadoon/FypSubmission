import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';

const { width } = Dimensions.get('window');

// Activity Card Data
const activities = [
  // {
  //   id: 'math',
  //   icon: '🎓',
  //   title: 'Math Games',
  //   description: 'Play exciting math games! Addition, subtraction, multiplication and more! Earn points! ⭐',
  //   color: COLORS.primary,
  //   screen: 'MathGame',
  // },
  {
    id: 'drawing',
    icon: '✏️',
    title: 'Magic Drawing',
    description: 'Draw numbers with your finger and watch AI guess what you drew! It\'s like magic! ✨',
    color: COLORS.pink,
    screen: 'Drawing',
  },
  {
    id: 'camera',
    icon: '📸',
    title: 'Camera Magic',
    description: 'Show numbers to your camera and watch the AI recognize them instantly! Super cool! 🎥',
    color: COLORS.blue,
    screen: 'Camera',
  },
  {
    id: 'voice',
    icon: '🎤',
    title: 'Voice Detective',
    description: 'Say a number out loud and let AI figure it out! Your voice is the magic key! 🔮',
    color: COLORS.orange,
    screen: 'Voice',
  },
  {
    id: 'finger',
    icon: '✋',
    title: 'Finger Counting',
    description: 'Show your fingers to the camera and let AI count them! MediaPipe magic at work! 🖐️',
    color: '#9C27B0',
    screen: 'FingerCount',
  },
  {
    id: 'fruit',
    icon: '🍎',
    title: 'Fruit Detector',
    description: 'Snap a photo of fruits and the AI will tell you which fruits are there and how many! 🍌🍇',
    color: COLORS.green,
    screen: 'Fruit',
  },
];

// Floating Number Component
const FloatingNumber = ({ number, delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -500,
          duration: 15000,
          useNativeDriver: true,
          delay: delay,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingNumber,
        {
          transform: [{ translateY }],
          opacity,
          left: `${Math.random() * 90}%`,
        },
      ]}
    >
      {number}
    </Animated.Text>
  );
};

// Activity Card Component
const ActivityCard = ({ activity, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wiggle animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const wiggleRotate = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.activityCard, { borderTopColor: activity.color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.Text
          style={[
            styles.activityIcon,
            { transform: [{ rotate: wiggleRotate }] },
          ]}
        >
          {activity.icon}
        </Animated.Text>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <LinearGradient
          colors={GRADIENTS.button}
          style={styles.activityButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.activityButtonText}>Let's Go! 🚀</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={GRADIENTS.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Floating Numbers Background */}
      <View style={styles.floatingContainer}>
        {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num, i) => (
          <FloatingNumber key={i} number={num} delay={i * 1500} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Animated.Text
              style={[
                styles.logoText,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              ✨ Digitify Learn ✨
            </Animated.Text>
            <Text style={styles.tagline}>🚀 Learn Numbers with AI Magic! 🎨</Text>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>🎯</Text>
            <Text style={styles.heroTitle}>Welcome!</Text>
            <Text style={styles.heroDescription}>
              🌟 Digitify Learn is a magical AI-powered learning platform where you explore numbers through fun, interactive games!
            </Text>
            
            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>💡 How It Works</Text>
              <Text style={styles.howItWorksItem}>✅ Draw numbers with your finger</Text>
              <Text style={styles.howItWorksItem}>✅ Show numbers to your camera</Text>
              <Text style={styles.howItWorksItem}>✅ Speak numbers using your voice</Text>
              <Text style={styles.howItWorksItem}>🤖 Our AI recognizes everything! ✨</Text>
            </View>
          </View>

          {/* Activities Title */}
          <Text style={styles.activitiesTitle}>🎮 Choose Your Adventure! 🎮</Text>

          {/* Activity Cards */}
          <View style={styles.activityGrid}>
            {activities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                onPress={() => navigation.navigate(activity.screen)}
              />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerSubtext}>Digitify Learn - Where Learning Meets Fun! 🎉</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  floatingNumber: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    opacity: 0.15,
    top: '100%',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  heroSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    margin: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  heroDescription: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  howItWorks: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    width: '100%',
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  howItWorksItem: {
    fontSize: 16,
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  activitiesTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: SPACING.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  activityGrid: {
    paddingHorizontal: SPACING.md,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 6,
    ...SHADOWS.medium,
  },
  activityIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  activityButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.small,
  },
  activityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: COLORS.primary,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
});
