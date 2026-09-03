// app/(tabs)/profile.tsx
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";
import { useAlert } from "../../context/AlertContext";
import { useAppTheme } from "../../context/ThemeContext";
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

  // Theme Context
  const { isDarkMode, toggleTheme, theme } = useAppTheme();

  // Modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Edit Profile State
  const [editName, setEditName] = useState(user.name || "");
  const [editAvatar, setEditAvatar] = useState<string | null>(user.avatar || null);
  const [savingProfile, setSavingProfile] = useState(false);

  const totalPosts = items.length;
  const foundCount = items.filter((item) => item.type === "found").length;
  const lostCount = items.filter((item) => item.type === "lost").length;

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
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
      console.log("Fetch user items error:", error);
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
    if (!editName || editName.trim().length < 2 || editName.trim().length > 30) {
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
        { headers: { Authorization: `Bearer ${token}` } }
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? "#FFFFFF" : "#000000"]}
            tintColor={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={openEditModal} activeOpacity={0.8} style={styles.avatarWrapper}>
            <Image
              source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=000&color=fff` }}
              style={styles.avatar}
            />
            <View style={[styles.editBadge, { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" }]}>
              <Ionicons name="camera" size={14} color={isDarkMode ? "#000000" : "#FFFFFF"} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.name, { color: theme.textPrimary }]}>{user.name || "FoundIT User"}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>

          <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.btnPrimary }]} onPress={openEditModal}>
            <Text style={[styles.editText, { color: theme.btnPrimaryText }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{totalPosts}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Posts</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statNumber, { color: "#16A34A" }]}>{foundCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Found</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.statNumber, { color: "#DC2626" }]}>{lostCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Lost</Text>
          </View>
        </View>

        {/* App Settings & Theme Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Preferences & Info</Text>

        <View style={[styles.menuCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {/* Dark Mode Switch */}
          <View style={[styles.menuRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={20}
                  color={isDarkMode ? "#F8FAFC" : "#000000"}
                />
              </View>
              <View>
                <Text style={[styles.menuRowTitle, { color: theme.textPrimary }]}>
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </Text>
                <Text style={[styles.menuRowSubtitle, { color: theme.textSecondary }]}>
                  {isDarkMode ? "Night theme active" : "Bright clean theme"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: "#CBD5E1", true: "#FFFFFF" }}
              thumbColor={isDarkMode ? "#000000" : "#F8FAFC"}
            />
          </View>

          {/* About Us */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.divider }]}
            onPress={() => setAboutModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.textPrimary} />
              </View>
              <View>
                <Text style={[styles.menuRowTitle, { color: theme.textPrimary }]}>About Us</Text>
                <Text style={[styles.menuRowSubtitle, { color: theme.textSecondary }]}>FoundIT mission and campus vision</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: theme.divider }]}
            onPress={() => setTermsModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.textPrimary} />
              </View>
              <View>
                <Text style={[styles.menuRowTitle, { color: theme.textPrimary }]}>Terms of Service</Text>
                <Text style={[styles.menuRowSubtitle, { color: theme.textSecondary }]}>Usage guidelines and community rules</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setPrivacyModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={theme.textPrimary} />
              </View>
              <View>
                <Text style={[styles.menuRowTitle, { color: theme.textPrimary }]}>Privacy Policy</Text>
                <Text style={[styles.menuRowSubtitle, { color: theme.textSecondary }]}>How your data & posts are protected</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* My Posts Section */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 24 }]}>My Posts</Text>
        {items.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="cube-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              You haven’t posted any lost or found items yet.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View
              key={item._id}
              style={[styles.rowCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <Image
                source={{
                  uri:
                    item.image && (item.image.startsWith("http") || item.image.startsWith("data:"))
                      ? item.image
                      : "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80",
                }}
                style={styles.rowImage}
              />
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>

                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.type === "found" ? styles.badgeFound : styles.badgeLost,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.type === "found" ? styles.textFound : styles.textLost,
                      ]}
                    >
                      {item.type === "found" ? "Found" : "Lost"}
                    </Text>
                  </View>

                  {item.status && (
                    <View style={[styles.resolvedBadge, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                      <Text style={[styles.resolvedBadgeText, { color: theme.textSecondary }]}>{item.status}</Text>
                    </View>
                  )}
                </View>

                {item.location && (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                    <Text style={[styles.rowLocation, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Full-Screen Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseCircle}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              {/* Avatar Preview */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <Image
                  source={{
                    uri: editAvatar || user.avatar || "https://via.placeholder.com/150",
                  }}
                  style={styles.editAvatarLarge}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={pickFromGallery}
                    style={[styles.avatarPickBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                  >
                    <Ionicons name="images-outline" size={16} color={theme.textPrimary} />
                    <Text style={[styles.avatarPickBtnText, { color: theme.textPrimary }]}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={takePhotoWithCamera}
                    style={[styles.avatarPickBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                  >
                    <Ionicons name="camera-outline" size={16} color={theme.textPrimary} />
                    <Text style={[styles.avatarPickBtnText, { color: theme.textPrimary }]}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Username Input */}
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>Username *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your username"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.btnPrimary }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color={theme.btnPrimaryText} />
                ) : (
                  <Text style={[styles.saveBtnText, { color: theme.btnPrimaryText }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Full-Screen About Us Modal */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>About FoundIT</Text>
            </View>
            <TouchableOpacity onPress={() => setAboutModalVisible(false)} style={styles.modalCloseCircle}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <View style={styles.aboutHeaderBox}>
              <View style={[styles.aboutLogoCircle, { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                <Ionicons name="search" size={32} color={isDarkMode ? "#000000" : "#FFFFFF"} />
              </View>
              <Text style={[styles.aboutAppName, { color: theme.textPrimary }]}>FoundIT Campus</Text>
              <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 1.0.0 (Production Build)</Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>Our Mission</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                FoundIT is a community-driven digital lost and found platform built specifically for university campus students, faculty, and staff. Our goal is to connect lost belongings with their rightful owners rapidly, transparently, and securely.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>How It Works</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                • Anyone who finds an item can post a picture, description, and location in seconds.{"\n"}
                • Owners can browse or search the catalog and submit a private claim with identifying details.{"\n"}
                • Campus administration reviews claim details to ensure safe and accurate returns.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>Contact & Support</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                Email: support@foundit-campus.edu{"\n"}
                Office: Student Services Building, Room 204{"\n"}
                Hours: Mon - Fri, 8:30 AM - 5:00 PM
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Full-Screen Terms of Service Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Terms of Service</Text>
            </View>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={styles.modalCloseCircle}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>1. Acceptance of Terms</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                By accessing and using FoundIT, you agree to comply with all campus regulations, local laws, and these community guidelines.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>2. Honest Reporting & Claims</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                Users must provide accurate information when reporting lost or found items. Submitting fraudulent claims for items you do not own is strictly prohibited and will result in account suspension and referral to campus disciplinary authorities.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>3. Prohibited Content</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                Users may not post offensive, illegal, defamatory, or copyrighted content. Items involving hazardous materials or weapons must be reported directly to Campus Security.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>4. Admin Review & Verification</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                FoundIT administrators reserve the right to review, edit, or remove any post, and to verify claims prior to releasing items.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Full-Screen Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>Privacy Policy</Text>
            </View>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)} style={styles.modalCloseCircle}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>1. Information We Collect</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                We collect minimal information necessary to deliver the service, including your name, campus email address, uploaded photos of items, and contact details provided when reporting or claiming items.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>2. How Your Information Is Used</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                Your information is used strictly to authenticate your account, display items on the campus feed, and facilitate claim communication between owners and administrators.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>3. Data Security & Storage</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                All network communications are encrypted via SSL/TLS. Sensitive tokens and passwords are cryptographically hashed and never stored in plain text.
              </Text>
            </View>

            <View style={[styles.legalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.legalHeading, { color: theme.textPrimary }]}>4. Contact Us</Text>
              <Text style={[styles.legalBody, { color: theme.textSecondary }]}>
                If you have any questions regarding your data privacy, please contact privacy@foundit-campus.edu.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E2E8F0",
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    marginBottom: 14,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 10,
  },
  statBox: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  menuRowSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  rowCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  rowImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#E2E8F0",
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeFound: {
    backgroundColor: "#DCFCE7",
  },
  badgeLost: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  textFound: {
    color: "#15803D",
  },
  textLost: {
    color: "#DC2626",
  },
  resolvedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resolvedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowLocation: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  // Modal Common Styles
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 14,
    backgroundColor: "#E2E8F0",
  },
  avatarPickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarPickBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },

  // Legal / About Styles
  aboutHeaderBox: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 16,
  },
  aboutLogoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: "800",
  },
  aboutVersion: {
    fontSize: 13,
    marginTop: 2,
  },
  legalCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  legalHeading: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  legalBody: {
    fontSize: 14,
    lineHeight: 22,
  },
});
