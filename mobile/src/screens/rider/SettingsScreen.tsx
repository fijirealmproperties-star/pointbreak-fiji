import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useServer } from "../../context/ServerContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { getBaseUrl } from "../../api/client";
import { theme } from "../../theme";

export function SettingsScreen() {
  const { connected, checking, setServerUrl, resetServer } = useServer();
  const [url, setUrl] = useState(getBaseUrl());

  const save = async () => {
    const ok = await setServerUrl(url);
    if (ok) {
      Alert.alert("Connected", "Server updated.");
    } else {
      Alert.alert("Connection failed", "Could not reach that server URL.");
    }
  };

  const reset = () => {
    Alert.alert("Reset app?", "You will be logged out and returned to setup.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          await resetServer();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title="Settings" showBack />
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
          <Text style={styles.status}>{connected ? "Connected to server" : "Not connected"}</Text>
        </View>
        <Input
          label="Server URL"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://192.168.1.50:3001"
        />
        <Button title="Save & reconnect" onPress={save} loading={checking} />
        <Text style={styles.hint}>
          Use your computer's LAN IP (find with `ipconfig` on Windows). Android emulator: http://10.0.2.2:3001
        </Text>
        <Button title="Reset app" onPress={reset} variant="danger" style={{ marginTop: 24 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOn: { backgroundColor: theme.success },
  dotOff: { backgroundColor: theme.danger },
  status: { color: theme.textMuted, fontSize: 14, fontWeight: "600" },
  hint: { color: theme.textFaint, fontSize: 11, lineHeight: 16, marginTop: 10 },
});
