import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import { initials } from "../utils";

export function Avatar({
  name,
  size = 44,
  tint = theme.accentDeep,
}: {
  name: string;
  size?: number;
  tint?: string;
}) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tint },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontWeight: "800" },
});
