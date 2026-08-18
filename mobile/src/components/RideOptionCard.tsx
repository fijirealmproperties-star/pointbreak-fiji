import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import type { Vehicle } from "../types";
import { fjd } from "../utils";

interface Props {
  vehicle: Vehicle;
  selected?: boolean;
  onPress: () => void;
}

export function RideOptionCard({ vehicle, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.emojiWrap, selected && styles.emojiWrapSelected]}>
        <Text style={styles.emoji}>{vehicle.emoji}</Text>
      </View>
      <View style={styles.mid}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {vehicle.desc} · up to {vehicle.cap} pax
        </Text>
        <Text style={styles.eta}>
          ≈ {vehicle.duration_min} min · {vehicle.distance_km} km
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{fjd(vehicle.price)}</Text>
        {selected ? (
          <View style={styles.check}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  selected: {
    borderColor: theme.accent,
    backgroundColor: theme.accentSoft,
  },
  pressed: { opacity: 0.85 },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emojiWrapSelected: { backgroundColor: "rgba(0,180,216,0.2)" },
  emoji: { fontSize: 24 },
  mid: { flex: 1 },
  name: { color: theme.text, fontWeight: "800", fontSize: 15 },
  desc: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  eta: { color: theme.textFaint, fontSize: 11, marginTop: 3 },
  right: { alignItems: "flex-end", marginLeft: 8 },
  price: { color: theme.gold, fontWeight: "800", fontSize: 16 },
  check: {
    marginTop: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
