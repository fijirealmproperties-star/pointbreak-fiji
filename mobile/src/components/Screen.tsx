import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";

export function Screen({
  children,
  style,
  scroll,
}: {
  children: React.ReactNode;
  style?: object;
  scroll?: boolean;
}) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]}>
        <Text style={styles.pad}>{""}</Text>
        {children}
      </SafeAreaView>
    );
  }
  return <SafeAreaView style={[styles.safe, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  pad: { height: 0 },
});
