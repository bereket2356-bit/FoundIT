import React, { useState } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const [secure, setSecure] = useState(true);
  const router = useRouter();
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.container}>
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
      const response = await fetch("http://192.168.1.2:5000/api/auth/login", {
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
              router.replace("/(tabs)/home");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (error) {
      Alert.alert("Error", "Cannot connect to server");
    }
  }}
>
          <Text style={styles.buttonText}>Login</Text>          
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/forgotpassword")}>
  <Text style={styles.forgot}>Forgot password?</Text>
</TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
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