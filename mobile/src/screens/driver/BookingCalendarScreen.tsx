import React, { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { EmptyState } from "../../components/EmptyState";
import { Loading } from "../../components/Loading";
import { theme } from "../../theme";
import type { Ride } from "../../types";
import { fjd } from "../../utils";

interface BookingRow extends Ride {
  rider_name?: string;
  rider_phone?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function BookingCalendarScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await api.get<{ id: string }>("/api/providers/me");
      const b = await api.get<BookingRow[]>(`/api/providers/${p.id}/bookings`);
      setBookings(b);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const bookingOn = (day: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => {
      const t = b.scheduled_time || b.created_at;
      if (!t) return false;
      return new Date(t).toISOString().slice(0, 10) === key;
    });
  };

  const move = (dir: number) => {
    setViewDate(new Date(year, month + dir, 1));
  };

  const selectedBookings = bookings.filter((b) => {
    const t = b.scheduled_time || b.created_at;
    if (!t) return false;
    const d = new Date(t);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <Screen>
      <Header title="Booking Calendar" subtitle="All your passenger bookings" />
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={selectedBookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.calendarCard}>
                <View style={styles.calHeader}>
                  <Pressable onPress={() => move(-1)} hitSlop={12}>
                    <Text style={styles.nav}>‹</Text>
                  </Pressable>
                  <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
                  <Pressable onPress={() => move(1)} hitSlop={12}>
                    <Text style={styles.nav}>›</Text>
                  </Pressable>
                </View>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w) => (
                    <Text key={w} style={styles.weekday}>{w}</Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {cells.map((day, idx) => {
                    if (day === null) return <View key={idx} style={styles.day} />;
                    const b = bookingOn(day);
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    return (
                      <View key={idx} style={[styles.day, isToday && styles.dayToday]}>
                        <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
                        {b.length ? <View style={styles.dot}><Text style={styles.dotText}>{b.length}</Text></View> : null}
                      </View>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                Bookings {selectedBookings.length ? `(${selectedBookings.length})` : ""}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.bookingRow}>
              <View style={styles.bookingText}>
                <Text style={styles.bookingRoute} numberOfLines={1}>
                  {item.pickup_name || "Pickup"} → {item.dropoff_name || "Dropoff"}
                </Text>
                <Text style={styles.bookingMeta}>
                  👤 {item.rider_name || "Rider"}{item.rider_phone ? ` · ${item.rider_phone}` : ""} · {item.passengers || 1} pax
                </Text>
                <Text style={styles.bookingTime}>
                  📅 {item.scheduled_time ? new Date(item.scheduled_time).toLocaleString() : new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingFare}>{fjd(item.price_fjd)}</Text>
                <Text style={[styles.badge, item.status === "completed" ? styles.badgeDone : item.status === "cancelled" ? styles.badgeCancelled : styles.badgePending]}>
                  {item.status}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="📅" title="No bookings" subtitle="Bookings for this driver will appear here." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 30 },
  calendarCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 18,
  },
  calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  monthTitle: { color: theme.text, fontSize: 17, fontWeight: "800" },
  nav: { color: theme.accentBright, fontSize: 26, fontWeight: "800", paddingHorizontal: 8 },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekday: { flex: 1, textAlign: "center", color: theme.textFaint, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayToday: { backgroundColor: theme.accentSoft, borderRadius: 8 },
  dayNum: { color: theme.text, fontSize: 13, fontWeight: "600" },
  dayNumToday: { color: theme.accentBright, fontWeight: "900" },
  dot: {
    position: "absolute",
    top: 2,
    right: 6,
    backgroundColor: theme.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  dotText: { color: "#111", fontSize: 9, fontWeight: "900" },
  sectionTitle: { color: theme.text, fontSize: 15, fontWeight: "800", marginBottom: 10 },
  bookingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 8,
  },
  bookingText: { flex: 1 },
  bookingRoute: { color: theme.text, fontSize: 13, fontWeight: "700" },
  bookingMeta: { color: theme.textMuted, fontSize: 11, marginTop: 3 },
  bookingTime: { color: theme.textFaint, fontSize: 11, marginTop: 3 },
  bookingRight: { alignItems: "flex-end", marginLeft: 10 },
  bookingFare: { color: theme.gold, fontSize: 15, fontWeight: "900" },
  badge: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  badgePending: { backgroundColor: theme.warningSoft, color: theme.warning },
  badgeDone: { backgroundColor: theme.successSoft, color: theme.success },
  badgeCancelled: { backgroundColor: theme.dangerSoft, color: theme.danger },
});
