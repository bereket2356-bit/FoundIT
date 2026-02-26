// app/index.tsx
import React, { Key, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from "../../context/Itemscontext";
import axios from 'axios';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { RefreshControl } from "react-native";
type Item = {
  _id: Key | null | undefined;
  id: string;
  title: string;
  image: string;
  category: string;
  type: 'found' | 'lost';
  location: string;
  createdAt: string;
};

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "found" | "lost">("all");
  const [refreshing, setRefreshing] = useState(false);

useFocusEffect(
  useCallback(() => {
    fetchItems();
  }, [])
);

const fetchItems = async () => {
  try {
    const res = await axios.get(
      "http://192.168.1.2:5000/api/items"
    );
    setItems(res.data);
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

 const filteredItems = items.filter((item) => {
  const matchesType =
    selectedType === "all" || item.type === selectedType;

  const matchesSearch =
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase());

  return matchesType && matchesSearch;
});

  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>FoundIT</Text>
          <Text style={styles.subtitle}>Campus Lost & Found</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
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
    style={[styles.toggleButton, selectedType === "all" && styles.toggleActive]}
    onPress={() => setSelectedType("all")}
  >
    <Text style={selectedType === "all" ? styles.toggleTextActive : styles.toggleText}>
      All
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.toggleButton, selectedType === "found" && styles.toggleActive]}
    onPress={() => setSelectedType("found")}
  >
    <Text style={selectedType === "found" ? styles.toggleTextActive : styles.toggleText}>
      Found
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.toggleButton, selectedType === "lost" && styles.toggleActive]}
    onPress={() => setSelectedType("lost")}
  >
    <Text style={selectedType === "lost" ? styles.toggleTextActive : styles.toggleText}>
      Lost
    </Text>
  </TouchableOpacity>
</View>

      {/* Filters */}
      <TouchableOpacity style={styles.filtersRow}>
        <Text style={styles.filtersText}>≋ Filters & Sort</Text>
      </TouchableOpacity>

      {/* Item List */}
      <ScrollView style={styles.feed}  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }>
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
                    {item.type === 'found' ? 'Found' : 'Lost'}
                  </Text>
                </View>
              </View>
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
              <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleString()}</Text>  
            </View>
            {activeTab === 'found' && (
              <View style={styles.foundBadge}>
                <Text style={styles.foundText}>Found</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 13, color: '#666' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#eee',
  
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: '#000' },
  toggleText: { fontWeight: '600', color: '#666', fontSize: 15 },
  toggleTextActive: { color: '#fff' },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 12 },
  filtersText: { fontSize: 15, fontWeight: '600', color: '#000' },
  feed: { paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: '#444', fontWeight: '500' },
  statusTag: { backgroundColor: '#e0ffe0' },
  statusText: { color: '#006600', fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaText: { fontSize: 14, color: '#666', marginLeft: 4 },
  timeText: { fontSize: 13, color: '#888' },
  foundBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  foundText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});