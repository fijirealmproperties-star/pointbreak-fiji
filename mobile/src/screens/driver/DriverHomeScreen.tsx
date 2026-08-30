import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { api } from "../../api/client";
import { connectSocket, getSocket } from "../../api/socket";
import { useAuth } from "../../context/AuthContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { Avatar } from "../../components/Avatar";
import { MapView, MapMarker } from "../../components/MapView";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import type { Provider, ProviderStats } from "../../types";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface IncomingRide {
  rideId: string;
  pickup_name?: string;
  dropoff_name?: string;
  mode?: string;
  vehicle_type?: string;
  price?: number;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  passengers?: number;
  scheduled_time?: string | null;
  rider?: { name: string; phone: string } | null;
}

export function DriverHomeScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState({ lat: -17.8018, lng: 177.4534 });
  const [incoming, setIncoming] = useState<IncomingRide | null>(null);
  const [acting, setActing] = useState(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  const loadProvider = useCallback(async () => {
    try {
      const p = await api.get<Provider>("/api/providers/me");
      setProvider(p);
      setOnline(Boolean(p.available));
      setLocation({ lat: p.lat, lng: p.lng });
      return p;
    } catch {
      setProvider(null);
      return null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProvider();
    }, [loadProvider]),
  );

  useEffect(() => {
    connectSocket();
    return () => {
      if (watcherRef.current) watcherRef.current.remove();
    };
  }, []);

  useEffect(() => {
    if (!provider) return;
    const socket = connectSocket();
    socket.emit("provider:join", { providerId: provider.id, mode: provider.mode });
    const onNewRide = (data: IncomingRide & { rideId: string }) => {
      if (!online) return;
      setIncoming(data);
    };
    socket.on("ride:new", onNewRide);
    return () => {
      socket.off("ride:new", onNewRide);
    };
  }, [provider, online]);

  const startLocationWatch = useCallback(async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    if (watcherRef.current) watcherRef.current.remove();
    watcherRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 3000 },
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        if (online && provider) {
          getSocket()?.emit("provider:location", { providerId: provider.id, lat, lng });
        }
      },
    );
  }, [online, provider]);

  useEffect(() => {
    if (online && provider) {
      startLocationWatch();
      api.put("/api/providers/me", { available: true }).catch(() => {});
      getSocket()?.emit("provider:location", { providerId: provider.id, ...location });
    } else if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
      if (provider) {
        api.put("/api/providers/me", { available: false }).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, provider]);

  useEffect(() => {
    if (!provider) return;
    api.get<ProviderStats>(`/api/providers/${provider.id}/stats`).then(setStats).catch(() => {});
  }, [provider]);

  const acceptRide = async () => {
    if (!incoming || !provider) return;
    setActing(true);
    try {
      await api.put(`/api/rides/${incoming.rideId}/accept`, { provider_id: provider.id });
      setIncoming(null);
      setOnline(false);
      await api.put("/api/providers/me", { available: false });
      nav.navigate("DriverRide", { rideId: incoming.rideId });
    } catch (e) {
      Alert.alert("Could not accept", (e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const declineRide = async () => {
    if (!incoming || !provider) return;
    setActing(true);
    try {
      await api.put(`/api/rides/${incoming.rideId}/decline`, { provider_id: provider.id });
    } catch {
      // ignore
    } finally {
      setIncoming(null);
      setActing(false);
    }
  };

  const markers: MapMarker[] = [
    { id: "me", lat: location.lat, lng: location.lng, icon: provider?.mode === "sea" ? "⛵" : "🚙", pulse: online },
  ];

  return (
    <Screen>
      <Header
        title={`Bula, ${user?.name?.split(" ")[0] ?? "Captain"}!`}
        subtitle={provider ? `${provider.vehicle_name} · ${provider.vehicle_plate || ""}` : "Driver profile not set up"}
        right={
          <Pressable onPress={() => nav.navigate("DriverProfile")} hitSlop={8}>
            <Avatar name={user?.name ?? "?"} size={38} tint={theme.driver} />
          </Pressable>
        }
      />

      <MapView markers={markers} center={location} zoom={14} height={220} />

      <View style={styles.body}>
        {provider ? (
          <View style={styles.statusCard}>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>
                {online ? "You're online 🌴" : "You're offline"}
              </Text>
              <Text style={styles.statusSub}>
                {online
                  ? "Riders can see you — get ready for requests!"
                  : "Go online to start receiving ride requests."}
              </Text>
            </View>
            <Pressable
              onPress={() => setOnline((o) => !o)}
              style={[styles.toggle, online ? styles.toggleOn : styles.toggleOff]}
            >
              <Text style={styles.toggleText}>{online ? "ON" : "OFF"}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.noProvider}>
            <Text style={styles.noProviderText}>
              No driver profile found. Create a driver account from the login screen, or contact PointBreak.
            </Text>
          </View>
        )}

        {stats ? (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.total_rides}</Text>
              <Text style={styles.statLabel}>rides</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>★ {stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>rating</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{fjd(stats.today_earnings)}</Text>
              <Text style={styles.statLabel}>today</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue} onPress={() => nav.navigate("DriverEarnings")}>
                → 
              </Text>
              <Text style={styles.statLabel}>earnings</Text>
            </View>
          </View>
        ) : null}

        {provider ? (
          <Button
            title={online ? "Go offline" : "Go online"}
            variant={online ? "danger" : "gold"}
            size="lg"
            onPress={() => setOnline((o) => !o)}
          />
        ) : null}

        <Pressable
          onPress={() => nav.navigate("DriverBookings")}
          style={styles.bookingBtn}
        >
          <Text style={styles.bookingBtnText}>📅 View booking calendar</Text>
        </Pressable>
      </View>

      <Modal visible={Boolean(incoming)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🔔 New ride request!</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Passenger</Text>
              <Text style={styles.modalValue}>
                {incoming?.rider?.name ?? "Rider"} {incoming?.rider?.phone ? `· ${incoming.rider.phone} 📞` : ""}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Route</Text>
              <Text style={styles.modalValue} numberOfLines={2}>
                📍 {incoming?.pickup_name || "Pickup"} → 🏁 {incoming?.dropoff_name || "Dropoff"}
              </Text>
            </View>
            {incoming?.pickup_lat ? (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Pickup GPS</Text>
                <Text style={styles.modalValue}>
                  {incoming.pickup_lat.toFixed(4)}, {incoming.pickup_lng?.toFixed(4)}
                </Text>
              </View>
            ) : null}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Vehicle</Text>
              <Text style={styles.modalValue}>
                {incoming?.mode === "sea" ? "⛵" : "🚗"} {incoming?.vehicle_type?.replace("_", " ") ?? "-"} · {incoming?.passengers ?? 1} pax
              </Text>
            </View>
            {incoming?.scheduled_time ? (
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Scheduled</Text>
                <Text style={styles.modalValue}>📅 {new Date(incoming.scheduled_time).toLocaleString()}</Text>
              </View>
            ) : null}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Fare</Text>
              <Text style={styles.modalValue}>{fjd(incoming?.price)}</Text>
            </View>
            <View style={styles.modalActions}>
              <Button title="Decline" variant="outline" onPress={declineRide} loading={acting} style={styles.modalBtn} />
              <Button title="Accept" variant="gold" onPress={acceptRide} loading={acting} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  statusTextWrap: { flex: 1 },
  statusTitle: { color: theme.text, fontSize: 17, fontWeight: "800" },
  statusSub: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  toggle: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toggleOn: { backgroundColor: theme.successSoft },
  toggleOff: { backgroundColor: theme.dangerSoft },
  toggleText: { color: theme.text, fontWeight: "900", fontSize: 14, letterSpacing: 1 },
  noProvider: { backgroundColor: theme.warningSoft, borderRadius: 14, padding: 14 },
  noProviderText: { color: theme.warning, fontSize: 13, lineHeight: 18 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: theme.text, fontSize: 17, fontWeight: "900" },
  statLabel: { color: theme.textFaint, fontSize: 10, textTransform: "uppercase", marginTop: 3, letterSpacing: 0.4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalCard: {
    backgroundColor: theme.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    padding: 20,
  },
  modalTitle: { color: theme.text, fontSize: 19, fontWeight: "900", textAlign: "center", marginBottom: 14 },
  modalRow: { flexDirection: "row", marginBottom: 10 },
  modalLabel: { color: theme.textFaint, fontSize: 12, width: 70, textTransform: "uppercase" },
  modalValue: { color: theme.text, fontSize: 13, fontWeight: "600", flex: 1 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1 },
  bookingBtn: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookingBtnText: { color: theme.accentBright, fontSize: 14, fontWeight: "700", textAlign: "center" },
});
