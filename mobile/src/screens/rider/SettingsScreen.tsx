import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useServer } from "../../context/ServerContext";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { getBaseUrl } from "../../api/client";
import { theme } from "../../theme";
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  requestNotificationPermission,
  NotificationPrefs,
} from "../../utils/notifications";

export function SettingsScreen() {
  const { connected, checking, setServerUrl, resetServer } = useServer();
  const [url, setUrl] = useState(getBaseUrl());
  const [notiPrefs, setNotiPrefs] = useState<NotificationPrefs>({
    rideArrival: true,
    rideDropoff: true,
    rideUpdates: true,
    sound: true,
  });

  useEffect(() => {
    loadNotificationPrefs().then(setNotiPrefs);
  }, []);

  const togglePref = async (key: keyof NotificationPrefs) => {
    const next = { ...notiPrefs, [key]: !notiPrefs[key] };
    setNotiPrefs(next);
    await saveNotificationPrefs(next);
    if (next.rideArrival || next.rideDropoff || next.rideUpdates) {
      await requestNotificationPermission();
    }
  };

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
      <ScrollView contentContainerStyle={styles.body}>
        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionDesc}>Choose what alerts you receive during rides</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Driver Arrived</Text>
            <Text style={styles.toggleDesc}>Notify when driver reaches pickup</Text>
          </View>
          <Switch
            value={notiPrefs.rideArrival}
            onValueChange={() => togglePref("rideArrival")}
            trackColor={{ false: theme.surfaceAlt, true: theme.accentDeep }}
            thumbColor={notiPrefs.rideArrival ? theme.accent : theme.textFaint}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Ride Dropped Off</Text>
            <Text style={styles.toggleDesc}>Notify when you reach destination</Text>
          </View>
          <Switch
            value={notiPrefs.rideDropoff}
            onValueChange={() => togglePref("rideDropoff")}
            trackColor={{ false: theme.surfaceAlt, true: theme.accentDeep }}
            thumbColor={notiPrefs.rideDropoff ? theme.accent : theme.textFaint}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Ride Updates</Text>
            <Text style={styles.toggleDesc}>Driver assigned, ride started, etc.</Text>
          </View>
          <Switch
            value={notiPrefs.rideUpdates}
            onValueChange={() => togglePref("rideUpdates")}
            trackColor={{ false: theme.surfaceAlt, true: theme.accentDeep }}
            thumbColor={notiPrefs.rideUpdates ? theme.accent : theme.textFaint}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Notification Sound</Text>
            <Text style={styles.toggleDesc}>Play sound with notifications</Text>
          </View>
          <Switch
            value={notiPrefs.sound}
            onValueChange={() => togglePref("sound")}
            trackColor={{ false: theme.surfaceAlt, true: theme.accentDeep }}
            thumbColor={notiPrefs.sound ? theme.accent : theme.textFaint}
          />
        </View>

        {/* Server */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Server</Text>
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
          placeholder="https://your-server.ngrok-free.dev"
        />
        <Button title="Save & reconnect" onPress={save} loading={checking} />
        <Text style={styles.hint}>
          The app auto-discovers the server on startup. You can override it here if needed.
        </Text>
        <Button title="Reset app" onPress={reset} variant="danger" style={{ marginTop: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  sectionTitle: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 8,
  },
  sectionDesc: { color: theme.textFaint, fontSize: 12, marginBottom: 16 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { color: theme.text, fontSize: 15, fontWeight: "600" },
  toggleDesc: { color: theme.textFaint, fontSize: 12, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOn: { backgroundColor: theme.success },
  dotOff: { backgroundColor: theme.danger },
  status: { color: theme.textMuted, fontSize: 14, fontWeight: "600" },
  hint: { color: theme.textFaint, fontSize: 11, lineHeight: 16, marginTop: 10 },
});
