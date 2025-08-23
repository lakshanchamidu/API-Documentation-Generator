import React, { createContext, useContext, useEffect, useReducer } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";

// Create context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };

    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = Cookies.get("token");

        if (token) {
          // Token exists, verify with backend
          const response = await authAPI.getProfile();

          if (response.data.success) {
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                user: response.data.data.user,
                token,
              },
            });
          } else {
            // Invalid token, clear it
            Cookies.remove("token");
            dispatch({ type: "LOGOUT" });
          }
        } else {
          // No token found
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        // Error fetching profile, clear token
        console.error("Auth initialization error:", error);
        Cookies.remove("token");
        dispatch({ type: "LOGOUT" });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.login(credentials);

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Store token in cookie (expires in 7 days)
        Cookies.set("token", token, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Update state
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        toast.success("Login successful!");
        return { success: true, user };
      }

      return { success: false, message: "Login failed" };
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      dispatch({ type: "SET_LOADING", payload: false });
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const response = await authAPI.register(userData);

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Store token in cookie
        Cookies.set("token", token, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Update state
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });

        toast.success("Registration successful!");
        return { success: true, user };
      }

      return { success: false, message: "Registration failed" };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      dispatch({ type: "SET_LOADING", payload: false });
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from cookies
    Cookies.remove("token");

    // Update state
    dispatch({ type: "LOGOUT" });

    toast.success("Logged out successfully");
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);

      if (response.data.success) {
        dispatch({
          type: "UPDATE_USER",
          payload: response.data.data.user,
        });

        toast.success("Profile updated successfully");
        return { success: true, user: response.data.data.user };
      }

      return { success: false, message: "Failed to update profile" };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);

      if (response.data.success) {
        toast.success("Password changed successfully");
        return { success: true };
      }

      return { success: false, message: "Failed to change password" };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to change password";
      return { success: false, message };
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission, projectOwnerId = null) => {
    if (!state.user) return false;

    // Admin users have all permissions
    if (state.user.role === "admin") return true;

    // Check project ownership
    if (projectOwnerId && state.user._id === projectOwnerId) return true;

    // Add more permission logic as needed
    return false;
  };

  // Get user subscription limits
  const getSubscriptionLimits = () => {
    const subscription = state.user?.subscription || "free";
    const limits = {
      free: { projects: 3, endpoints: 50, collaborators: 1 },
      pro: { projects: 25, endpoints: 500, collaborators: 10 },
      enterprise: { projects: -1, endpoints: -1, collaborators: -1 },
    };

    return limits[subscription] || limits.free;
  };

  // Context value
  const value = {
    // State
    ...state,

    // Actions
    login,
    register,
    logout,
    updateUser,
    changePassword,

    // Helpers
    hasPermission,
    getSubscriptionLimits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
