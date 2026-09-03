// context/ThemeContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeColors = {
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  btnPrimary: string;
  btnPrimaryText: string;
  divider: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
};

const lightTheme: ThemeColors = {
  bg: "#F8FAFC",
  cardBg: "#FFFFFF",
  cardBorder: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  inputBg: "#FFFFFF",
  inputBorder: "#CBD5E1",
  btnPrimary: "#000000",
  btnPrimaryText: "#FFFFFF",
  divider: "#F1F5F9",
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E2E8F0",
  tabActive: "#000000",
  tabInactive: "#94A3B8",
};

const darkTheme: ThemeColors = {
  bg: "#0F172A",
  cardBg: "#1E293B",
  cardBorder: "#334155",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  inputBg: "#1E293B",
  inputBorder: "#475569",
  btnPrimary: "#FFFFFF",
  btnPrimaryText: "#000000",
  divider: "#334155",
  tabBarBg: "#0F172A",
  tabBarBorder: "#1E293B",
  tabActive: "#FFFFFF",
  tabInactive: "#64748B",
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: (value?: boolean) => Promise<void>;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: async () => {},
  theme: lightTheme,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("user_theme").then((val) => {
      if (val === "dark") {
        setIsDarkMode(true);
      }
    });
  }, []);

  const toggleTheme = async (value?: boolean) => {
    const nextVal = typeof value === "boolean" ? value : !isDarkMode;
    setIsDarkMode(nextVal);
    await AsyncStorage.setItem("user_theme", nextVal ? "dark" : "light");
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
