import React, { useEffect, useRef } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import { MapView, MapMarker, MapRef } from "../../components/MapView";
import { Avatar } from "../../components/Avatar";
import { Stars } from "../../components/Stars";
import { useRide } from "../../hooks/useRide";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "ActiveRide">;

export function ActiveRideScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { rideId } = route.params;
  const { ride, driverLoc, sosAlert } = useRide(rideId);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (ride?.status === "completed") {
      nav.replace("RideComplete", { rideId });
    }
  }, [ride?.status, rideId, nav]);

  useEffect(() => {
    if (driverLoc) mapRef.current?.moveMarker("driver", driverLoc.lat, driverLoc.lng);
  }, [driverLoc]);

  const cancel = () => {
    Alert.alert("Cancel ride?", "Your driver has been notified. Cancellation fees may apply.", [
      { text: "Keep ride", style: "cancel" },
      {
        text: "Cancel ride",
        style: "destructive",
        onPress: async () => {
          try {
            await api.put(`/api/rides/${rideId}/cancel`, {});
          } catch {
            // ignore
          }
          nav.goBack();
        },
      },
    ]);
  };

  const callDriver = () => {
    const phone = ride?.provider?.phone;
    if (!phone) return;
    Alert.alert("Call driver?", `${phone}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  const sos = () => {
    if (!user) return;
    Alert.alert(
      "Send SOS?",
      "This alerts our emergency line and shares your location with PointBreak and your driver.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS 🚨",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/api/sos", {
                ride_id: rideId,
                user_id: user.id,
                location: { lat: ride?.pickup_lat, lng: ride?.pickup_lng },
              });
              Alert.alert("SOS sent", "PointBreak emergency team has been alerted. Help is on the way.");
            } catch {
              Alert.alert("Failed", "Could not send SOS. Call emergency: 911 / 999.");
            }
          },
        },
      ],
    );
  };

  const markers: MapMarker[] = [
    { id: "pickup", lat: ride?.pickup_lat ?? 0, lng: ride?.pickup_lng ?? 0, icon: "📍" },
    { id: "dropoff", lat: ride?.dropoff_lat ?? 0, lng: ride?.dropoff_lng ?? 0, icon: "🏁" },
    {
      id: "driver",
      lat: driverLoc?.lat ?? ride?.provider?.lat ?? ride?.pickup_lat ?? 0,
      lng: driverLoc?.lng ?? ride?.provider?.lng ?? ride?.pickup_lng ?? 0,
      icon: ride?.mode === "sea" ? "⛵" : "🚙",
      pulse: true,
    },
  ];

  const inProgress = ride?.status === "in_progress";

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        markers={markers}
        polyline={[[ride?.pickup_lat ?? 0, ride?.pickup_lng ?? 0], [ride?.dropoff_lat ?? 0, ride?.dropoff_lng ?? 0]]}
        height="55%"
        fitOnLoad
      />

      {sosAlert ? (
        <View style={styles.sosBanner}>
          <Text style={styles.sosText}>🚨 SOS alert sent to PointBreak emergency team</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, inProgress ? styles.dotProgress : styles.dotOnway]} />
          <Text style={styles.statusText}>
            {inProgress ? "Ride in progress" : ride?.status === "accepted" ? "Driver on the way" : "Driver assigned"}
          </Text>
          <Text style={styles.statusTime}>
            {ride?.duration_min ?? "-"} min trip
          </Text>
        </View>

        {ride?.provider ? (
          <View style={styles.driverCard}>
            <Avatar name={ride.provider.name} size={54} tint={theme.accentDeep} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.provider.name}</Text>
              <View style={styles.driverMeta}>
                <Stars rating={ride.provider.rating} size={13} />
                <Text style={styles.driverRating}>{ride.provider.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.driverVehicle}>
                {ride.provider.vehicle_name} · {ride.provider.vehicle_plate || "no plate"} · {ride.provider.total_rides} rides
              </Text>
            </View>
            <Text style={styles.driverPhone} onPress={callDriver}>{ride.provider.phone} 📞</Text>
          </View>
        ) : (
          <Text style={styles.noDriver}>Assigning your captain…</Text>
        )}

        <View style={styles.route}>
          <Text style={styles.routeText} numberOfLines={1}>
            {ride?.pickup_name || "Pickup"} → {ride?.dropoff_name || "Destination"}
          </Text>
          <Text style={styles.routeFare}>{fjd(ride?.price_fjd)}</Text>
        </View>

        <View style={styles.actions}>
          <Button title="📞 Call" onPress={callDriver} variant="outline" style={styles.actionBtn} />
          <Button title="SOS" onPress={sos} variant="danger" style={styles.actionBtn} />
          {!inProgress && ride?.status !== "completed" ? (
            <Button title="Cancel ride" onPress={cancel} variant="outline" style={styles.actionBtn} />
          ) : (
            <Button title="Share trip" onPress={() => Alert.alert("Share trip", "Trip link copied to clipboard.")} variant="outline" style={styles.actionBtn} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  sosBanner: {
    backgroundColor: theme.dangerSoft,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sosText: { color: theme.danger, fontWeight: "800", fontSize: 12, textAlign: "center" },
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -22,
    padding: 20,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOnway: { backgroundColor: theme.warning },
  dotProgress: { backgroundColor: theme.success },
  statusText: { color: theme.text, fontSize: 16, fontWeight: "800", flex: 1 },
  statusTime: { color: theme.textMuted, fontSize: 12 },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 14,
  },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { color: theme.text, fontSize: 16, fontWeight: "800" },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  driverRating: { color: theme.gold, fontSize: 12, fontWeight: "700" },
  driverVehicle: { color: theme.textMuted, fontSize: 12, marginTop: 3 },
  driverPhone: { color: theme.accentBright, fontSize: 13, fontWeight: "700" },
  noDriver: { color: theme.textMuted, fontSize: 14, textAlign: "center", marginBottom: 14 },
  route: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.accentSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  routeText: { color: theme.text, fontSize: 13, flex: 1, marginRight: 8 },
  routeFare: { color: theme.gold, fontSize: 13, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1 },
});
