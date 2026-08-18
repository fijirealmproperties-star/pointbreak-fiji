import React, { useEffect, useState, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { StatusPill } from "../../components/StatusPill";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import type { Ride } from "../../types";
import { fjd, timeAgo } from "../../utils";

export function HistoryScreen() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await api.get<Ride[]>(`/api/rides?rider_id=${user.id}`);
      setRides(rows);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <Header title="Ride history" subtitle={`${rides.length} rides`} />
      {loading ? (
        <Loading />
      ) : rides.length === 0 ? (
        <EmptyState icon="🌊" title="No rides yet" subtitle="Book your first PointBreak ride from the home screen." />
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.route} numberOfLines={1}>
                  {item.pickup_name || "Pickup"} → {item.dropoff_name || "Dropoff"}
                </Text>
                <StatusPill status={item.status} />
              </View>
              <View style={styles.mid}>
                <Text style={styles.meta}>
                  {item.mode === "sea" ? "⛵" : "🚗"} {item.vehicle_type.replace("_", " ")} · {item.distance_km?.toFixed(1)} km · {timeAgo(item.created_at)}
                </Text>
                <Text style={styles.fare}>{fjd(item.price_fjd)}</Text>
              </View>
              <View style={styles.bottom}>
                <Text style={styles.provider}>
                  {item.provider ? `${item.provider.name} · ${item.provider.vehicle_plate || ""}` : "—"}
                </Text>
                {item.rating ? <Text style={styles.rating}>★ {item.rating}</Text> : null}
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  route: { color: theme.text, fontSize: 14, fontWeight: "700", flex: 1 },
  mid: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  meta: { color: theme.textMuted, fontSize: 12, flex: 1 },
  fare: { color: theme.gold, fontSize: 14, fontWeight: "800" },
  bottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  provider: { color: theme.textFaint, fontSize: 11 },
  rating: { color: theme.gold, fontSize: 11, fontWeight: "700" },
});
