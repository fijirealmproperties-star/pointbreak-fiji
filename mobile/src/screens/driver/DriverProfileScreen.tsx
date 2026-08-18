import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Avatar } from "../../components/Avatar";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import type { Provider } from "../../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DriverProfileScreen() {
  const nav = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.get<Provider>("/api/providers/me").then(setProvider).catch(() => setProvider(null));
    }, []),
  );

  return (
    <Screen>
      <Header title="Driver profile" showBack />
      <View style={styles.hero}>
        <Avatar name={user?.name ?? "?"} size={76} tint={theme.driver} />
        <View style={styles.heroInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>
      </View>

      {provider ? (
        <View style={styles.providerCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Vehicle</Text>
            <Text style={styles.fieldValue}>
              {provider.mode === "sea" ? "⛵" : "🚗"} {provider.vehicle_name}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Type</Text>
            <Text style={styles.fieldValue}>{provider.vehicle_type.replace("_", " ")}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Plate</Text>
            <Text style={styles.fieldValue}>{provider.vehicle_plate || "—"}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Capacity</Text>
            <Text style={styles.fieldValue}>{provider.capacity} passengers</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Rating</Text>
            <Text style={styles.fieldValue}>★ {provider.rating.toFixed(1)} · {provider.total_rides} rides</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Licence</Text>
            <Text style={styles.fieldValue}>{provider.license_no || "—"}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.none}>No driver profile linked to this account.</Text>
      )}

      <Pressable onPress={() => nav.navigate("DriverEarnings")} style={({ pressed }) => [styles.menu, pressed && styles.pressed]}>
        <Text style={styles.menuIcon}>💰</Text>
        <Text style={styles.menuLabel}>Earnings & trips</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <Pressable onPress={() => nav.navigate("Settings")} style={({ pressed }) => [styles.menu, pressed && styles.pressed]}>
        <Text style={styles.menuIcon}>⚙️</Text>
        <Text style={styles.menuLabel}>Settings & server</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable onPress={() => logout()} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  heroInfo: { marginLeft: 16 },
  name: { color: theme.text, fontSize: 22, fontWeight: "900" },
  phone: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  providerCard: {
    marginHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  fieldLabel: { color: theme.textFaint, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValue: { color: theme.text, fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  none: { color: theme.textMuted, textAlign: "center", marginTop: 30, fontSize: 13 },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 15,
  },
  pressed: { opacity: 0.7 },
  menuIcon: { fontSize: 20, marginRight: 10 },
  menuLabel: { color: theme.text, fontSize: 14, fontWeight: "700", flex: 1 },
  chevron: { color: theme.textFaint, fontSize: 20 },
  logout: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.35)",
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: theme.danger, fontSize: 15, fontWeight: "800" },
});
