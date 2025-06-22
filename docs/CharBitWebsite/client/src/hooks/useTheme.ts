import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";

export type Theme = "black" | "white" | "midnight" | "neon" | "pinky" | "bob";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("black");
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Load theme from user data or localStorage
    if (isAuthenticated && user?.theme) {
      setTheme(user.theme as Theme);
    } else {
      const savedTheme = localStorage.getItem("charbit-theme") as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.className = `theme-${theme}`;
    
    // Save to localStorage for non-authenticated users
    if (!isAuthenticated) {
      localStorage.setItem("charbit-theme", theme);
    }
  }, [theme, isAuthenticated]);

  const switchTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Save to backend if authenticated
    if (isAuthenticated) {
      try {
        await apiRequest("PATCH", "/api/user/theme", { theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme:", error);
      }
    }
  };

  return {
    theme,
    switchTheme,
  };
}
