import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { getSocket } from "../api/socket";
import { scheduleRideNotification, loadNotificationPrefs } from "../utils/notifications";
import type { Provider, Ride } from "../types";

export interface LiveLocation {
  lat: number;
  lng: number;
}

export function useRide(rideId: string | null) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLoc, setDriverLoc] = useState<LiveLocation | null>(null);
  const [sosAlert, setSosAlert] = useState(false);
  const providerIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!rideId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<Ride>(`/api/rides/${rideId}`);
      setRide(r);
      if (r.provider_id) providerIdRef.current = r.provider_id;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    providerIdRef.current = null;
    setDriverLoc(null);
    if (rideId) {
      load();
      const socket = getSocket();
      if (socket) socket.emit("ride:track", rideId);
    }
  }, [rideId, load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rideId) return;

    const onStatus = (evt: { rideId: string; status: string }) => {
      if (evt.rideId === rideId) {
        setRide((prev) => (prev ? { ...prev, status: evt.status as Ride["status"] } : prev));
        if (evt.status === "in_progress") {
          scheduleRideNotification("Your driver has arrived!", "Your ride is starting now. Please head to the pickup point.", "arrival");
        } else if (evt.status === "completed") {
          scheduleRideNotification("Ride Complete!", "You've arrived at your destination. Thank you for riding PointBreak!", "dropoff");
        } else if (evt.status === "accepted") {
          scheduleRideNotification("Driver Found!", "A driver has accepted your ride request and is on the way.", "update");
        }
      }
    };

    const onAccepted = (evt: { rideId: string; provider_id: string }) => {
      if (evt.rideId === rideId) {
        providerIdRef.current = evt.provider_id;
        setRide((prev) => (prev ? { ...prev, status: "accepted", provider_id: evt.provider_id } : prev));
      }
    };

    const onMoved = (evt: { providerId: string; lat: number; lng: number }) => {
      if (providerIdRef.current && evt.providerId === providerIdRef.current) {
        setDriverLoc({ lat: evt.lat, lng: evt.lng });
      }
    };

    const onSos = (evt: { rideId: string; sosId: string }) => {
      if (evt.rideId === rideId) {
        setSosAlert(true);
      }
    };

    socket.on("ride:status", onStatus);
    socket.on("ride:accepted", onAccepted);
    socket.on("provider:moved", onMoved);
    socket.on("sos:alert", onSos);
    return () => {
      socket.off("ride:status", onStatus);
      socket.off("ride:accepted", onAccepted);
      socket.off("provider:moved", onMoved);
      socket.off("sos:alert", onSos);
    };
  }, [rideId]);

  return { ride, setRide, loading, error, driverLoc, setDriverLoc, sosAlert, setSosAlert, reload: load };
}

export function useProvidersAround(lat: number, lng: number, mode: "land" | "sea", enabled = true) {
  const [providers, setProviders] = useState<Provider[]>([]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const rows = await api.get<Provider[]>(
        `/api/providers?mode=${mode}&lat=${lat}&lng=${lng}`,
      );
      setProviders(rows);
    } catch {
      // ignore
    }
  }, [enabled, lat, lng, mode]);

  useEffect(() => {
    refresh();
    const socket = getSocket();
    if (!socket) return;
    const onMoved = (evt: { providerId: string; lat: number; lng: number }) => {
      setProviders((prev) =>
        prev.map((p) => (p.id === evt.providerId ? { ...p, lat: evt.lat, lng: evt.lng } : p)),
      );
    };
    socket.on("provider:moved", onMoved);
    return () => {
      socket.off("provider:moved", onMoved);
    };
  }, [refresh]);

  return { providers, refresh };
}
