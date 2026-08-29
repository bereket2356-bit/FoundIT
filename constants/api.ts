import Constants from "expo-constants";

const PROD_BASE_URL = "https://foundit-n1ou.onrender.com";

const getBaseUrl = (): string => {
  // 1. Check EXPO_PUBLIC_BASE_URL or EXPO_PUBLIC_API_URL from environment / EAS Build / .env
  if (process.env.EXPO_PUBLIC_BASE_URL) {
    return process.env.EXPO_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, "").replace(
      /\/+$/,
      "",
    );
  }

  // 2. Check Expo Constants extra (configured in app.json for EAS Build)
  const extraBaseUrl = Constants.expoConfig?.extra?.baseUrl;
  if (extraBaseUrl) {
    return (extraBaseUrl as string).replace(/\/+$/, "");
  }
  const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraApiUrl) {
    return (extraApiUrl as string).replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }

  // 3. Fallback to production deployed URL
  return PROD_BASE_URL;
};

export const BASE_URL = getBaseUrl();
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") || `${BASE_URL}/api`;
