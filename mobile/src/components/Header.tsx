import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../theme";

interface Props {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  tint?: string;
}

export function Header({ title, subtitle, right, onBack, showBack, tint }: Props) {
  const nav = useNavigation();
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => nav.goBack())}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            hitSlop={10}
          >
            <Text style={[styles.backText, tint && { color: tint }]}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.titles}>
          {title ? (
            <Text style={[styles.title, tint && { color: tint }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1, gap: 4 },
  titles: { flex: 1 },
  title: { color: theme.text, fontSize: 19, fontWeight: "800" },
  subtitle: { color: theme.textMuted, fontSize: 12, marginTop: 1 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  backPlaceholder: { width: 44 },
  backText: { color: theme.text, fontSize: 28, lineHeight: 30, fontWeight: "700", marginTop: -2 },
  pressed: { opacity: 0.7 },
  right: { flexDirection: "row", alignItems: "center" },
});
