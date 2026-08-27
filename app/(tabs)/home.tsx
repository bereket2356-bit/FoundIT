// app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { Key, useCallback, useEffect, useState } from "react";
import {
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
  user: any;
  status: any;
  _id: Key | null | undefined;
  id: string;
  title: string;
  image: string;
  category: string;
  type: "found" | "lost";
  location: string;
  createdAt: string;
};

export default function HomeScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "found" | "lost">(
    "all",
  );
  const [refreshing, setRefreshing] = useState(false);

  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<Item | null>(
    null,
  );
  const [proofDescription, setProofDescription] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [lostLocation, setLostLocation] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const { user } = useUser();
  const { showAlert } = useAlert();

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch (error) {
      console.log("Fetch notifications error", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
      fetchNotifications();
    }, []),
  );

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      setItems(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchNotifications()]);
    setRefreshing(false);
  };

  const markNotificationRead = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${API_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.log("Mark notification read error", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredItems = items.filter((item) => {
    const matchesType = selectedType === "all" || item.type === selectedType;

    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  const pickProofImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert({
        title: "Permission required",
        message: "Sorry, we need camera roll permissions to make this work!",
        type: "error",
      });
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
      setProofImage(imgStr);
    }
  };

  const submitClaim = async () => {
    if (!proofDescription || !contactInfo) {
      return;
    }
    if (!selectedItemForClaim) return;

    setSubmittingClaim(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/items/${selectedItemForClaim._id}/claim`,
        {
          proof_description: proofDescription,
          proof_image: proofImage || "",
          lost_location: lostLocation || "",
          lost_date: lostDate || "",
          contact_info: contactInfo,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update item in feed
      setItems((prev) =>
        prev.map((it) => (it._id === selectedItemForClaim._id ? res.data : it)),
      );

      showAlert({
        type: "success",
        title: "Form Submitted",
        message: "Wait for admin review.",
        buttonText: "Continue",
      });

      // Reset Modal
      setClaimModalVisible(false);
      setSelectedItemForClaim(null);
      setProofDescription("");
      setProofImage(null);
      setLostLocation("");
      setLostDate("");
      setContactInfo("");
    } catch (err: any) {
      console.log("Claim error", err.response?.data || err);
      const code = err.response?.data?.code;
      if (code === "DUPLICATE_CLAIM") {
        showAlert({
          title: "Claim Error",
          message: "This item already has a pending claim under review.",
          type: "error",
        });
      } else if (code === "VALIDATION_ERROR") {
        showAlert({
          title: "Claim Error",
          message: "Please fill out all required fields.",
          type: "error",
        });
      } else if (code === "INVALID_STATE") {
        showAlert({
          title: "Claim Error",
          message: "Item is not available for claim.",
          type: "error",
        });
      } else if (err.response?.status === 401) {
        showAlert({
          title: "Claim Error",
          message:
            "Your session expired — please log in again to submit a claim.",
          type: "error",
        });
      } else if (err.message && err.message.includes("Network")) {
        showAlert({
          title: "Claim Error",
          message:
            "Something went wrong on our end. Please try again in a moment.",
          type: "error",
        });
      } else {
        showAlert({
          title: "Claim Error",
          message:
            "Something went wrong on our end. Please try again in a moment.",
          type: "error",
        });
      }
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f8f9fa" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>FoundIT</Text>
          <Text style={styles.subtitle}>Campus Lost & Found</Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => setNotifModalVisible(true)}
        >
          <Ionicons name="notifications-outline" size={22} color="#000" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search items..."
          placeholderTextColor="#aaa"
          style={styles.searchInput}
        />
      </View>

      {/* Found / Lost Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedType === "all" && styles.toggleActive,
          ]}
          onPress={() => setSelectedType("all")}
        >
          <Text
            style={
              selectedType === "all"
                ? styles.toggleTextActive
                : styles.toggleText
            }
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedType === "found" && styles.toggleActive,
          ]}
          onPress={() => setSelectedType("found")}
        >
          <Text
            style={
              selectedType === "found"
                ? styles.toggleTextActive
                : styles.toggleText
            }
          >
            Found
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedType === "lost" && styles.toggleActive,
          ]}
          onPress={() => setSelectedType("lost")}
        >
          <Text
            style={
              selectedType === "lost"
                ? styles.toggleTextActive
                : styles.toggleText
            }
          >
            Lost
          </Text>
        </TouchableOpacity>
      </View>

      {/* Item List */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredItems.map((item) => (
          <View key={item._id} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.category}</Text>
                </View>
                <View style={[styles.tag, styles.statusTag]}>
                  <Text style={[styles.tagText, styles.statusText]}>
                    {item.type === "found" ? "Found" : "Lost"}
                  </Text>
                </View>
              </View>
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
              <Text style={styles.timeText}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <View style={styles.actionsRow}>
              {/* show status */}
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {item.status?.toUpperCase() || "OPEN"}
                </Text>
              </View>
              {/* claim button: only show if open and not the owner */}
              {item.status === "open" &&
                user?.id !== (item.user?._id || item.user) && (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => {
                      setSelectedItemForClaim(item as Item);
                      setClaimModalVisible(true);
                    }}
                  >
                    <Text style={styles.claimButtonText}>Claim</Text>
                  </TouchableOpacity>
                )}
            </View>
            {item.type === "found" && (
              <View style={styles.foundBadge}>
                <Text style={styles.foundText}>Found</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={claimModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#f8f9fa" }}
          edges={["top"]}
        >
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
                Submit Claim
              </Text>
              <TouchableOpacity onPress={() => setClaimModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                Describe details only the owner would know *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 80,
                  textAlignVertical: "top",
                  marginBottom: 4,
                }}
                placeholder="e.g. lock screen photo, scratches, keychain..."
                multiline
                value={proofDescription}
                onChangeText={setProofDescription}
              />
              {!proofDescription && submittingClaim ? (
                <Text style={{ color: "red", fontSize: 12, marginBottom: 12 }}>
                  This field is required.
                </Text>
              ) : (
                <View style={{ marginBottom: 16 }} />
              )}

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                Phone or Telegram username *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 4,
                }}
                placeholder="@username or 09..."
                value={contactInfo}
                onChangeText={setContactInfo}
              />
              {!contactInfo && submittingClaim ? (
                <Text style={{ color: "red", fontSize: 12, marginBottom: 12 }}>
                  This field is required.
                </Text>
              ) : (
                <View style={{ marginBottom: 16 }} />
              )}

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                Photo proof{" "}
                <Text style={{ fontWeight: "400", color: "#9ca3af" }}>
                  (optional)
                </Text>
              </Text>
              <TouchableOpacity
                onPress={pickProofImage}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderStyle: "dashed",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {proofImage ? (
                  <Image
                    source={{ uri: proofImage }}
                    style={{ width: 60, height: 60, borderRadius: 8 }}
                  />
                ) : (
                  <Text style={{ color: "#6b7280" }}>Tap to upload</Text>
                )}
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                Where you lost it{" "}
                <Text style={{ fontWeight: "400", color: "#9ca3af" }}>
                  (optional)
                </Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
                placeholder="e.g. Library 2nd floor"
                value={lostLocation}
                onChangeText={setLostLocation}
              />

              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                When you lost it{" "}
                <Text style={{ fontWeight: "400", color: "#9ca3af" }}>
                  (optional)
                </Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                }}
                placeholder="YYYY-MM-DD"
                value={lostDate}
                onChangeText={setLostDate}
              />

              <TouchableOpacity
                style={{
                  backgroundColor:
                    !proofDescription || !contactInfo || submittingClaim
                      ? "#9ca3af"
                      : "#000000",
                  padding: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  marginBottom: 32,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                }}
                onPress={submitClaim}
                disabled={!proofDescription || !contactInfo || submittingClaim}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                >
                  {submittingClaim ? "Submitting..." : "Submit Claim"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Notifications Inbox Modal */}
      <Modal
        visible={notifModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
          <StatusBar barStyle="dark-content" />

          {/* Compact Top Bar */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>Notifications</Text>
              <Text style={styles.subtitle}>Activity & Claim Updates</Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => setNotifModalVisible(false)}
            >
              <Ionicons name="close-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
            {notifications.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color="#ccc"
                />
                <Text style={{ color: "#888", marginTop: 12, fontSize: 15 }}>
                  No notifications yet.
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  onPress={() => markNotificationRead(item._id)}
                  style={{
                    backgroundColor: item.read ? "#fff" : "#f0f4ff",
                    borderWidth: 1,
                    borderColor: item.read ? "#eee" : "#c7d2fe",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ marginRight: 12 }}>
                    <Ionicons
                      name={
                        item.type === "claim_approved"
                          ? "checkmark-circle-outline"
                          : item.type === "claim_rejected"
                            ? "close-circle-outline"
                            : "information-circle-outline"
                      }
                      size={28}
                      color="#000"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "bold",
                          color: "#000",
                        }}
                      >
                        {item.title}
                      </Text>
                      {!item.read && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#000",
                          }}
                        />
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
                      {item.message}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  appName: { fontSize: 20, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 11, color: "#666" },
  bellButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#000",
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 12,
    overflow: "hidden",
  },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: "center" },
  toggleActive: { backgroundColor: "#000" },
  toggleText: { fontWeight: "600", color: "#666", fontSize: 15 },
  toggleTextActive: { color: "#fff" },
  feed: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    position: "relative",
  },
  cardImage: { width: "100%", height: 180, resizeMode: "cover" },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 6 },
  tagRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: "#444", fontWeight: "500" },
  statusTag: { backgroundColor: "#e0ffe0" },
  statusText: { color: "#006600", fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  metaText: { fontSize: 14, color: "#666", marginLeft: 4 },
  timeText: { fontSize: 13, color: "#888" },
  foundBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  foundText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  claimButton: {
    backgroundColor: "#088b15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  claimButtonText: { color: "#fff", fontWeight: "600" },
  statusPill: {
    backgroundColor: "#eee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 12, color: "#333", fontWeight: "600" },
});
