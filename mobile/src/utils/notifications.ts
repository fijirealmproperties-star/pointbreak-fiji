import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_PREFS_KEY = "pb_notification_prefs";

export interface NotificationPrefs {
  rideArrival: boolean;
  rideDropoff: boolean;
  rideUpdates: boolean;
  sound: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  rideArrival: true,
  rideDropoff: true,
  rideUpdates: true,
  sound: true,
};

let prefs: NotificationPrefs = { ...DEFAULT_PREFS };

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) {
      prefs = { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...prefs };
}

export async function saveNotificationPrefs(p: NotificationPrefs): Promise<void> {
  prefs = { ...p };
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export function getNotificationPrefs(): NotificationPrefs {
  return { ...prefs };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleRideNotification(
  title: string,
  body: string,
  type: "arrival" | "dropoff" | "update"
): Promise<void> {
  const enabled =
    (type === "arrival" && prefs.rideArrival) ||
    (type === "dropoff" && prefs.rideDropoff) ||
    (type === "update" && prefs.rideUpdates);

  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: prefs.sound,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
