import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";
import { useAlert } from "../../context/AlertContext";
import { useItems } from "../../context/Itemscontext";
import { useUser } from "../../context/Usercontext";
type ItemType = "found" | "lost";

export default function PostScreen() {
  const [type, setType] = useState<ItemType>("found");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const { addItem } = useItems();
  const { user } = useUser();
  const { showAlert } = useAlert();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const imgStr = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setImage(imgStr);
    }
  };

  const handleSubmit = async () => {
    // date is optional for lost items
    if (
      !title ||
      !category ||
      !location ||
      !description ||
      !contactInfo ||
      !image
    ) {
      showAlert({
        title: "Missing Fields",
        message: "Please fill in all required fields including Contact Info.",
        type: "error",
      });
      return;
    }
    if (type === "found" && !date) {
      showAlert({
        title: "Missing Fields",
        message: "Please provide a Date Found.",
        type: "error",
      });
      return;
    }

    // Format date string as YYYY-MM-DD
    let finalDate: string = date.trim();
    if (finalDate) {
      const parsed = Date.parse(finalDate);
      if (!isNaN(parsed)) {
        finalDate = new Date(parsed).toISOString().split("T")[0]; // YYYY-MM-DD
      }
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/items`,
        {
          type,
          title,
          category,
          location,
          date: finalDate,
          description,
          contactInfo: contactInfo.trim(),
          image,
          user: user?.id || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      showAlert({
        type: "success",
        title: "Form Submitted",
        message: "Wait for admin review.",
        buttonText: "Continue",
        onPress: () => router.replace("/(tabs)/home"),
      });
      // add to local context
      if (response && response.data) addItem(response.data);
      // 🔥 CLEAR FORM
      setTitle("");
      setCategory("");
      setLocation("");
      setDate("");
      setDescription("");
      setContactInfo("");
      setImage(null);
      setType("found");
    } catch (error) {
      console.log("POST ERROR:", error);
      showAlert({
        title: "Error",
        message:
          (error as any).response?.data?.message || "Could not post item.",
        type: "error",
      });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f8f9fa" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.headerTitle}>Post an Item</Text>

          {/* Lost / Found Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                type === "found" && styles.toggleActive,
              ]}
              onPress={() => setType("found")}
            >
              <Text
                style={[
                  styles.toggleText,
                  type === "found" && styles.toggleTextActive,
                ]}
              >
                Found
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                type === "lost" && styles.toggleActive,
              ]}
              onPress={() => setType("lost")}
            >
              <Text
                style={[
                  styles.toggleText,
                  type === "lost" && styles.toggleTextActive,
                ]}
              >
                Lost
              </Text>
            </TouchableOpacity>
          </View>

          {/* Image Picker Placeholder */}
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <>
                <Ionicons name="image-outline" size={24} color="#888" />
                <Text style={styles.imageText}>Upload Image</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Title */}
          <TextInput
            placeholder="Item Title"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          {/* Category */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
              dropdownIconColor="#000"
            >
              <Picker.Item label="Select Category..." value="" />
              <Picker.Item label="Keys" value="Keys" />
              <Picker.Item label="Electronics" value="Electronics" />
              <Picker.Item label="Bag" value="Bag" />
              <Picker.Item label="Phone" value="Phone" />
              <Picker.Item label="Clothes" value="Clothes" />
              <Picker.Item label="Documents" value="Documents" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          {/* Location */}
          <TextInput
            placeholder="Location"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />

          {/* Contact Info */}
          <TextInput
            placeholder="Contact Info (Phone or Telegram handle)"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={contactInfo}
            onChangeText={setContactInfo}
          />

          {/* Date */}
          <TextInput
            placeholder={
              type === "lost"
                ? "Date Lost (Optional, YYYY-MM-DD)"
                : "Date Found (YYYY-MM-DD)"
            }
            placeholderTextColor="#aaa"
            style={styles.input}
            value={date}
            onChangeText={setDate}
          />

          {/* Description */}
          <TextInput
            placeholder="Description"
            placeholderTextColor="#aaa"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>
              Post {type === "found" ? "Found" : "Lost"} Item
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 10,
    justifyContent: "center",
    width: "100%",
    minHeight: 48,
  },
  picker: {
    color: "#000",
    height: 52,
    width: "100%",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#000",
  },
  toggleText: {
    fontWeight: "600",
    color: "#666",
    fontSize: 14,
  },
  toggleTextActive: {
    color: "#fff",
  },

  imageUpload: {
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  imageText: {
    marginTop: 4,
    color: "#888",
    fontSize: 13,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 44,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 10,
    color: "#000",
  },

  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },

  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
