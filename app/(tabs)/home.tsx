// app/(tabs)/home.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { Key, useCallback, useEffect, useState } from "react";
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
import { useAppTheme } from "../../context/ThemeContext";
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
  date?: string;
  description?: string;
  contactInfo?: string;
  createdAt: string;
};

const CATEGORIES = [
  { id: "bottle", label: "Bottle", categoryKey: "Bottle", iconFamily: "MCI", iconName: "bottle-tonic-outline" },
  { id: "umbrella", label: "Umbrella", categoryKey: "Umbrella", iconFamily: "Ionicons", iconName: "umbrella-outline" },
  { id: "headphones", label: "Headphones", categoryKey: "Headphones", iconFamily: "Ionicons", iconName: "headset-outline" },
  { id: "glasses", label: "Glasses", categoryKey: "Glasses", iconFamily: "Ionicons", iconName: "glasses-outline" },
  { id: "id_badge", label: "ID Card", categoryKey: "ID Card", iconFamily: "Ionicons", iconName: "card-outline" },
  { id: "keys", label: "Keys", categoryKey: "Keys", iconFamily: "Ionicons", iconName: "key-outline" },
  { id: "phone", label: "Phone", categoryKey: "Phone", iconFamily: "Ionicons", iconName: "phone-portrait-outline" },
  { id: "bag", label: "Bag", categoryKey: "Bag", iconFamily: "Ionicons", iconName: "bag-handle-outline" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function HomeScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | "found" | "lost">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Theme
  const { isDarkMode, theme } = useAppTheme();

  // Item Details View Modal
  const [selectedItemDetail, setSelectedItemDetail] = useState<Item | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Claim Modal State
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<Item | null>(null);
  const [proofDescription, setProofDescription] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [lostLocation, setLostLocation] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Claim Calendar Modal State
  const [claimCalVisible, setClaimCalVisible] = useState(false);
  const today = new Date();
  const [claimCalYear, setClaimCalYear] = useState(today.getFullYear());
  const [claimCalMonth, setClaimCalMonth] = useState(today.getMonth());
  const [claimCalSelectedDate, setClaimCalSelectedDate] = useState("");

  // Notifications
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

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      setItems(res.data || []);
    } catch (error) {
      console.log("Fetch items error", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
      fetchNotifications();
    }, [])
  );

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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.log("Mark notification read error", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCategorySelect = (catKey: string, catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catId);
    }
  };

  const filteredItems = items
    .filter((item) => {
      const matchesType = selectedType === "all" || item.type === selectedType;

      const matchesSearch =
        !search.trim() ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase()) ||
        item.location?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        !selectedCategory ||
        (() => {
          const selectedObj = CATEGORIES.find((c) => c.id === selectedCategory);
          if (!selectedObj) return true;
          const keyMatches = item.category?.toLowerCase() === selectedObj.categoryKey.toLowerCase();
          const labelMatches =
            item.title?.toLowerCase().includes(selectedObj.label.toLowerCase()) ||
            item.category?.toLowerCase().includes(selectedObj.label.toLowerCase()) ||
            item.description?.toLowerCase().includes(selectedObj.label.toLowerCase());
          return keyMatches || labelMatches;
        })();

      return matchesType && matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

  const pickProofImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert({
        title: "Permission required",
        message: "Camera roll permissions are required to upload proof images.",
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

  // Claim Calendar Functions
  const openClaimCalendar = () => {
    if (lostDate) {
      const parts = lostDate.split("-");
      if (parts.length === 3) {
        setClaimCalYear(parseInt(parts[0], 10));
        setClaimCalMonth(parseInt(parts[1], 10) - 1);
        setClaimCalSelectedDate(lostDate);
      }
    } else {
      const now = new Date();
      setClaimCalYear(now.getFullYear());
      setClaimCalMonth(now.getMonth());
      setClaimCalSelectedDate("");
    }
    setClaimCalVisible(true);
  };

  const prevClaimMonth = () => {
    if (claimCalMonth === 0) {
      setClaimCalMonth(11);
      setClaimCalYear(claimCalYear - 1);
    } else {
      setClaimCalMonth(claimCalMonth - 1);
    }
  };

  const nextClaimMonth = () => {
    if (claimCalMonth === 11) {
      setClaimCalMonth(0);
      setClaimCalYear(claimCalYear + 1);
    } else {
      setClaimCalMonth(claimCalMonth + 1);
    }
  };

  const selectClaimDay = (day: number) => {
    const formattedMonth = String(claimCalMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    setClaimCalSelectedDate(`${claimCalYear}-${formattedMonth}-${formattedDay}`);
  };

  const confirmClaimDate = () => {
    if (claimCalSelectedDate) {
      setLostDate(claimCalSelectedDate);
    }
    setClaimCalVisible(false);
  };

  const daysInClaimMonth = new Date(claimCalYear, claimCalMonth + 1, 0).getDate();
  const firstDayOfClaimWeek = new Date(claimCalYear, claimCalMonth, 1).getDay();

  const submitClaim = async () => {
    if (!proofDescription.trim() || !contactInfo.trim()) {
      showAlert({
        title: "Missing Fields",
        message: "Please describe identifying details and provide your contact info.",
        type: "error",
      });
      return;
    }
    if (!selectedItemForClaim) return;

    setSubmittingClaim(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/items/${selectedItemForClaim._id}/claim`,
        {
          proof_description: proofDescription.trim(),
          proof_image: proofImage || "",
          lost_location: lostLocation.trim() || "",
          lost_date: lostDate || "",
          contact_info: contactInfo.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update item in feed
      setItems((prev) =>
        prev.map((it) => (it._id === selectedItemForClaim._id ? res.data : it))
      );

      showAlert({
        type: "success",
        title: "Claim Submitted",
        message: "Your claim has been received and is pending admin review.",
        buttonText: "Continue",
      });

      // Reset Modal
      setClaimModalVisible(false);
      setSelectedItemForClaim(null);
      setDetailModalVisible(false);
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
      } else {
        showAlert({
          title: "Claim Error",
          message:
            err.response?.data?.message ||
            "Something went wrong on our end. Please try again in a moment.",
          type: "error",
        });
      }
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: theme.textPrimary }]}>FoundIT</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Campus Lost & Found</Text>
        </View>
        <TouchableOpacity
          style={[styles.bellButton, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          onPress={() => setNotifModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.textPrimary} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: isDarkMode ? "#DC2626" : "#000000" }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollFeed}
        contentContainerStyle={{ paddingBottom: 32 }}
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
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: isDarkMode ? theme.cardBorder : "#000000" }]}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search items list..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
          <TouchableOpacity onPress={() => {}} style={styles.searchIconButton}>
            <Ionicons name="search" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Categories</Text>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={[styles.viewAllText, { color: theme.textSecondary }]}>
              {selectedCategory ? "Clear Filter" : "View All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4x2 Category Grid */}
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                  isSelected && {
                    backgroundColor: isDarkMode ? "#FFFFFF" : "#000000",
                    borderColor: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                onPress={() => handleCategorySelect(cat.categoryKey, cat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIconWrap}>
                  {cat.iconFamily === "MCI" ? (
                    <MaterialCommunityIcons
                      name={cat.iconName as any}
                      size={28}
                      color={
                        isSelected
                          ? isDarkMode ? "#000000" : "#FFFFFF"
                          : theme.textPrimary
                      }
                    />
                  ) : (
                    <Ionicons
                      name={cat.iconName as any}
                      size={28}
                      color={
                        isSelected
                          ? isDarkMode ? "#000000" : "#FFFFFF"
                          : theme.textPrimary
                      }
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Latest Posts Header */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Latest Posts</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
          >
            <Text style={[styles.sortText, { color: theme.textSecondary }]}>
              Sort By {sortOrder === "desc" ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Type Filter Pills (All / Found / Lost) */}
        <View style={styles.typeFilterRow}>
          {(["all", "found", "lost"] as const).map((t) => {
            const isSelected = selectedType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typePill,
                  { backgroundColor: isDarkMode ? "#1E293B" : "#EAEAEA" },
                  isSelected && { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
                onPress={() => setSelectedType(t)}
              >
                <Text
                  style={[
                    styles.typePillText,
                    { color: theme.textSecondary },
                    isSelected && { color: isDarkMode ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  {t === "all" ? "All Posts" : t === "found" ? "Found Only" : "Lost Only"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Latest Posts List */}
        {filteredItems.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="cube-outline" size={44} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No items found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {search || selectedCategory || selectedType !== "all"
                ? "Try adjusting your search or category filter."
                : "No reported lost or found items at the moment."}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.postCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedItemDetail(item);
                setDetailModalVisible(true);
              }}
            >
              {/* Left Image Thumbnail */}
              <Image
                source={{
                  uri:
                    item.image &&
                    (item.image.startsWith("http") ||
                      item.image.startsWith("data:"))
                      ? item.image
                      : "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80",
                }}
                style={styles.postThumbnail}
              />

              {/* Middle Content */}
              <View style={styles.postInfo}>
                <Text style={[styles.postTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.location || "Campus"}
                  </Text>
                </View>

                {/* Status / Type Tag */}
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

                  {item.status && item.status !== "open" && (
                    <View style={[styles.resolvedBadge, { backgroundColor: isDarkMode ? "#334155" : "#F3F4F6" }]}>
                      <Text style={[styles.resolvedBadgeText, { color: theme.textSecondary }]}>
                        {item.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Right Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Full-Screen Item Details Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          {selectedItemDetail && (
            <View style={{ flex: 1 }}>
              {/* Modal Top Bar */}
              <View style={[styles.detailHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
                <Text style={[styles.detailHeaderTitle, { color: theme.textPrimary }]}>Item Details</Text>
                <TouchableOpacity
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.detailCloseButton}
                >
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Large Item Image */}
                <Image
                  source={{
                    uri:
                      selectedItemDetail.image &&
                      (selectedItemDetail.image.startsWith("http") ||
                        selectedItemDetail.image.startsWith("data:"))
                        ? selectedItemDetail.image
                        : "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80",
                  }}
                  style={styles.detailImage}
                />

                {/* Title & Badges */}
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>
                  {selectedItemDetail.title}
                </Text>
                <View style={[styles.badgeRow, { marginBottom: 16 }]}>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedItemDetail.type === "found" ? styles.badgeFound : styles.badgeLost,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        selectedItemDetail.type === "found" ? styles.textFound : styles.textLost,
                      ]}
                    >
                      {selectedItemDetail.type === "found" ? "Found Item" : "Lost Item"}
                    </Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? "#334155" : "#EAEAEA" }]}>
                    <Text style={[styles.categoryBadgeText, { color: theme.textPrimary }]}>
                      {selectedItemDetail.category}
                    </Text>
                  </View>
                </View>

                {/* Info Cards */}
                <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  <View style={styles.detailCardRow}>
                    <Ionicons name="location" size={18} color={theme.textPrimary} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Location</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                        {selectedItemDetail.location}
                      </Text>
                    </View>
                  </View>

                  {selectedItemDetail.date && (
                    <View style={[styles.detailCardRow, { marginTop: 14 }]}>
                      <Ionicons name="calendar" size={18} color={theme.textPrimary} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                          {selectedItemDetail.type === "found" ? "Date Found" : "Date Lost"}
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                          {selectedItemDetail.date}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedItemDetail.contactInfo && (
                    <View style={[styles.detailCardRow, { marginTop: 14 }]}>
                      <Ionicons name="call" size={18} color={theme.textPrimary} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Contact Info</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                          {selectedItemDetail.contactInfo}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>Description</Text>
                <Text style={[styles.detailDescription, { color: theme.textSecondary }]}>
                  {selectedItemDetail.description || "No additional description provided."}
                </Text>

                {/* Claim Button - Always active for open Found items */}
                {selectedItemDetail.status === "open" &&
                  selectedItemDetail.type === "found" && (
                    <TouchableOpacity
                      style={styles.claimActionButton}
                      onPress={() => {
                        setSelectedItemForClaim(selectedItemDetail);
                        setClaimModalVisible(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.claimActionButtonText}>
                        Claim This Item
                      </Text>
                    </TouchableOpacity>
                  )}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Full-Screen Modernized Claim Submission Modal */}
      <Modal
        visible={claimModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            {/* Modal Header */}
            <View style={[styles.claimModalHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
              <View>
                <Text style={[styles.claimModalTitle, { color: theme.textPrimary }]}>Submit Ownership Claim</Text>
                <Text style={[styles.claimModalSubtitle, { color: theme.textSecondary }]}>
                  {selectedItemForClaim?.title || "Item Claim"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setClaimModalVisible(false)}
                style={styles.modalCloseCircle}
              >
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Identifying Details */}
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Describe details only the owner would know *
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary },
                ]}
                placeholder="e.g., lock screen wallpaper, serial number, scratch marks, unique keychain..."
                placeholderTextColor={theme.textSecondary}
                multiline
                value={proofDescription}
                onChangeText={setProofDescription}
              />

              {/* Contact Info */}
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Phone number or Telegram handle (@username) *
              </Text>
              <View style={[styles.formInputWithIcon, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <Ionicons name="call-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.inputInner, { color: theme.textPrimary }]}
                  placeholder="@username or 09..."
                  placeholderTextColor={theme.textSecondary}
                  value={contactInfo}
                  onChangeText={setContactInfo}
                />
              </View>

              {/* Photo Proof Upload */}
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Photo Proof (optional)
              </Text>
              <TouchableOpacity
                onPress={pickProofImage}
                style={[styles.proofUploadBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
                activeOpacity={0.8}
              >
                {proofImage ? (
                  <View style={styles.proofPreviewWrapper}>
                    <Image source={{ uri: proofImage }} style={styles.proofPreviewImg} />
                    <View style={styles.proofPreviewOverlay}>
                      <TouchableOpacity
                        onPress={() => setProofImage(null)}
                        style={styles.removeProofBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <View style={[styles.uploadIconCircle, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                      <Ionicons name="cloud-upload-outline" size={26} color={theme.textPrimary} />
                    </View>
                    <Text style={[styles.uploadText, { color: theme.textPrimary }]}>
                      Tap to upload photo proof
                    </Text>
                    <Text style={[styles.uploadSubtext, { color: theme.textSecondary }]}>
                      Receipt, old photo with item, or purchase box
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Where lost */}
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                Where you lost it (optional)
              </Text>
              <View style={[styles.formInputWithIcon, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <Ionicons name="location-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.inputInner, { color: theme.textPrimary }]}
                  placeholder="e.g., Science Library 2nd Floor, Cafeteria"
                  placeholderTextColor={theme.textSecondary}
                  value={lostLocation}
                  onChangeText={setLostLocation}
                />
              </View>

              {/* When lost Date Picker */}
              <Text style={[styles.formLabel, { color: theme.textPrimary }]}>
                When you lost it (optional)
              </Text>
              <TouchableOpacity
                style={[styles.formInputWithIcon, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, justifyContent: "space-between" }]}
                onPress={openClaimCalendar}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, color: lostDate ? theme.textPrimary : theme.textSecondary, fontWeight: lostDate ? "700" : "normal" }}>
                    {lostDate || "Tap to select date from calendar"}
                  </Text>
                </View>
                {lostDate ? (
                  <TouchableOpacity onPress={() => setLostDate("")} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                )}
              </TouchableOpacity>

              {/* Submit Claim Action */}
              <TouchableOpacity
                style={[
                  styles.submitClaimBtn,
                  (!proofDescription.trim() || !contactInfo.trim() || submittingClaim) && { opacity: 0.5 },
                ]}
                onPress={submitClaim}
                disabled={!proofDescription.trim() || !contactInfo.trim() || submittingClaim}
                activeOpacity={0.85}
              >
                {submittingClaim ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitClaimBtnText}>Submit Claim for Review</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Claim Calendar Picker Modal */}
      <Modal
        visible={claimCalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClaimCalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.curvedCalendarModal, { backgroundColor: theme.cardBg }]}>
            {/* Header */}
            <View style={[styles.calModalHeader, { borderBottomColor: theme.divider }]}>
              <View>
                <Text style={[styles.calModalTitle, { color: theme.textPrimary }]}>Select Date Lost</Text>
                <Text style={[styles.calModalSubtitle, { color: theme.textSecondary }]}>
                  {claimCalSelectedDate || "Pick a date"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setClaimCalVisible(false)} style={styles.modalCloseCircle}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.calNavRow}>
              <TouchableOpacity onPress={prevClaimMonth} style={[styles.calNavBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.calMonthYearText, { color: theme.textPrimary }]}>
                {MONTH_NAMES[claimCalMonth]} {claimCalYear}
              </Text>
              <TouchableOpacity onPress={nextClaimMonth} style={[styles.calNavBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Weekday Labels */}
            <View style={[styles.weekDaysRow, { borderBottomColor: theme.divider }]}>
              {DAYS_OF_WEEK.map((d) => (
                <Text key={d} style={[styles.weekDayText, { color: theme.textSecondary }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {Array.from({ length: firstDayOfClaimWeek }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.daySlot} />
              ))}

              {Array.from({ length: daysInClaimMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedMonth = String(claimCalMonth + 1).padStart(2, "0");
                const formattedDay = String(dayNum).padStart(2, "0");
                const dateKey = `${claimCalYear}-${formattedMonth}-${formattedDay}`;
                const isSelected = claimCalSelectedDate === dateKey;

                return (
                  <TouchableOpacity
                    key={dateKey}
                    style={[
                      styles.daySlot,
                      isSelected && { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                    onPress={() => selectClaimDay(dayNum)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.textPrimary },
                        isSelected && { color: isDarkMode ? "#000000" : "#FFFFFF", fontWeight: "800" },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Actions */}
            <View style={[styles.calActionsRow, { borderTopColor: theme.divider }]}>
              <TouchableOpacity
                onPress={() => {
                  const now = new Date();
                  const yr = now.getFullYear();
                  const mo = String(now.getMonth() + 1).padStart(2, "0");
                  const dy = String(now.getDate()).padStart(2, "0");
                  setClaimCalSelectedDate(`${yr}-${mo}-${dy}`);
                }}
                style={[styles.calTodayBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}
              >
                <Text style={[styles.calTodayBtnText, { color: theme.textPrimary }]}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmClaimDate}
                style={[styles.calConfirmBtn, { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" }]}
              >
                <Text style={[styles.calConfirmBtnText, { color: isDarkMode ? "#000000" : "#FFFFFF" }]}>
                  Confirm Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notifModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
          <View style={[styles.claimModalHeader, { borderBottomColor: theme.divider, backgroundColor: theme.cardBg }]}>
            <View>
              <Text style={[styles.appName, { color: theme.textPrimary }]}>Notifications</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Activity & Claim Updates</Text>
            </View>
            <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={styles.modalCloseCircle}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 15 }}>
                  No notifications yet.
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  onPress={() => markNotificationRead(item._id)}
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: item.read ? theme.cardBg : isDarkMode ? "#334155" : "#F4F4F5",
                      borderColor: theme.cardBorder,
                    },
                  ]}
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
                      color={theme.textPrimary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                      {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.textPrimary }]} />}
                    </View>
                    <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>{item.message}</Text>
                    <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  scrollFeed: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  searchIconButton: {
    padding: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  categoryCard: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    overflow: "hidden",
  },
  categoryIconWrap: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sortButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sortText: {
    fontSize: 13,
    fontWeight: "600",
  },
  typeFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  postThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  postInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    marginLeft: 3,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  arrowContainer: {
    paddingLeft: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  detailCloseButton: {
    padding: 4,
  },
  detailImage: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  detailCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 1,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  claimActionButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  claimActionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  claimModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  claimModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  claimModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  formInputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 16,
  },
  inputInner: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 88,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  proofUploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  uploadIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: "700",
  },
  uploadSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  proofPreviewWrapper: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  proofPreviewImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  proofPreviewOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  removeProofBtn: {
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  submitClaimBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitClaimBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  notifMessage: {
    fontSize: 13,
    marginTop: 3,
  },
  notifTime: {
    fontSize: 11,
    marginTop: 5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  curvedCalendarModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  calModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  calModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  calModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  calNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  calMonthYearText: {
    fontSize: 16,
    fontWeight: "800",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "700",
    width: 36,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  daySlot: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: 18,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  calActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  calTodayBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  calTodayBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  calConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  calConfirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
