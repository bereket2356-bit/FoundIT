import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function ForgotPassword() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleRequestCode = async () => {
    if (!email) {
      showAlert({
        title: "Missing Email",
        message: "Please enter your university email address.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert({
          type: "info",
          title: "Reset Code Sent",
          message: data.message || "If an account exists, a 6-digit code has been sent.",
          buttonText: "Enter Code",
          onPress: () => setStep("reset"),
        });
      } else {
        showAlert({
          title: "Notice",
          message: data.message || "Could not request password reset.",
          type: "warning",
        });
      }
    } catch (error) {
      showAlert({
        title: "Connection Error",
        message: "Cannot connect to server. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || code.trim().length !== 6) {
      showAlert({
        title: "Invalid Code",
        message: "Please enter the 6-digit reset code.",
        type: "error",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showAlert({
        title: "Invalid Password",
        message: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        title: "Passwords Do Not Match",
        message: "Please confirm that both passwords match.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          token: code.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert({
          type: "success",
          title: "Password Reset Successfully",
          message: "Your password has been updated. You can now log in.",
          buttonText: "Log In",
          onPress: () => router.replace("/(auth)/login"),
        });
      } else {
        showAlert({
          title: "Reset Failed",
          message: data.message || "Invalid code or expired request.",
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Connection Error",
        message: "Cannot connect to server.",
        type: "error",
      });
    } finally {
      setLoading(false);
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
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Ionicons
                name={step === "request" ? "lock-open-outline" : "key-outline"}
                size={40}
                color="#000"
              />
            </View>
            <Text style={styles.title}>
              {step === "request" ? "Forgot Password" : "Set New Password"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "request"
                ? "Enter your email to receive a 6-digit reset code"
                : "Enter the code sent to your email and your new password"}
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {step === "request" ? (
              <>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder="your.email@university.edu"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[styles.button, loading && { backgroundColor: "#666" }]}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Sending..." : "Send Reset Code"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: "center" }}
                  onPress={() => setStep("reset")}
                >
                  <Text style={{ color: "#4f46e5", fontSize: 13, fontWeight: "600" }}>
                    Already have a code? Reset password
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder="your.email@university.edu"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>6-Digit Reset Code</Text>
                <TextInput
                  placeholder="123456"
                  placeholderTextColor="#aaa"
                  style={styles.codeInput}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor="#999"
                    secureTextEntry={secure}
                    style={{ flex: 1 }}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setSecure(!secure)}>
                    <Ionicons
                      name={secure ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor="#999"
                    secureTextEntry={secure}
                    style={{ flex: 1 }}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && { backgroundColor: "#666" }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Updating..." : "Reset Password"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: "center" }}
                  onPress={() => setStep("request")}
                >
                  <Text style={{ color: "#666", fontSize: 13 }}>
                    Resend code
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => router.push("/(auth)/login")}
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
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 5,
    fontSize: 13,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    padding: 20,
  },
  label: {
    marginBottom: 5,
    marginTop: 10,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    padding: 12,
    color: "#000",
  },
  codeInput: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 6,
    textAlign: "center",
    color: "#000",
  },
  passwordContainer: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#0b0c2a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  back: {
    textAlign: "center",
    color: "#0b0c2a",
    fontWeight: "500",
  },
});