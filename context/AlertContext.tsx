import React, { createContext, useContext, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  buttonText?: string;
  onPress?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: "",
    message: "",
    type: "info",
    buttonText: "OK",
  });

  const showAlert = (newOptions: AlertOptions) => {
    setOptions({
      type: "info",
      buttonText: "OK",
      ...newOptions,
    });
    setVisible(true);
  };

  const handlePress = () => {
    setVisible(false);
    if (options.onPress) {
      options.onPress();
    }
  };

  const getIcon = () => {
    switch (options.type) {
      case "success": return "checkmark-circle";
      case "error": return "close-circle";
      case "warning": return "warning";
      case "info":
      default: return "information-circle";
    }
  };

  const getColor = () => {
    switch (options.type) {
      case "success": return "#10b981";
      case "error": return "#ef4444";
      case "warning": return "#f59e0b";
      case "info":
      default: return "#3b82f6";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={[styles.iconBadge, { backgroundColor: getColor() }]}>
              <Ionicons name={getIcon() as any} size={40} color="#fff" />
            </View>
            <Text style={styles.title}>{options.title}</Text>
            <Text style={styles.description}>{options.message}</Text>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#4F46E5' }]} 
              onPress={handlePress}
            >
              <Text style={styles.buttonText}>{options.buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 12, 42, 0.85)', // Matches FoundIT dark theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  iconBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
