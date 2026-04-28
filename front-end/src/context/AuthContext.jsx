import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./auth-context";

const TOKEN_KEY = "token";
const USER_KEY = "flowful_user";

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function persistSession(nextUser, nextToken) {
  if (nextToken) {
    localStorage.setItem(TOKEN_KEY, nextToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (nextUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() =>
    localStorage.getItem(TOKEN_KEY) ? readStoredUser() : null
  );
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const setSession = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    persistSession(nextUser, nextToken);
  };

  const refreshUser = async () => {
    const { data } = await api.get("/me");
    setUser(data);
    persistSession(data, token);
    return data;
  };

  const login = async (credentials) => {
    const { data } = await api.post("/login", credentials);
    setSession(data.user, data.token);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/register", payload);
    setSession(data.user, data.token);
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Clear the client session even if the server token is already invalid.
    } finally {
      setSession(null, null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    if (!token) {
      return () => {
        isActive = false;
      };
    }

    const bootstrapUser = async () => {
      setIsLoading(true);

      try {
        const { data } = await api.get("/me");

        if (!isActive) {
          return;
        }

        setUser(data);
        persistSession(data, token);
      } catch {
        if (!isActive) {
          return;
        }

        setUser(null);
        setToken(null);
        persistSession(null, null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    bootstrapUser();

    return () => {
      isActive = false;
    };
  }, [token]);

  const value = {
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    refreshUser,
    register,
    setUser,
    token,
    user,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
