import React, { useEffect } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import { MapView, MapMarker } from "../../components/MapView";
import { useRide } from "../../hooks/useRide";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "DriverRide">;

export function DriverRideScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { rideId } = route.params;
  const { user } = useAuth();
  const { ride } = useRide(rideId);

  const status = ride?.status ?? "accepted";
  const inProgress = status === "in_progress";
  const completed = status === "completed";

  useEffect(() => {
    if (completed) {
      const t = setTimeout(() => nav.replace("DriverTabs"), 1200);
      return () => clearTimeout(t);
    }
  }, [completed, nav]);

  const start = async () => {
    try {
      await api.put(`/api/rides/${rideId}/start`, {});
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const callRider = () => {
    const phone = ride?.rider?.phone;
    if (!phone) return;
    Alert.alert("Call passenger?", `${phone}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  const complete = async () => {
    Alert.alert("Complete ride?", `Collect ${fjd(ride?.price_fjd)} in cash or mPaisa.`, [
      { text: "Not yet", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          try {
            await api.put(`/api/rides/${rideId}/complete`, {});
          } catch (e) {
            Alert.alert("Error", (e as Error).message);
          }
        },
      },
    ]);
  };

  const markers: MapMarker[] = [
    { id: "pickup", lat: ride?.pickup_lat ?? 0, lng: ride?.pickup_lng ?? 0, icon: "📍" },
    { id: "dropoff", lat: ride?.dropoff_lat ?? 0, lng: ride?.dropoff_lng ?? 0, icon: "🏁" },
  ];

  return (
    <View style={styles.root}>
      <MapView
        markers={markers}
        polyline={[[ride?.pickup_lat ?? 0, ride?.pickup_lng ?? 0], [ride?.dropoff_lat ?? 0, ride?.dropoff_lng ?? 0]]}
        height="55%"
        fitOnLoad
      />

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, inProgress ? styles.dotProgress : styles.dotWait]} />
          <Text style={styles.statusText}>
            {inProgress ? "On the way to drop-off" : "Head to pickup"}
          </Text>
        </View>

        <View style={styles.routeBox}>
          <View style={styles.routeLine}>
            <View style={[styles.routeDot, { backgroundColor: "#00C2A8" }]} />
            <View style={styles.routeStem} />
            <View style={[styles.routeDot, { backgroundColor: "#FF5A5A" }]} />
          </View>
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeName}>{ride?.pickup_name || "Pickup location"}</Text>
            <Text style={styles.routeSub}>Passenger pickup</Text>
            <View style={styles.routeSpacer} />
            <Text style={styles.routeName}>{ride?.dropoff_name || "Drop-off"}</Text>
            <Text style={styles.routeSub}>Destination</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.info}>
            <Text style={styles.infoValue}>{fjd(ride?.price_fjd)}</Text>
            <Text style={styles.infoLabel}>fare</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoValue}>{ride?.distance_km?.toFixed(1)} km</Text>
            <Text style={styles.infoLabel}>distance</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoValue}>≈{ride?.duration_min} min</Text>
            <Text style={styles.infoLabel}>duration</Text>
          </View>
        </View>

        <Button
          title={inProgress ? "Complete ride" : "Start ride"}
          onPress={inProgress ? complete : start}
          variant="gold"
          size="lg"
        />
        <Text style={styles.footer}>Payment: {ride?.payment_method === "mpaisa" ? "mPaisa wallet 💳" : "cash 💵"} · Rider: {ride?.passengers ?? 1} pax</Text>
        {ride?.rider ? (
          <Text style={styles.riderPhone} onPress={callRider}>
            {ride.rider.name} · {ride.rider.phone} 📞
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button title="📞 Call Passenger" onPress={callRider} variant="outline" style={styles.actionBtn} />
          <Button title="SOS" onPress={() => Alert.alert("SOS", "Call 911 / 999 for emergencies")} variant="danger" style={styles.actionBtn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -22,
    padding: 20,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotWait: { backgroundColor: theme.warning },
  dotProgress: { backgroundColor: theme.success },
  statusText: { color: theme.text, fontSize: 17, fontWeight: "800" },
  routeBox: {
    flexDirection: "row",
    backgroundColor: theme.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 14,
  },
  routeLine: { alignItems: "center", marginRight: 12, paddingTop: 2 },
  routeDot: { width: 11, height: 11, borderRadius: 6 },
  routeStem: { width: 2, flex: 1, backgroundColor: theme.borderStrong, marginVertical: 2 },
  routeTextWrap: { flex: 1 },
  routeName: { color: theme.text, fontSize: 14, fontWeight: "700" },
  routeSub: { color: theme.textFaint, fontSize: 11, marginTop: 1 },
  routeSpacer: { height: 12 },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  info: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    alignItems: "center",
  },
  infoValue: { color: theme.text, fontSize: 15, fontWeight: "900" },
  infoLabel: { color: theme.textFaint, fontSize: 10, textTransform: "uppercase", marginTop: 3 },
  footer: { color: theme.textFaint, fontSize: 11, textAlign: "center", marginTop: 12 },
  riderPhone: { color: theme.accentBright, fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1 },
});
