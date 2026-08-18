import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

export interface GeoPoint {
  lat: number;
  lng: number;
  name: string;
}

const FALLBACK: GeoPoint = { lat: -17.8018, lng: 177.4534, name: "Nadi Town" };

export function useCurrentLocation() {
  const [loc, setLoc] = useState<GeoPoint | null>(null);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");

  const refresh = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setPermission(perm.granted ? "granted" : "denied");
      if (!perm.granted) return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: "Current location",
      });
    } catch {
      setLoc(FALLBACK);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loc: loc ?? FALLBACK, permission, refresh };
}
