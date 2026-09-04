import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  "430665417535-j2se6nla3lop6ko8eokavqqvrdgnvite.apps.googleusercontent.com";

export default function Login() {
  const [secure, setSecure] = useState(true);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { updateUser } = useUser();
  const { showAlert } = useAlert();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    redirectUri: "https://auth.expo.io/@bereket2356-bit/FoundIt",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (
    idToken?: string,
    fallbackEmail?: string,
  ) => {
    try {
      const payload: any = {};
      if (idToken) {
        payload.idToken = idToken;
      } else {
        const userEmail = fallbackEmail || email.trim();
        if (!userEmail) {
          showAlert({
            title: "Email Required",
            message:
              "Please enter your email above or tap Continue with Google.",
            type: "warning",
          });
          return;
        }
        payload.email = userEmail;
        payload.name = userEmail.split("@")[0];
      }

      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) await AsyncStorage.setItem("token", data.token);
        updateUser({
          id: data._id,
          name: data.name,
          email: data.email,
          avatar: data.avatar || "https://via.placeholder.com/150",
        });
        showAlert({
          type: "success",
          title: "Signed in with Google",
          message: `Welcome back, ${data.name}!`,
          buttonText: "Continue",
          onPress: () => router.replace("/(tabs)/home"),
        });
      } else {
        showAlert({
          title: "Google Sign-In Error",
          message: data.message || "Could not authenticate with Google.",
          type: "error",
        });
      }
    } catch (err) {
      showAlert({
        title: "Connection Error",
        message: "Cannot connect to authentication server.",
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
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="cube-outline" size={40} color="#000" />
            </View>
            <Text style={styles.title}>FoundIT</Text>
            <Text style={styles.subtitle}>Campus Lost & Found Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={styles.activeTab}>
                <Text style={styles.activeText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text style={styles.inactiveText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="your.email@university.edu"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={secure}
                style={{ flex: 1 }}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Ionicons
                  name={secure ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                try {
                  const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email,
                      password,
                    }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    try {
                      if (data.token)
                        await AsyncStorage.setItem("token", data.token);
                    } catch (e) {
                      console.log("Could not save token", e);
                    }
                    updateUser({
                      id: data._id,
                      name: data.name,
                      email: data.email,
                      avatar: data.avatar || "https://via.placeholder.com/150",
                    });
                    showAlert({
                      type: "success",
                      title: "You are now logged in",
                      message: "Welcome back to FoundIT.",
                      buttonText: "Continue",
                      onPress: () => router.replace("/(tabs)/home"),
                    });
                  } else {
                    if (data.code === "EMAIL_NOT_VERIFIED") {
                      showAlert({
                        title: "Email Not Verified",
                        message:
                          data.message ||
                          "Please verify your email before logging in.",
                        type: "warning",
                        buttonText: "Verify Now",
                        onPress: () =>
                          router.push({
                            pathname: "/(auth)/verify",
                            params: { email },
                          }),
                      });
                    } else {
                      showAlert({
                        title: "Error",
                        message: data.message,
                        type: "error",
                      });
                    }
                  }
                } catch (error) {
                  showAlert({
                    title: "Error",
                    message: "Cannot connect to server",
                    type: "error",
                  });
                }
              }}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={async () => {
                try {
                  if (promptAsync) {
                    await promptAsync();
                  } else {
                    handleGoogleLogin(undefined, email);
                  }
                } catch (e) {
                  handleGoogleLogin(undefined, email);
                }
              }}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#000"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgotpassword")}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#ddd",
    borderRadius: 20,
    padding: 5,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  activeTab: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  activeText: {
    fontWeight: "600",
  },
  inactiveText: {
    paddingVertical: 8,
    paddingHorizontal: 40,
    color: "#555",
  },
  label: {
    marginBottom: 5,
    marginTop: 10,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    padding: 12,
  },
  passwordContainer: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    paddingHorizontal: 12,
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
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 12,
  },
  googleButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  forgot: {
    textAlign: "center",
    marginTop: 15,
  },
  footer: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 12,
    marginTop: 20,
  },
});
