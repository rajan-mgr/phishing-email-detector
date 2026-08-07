import axios from "axios";

const API_BASE = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const getAuthUrl = (provider) => `/auth/${provider}`;
export const getCurrentUser = () => api.get("/auth/me");

// Scanning
export const scanEmails = () => api.post("/scan");
export const quickScan = (subject, body, sender = "") =>
  api.post("/scan/quick", { subject, body, sender });

// Upload a .eml file for scanning — multipart/form-data, not JSON
export const scanEmlFile = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/scan/eml", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// History with optional days filter
export const getHistory = (days = 0) => {
  const params = days > 0 ? { days } : {};
  return api.get("/history", { params });
};

export const getStats = (days = 0) => {
  const params = days > 0 ? { days } : {};
  return api.get("/history/stats", { params });
};

// Model management
export const getModelStatus = () => api.get("/model/status");
export const switchModel = (model) => api.post("/model/switch", { model });

export default api;