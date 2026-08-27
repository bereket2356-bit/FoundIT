import Constants from "expo-constants";
import { Platform } from "react-native";

const getBaseUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri || (Constants as any).experienceUrl;

  if (hostUri) {
    const host = hostUri.split(":")[0].replace(/^https?:\/\//, "");
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:5000`;
    }
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
