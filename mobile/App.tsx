import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ServerProvider } from "./src/context/ServerContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { Loading } from "./src/components/Loading";
import { theme } from "./src/theme";
import { loadNotificationPrefs, requestNotificationPermission } from "./src/utils/notifications";
import { BUILD_TARGET } from "./src/config";
import type { RootStackParamList } from "./src/navigation";

import { AuthScreen } from "./src/screens/rider/AuthScreen";
import { RiderTabs } from "./src/screens/rider/RiderTabs";
import { DriverTabs } from "./src/screens/driver/DriverTabs";
import { RideOptionsScreen } from "./src/screens/rider/RideOptionsScreen";
import { RequestingScreen } from "./src/screens/rider/RequestingScreen";
import { ActiveRideScreen } from "./src/screens/rider/ActiveRideScreen";
import { RideCompleteScreen } from "./src/screens/rider/RideCompleteScreen";
import { HistoryScreen } from "./src/screens/rider/HistoryScreen";
import { ProfileScreen } from "./src/screens/rider/ProfileScreen";
import { WalletScreen } from "./src/screens/rider/WalletScreen";
import { GuideScreen } from "./src/screens/rider/GuideScreen";
import { SettingsScreen } from "./src/screens/rider/SettingsScreen";
import { DriverRideScreen } from "./src/screens/driver/DriverRideScreen";
import { DriverEarningsScreen } from "./src/screens/driver/DriverEarningsScreen";
import { BookingCalendarScreen } from "./src/screens/driver/BookingCalendarScreen";
import { DriverProfileScreen } from "./src/screens/driver/DriverProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: theme.bg,
    card: theme.surface,
    text: theme.text,
    border: theme.border,
    primary: theme.accent,
  },
};

function Root() {
  const { user, loading } = useAuth();
  const navRef = useRef<any>(null);
  const prevUser = useRef(user);

  useEffect(() => {
    loadNotificationPrefs().then(() => requestNotificationPermission());
  }, []);

  useEffect(() => {
    if (!navRef.current) return;

    if (prevUser.current && !user) {
      navRef.current.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } else if (!prevUser.current && user) {
      const route: keyof RootStackParamList = BUILD_TARGET === "driver" ? "DriverTabs" : "RiderTabs";
      navRef.current.reset({
        index: 0,
        routes: [{ name: route }],
      });
    }
    prevUser.current = user;
  }, [user]);

  if (loading) return <Loading label="PointBreak Rides Fiji" />;

  const initialRoute: keyof RootStackParamList = user
    ? BUILD_TARGET === "driver"
      ? "DriverTabs"
      : "RiderTabs"
    : "Auth";

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        {BUILD_TARGET === "rider" && (
          <>
            <Stack.Screen name="RiderTabs" component={RiderTabs} options={{ gestureEnabled: false }} />
            <Stack.Screen name="RideOptions" component={RideOptionsScreen} />
            <Stack.Screen name="Requesting" component={RequestingScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="ActiveRide" component={ActiveRideScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="RideComplete" component={RideCompleteScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Guide" component={GuideScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
        {BUILD_TARGET === "driver" && (
          <>
            <Stack.Screen name="DriverTabs" component={DriverTabs} options={{ gestureEnabled: false }} />
            <Stack.Screen name="DriverRide" component={DriverRideScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
            <Stack.Screen name="DriverBookings" component={BookingCalendarScreen} />
            <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ServerProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Root />
        </AuthProvider>
      </ServerProvider>
    </SafeAreaProvider>
  );
}
