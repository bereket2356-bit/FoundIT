import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  name: string;
  email: string;
  avatar: string;
  id?: string;
}

interface UserContextType {
  user: User;
  updateUser: (data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>({
    name: "",
    email: "",
    avatar: "",
    id: "",
  });

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.log("Failed to load user from storage", err);
      }
    };
    loadStoredUser();
  }, []);

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      AsyncStorage.setItem("user", JSON.stringify(updated)).catch((err) =>
        console.log("Failed to save user to storage", err),
      );
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
};
