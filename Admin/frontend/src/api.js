// src/api.js
import axios from "axios";

// Make sure baseURL matches your backend server
const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token automatically to protected requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = token;
  return config;
});

export default API;