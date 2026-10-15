import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginAdmin, onAdminLogout } from "../api";

const AdminAuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000 - 10000;
}

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("shopforge_admin");
    const token = localStorage.getItem("shopforge_access_token");
    if (saved && token && !isTokenExpired(token)) {
      return JSON.parse(saved);
    }
    if (saved || token) {
      localStorage.removeItem("shopforge_admin");
      localStorage.removeItem("shopforge_access_token");
      localStorage.removeItem("shopforge_refresh_token");
    }
    return null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem("shopforge_admin", JSON.stringify(admin));
    } else {
      localStorage.removeItem("shopforge_admin");
    }
  }, [admin]);

  const logout = useCallback(() => {
    localStorage.removeItem("shopforge_access_token");
    localStorage.removeItem("shopforge_refresh_token");
    localStorage.removeItem("shopforge_admin");
    setAdmin(null);
  }, []);

  // Check token expiry periodically (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("shopforge_access_token");
      if (token && isTokenExpired(token)) {
        console.warn("Admin token expired, logging out...");
        logout();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [logout]);

  // Listen for 401 logout events from API layer
  useEffect(() => {
    return onAdminLogout(() => {
      console.warn("Received 401 — admin session expired");
      logout();
    });
  }, [logout]);

  const login = async (email, password) => {
    try {
      const result = await loginAdmin(email.trim(), password);
      if (!result?.accessToken) {
        throw new Error("The login response did not include an access token.");
      }

      const adminUser = {
        id: result.user?.id,
        name: [result.user?.firstName, result.user?.lastName].filter(Boolean).join(" ") || result.user?.fullname || email,
        email: result.user?.email || email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=shopforge-admin`,
        role: result.user?.role || "ADMIN",
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("shopforge_access_token", result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("shopforge_refresh_token", result.refreshToken);
      }
      setAdmin(adminUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ admin, isAuthenticated: !!admin, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
