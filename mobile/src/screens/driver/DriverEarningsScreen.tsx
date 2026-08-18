import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import type { EarningsResponse } from "../../types";
import { fjd, timeAgo } from "../../utils";

export function DriverEarningsScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const p = await api.get<{ id: string }>("/api/providers/me");
          const e = await api.get<EarningsResponse>(`/api/providers/${p.id}/earnings`);
          setData(e);
        } catch {
          setData(null);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  if (loading) {
    return (
      <Screen>
        <Header title="Earnings" showBack />
        <Loading />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <Header title="Earnings" showBack />
        <EmptyState icon="💰" title="No driver profile" subtitle="Set up your driver account to see earnings." />
      </Screen>
    );
  }

  const cards = [
    { label: "Today", ...data.summary.today },
    { label: "This week", ...data.summary.week },
    { label: "This month", ...data.summary.month },
    { label: "All time", ...data.summary.total },
  ];

  return (
    <Screen>
      <Header title="Earnings" subtitle={data.provider.name} showBack />
      <FlatList
        data={cards}
        keyExtractor={(c) => c.label}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Text style={styles.headerLabel}>Today's earnings</Text>
            <Text style={styles.headerValue}>{fjd(data.summary.today.earnings)}</Text>
            <Text style={styles.headerSub}>
              {data.summary.today.rides} ride{data.summary.today.rides === 1 ? "" : "s"} · ★ {data.provider.rating.toFixed(1)}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardValue}>{fjd(item.earnings)}</Text>
            <Text style={styles.cardSub}>{item.rides} rides</Text>
          </View>
        )}
        ListFooterComponent={
          data.recentRides.length ? (
            <View style={styles.recent}>
              <Text style={styles.recentTitle}>Recent rides</Text>
              {data.recentRides.map((r) => (
                <View key={r.id} style={styles.recentRow}>
                  <View style={styles.recentText}>
                    <Text style={styles.recentRoute} numberOfLines={1}>
                      {r.pickup_name} → {r.dropoff_name}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {timeAgo(r.completed_at)} · {r.distance_km?.toFixed(1)} km{r.rating ? ` · ★ ${r.rating}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.recentFare}>{fjd(r.price_fjd)}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 30 },
  headerCard: {
    backgroundColor: theme.accentSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.accent,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
  },
  headerLabel: { color: theme.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  headerValue: { color: theme.text, fontSize: 38, fontWeight: "900", marginTop: 4 },
  headerSub: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 8,
  },
  cardLabel: { color: theme.text, fontSize: 14, fontWeight: "700" },
  cardValue: { color: theme.gold, fontSize: 17, fontWeight: "900" },
  cardSub: { color: theme.textFaint, fontSize: 11 },
  recent: { marginTop: 16 },
  recentTitle: { color: theme.text, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 8,
  },
  recentText: { flex: 1 },
  recentRoute: { color: theme.text, fontSize: 13, fontWeight: "600" },
  recentMeta: { color: theme.textFaint, fontSize: 11, marginTop: 3 },
  recentFare: { color: theme.gold, fontSize: 14, fontWeight: "800", marginLeft: 8 },
});
