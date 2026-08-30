import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TabBar, TabItem } from "../../components/TabBar";
import { DriverHomeScreen } from "./DriverHomeScreen";
import { DriverEarningsScreen } from "./DriverEarningsScreen";
import { BookingCalendarScreen } from "./BookingCalendarScreen";
import { DriverProfileScreen } from "./DriverProfileScreen";

const TABS: TabItem[] = [
  { key: "home", icon: "🧭", label: "Work" },
  { key: "bookings", icon: "📅", label: "Bookings" },
  { key: "earnings", icon: "💰", label: "Earnings" },
  { key: "profile", icon: "👤", label: "Profile" },
];

export function DriverTabs() {
  const [tab, setTab] = useState("home");

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === "home" ? <DriverHomeScreen /> : null}
        {tab === "bookings" ? <BookingCalendarScreen /> : null}
        {tab === "earnings" ? <DriverEarningsScreen /> : null}
        {tab === "profile" ? <DriverProfileScreen /> : null}
      </View>
      <TabBar items={TABS} active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07141F" },
  content: { flex: 1 },
});
