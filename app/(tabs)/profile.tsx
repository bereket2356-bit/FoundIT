import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
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
      const res = await axios.get("http://localhost:5000/api/items");
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
      quality: 0.8,
    });

    if (!result.canceled) {
      updateUser({ avatar: result.assets[0].uri });
    }
  };
  const myItems = [
    {
      id: "1",
      title: "Blue Nike Backpack",
      type: "found",
      status: "Available",
    },
    {
      id: "2",
      title: "Silver MacBook Charger",
      type: "lost",
      status: "Resolved",
    },
  ];

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
          <TouchableOpacity onPress={pickImage}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <TouchableOpacity style={styles.editButton}>
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
