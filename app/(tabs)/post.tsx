import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useItems } from "../../context/Itemscontext";
import axios from "axios";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
type ItemType = "found" | "lost";

export default function PostScreen() {
  const [type, setType] = useState<ItemType>("found");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const { addItem } = useItems();

  const pickImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Permission is required!");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};

 const handleSubmit = async () => {
  if (!title || !category || !location || !description || !image) {
    Alert.alert("Missing Fields", "Please fill in all fields.");
    return;
  }

  try {
    const response = await axios.post(
      "http://192.168.1.2:5000/api/items",
      {
        type,
        title,
        category,
        location,
        description,
        image,
      }
    );

    Alert.alert("Success", "Your item has been posted!");
      // 🔥 CLEAR FORM
    setTitle("");
    setCategory("");
    setLocation("");
    setDescription("");
    setImage(null);
    setType("found");

    router.replace("/(tabs)/home"); // go back to home

  } catch (error) {
    console.log("POST ERROR:", error);
    Alert.alert("Error", "Could not post item.");
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text style={styles.headerTitle}>Post an Item</Text>

        {/* Lost / Found Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, type === "found" && styles.toggleActive]}
            onPress={() => setType("found")}
          >
            <Text
              style={[styles.toggleText, type === "found" && styles.toggleTextActive]}
            >
              Found
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, type === "lost" && styles.toggleActive]}
            onPress={() => setType("lost")}
          >
            <Text
              style={[styles.toggleText, type === "lost" && styles.toggleTextActive]}
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
              <Ionicons name="image-outline" size={28} color="#888" />
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

        {/* Description */}
        <TextInput
          placeholder="Description"
          placeholderTextColor="#aaa"
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
pickerContainer: {
  backgroundColor: "rgba(255, 255, 255, 0.25)", // transparent
  borderRadius: 30, // makes it circular/rounded
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.4)",
  paddingHorizontal: 15,
  marginBottom: 16,
  overflow: "hidden",
},
picker: {
  color: "#000",
  height: 50,
  
},
  
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#000",
  },
  toggleText: {
    fontWeight: "600",
    color: "#666",
    fontSize: 15,
  },
  toggleTextActive: {
    color: "#fff",
  },

  imageUpload: {
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  imageText: {
    marginTop: 8,
    color: "#888",
    fontSize: 14,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

 input: {
  backgroundColor: "rgba(255,255,255,0.6)",
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.08)",
  marginBottom: 16,
  color: "#000",
},

  textArea: {
    height: 110,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});