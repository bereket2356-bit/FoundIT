import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { createContext, useContext, useState } from "react";
import {
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      case "success":
        return "checkmark-circle-outline";
      case "error":
        return "close-circle-outline";
      case "warning":
        return "warning-outline";
      case "info":
      default:
        return "information-circle-outline";
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        transparent={true}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <BlurView
          intensity={90}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        >
          <SafeAreaView style={styles.fullScreenContainer}>
            <View style={styles.centerGroup}>
              <View style={styles.iconCircle}>
                <Ionicons name={getIcon() as any} size={64} color="#ffffff" />
              </View>
              <Text style={styles.title}>{options.title}</Text>
              <Text style={styles.description}>{options.message}</Text>

              <TouchableOpacity
                style={styles.button}
                onPress={handlePress}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {options.buttonText || "Continue"}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)", // Semi-transparent dark blur overlay
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  centerGroup: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#1a1a1a",
    borderWidth: 1.5,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#aaaaaa",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#ffffff", // Clean contrast white button
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
