import React, { useState } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
export default function SignUp() {
  const [secure, setSecure] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleSignup(event: GestureResponderEvent): void {
    throw new Error("Function not implemented.");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Ionicons name="cube-outline" size={40} color="#000" />
        </View>
        <Text style={styles.title}>FoundIT</Text>
      </View>

      <View style={styles.card}>
        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.inactiveText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@university.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Create password"
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

        {/* Create Account Button */}
<TouchableOpacity
  style={styles.button}
  onPress={async () => {
    try {
      const response = await fetch(
        "http://192.168.1.2:5000/api/auth/signup", // change if using real phone
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Account created successfully 🎉");
        console.log(data);
      } else {
        Alert.alert("Error", data.message);
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Cannot connect to server");
    }
  }}
>
  <Text style={styles.buttonText}>Create Account</Text>
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
});