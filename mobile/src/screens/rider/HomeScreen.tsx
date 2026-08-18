import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { connectSocket, getSocket } from "../../api/socket";
import { MapView, MapRef, MapMarker } from "../../components/MapView";
import { Button } from "../../components/Button";
import { Segmented } from "../../components/Segmented";
import { LocationPicker } from "../../components/LocationPicker";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { useAuth } from "../../context/AuthContext";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import type { EstimateResponse, Location, Provider, RideMode } from "../../types";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { loc } = useCurrentLocation();

  const [locations, setLocations] = useState<Location[]>([]);
  const [pickup, setPickup] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [dropoff, setDropoff] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [pickerFor, setPickerFor] = useState<"pickup" | "dropoff" | null>(null);
  const [mode, setMode] = useState<RideMode>("land");
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    connectSocket();
    if (user) getSocket()?.emit("rider:join", user.id);
    api.get<Location[]>("/api/locations").then(setLocations).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (pickup && dropoff) {
      fetchEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, dropoff, mode]);

  const fetchEstimate = async () => {
    if (!pickup || !dropoff) return;
    setLoadingEstimate(true);
    try {
      const res = await api.get<EstimateResponse>(
        `/api/estimate?pickup_lat=${pickup.lat}&pickup_lng=${pickup.lng}&dropoff_lat=${dropoff.lat}&dropoff_lng=${dropoff.lng}&mode=${mode}`,
      );
      setEstimate(res);
    } catch {
      setEstimate(null);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const refreshProviders = async () => {
    try {
      const rows = await api.get<Provider[]>(
        `/api/providers?mode=${mode}&lat=${pickup?.lat ?? loc.lat}&lng=${pickup?.lng ?? loc.lng}`,
      );
      setProviders(rows);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshProviders();
    const socket = getSocket();
    if (!socket) return;
    const onMoved = (evt: { providerId: string; lat: number; lng: number }) => {
      setProviders((prev) =>
        prev.map((p) => (p.id === evt.providerId ? { ...p, lat: evt.lat, lng: evt.lng } : p)),
      );
    };
    socket.on("provider:moved", onMoved);
    return () => {
      socket.off("provider:moved", onMoved);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pickup?.lat, pickup?.lng]);

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (pickup) {
      list.push({
        id: "pickup",
        lat: pickup.lat,
        lng: pickup.lng,
        label: "A",
        color: "#00C2A8",
      });
    }
    if (dropoff) {
      list.push({ id: "dropoff", lat: dropoff.lat, lng: dropoff.lng, label: "B", color: "#FF5A5A" });
    }
    providers.forEach((p, i) => {
      list.push({
        id: `driver-${p.id}`,
        lat: p.lat,
        lng: p.lng,
        icon: p.mode === "sea" ? "⛵" : "🚙",
        color: p.mode === "sea" ? theme.ocean : theme.accentDeep,
        pulse: p.mode === mode,
      });
    });
    return list;
  }, [pickup, dropoff, providers, mode]);

  const polyline = useMemo<Array<[number, number]>>(() => {
    if (pickup && dropoff) {
      return [
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ];
    }
    return [];
  }, [pickup, dropoff]);

  const cheapest = estimate
    ? Math.min(...Object.values(estimate.estimates).map((v) => v.price))
    : null;

  const goOptions = () => {
    if (!pickup || !dropoff) return;
    nav.navigate("RideOptions", {
      pickup,
      dropoff,
      mode,
    });
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={{ height: "100%" }}
        markers={markers}
        polyline={polyline}
        center={pickup ?? loc}
        zoom={10}
        height="100%"
        fitOnLoad={Boolean(pickup && dropoff)}
      />

      <View style={[styles.topOverlay, { top: insets.top + 8 }]}>
        <View style={styles.brandPill}>
          <Text style={styles.brandEmoji}>🏄</Text>
          <Text style={styles.brandText}>PointBreak Rides</Text>
        </View>
      </View>

      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.routeCard}>
          <View style={styles.routeDots}>
            <View style={[styles.dot, { backgroundColor: "#00C2A8" }]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, { backgroundColor: "#FF5A5A" }]} />
          </View>
          <View style={styles.routeFields}>
            <Pressable onPress={() => setPickerFor("pickup")} style={styles.field}>
              <Text style={[styles.fieldLabel, pickup && styles.fieldFilled]}>
                {pickup ? "Pickup" : "Where from?"}
              </Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {pickup ? pickup.name : "Tap to choose"}
              </Text>
            </Pressable>
            <View style={styles.fieldDivider} />
            <Pressable onPress={() => setPickerFor("dropoff")} style={styles.field}>
              <Text style={[styles.fieldLabel, dropoff && styles.fieldFilled]}>
                {dropoff ? "Drop-off" : "Where to?"}
              </Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {dropoff ? dropoff.name : "Tap to choose"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Segmented
          options={[
            { value: "land", label: "🚗 Land" },
            { value: "sea", label: "⛵ Sea" },
          ]}
          value={mode}
          onChange={setMode}
        />

        {estimate ? (
          <View style={styles.estimateRow}>
            <Text style={styles.estimateText}>
              {estimate.distance_km.toFixed(1)} km · ≈ {estimate.duration_min} min
            </Text>
            <Text style={styles.estimatePrice}>
              from {fjd(cheapest)}
            </Text>
            {estimate.surge > 1 ? (
              <Text style={styles.surge}>⚡ {estimate.surge.toFixed(1)}× surge</Text>
            ) : null}
          </View>
        ) : null}

        <Button
          title={!pickup || !dropoff ? "Choose pickup & destination" : "See ride options"}
          onPress={goOptions}
          disabled={!pickup || !dropoff}
          loading={loadingEstimate}
          size="lg"
        />
      </View>

      <LocationPicker
        visible={pickerFor !== null}
        locations={locations}
        current={loc}
        title={pickerFor === "pickup" ? "Choose pickup" : "Choose destination"}
        onClose={() => setPickerFor(null)}
        onSelect={(l) => {
          const sel = { name: l.name, lat: l.lat, lng: l.lng };
          if (pickerFor === "pickup") {
            setPickup(sel);
            mapRef.current?.flyTo(l.lat, l.lng, 12);
          } else {
            setDropoff(sel);
            mapRef.current?.flyTo(l.lat, l.lng, 12);
          }
          setPickerFor(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  topOverlay: { position: "absolute", left: 16, right: 16 },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: theme.overlay,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  brandEmoji: { fontSize: 16, marginRight: 6 },
  brandText: { color: theme.text, fontSize: 13, fontWeight: "800" },
  bottomCard: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  routeCard: {
    flexDirection: "row",
    backgroundColor: theme.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  routeDots: { alignItems: "center", paddingTop: 8, marginRight: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotLine: { width: 2, flex: 1, backgroundColor: theme.borderStrong, marginVertical: 3 },
  routeFields: { flex: 1 },
  field: { paddingVertical: 6 },
  fieldLabel: { color: theme.textFaint, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldFilled: { color: theme.accentBright },
  fieldValue: { color: theme.text, fontSize: 15, fontWeight: "600", marginTop: 2 },
  fieldDivider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginVertical: 4 },
  estimateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  estimateText: { color: theme.textMuted, fontSize: 12 },
  estimatePrice: { color: theme.gold, fontSize: 14, fontWeight: "800" },
  surge: { color: theme.warning, fontSize: 11, fontWeight: "700" },
});
