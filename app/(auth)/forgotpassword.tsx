import React, { useState } from "react";
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Ionicons name="lock-open-outline" size={40} color="#000" />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your university email to receive reset link
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>

        <TextInput
          placeholder="your.email@university.edu"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 15 }}
          onPress={() => router.push("/(auth)/login") }
        >
          <Text style={styles.back}>Back to Login</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 60,
  },
  logoBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
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
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    padding: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    padding: 12,
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
  back: {
    textAlign: "center",
    color: "#0b0c2a",
    fontWeight: "500",
  },
});