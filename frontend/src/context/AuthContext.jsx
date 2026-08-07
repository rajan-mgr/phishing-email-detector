import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoScan, setAutoScan] = useState(() => {
    return localStorage.getItem("autoScan") === "true";
  });

  useEffect(() => {
    // Check for token in URL (OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const provider = params.get("provider");

    if (token) {
      // Clear old data if provider changed
      const oldProvider = localStorage.getItem("provider");
      if (oldProvider && oldProvider !== provider) {
        localStorage.removeItem("scan_cache");
      }
      localStorage.setItem("token", token);
      localStorage.setItem("provider", provider);
      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }

    // Verify token
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      getCurrentUser()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("provider");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("provider");
    localStorage.removeItem("scan_cache");
    setUser(null);
  };

  const toggleAutoScan = () => {
    const newValue = !autoScan;
    setAutoScan(newValue);
    localStorage.setItem("autoScan", String(newValue));
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, autoScan, toggleAutoScan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
