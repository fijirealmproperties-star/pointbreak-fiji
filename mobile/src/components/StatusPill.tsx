import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

const COLORS: Record<string, { bg: string; fg: string }> = {
  searching: { bg: theme.dangerSoft, fg: theme.danger },
  matched: { bg: theme.accentSoft, fg: theme.accentBright },
  accepted: { bg: theme.warningSoft, fg: theme.warning },
  in_progress: { bg: theme.accentSoft, fg: theme.accentBright },
  completed: { bg: theme.successSoft, fg: theme.success },
  cancelled: { bg: "#2A2A2A", fg: theme.textMuted },
};

export function StatusPill({ status }: { status: string }) {
  const c = COLORS[status] ?? { bg: theme.surfaceAlt, fg: theme.textMuted };
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <Text style={[styles.label, { color: c.fg }]}>
        {status.replace("_", " ")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
