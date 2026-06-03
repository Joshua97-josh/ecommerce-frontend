import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback((authResponse) => {
    const user = {
      name: authResponse.name, email: authResponse.email,
      role: authResponse.role, userId: authResponse.userId,
      token: authResponse.token,
    };
    localStorage.setItem("token", authResponse.token);
    localStorage.setItem("user", JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  }, []);

  const isLoggedIn = () => !!currentUser;
  const isAdmin    = () => currentUser?.role === "ADMIN";

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoggedIn, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
