import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  serverUrl: "pbrf:serverUrl",
  session: "pbrf:session",
  profile: "pbrf:profile",
  driverLocation: "pbrf:driverLocation",
  onboarded: "pbrf:onboarded",
  keepSignedIn: "pbrf:keepSignedIn",
} as const;

export async function getItem(key: keyof typeof KEYS): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS[key]);
  } catch {
    return null;
  }
}

export async function setItem(key: keyof typeof KEYS, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS[key], value);
  } catch {
    // ignore
  }
}

export async function removeItem(key: keyof typeof KEYS): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS[key]);
  } catch {
    // ignore
  }
}

export async function getJson<T>(key: keyof typeof KEYS): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJson(key: keyof typeof KEYS, value: unknown): Promise<void> {
  await setItem(key, JSON.stringify(value));
}
