/**
 * API Configuration
 *
 * Change BASE_URL to your server's IP address when testing on a physical device.
 *
 * Finding your IP:
 * - Windows: Run 'ipconfig' in terminal
 * - Mac/Linux: Run 'ifconfig' in terminal
 * - Look for IPv4 Address (e.g., 192.168.1.100)
 *
 * For Android Emulator: 10.0.2.2
 * For iOS Simulator: localhost or 127.0.0.1
 * For Physical Device: Your computer's IP address
 */

const API_CONFIG = {
  // ⚠️ CHANGE THIS to your computer's IP address
  BASE_URL: "http://192.168.43.129:8000",
                                    
  // API Endpoints
  ENDPOINTS: {
    HEALTH: "/api/health/",
    PREDICT_DIGIT: "/api/predict/digit/",
    PREDICT_VOICE: "/api/voice/predict/",
    PREDICT_CAMERA: "/api/predict/camera/",
    PREDICT_MATH: "/api/predict/math/",
    FINGER_COUNT: "/api/finger/count/",
    PREDICT_FRUIT: "/api/predict/fruit/",
  },
};

/**
 * Get full API URL for an endpoint
 * @param {string} endpoint - Endpoint key from ENDPOINTS
 * @returns {string} Full URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};

export default API_CONFIG;
