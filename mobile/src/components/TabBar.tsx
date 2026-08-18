import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

export interface TabItem {
  key: string;
  icon: string;
  label: string;
  activeIcon?: string;
}

export function TabBar({
  items,
  active,
  onChange,
}: {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {isActive ? (item.activeIcon ?? item.icon) : item.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            {isActive ? <View style={styles.underline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: "center", paddingVertical: 4 },
  itemActive: { opacity: 1 },
  icon: { fontSize: 20, opacity: 0.55 },
  iconActive: { opacity: 1 },
  label: { color: theme.textMuted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  labelActive: { color: theme.accentBright },
  underline: { position: "absolute", top: -8, width: 32, height: 3, borderRadius: 2, backgroundColor: theme.accent },
});
