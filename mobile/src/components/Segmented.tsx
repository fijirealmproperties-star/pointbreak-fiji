import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.seg, active && styles.segActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {o.icon ? `${o.icon} ` : ""}
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: theme.surfaceAlt,
    borderRadius: 14,
    padding: 4,
  },
  seg: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
  },
  segActive: { backgroundColor: theme.accentDeep },
  label: { color: theme.textMuted, fontWeight: "700", fontSize: 13 },
  labelActive: { color: "#FFFFFF" },
});
