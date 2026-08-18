import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
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
type Route = RouteProp<RootStackParamList, "Requesting">;

export function RequestingScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { rideId, mode, vehicleType, price, pickupName, dropoffName } = route.params;
  const { ride, driverLoc } = useRide(rideId);

  const pulse = useRef(new Animated.Value(0)).current;
  const [cancelling, setCancelling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (ride?.status === "accepted" || ride?.status === "matched") {
      nav.replace("ActiveRide", { rideId });
    }
  }, [ride?.status, rideId, nav]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => setTimedOut(true), 45000);
    return () => clearTimeout(t);
  }, [user]);

  const cancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/api/rides/${rideId}/cancel`, {});
    } catch {
      // ignore
    }
    nav.goBack();
  };

  const pickupMarker: MapMarker = { id: "pickup", lat: ride?.pickup_lat ?? -17.8018, lng: ride?.pickup_lng ?? 177.4534, icon: "📍" };

  return (
    <View style={styles.root}>
      <MapView markers={[pickupMarker]} height="52%" center={{ lat: ride?.pickup_lat ?? -17.8018, lng: ride?.pickup_lng ?? 177.4534 }} zoom={14} />
      <View style={styles.card}>
        <View style={styles.pulseWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                transform: [
                  {
                    scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.pulseCore}>
            <Text style={styles.pulseEmoji}>{mode === "sea" ? "⛵" : "🚕"}</Text>
          </View>
        </View>

        <Text style={styles.title}>
          {timedOut ? "Still searching…" : "Finding your captain"}
        </Text>
        <Text style={styles.subtitle}>
          {pickupName} → {dropoffName}
        </Text>

        <View style={styles.details}>
          <View style={styles.detail}>
            <Text style={styles.detailValue}>{vehicleType.replace("_", " ")}</Text>
            <Text style={styles.detailLabel}>{mode === "sea" ? "sea craft" : "vehicle"}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailValue}>{fjd(price)}</Text>
            <Text style={styles.detailLabel}>fare · cash or mPaisa</Text>
          </View>
        </View>

        <Button title="Cancel request" onPress={cancel} loading={cancelling} variant="danger" />
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
    paddingHorizontal: 20,
    paddingTop: 28,
    alignItems: "center",
  },
  pulseWrap: { width: 92, height: 92, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  pulseRing: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: theme.accent,
  },
  pulseCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accentDeep,
    borderWidth: 2,
    borderColor: theme.accentBright,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseEmoji: { fontSize: 28 },
  title: { color: theme.text, fontSize: 20, fontWeight: "800" },
  subtitle: { color: theme.textMuted, fontSize: 13, marginTop: 6, textAlign: "center" },
  details: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 22,
    width: "100%",
  },
  detail: {
    flex: 1,
    backgroundColor: theme.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    alignItems: "center",
  },
  detailValue: { color: theme.text, fontSize: 14, fontWeight: "800", textTransform: "capitalize" },
  detailLabel: { color: theme.textFaint, fontSize: 10, marginTop: 3, textTransform: "uppercase" },
});
