import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TabBar, TabItem } from "../../components/TabBar";
import { HomeScreen } from "./HomeScreen";
import { HistoryScreen } from "./HistoryScreen";
import { GuideScreen } from "./GuideScreen";
import { ProfileScreen } from "./ProfileScreen";

const TABS: TabItem[] = [
  { key: "home", icon: "🏝️", label: "Home" },
  { key: "history", icon: "🗺️", label: "Trips" },
  { key: "guide", icon: "🤙", label: "Guide" },
  { key: "profile", icon: "👤", label: "Profile" },
];

export function RiderTabs() {
  const [tab, setTab] = useState("home");

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === "home" ? <HomeScreen /> : null}
        {tab === "history" ? <HistoryScreen /> : null}
        {tab === "guide" ? <GuideScreen /> : null}
        {tab === "profile" ? <ProfileScreen /> : null}
      </View>
      <TabBar items={TABS} active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07141F" },
  content: { flex: 1 },
});
