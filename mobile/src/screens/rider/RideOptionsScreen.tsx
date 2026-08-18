import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { Loading } from "../../components/Loading";
import { RideOptionCard } from "../../components/RideOptionCard";
import { Segmented } from "../../components/Segmented";
import { MapView, MapMarker } from "../../components/MapView";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import type { EstimateResponse, Ride, Vehicle } from "../../types";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "RideOptions">;

export function RideOptionsScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { pickup, dropoff, mode } = route.params;

  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [modeState, setModeState] = useState<"land" | "sea">(mode);
  const [requesting, setRequesting] = useState(false);

  const loadEstimate = async (m: "land" | "sea") => {
    setLoading(true);
    try {
      const res = await api.get<EstimateResponse>(
        `/api/estimate?pickup_lat=${pickup.lat}&pickup_lng=${pickup.lng}&dropoff_lat=${dropoff.lat}&dropoff_lng=${dropoff.lng}&mode=${m}`,
      );
      setEstimate(res);
      setSelected(null);
    } catch {
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimate(modeState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeState]);

  const vehicles = useMemo<Vehicle[]>(() => {
    if (!estimate) return [];
    return Object.entries(estimate.estimates)
      .map(([type, v]) => ({ ...v, type }))
      .sort((a, b) => a.price - b.price);
  }, [estimate]);

  const requestRide = async () => {
    if (!selected || !user) return;
    setRequesting(true);
    try {
      const ride = await api.post<Ride>("/api/rides", {
        rider_id: user.id,
        mode: modeState,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_name: pickup.name,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        dropoff_name: dropoff.name,
        vehicle_type: selected,
        passengers: 1,
      });
      nav.replace("Requesting", {
        rideId: ride.id,
        mode: modeState,
        vehicleType: selected,
        price: ride.price_fjd ?? 0,
        pickupName: pickup.name,
        dropoffName: dropoff.name,
      });
    } catch (e) {
      // surface via alert later
    } finally {
      setRequesting(false);
    }
  };

  const markers: MapMarker[] = [
    { id: "pickup", lat: pickup.lat, lng: pickup.lng, label: "A", color: "#00C2A8" },
    { id: "dropoff", lat: dropoff.lat, lng: dropoff.lng, label: "B", color: "#FF5A5A" },
  ];

  return (
    <View style={styles.root}>
      <MapView
        markers={markers}
        polyline={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
        height={220}
        fitOnLoad
      />
      <Header title="Choose your ride" subtitle={`${pickup.name} → ${dropoff.name}`} showBack />

      <View style={styles.modeWrap}>
        <Segmented
          options={[
            { value: "land", label: "🚗 Land" },
            { value: "sea", label: "⛵ Sea" },
          ]}
          value={modeState}
          onChange={setModeState}
        />
      </View>

      {loading ? (
        <Loading label="Calculating fares..." />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {estimate ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {estimate.distance_km.toFixed(1)} km · ≈ {estimate.duration_min} min
              </Text>
              {estimate.surge > 1 ? (
                <Text style={styles.surge}>⚡ Surge {estimate.surge.toFixed(1)}×</Text>
              ) : (
                <Text style={styles.zone}>Zone: {estimate.zone}</Text>
              )}
            </View>
          ) : null}
          {vehicles.map((v) => (
            <RideOptionCard
              key={v.type}
              vehicle={v}
              selected={selected === v.type}
              onPress={() => setSelected(v.type)}
            />
          ))}
          {!vehicles.length ? (
            <Text style={styles.empty}>No vehicles available for this route.</Text>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.bottom}>
        {selected && estimate ? (
          <Text style={styles.total}>
            {fjd(estimate.estimates[selected]?.price)} · cash or mPaisa
          </Text>
        ) : null}
        <Button
          title={selected ? "Request PointBreak ride" : "Select a ride option"}
          onPress={requestRide}
          disabled={!selected}
          loading={requesting}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  modeWrap: { paddingHorizontal: 16, paddingTop: 10 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  summaryText: { color: theme.textMuted, fontSize: 12 },
  surge: { color: theme.warning, fontSize: 12, fontWeight: "800" },
  zone: { color: theme.textFaint, fontSize: 12, textTransform: "capitalize" },
  empty: { color: theme.textFaint, textAlign: "center", marginTop: 40, fontSize: 14 },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  total: { color: theme.textMuted, fontSize: 13, textAlign: "center", marginBottom: 10 },
});
