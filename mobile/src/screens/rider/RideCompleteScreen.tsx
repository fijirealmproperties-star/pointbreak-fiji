import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import { Stars } from "../../components/Stars";
import { Avatar } from "../../components/Avatar";
import { theme } from "../../theme";
import type { RootStackParamList } from "../../navigation";
import type { Ride } from "../../types";
import { fjd } from "../../utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "RideComplete">;

export function RideCompleteScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { rideId } = route.params;

  const [ride, setRide] = useState<Ride | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Ride>(`/api/rides/${rideId}`).then(setRide).catch(() => {});
  }, [rideId]);

  const payMpaisa = async () => {
    if (!user || !ride) return;
    setPaying(true);
    try {
      const res = await api.post<{ balance: number }>("/api/wallet/pay", {
        rideId,
        amount: ride.price_fjd,
      });
      Alert.alert("Paid with mPaisa", `Your wallet balance is now ${fjd(res.balance)}.`);
      setRide((r) => (r ? { ...r, payment_method: "mpaisa" } : r));
    } catch (e) {
      Alert.alert("Payment failed", (e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      await api.put(`/api/rides/${rideId}/rate`, {
        rider_id: user?.id,
        rating,
        review: review.trim() || undefined,
      });
    } catch {
      // ignore rating errors
    }
    nav.reset({ index: 0, routes: [{ name: "RiderTabs" }] });
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌴</Text>
        <Text style={styles.title}>Vinaka!</Text>
        <Text style={styles.subtitle}>Your PointBreak ride is complete</Text>
        <Text style={styles.fare}>{fjd(ride?.price_fjd)}</Text>
        <Text style={styles.distance}>
          {ride ? `${ride.distance_km?.toFixed(1) ?? "-"} km · ${ride.duration_min ?? "-"} min` : ""}
        </Text>
      </View>

      <View style={styles.card}>
        {ride?.provider ? (
          <View style={styles.driverRow}>
            <Avatar name={ride.provider.name} size={48} tint={theme.accentDeep} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.provider.name}</Text>
              <Text style={styles.driverVehicle}>
                {ride.provider.vehicle_name} · {ride.provider.vehicle_plate || ""}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>Rate your captain</Text>
        <View style={styles.stars}>
          <Stars rating={rating} size={34} onChange={setRating} />
        </View>

        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder="Leave a comment (optional)"
          placeholderTextColor={theme.textFaint}
          style={styles.review}
          multiline
          maxLength={300}
        />

        <Button
          title={ride?.payment_method === "mpaisa" ? "Paid with mPaisa ✓" : "Pay with mPaisa wallet"}
          onPress={payMpaisa}
          loading={paying}
          disabled={ride?.payment_method === "mpaisa"}
          variant="gold"
        />
        <Text style={styles.or}>or</Text>
        <Button title="Finish" onPress={finish} loading={submitting} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  hero: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  heroEmoji: { fontSize: 56, marginBottom: 10 },
  title: { color: theme.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: theme.textMuted, fontSize: 14, marginTop: 6 },
  fare: { color: theme.gold, fontSize: 26, fontWeight: "900", marginTop: 16 },
  distance: { color: theme.textFaint, fontSize: 12, marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 18,
  },
  driverInfo: { marginLeft: 12 },
  driverName: { color: theme.text, fontSize: 15, fontWeight: "800" },
  driverVehicle: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  label: { color: theme.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, textAlign: "center" },
  stars: { alignItems: "center", marginBottom: 16 },
  review: {
    backgroundColor: theme.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    padding: 14,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
    marginBottom: 16,
  },
  or: { color: theme.textFaint, textAlign: "center", marginVertical: 8, fontSize: 12 },
});
