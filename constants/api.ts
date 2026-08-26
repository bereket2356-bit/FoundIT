import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0] || "localhost";

  // If we are in Expo Go, hostUri will give us the local IP of the computer
  if (debuggerHost) {
    return `http://${localhost}:5000`;
  }

  // Fallback for Android emulator
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  // Fallback for iOS simulator and Web
  return "http://localhost:5000";
};

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`;
