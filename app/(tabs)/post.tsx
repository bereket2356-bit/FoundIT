// app/(tabs)/post.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useAppTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/Usercontext";

type ItemType = "found" | "lost";

const CATEGORIES = [
  { id: "Bottle", label: "Bottle", iconFamily: "MCI", iconName: "bottle-tonic-outline" },
  { id: "Umbrella", label: "Umbrella", iconFamily: "Ionicons", iconName: "umbrella-outline" },
  { id: "Headphones", label: "Headphones", iconFamily: "Ionicons", iconName: "headset-outline" },
  { id: "Glasses", label: "Glasses", iconFamily: "Ionicons", iconName: "glasses-outline" },
  { id: "ID Card", label: "ID Card", iconFamily: "Ionicons", iconName: "card-outline" },
  { id: "Keys", label: "Keys", iconFamily: "Ionicons", iconName: "key-outline" },
  { id: "Phone", label: "Phone", iconFamily: "Ionicons", iconName: "phone-portrait-outline" },
  { id: "Bag", label: "Bag", iconFamily: "Ionicons", iconName: "bag-handle-outline" },
  { id: "Other", label: "Other", iconFamily: "Ionicons", iconName: "ellipsis-horizontal-circle-outline" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function PostScreen() {
  const [type, setType] = useState<ItemType>("found");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);

  // Theme
  const { isDarkMode, theme } = useAppTheme();

  // Modals
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Calendar State
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedCalDate, setSelectedCalDate] = useState<string>("");

  const { addItem } = useItems();
  const { user } = useUser();
  const { showAlert } = useAlert();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert({
        title: "Permission required",
        message: "Camera roll permissions are required to upload an image.",
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
      setImage(imgStr);
    }
  };

  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !category ||
      !location.trim() ||
      !description.trim() ||
      !contactInfo.trim() ||
      !image
    ) {
      showAlert({
        title: "Missing Fields",
        message: "Please fill in all required fields including Contact Info and Image.",
        type: "error",
      });
      return;
    }

    if (type === "found" && !date) {
      showAlert({
        title: "Missing Fields",
        message: "Please select the Date Found using the calendar.",
        type: "error",
      });
      return;
    }

    let finalDate: string = date.trim();
    if (finalDate) {
      const parsed = Date.parse(finalDate);
      if (!isNaN(parsed)) {
        finalDate = new Date(parsed).toISOString().split("T")[0];
      }
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/items`,
        {
          type,
          title: title.trim(),
          category,
          location: location.trim(),
          date: finalDate,
          description: description.trim(),
          contactInfo: contactInfo.trim(),
          image,
          user: user?.id || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showAlert({
        type: "success",
        title: "Item Posted",
        message: `Your ${type === "found" ? "found" : "lost"} item report has been submitted.`,
        buttonText: "Continue",
        onPress: () => router.replace("/(tabs)/home"),
      });

      if (response && response.data) addItem(response.data);

      // Clear Form
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

  // Calendar Helpers
  const openCalendar = () => {
    if (date) {
      const parts = date.split("-");
      if (parts.length === 3) {
        setCalYear(parseInt(parts[0], 10));
        setCalMonth(parseInt(parts[1], 10) - 1);
        setSelectedCalDate(date);
      }
    } else {
      const now = new Date();
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
      setSelectedCalDate("");
    }
    setCalendarModalVisible(true);
  };

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    const formattedMonth = String(calMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
    setSelectedCalDate(dateStr);
  };

  const confirmCalendarDate = () => {
    if (selectedCalDate) {
      setDate(selectedCalDate);
    }
    setCalendarModalVisible(false);
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Post an Item</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Provide item details to help return it to its owner
          </Text>

          {/* Lost / Found Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: isDarkMode ? "#1E293B" : "#E2E8F0" }]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                type === "found" && { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
              onPress={() => setType("found")}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: theme.textSecondary },
                  type === "found" && { color: isDarkMode ? "#000000" : "#FFFFFF" },
                ]}
              >
                Found
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                type === "lost" && { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
              onPress={() => setType("lost")}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: theme.textSecondary },
                  type === "lost" && { color: isDarkMode ? "#000000" : "#FFFFFF" },
                ]}
              >
                Lost
              </Text>
            </TouchableOpacity>
          </View>

          {/* Image Picker */}
          <TouchableOpacity
            style={[styles.imageUpload, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {image ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <View style={styles.changeImageBadge}>
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={[styles.uploadIconCircle, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                  <Ionicons name="camera-outline" size={26} color={theme.textPrimary} />
                </View>
                <Text style={[styles.imageText, { color: theme.textPrimary }]}>Upload Item Photo *</Text>
                <Text style={[styles.imageSubtext, { color: theme.textSecondary }]}>PNG, JPG, JPEG</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Item Title *</Text>
          <TextInput
            placeholder="e.g., Blue Water Bottle, Black Backpack..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            value={title}
            onChangeText={setTitle}
          />

          {/* Modern Category Selector */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Category *</Text>
          <TouchableOpacity
            style={[styles.selectInput, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.8}
          >
            {selectedCategoryObj ? (
              <View style={styles.selectedCatRow}>
                {selectedCategoryObj.iconFamily === "MCI" ? (
                  <MaterialCommunityIcons
                    name={selectedCategoryObj.iconName as any}
                    size={20}
                    color={theme.textPrimary}
                  />
                ) : (
                  <Ionicons
                    name={selectedCategoryObj.iconName as any}
                    size={20}
                    color={theme.textPrimary}
                  />
                )}
                <Text style={[styles.selectedCatText, { color: theme.textPrimary }]}>{selectedCategoryObj.label}</Text>
              </View>
            ) : (
              <Text style={[styles.selectPlaceholder, { color: theme.textSecondary }]}>Select Category...</Text>
            )}
            <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Location */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Location *</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="location-outline" size={18} color={theme.textSecondary} style={styles.fieldIcon} />
            <TextInput
              placeholder="e.g., Library 2nd Floor, Main Cafeteria..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.inputInner, { color: theme.textPrimary }]}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Contact Info */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Contact Info *</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Ionicons name="call-outline" size={18} color={theme.textSecondary} style={styles.fieldIcon} />
            <TextInput
              placeholder="Phone number or Telegram handle (@username)"
              placeholderTextColor={theme.textSecondary}
              style={[styles.inputInner, { color: theme.textPrimary }]}
              value={contactInfo}
              onChangeText={setContactInfo}
            />
          </View>

          {/* Date Selector (Calendar) */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
            {type === "lost" ? "Date Lost (Optional)" : "Date Found *"}
          </Text>
          <TouchableOpacity
            style={[styles.selectInput, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            onPress={openCalendar}
            activeOpacity={0.8}
          >
            <View style={styles.selectedCatRow}>
              <Ionicons name="calendar-outline" size={18} color={theme.textPrimary} />
              <Text style={{ fontSize: 14, color: date ? theme.textPrimary : theme.textSecondary, fontWeight: date ? "700" : "normal" }}>
                {date || (type === "lost" ? "Tap to pick date lost" : "Tap to pick date found")}
              </Text>
            </View>
            {date ? (
              <TouchableOpacity
                onPress={() => setDate("")}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="calendar" size={18} color={theme.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Description */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Description *</Text>
          <TextInput
            placeholder="Describe distinguishing marks, condition, color, stickers, etc."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.textArea, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.btnPrimary }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={[styles.submitText, { color: theme.btnPrimaryText }]}>
              Post {type === "found" ? "Found" : "Lost"} Item
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modern Curved Category Popup Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.curvedCategoryModal, { backgroundColor: theme.cardBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.divider }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Category</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Choose the category that best matches your item
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Category Grid in Modal */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              <View style={styles.modalCategoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.modalCategoryCard,
                        { backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC", borderColor: theme.cardBorder },
                        isSelected && { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000", borderColor: isDarkMode ? "#FFFFFF" : "#000000" },
                      ]}
                      onPress={() => {
                        setCategory(cat.id);
                        setCategoryModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.modalCatIconCircle,
                          { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" },
                          isSelected && { backgroundColor: isDarkMode ? "#E2E8F0" : "#222222" },
                        ]}
                      >
                        {cat.iconFamily === "MCI" ? (
                          <MaterialCommunityIcons
                            name={cat.iconName as any}
                            size={24}
                            color={isSelected ? (isDarkMode ? "#000000" : "#FFFFFF") : theme.textPrimary}
                          />
                        ) : (
                          <Ionicons
                            name={cat.iconName as any}
                            size={24}
                            color={isSelected ? (isDarkMode ? "#000000" : "#FFFFFF") : theme.textPrimary}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.modalCatLabel,
                          { color: theme.textPrimary },
                          isSelected && { color: isDarkMode ? "#000000" : "#FFFFFF" },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modern Curved Calendar Selector Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.curvedCalendarModal, { backgroundColor: theme.cardBg }]}>
            {/* Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.divider }]}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {type === "found" ? "Select Date Found" : "Select Date Lost"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {selectedCalDate || "Choose a date"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={styles.calNavRow}>
              <TouchableOpacity onPress={prevMonth} style={[styles.calNavBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.calMonthYearText, { color: theme.textPrimary }]}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={[styles.calNavBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}>
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
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.daySlot} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedMonth = String(calMonth + 1).padStart(2, "0");
                const formattedDay = String(dayNum).padStart(2, "0");
                const dateKey = `${calYear}-${formattedMonth}-${formattedDay}`;
                const isSelected = selectedCalDate === dateKey;

                return (
                  <TouchableOpacity
                    key={dateKey}
                    style={[
                      styles.daySlot,
                      isSelected && { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                    onPress={() => selectDay(dayNum)}
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
                  setSelectedCalDate(`${yr}-${mo}-${dy}`);
                }}
                style={[styles.calTodayBtn, { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" }]}
              >
                <Text style={[styles.calTodayBtnText, { color: theme.textPrimary }]}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmCalendarDate}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  toggleText: {
    fontWeight: "700",
    fontSize: 14,
  },
  imageUpload: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },
  uploadPlaceholder: {
    alignItems: "center",
    padding: 20,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  imageText: {
    fontSize: 14,
    fontWeight: "700",
  },
  imageSubtext: {
    marginTop: 2,
    fontSize: 12,
  },
  imageWrapper: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeImageBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeImageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  fieldIcon: {
    marginRight: 8,
  },
  inputInner: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    borderWidth: 1,
    marginBottom: 16,
  },
  selectedCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedCatText: {
    fontSize: 14,
    fontWeight: "700",
  },
  selectPlaceholder: {
    fontSize: 14,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  submitButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "800",
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Curved Category Modal
  curvedCategoryModal: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 28,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: "80%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  modalCategoryCard: {
    width: "31%",
    aspectRatio: 0.95,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    padding: 8,
  },
  modalCatIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  modalCatLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  // Curved Calendar Modal
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
