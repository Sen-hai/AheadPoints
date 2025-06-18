import { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  studentId: string;
  walletAddress?: string;
  points?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    let user = null;
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        user = JSON.parse(userString);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user");
      }
    }
    return {
      isAuthenticated: !!token,
      user: user,
      token: token,
    };
  });

  useEffect(() => {
    // 设置 axios 默认 headers
    if (authState.token) {
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${authState.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [authState.token]);

  const login = useCallback(async (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setAuthState({
      isAuthenticated: true,
      user,
      token,
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };

  const updateUser = (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    setAuthState((prev) => ({
      ...prev,
      user,
    }));
  };

  const refreshUser = useCallback(async () => {
    if (!authState.token) return;
    
    try {
      const response = await axios.get('http://localhost:5000/api/user/info', {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });
      
      if (response.data.success) {
        const userData = response.data.data;
        const updatedUser = {
          id: userData._id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          studentId: userData.studentId,
          walletAddress: userData.walletAddress,
          points: userData.points,
        };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }
  }, [authState.token]);

  return {
    ...authState,
    login,
    logout,
    updateUser,
    refreshUser,
  };
};
