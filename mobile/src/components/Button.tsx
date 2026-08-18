import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { theme } from "../theme";

type Variant = "primary" | "outline" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  style,
  icon,
}: Props) {
  const colors: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: theme.accentDeep, text: "#FFFFFF" },
    gold: { bg: theme.gold, text: "#1A1200" },
    outline: { bg: "transparent", text: theme.accentBright, border: theme.borderStrong },
    ghost: { bg: "transparent", text: theme.textMuted },
    danger: { bg: theme.dangerSoft, text: theme.danger, border: "rgba(255,90,90,0.35)" },
  };

  const sizes: Record<Size, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    md: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16 },
  };

  const c = colors[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizes[size],
        { backgroundColor: c.bg, borderColor: c.border ?? "transparent" },
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: c.text }, size === "sm" && styles.labelSm]}>
          {icon ? `${icon}  ` : ""}
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  label: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  labelSm: { fontSize: 13 },
});
