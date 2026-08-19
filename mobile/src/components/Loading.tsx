import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.logo}>
        <Text style={styles.emoji}>🏄</Text>
      </View>
      <Text style={styles.title}>PointBreak Rides Fiji</Text>
      <Text style={styles.subtitle}>Ride, boat & charter across every island</Text>
      <ActivityIndicator size="large" color={theme.accent} style={styles.spinner} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: theme.accentSoft,
    borderWidth: 2,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emoji: { fontSize: 52 },
  title: { color: theme.text, fontSize: 26, fontWeight: "900", letterSpacing: 0.3 },
  subtitle: { color: theme.textMuted, fontSize: 14, marginTop: 6 },
  spinner: { marginTop: 28 },
  label: { color: theme.textFaint, fontSize: 12, marginTop: 12 },
});
