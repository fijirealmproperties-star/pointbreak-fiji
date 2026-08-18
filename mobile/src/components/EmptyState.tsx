import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { color: theme.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
  subtitle: { color: theme.textMuted, fontSize: 13, marginTop: 6, textAlign: "center" },
});
