// Theme configuration for Digitify Learn app
// Matches the web app's colorful, kid-friendly design

export const COLORS = {
  // Primary gradient colors
  primary: "#667eea",
  primaryDark: "#764ba2",
  secondary: "#f093fb",
  accent: "#4facfe",
  accentLight: "#00f2fe",

  // Card border colors
  purple: "#667eea",
  pink: "#f093fb",
  blue: "#4facfe",
  orange: "#ff6b6b",
  yellow: "#feca57",
  green: "#1dd1a1",

  // Text colors
  text: "#333333",
  textLight: "#666666",
  textWhite: "#ffffff",

  // Background colors
  background: "#ffffff",
  backgroundLight: "rgba(255, 255, 255, 0.95)",
  backgroundOverlay: "rgba(255, 255, 255, 0.9)",

  // Status colors
  success: "#1dd1a1",
  error: "#ff6b6b",
  warning: "#feca57",
};

export const GRADIENTS = {
  primary: ["#667eea", "#764ba2", "#f093fb"],
  background: ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#00f2fe"],
  button: ["#667eea", "#764ba2"],
  card: ["#ffffff", "#f8f9fa"],
};

export const FONTS = {
  regular: "System",
  bold: "System",
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 15,
  lg: 25,
  xl: 30,
  round: 50,
};

export default {
  COLORS,
  GRADIENTS,
  FONTS,
  SHADOWS,
  SPACING,
  BORDER_RADIUS,
};
