import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

export function Stars({
  rating,
  size = 16,
  onChange,
}: {
  rating: number;
  size?: number;
  onChange?: (n: number) => void;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {stars.map((n) => {
        const filled = n <= Math.round(rating);
        const star = (
          <Text style={{ fontSize: size, color: filled ? theme.gold : theme.borderStrong }}>
            ★
          </Text>
        );
        if (!onChange) {
          return <View key={n}>{star}</View>;
        }
        return (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2 },
});
