import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, GRADIENTS } from '../config/theme';

const { width } = Dimensions.get('window');

// Probability Bar Component
const ProbabilityBar = ({ digit, probability, maxProbability, index }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const isHighest = probability === maxProbability && probability > 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: probability,
      duration: 800,
      delay: index * 100,
      useNativeDriver: false,
    }).start();
  }, [probability]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.probabilityRow}>
      <Text style={[styles.digitLabel, isHighest && styles.highlightedText]}>
        {digit}
      </Text>
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.bar,
            {
              width: barWidth,
              backgroundColor: isHighest ? COLORS.green : COLORS.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.probabilityText, isHighest && styles.highlightedText]}>
        {probability.toFixed(1)}%
      </Text>
    </View>
  );
};

export default function ResultScreen({ route, navigation }) {
  const { prediction, probabilities, type } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  // Get the type emoji
  const getTypeEmoji = () => {
    switch (type) {
      case 'digit':
        return '✏️';
      case 'voice':
        return '🎤';
      case 'camera':
        return '📸';
      default:
        return '🔮';
    }
  };

  // Get max probability
  const maxProbability = Math.max(...Object.values(probabilities));

  return (
    <LinearGradient
      colors={GRADIENTS.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Card */}
        <Animated.View
          style={[
            styles.resultCard,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          <Text style={styles.typeEmoji}>{getTypeEmoji()}</Text>
          <Text style={styles.resultTitle}>🎉 Prediction Result 🎉</Text>
          
          {/* Main Prediction */}
          <View style={styles.predictionContainer}>
            <Text style={styles.predictionLabel}>The AI thinks you showed:</Text>
            <View style={styles.predictionBox}>
              {prediction.map((digit, index) => (
                <Text key={index} style={styles.predictionDigit}>
                  {digit}
                </Text>
              ))}
            </View>
          </View>

          {/* Success Message */}
          <Text style={styles.successMessage}>
            {prediction.length === 1
              ? `Amazing! The AI recognized digit ${prediction[0]}! ✨`
              : `Wow! The AI found ${prediction.length} digits: ${prediction.join(', ')}! ✨`}
          </Text>
        </Animated.View>

        {/* Probabilities Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📊 Confidence Levels</Text>
          <Text style={styles.chartSubtitle}>How sure is the AI?</Text>

          <View style={styles.chartContainer}>
            {Object.entries(probabilities).map(([digit, prob], index) => (
              <ProbabilityBar
                key={digit}
                digit={digit}
                probability={prob}
                maxProbability={maxProbability}
                index={index}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>🔄 Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>🏠 Go Home</Text>
          </TouchableOpacity>
        </View>

        {/* Fun Facts */}
        <View style={styles.funFactCard}>
          <Text style={styles.funFactTitle}>🧠 Did you know?</Text>
          <Text style={styles.funFactText}>
            The AI uses a neural network trained on thousands of handwritten digits 
            to make predictions! It's like teaching a computer to read! 🤖
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  typeEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  predictionContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  predictionLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  predictionBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  predictionDigit: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: SPACING.sm,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.green,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    ...SHADOWS.medium,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  chartContainer: {
    marginTop: SPACING.md,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  digitLabel: {
    width: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  highlightedText: {
    color: COLORS.green,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 10,
  },
  probabilityText: {
    width: 50,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  buttonContainer: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  tryAgainButton: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  buttonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  homeButton: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  funFactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  funFactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  funFactText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
});
