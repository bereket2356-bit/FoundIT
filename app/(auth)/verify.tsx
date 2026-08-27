import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";
import { useAlert } from "../../context/AlertContext";
import { useUser } from "../../context/Usercontext";

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const emailParam = (params.email as string) || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const { updateUser } = useUser();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (params.email) setEmail(params.email as string);
  }, [params.email]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email || !code || code.trim().length !== 6) {
      showAlert({
        title: "Invalid Code",
        message: "Please enter the 6-digit code sent to your email.",
        type: "error",
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token: code.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
        }
        updateUser({
          id: data._id,
          name: data.name,
          email: data.email,
          avatar: data.avatar || "https://via.placeholder.com/150",
        });

        showAlert({
          type: "success",
          title: "Email Verified!",
          message: "Welcome to FoundIT. Your account is now fully active.",
          buttonText: "Continue",
          onPress: () => router.replace("/(tabs)/home"),
        });
      } else {
        showAlert({
          title: "Verification Failed",
          message: data.message || "Invalid verification code.",
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Connection Error",
        message: "Could not connect to the server. Please try again.",
        type: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!email) {
      showAlert({
        title: "Missing Email",
        message: "Please enter your email address.",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setCooldown(60);
        showAlert({
          type: "success",
          title: "Code Resent",
          message:
            data.message || "A new 6-digit code has been sent to your email.",
          buttonText: "OK",
        });
      } else {
        showAlert({
          title: "Resend Failed",
          message: data.message || "Could not resend code.",
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Connection Error",
        message: "Could not connect to the server.",
        type: "error",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="mail-unread-outline" size={40} color="#000" />
            </View>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={{ fontWeight: "bold", color: "#fff" }}>
                {email || "your email"}
              </Text>
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              placeholder="123456"
              placeholderTextColor="#aaa"
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.button, verifying && { backgroundColor: "#888" }]}
              onPress={handleVerify}
              disabled={verifying}
            >
              <Text style={styles.buttonText}>
                {verifying ? "Verifying..." : "Verify & Continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={cooldown > 0}
            >
              <Text style={styles.resendText}>
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend verification email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.back}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0c2a",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  logoBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    padding: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#333",
  },
  codeInput: {
    backgroundColor: "#e6e6e6",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 8,
    textAlign: "center",
    color: "#000",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0b0c2a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resendBtn: {
    marginTop: 14,
    alignItems: "center",
  },
  resendText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 14,
  },
  back: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
});
