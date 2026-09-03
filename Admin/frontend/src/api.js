// src/api.js
import axios from "axios";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  "https://foundit-n1ou.onrender.com";

export const API_URL = `${BASE_URL.replace(/\/+$/, "")}/api`;

// Make sure baseURL matches your backend server
const API = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Add token automatically to protected requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 unauthorized responses (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid/expired session
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      // Redirect to login if not already on the login page
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login?session=expired";
      }
    }
    return Promise.reject(error);
  },
);

export default API;
