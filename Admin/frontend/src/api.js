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
});

// Add token automatically to protected requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
