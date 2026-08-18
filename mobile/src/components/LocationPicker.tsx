import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import type { Location } from "../types";

interface Props {
  visible: boolean;
  locations: Location[];
  current?: { name: string; lat: number; lng: number } | null;
  title: string;
  onSelect: (loc: Location & { distance?: number }) => void;
  onClose: () => void;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LocationPicker({
  visible,
  locations,
  current,
  title,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = locations.map((l) => ({
      ...l,
      distance: current ? haversine(current.lat, current.lng, l.lat, l.lng) : undefined,
    }));
    if (q) {
      list = list.filter((l) => l.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return list;
  }, [locations, query, current]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.safe, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Fijian locations..."
            placeholderTextColor={theme.textFaint}
            style={styles.search}
            autoFocus
          />
        </View>
        {current ? (
          <Pressable
            onPress={() =>
              onSelect({ ...current, id: "current-location", zone: "nearby", modes: ["land", "sea"], icon: "📍" })
            }
            style={styles.currentRow}
          >
            <Text style={styles.currentIcon}>📍</Text>
            <View style={styles.currentTextWrap}>
              <Text style={styles.currentName}>My current location</Text>
              <Text style={styles.currentSub} numberOfLines={1}>
                {current.name}
              </Text>
            </View>
          </Pressable>
        ) : null}
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>
                  {item.distance !== undefined
                    ? `${item.distance < 1 ? (item.distance * 1000).toFixed(0) + " m" : item.distance.toFixed(1) + " km"} away · ${item.modes.includes("sea") ? "🚤 sea" : "🚗 land"}`
                    : item.zone}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  closeText: { color: theme.text, fontSize: 15, fontWeight: "700" },
  title: { color: theme.text, fontSize: 18, fontWeight: "800" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  search: { flex: 1, paddingVertical: 12, color: theme.text, fontSize: 15 },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.accentSoft,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  currentIcon: { fontSize: 20, marginRight: 10 },
  currentTextWrap: { flex: 1 },
  currentName: { color: theme.text, fontWeight: "700", fontSize: 14 },
  currentSub: { color: theme.textMuted, fontSize: 12, marginTop: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  pressed: { backgroundColor: theme.surface },
  rowIcon: { fontSize: 20, width: 32, textAlign: "center" },
  rowTextWrap: { flex: 1, marginLeft: 10 },
  rowName: { color: theme.text, fontSize: 15, fontWeight: "600" },
  rowSub: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
});
