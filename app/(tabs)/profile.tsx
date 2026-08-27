import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
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
import { useUser } from "../../context/Usercontext";

type Item = {
  description: ReactNode;
  image: string;
  _id?: string;
  createdAt?: string;
  title: string;
  type: "found" | "lost";
  location?: string;
  status?: string;
};

export default function ProfileScreen() {
  const { user, updateUser } = useUser();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  // Edit Profile State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [editAvatar, setEditAvatar] = useState<string | null>(
    user.avatar || null,
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const totalPosts = items.length;
  const foundCount = items.filter((item) => item.type === "found").length;
  const lostCount = items.filter((item) => item.type === "lost").length;

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, []),
  );

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      const all = res.data || [];
      const filtered = all.filter((item: any) => {
        if (!item.user) return false;
        if (typeof item.user === "string") return item.user === user.id;
        if (item.user._id) return item.user._id === user.id;
        if (item.user.id) return item.user.id === user.id;
        return false;
      });
      setItems(filtered);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const openEditModal = () => {
    setEditName(user.name || "");
    setEditAvatar(user.avatar || null);
    setEditModalVisible(true);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert({
        title: "Permission required",
        message: "Gallery permission is required to select a photo.",
        type: "error",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const imgStr = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setEditAvatar(imgStr);
    }
  };

  const takePhotoWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert({
        title: "Permission required",
        message: "Camera permission is required to take a photo.",
        type: "error",
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const imgStr = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setEditAvatar(imgStr);
    }
  };

  const handleSaveProfile = async () => {
    if (
      !editName ||
      editName.trim().length < 2 ||
      editName.trim().length > 30
    ) {
      showAlert({
        title: "Invalid Username",
        message: "Username must be between 2 and 30 characters.",
        type: "error",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/auth/profile`,
        {
          name: editName.trim(),
          avatar: editAvatar || "",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      updateUser({
        name: res.data.name,
        avatar: res.data.avatar || editAvatar || "",
      });

      showAlert({
        type: "success",
        title: "Profile Updated",
        message: "Your profile changes have been saved successfully.",
        buttonText: "Done",
      });

      setEditModalVisible(false);
    } catch (err: any) {
      console.log("Save profile error", err.response?.data || err);
      showAlert({
        title: "Update Failed",
        message: err.response?.data?.message || "Could not update profile.",
        type: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={openEditModal}>
            <Image
              source={{ uri: user.avatar || "https://via.placeholder.com/150" }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{foundCount}</Text>
            <Text style={styles.statLabel}>Found</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{lostCount}</Text>
            <Text style={styles.statLabel}>Lost</Text>
          </View>
        </View>

        {/* My Posts */}
        <Text style={styles.sectionTitle}>My Posts</Text>
        {items.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            You haven’t posted anything yet.
          </Text>
        ) : (
          items.map((item) => (
            <View key={item._id} style={styles.rowCard}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.rowImage} />
              )}
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{item.title}</Text>

                <Text
                  style={[
                    styles.rowType,
                    item.type === "found" ? styles.foundText : styles.lostText,
                  ]}
                >
                  {item.type.toUpperCase()}
                </Text>

                <Text style={styles.rowLocation}>{item.location}</Text>
              </View>
            </View>
          ))
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#eee",
                backgroundColor: "#fff",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", color: "#1f2937" }}
              >
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Avatar Preview & Options */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <Image
                  source={{
                    uri: editAvatar || "https://via.placeholder.com/150",
                  }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    marginBottom: 12,
                  }}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={pickFromGallery}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#f0f0f0",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons name="images-outline" size={16} color="#000" />
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: "#000" }}
                    >
                      Gallery
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={takePhotoWithCamera}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: "#f0f0f0",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons name="camera-outline" size={16} color="#000" />
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: "#000" }}
                    >
                      Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Username Input */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                Username *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 24,
                  color: "#000",
                }}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your username"
                autoCapitalize="words"
              />

              {/* Save Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: savingProfile ? "#9ca3af" : "#000000",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginBottom: 16,
                }}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                }}
                onPress={() => setEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text
                  style={{ color: "#374151", fontWeight: "600", fontSize: 15 }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },

  rowImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },

  rowContent: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },

  rowType: {
    fontSize: 12,
    marginTop: 4,
  },

  foundText: {
    color: "green",
  },

  lostText: {
    color: "red",
  },

  rowLocation: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },

  postImage: {
    width: "100%",
    height: 100,
  },

  postContent: {
    padding: 14,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },

  postLocation: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },

  postDescription: {
    fontSize: 14,
    color: "#444",
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  foundBadge: {
    backgroundColor: "#d4edda",
  },

  lostBadge: {
    backgroundColor: "#f8d7da",
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
  },
  editButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editText: {
    color: "#fff",
    fontWeight: "600",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    marginHorizontal: 5,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },

  tagRow: {
    flexDirection: "row",
    gap: 8,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  foundTag: {
    backgroundColor: "#e0ffe0",
  },

  lostTag: {
    backgroundColor: "#ffe0e0",
  },

  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  statusTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },

  logoutButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
