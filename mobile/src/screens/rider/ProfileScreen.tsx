import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Avatar } from "../../components/Avatar";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import type { Wallet } from "../../types";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    api.get<Wallet>("/api/wallet").then(setWallet).catch(() => {});
  }, []);

  const items: Array<{ icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean }> = [
    { icon: "👛", label: "Wallet & mPaisa", sub: wallet ? `Balance ${fjd(wallet.balance)}` : "Top up & transactions", onPress: () => nav.navigate("Wallet") },
    { icon: "🗺️", label: "Ride history", onPress: () => nav.navigate("History") },
    { icon: "🤙", label: "Bula Bot guide", sub: "Food, culture & travel tips", onPress: () => nav.navigate("Guide") },
    { icon: "⚙️", label: "Settings & server", onPress: () => nav.navigate("Settings") },
  ];

  return (
    <Screen>
      <Header title="Profile" />
      <View style={styles.hero}>
        <Avatar name={user?.name ?? "?"} size={72} tint={theme.accentDeep} />
        <View style={styles.heroInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user?.role} 🌴</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {items.map((it, i) => (
          <Pressable key={it.label} onPress={it.onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed, i < items.length - 1 && styles.itemBorder]}>
            <Text style={styles.itemIcon}>{it.icon}</Text>
            <View style={styles.itemText}>
              <Text style={[styles.itemLabel, it.danger && styles.dangerText]}>{it.label}</Text>
              {it.sub ? <Text style={styles.itemSub}>{it.sub}</Text> : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => logout()} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  heroInfo: { marginLeft: 16, flex: 1 },
  name: { color: theme.text, fontSize: 22, fontWeight: "900" },
  phone: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: theme.accentBright, fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  menu: {
    marginHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 8,
  },
  item: { flexDirection: "row", alignItems: "center", padding: 16 },
  itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  pressed: { opacity: 0.7 },
  itemIcon: { fontSize: 22, width: 34 },
  itemText: { flex: 1, marginLeft: 6 },
  itemLabel: { color: theme.text, fontSize: 15, fontWeight: "700" },
  itemSub: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  dangerText: { color: theme.danger },
  chevron: { color: theme.textFaint, fontSize: 22 },
  logout: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.35)",
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: theme.danger, fontSize: 15, fontWeight: "800" },
});
