import React, { createContext, useContext, useState, useEffect } from "react";
import { loginAdmin } from "../api";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("shopforge_admin");
    const token = localStorage.getItem("shopforge_access_token");
    return saved && token ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (admin) {
      localStorage.setItem("shopforge_admin", JSON.stringify(admin));
    } else {
      localStorage.removeItem("shopforge_admin");
    }
  }, [admin]);

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

  const logout = () => {
    localStorage.removeItem("shopforge_access_token");
    localStorage.removeItem("shopforge_refresh_token");
    setAdmin(null);
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
