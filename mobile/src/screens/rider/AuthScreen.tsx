import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useServer } from "../../context/ServerContext";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Segmented } from "../../components/Segmented";
import { api, StoredSession } from "../../api/client";
import { theme } from "../../theme";
import { getBaseUrl } from "../../api/client";
import { setItem } from "../../storage";

type Tab = "rider" | "driver";
type Mode = "login" | "signup" | "otp";

const VEHICLE_TYPES = {
  land: [
    { value: "bula", label: "🚙 Bula Ride" },
    { value: "taxi", label: "🚕 Island Taxi" },
    { value: "suv", label: "🚐 Resort Transfer" },
    { value: "bula_bus", label: "🚌 Bula Bus" },
  ],
  sea: [
    { value: "water_taxi", label: "🚤 Water Taxi" },
    { value: "ferry", label: "⛴️ Island Ferry" },
    { value: "charter", label: "🛥️ Island Charter" },
    { value: "catamaran", label: "⛵ Pacific Catamaran" },
  ],
} as const;

export function AuthScreen() {
  const { login } = useAuth();
  const { configured, connected, setServerUrl } = useServer();
  const [tab, setTab] = useState<Tab>("rider");
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverInput, setServerInput] = useState(getBaseUrl());
  const [showServer, setShowServer] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState("");

  // Driver vehicle fields
  const [vMode, setVMode] = useState<"land" | "sea">("land");
  const [vType, setVType] = useState("taxi");
  const [vName, setVName] = useState("");
  const [vPlate, setVPlate] = useState("");

  const role = tab;

  const finish = (data: StoredSession) => {
    login(data);
  };

  const doLogin = async () => {
    setError(null);
    if (!phone || !password) {
      setError("Enter your phone number and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<StoredSession>("/api/auth/login", {
        phone,
        password,
      });
      finish(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doSignup = async () => {
    setError(null);
    if (!name || !phone) {
      setError("Name and phone number are required.");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name,
        phone,
        email: email || undefined,
        password: password || undefined,
        role,
      };
      if (role === "driver") {
        body.mode = vMode;
        body.vehicle_type = vType;
        body.vehicle_name = vName || undefined;
        body.vehicle_plate = vPlate || undefined;
      }
      const data = await api.post<StoredSession>("/api/auth/signup", body);
      finish(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setError(null);
    if (!phone) {
      setError("Enter your phone number first.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<{ _dev_code?: string }>("/api/auth/otp/send", { phone });
      setOtpSent(true);
      setDevCode(data._dev_code ?? "");
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (overrideCode?: string) => {
    setError(null);
    const finalCode = overrideCode ?? code;
    if (!phone || !finalCode) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<StoredSession>("/api/auth/otp/verify", {
        phone,
        code: finalCode,
      });
      finish(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoPhone: string) => {
    setError(null);
    setPhone(demoPhone);
    setLoading(true);
    try {
      const data = await api.post<StoredSession>("/api/auth/otp/verify", {
        phone: demoPhone,
        code: "123456",
      });
      finish(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveServer = async () => {
    setError(null);
    setLoading(true);
    const ok = await setServerUrl(serverInput);
    if (!ok) setError("Could not reach server at that URL. Check it's running and the IP is correct.");
    setLoading(false);
  };

  const resetMode = () => {
    setMode("login");
    setOtpSent(false);
    setCode("");
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🏄</Text>
            </View>
            <Text style={styles.brand}>PointBreak Rides Fiji</Text>
            <Text style={styles.tagline}>
              Ride, boat & charter across every island 🌊
            </Text>
            <Pressable onPress={() => setShowServer((s) => !s)} hitSlop={10}>
              <Text style={styles.serverHint}>
                {configured && connected ? `● Connected to ${getBaseUrl()}` : "○ Configure server"}
              </Text>
            </Pressable>
          </View>

          {showServer ? (
            <View style={styles.serverCard}>
              <Text style={styles.sectionLabel}>Server address</Text>
              <Input
                value={serverInput}
                onChangeText={setServerInput}
                placeholder="http://192.168.1.50:3001"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button title="Save & connect" onPress={saveServer} loading={loading} />
              <Text style={styles.hintText}>
                Use your computer's LAN IP so your phone can reach the API. Android
                emulator: 10.0.2.2
              </Text>
            </View>
          ) : null}

          <Segmented
            options={[
              { value: "rider", label: "🚕 Rider" },
              { value: "driver", label: "🧭 Driver" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              resetMode();
            }}
          />

          {mode === "otp" ? (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>
                Verify {phone}
              </Text>
              <Input
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
                keyboardType="number-pad"
                maxLength={6}
              />
              {devCode ? (
                <Pressable onPress={() => verifyOtp(devCode)} style={styles.devCode}>
                  <Text style={styles.devCodeText}>
                    Dev code: {devCode} — tap to auto-verify
                  </Text>
                </Pressable>
              ) : null}
              <Button
                title="Verify & continue"
                onPress={() => verifyOtp()}
                loading={loading}
              />
              <Pressable onPress={() => setMode("login")} style={styles.linkBtn}>
                <Text style={styles.link}>← Back</Text>
              </Pressable>
            </View>
          ) : mode === "login" ? (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>Welcome back</Text>
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+679 000 0000"
                keyboardType="phone-pad"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Log in" onPress={doLogin} loading={loading} size="lg" />
              <Pressable onPress={sendOtp} style={styles.linkBtn}>
                <Text style={styles.link}>Use phone OTP instead</Text>
              </Pressable>
              <Pressable onPress={() => setMode("signup")} style={styles.linkBtn}>
                <Text style={styles.link}>New here? Create account</Text>
              </Pressable>
              {tab === "rider" ? (
                <Pressable onPress={() => demoLogin("+6799990001")} style={styles.demoBtn}>
                  <Text style={styles.demoText}>⚡ Demo rider login (no password)</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => demoLogin("+6799990002")} style={styles.demoBtn}>
                  <Text style={styles.demoText}>⚡ Demo driver login (no password)</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>
                Create {tab === "driver" ? "driver" : "rider"} account
              </Text>
              <Input
                label="Full name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sera Naidu"
              />
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+679 000 0000"
                keyboardType="phone-pad"
              />
              <Input
                label="Email (optional)"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.fj"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password (optional for OTP)"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
              />
              {tab === "driver" ? (
                <>
                  <Text style={styles.sectionLabel}>Your vehicle</Text>
                  <Segmented
                    options={[
                      { value: "land", label: "🚗 Land" },
                      { value: "sea", label: "🚤 Sea" },
                    ]}
                    value={vMode}
                    onChange={(v) => {
                      setVMode(v);
                      setVType(v === "sea" ? "water_taxi" : "taxi");
                    }}
                  />
                  <View style={styles.chips}>
                    {VEHICLE_TYPES[vMode].map((t) => (
                      <Pressable
                        key={t.value}
                        onPress={() => setVType(t.value)}
                        style={[styles.chip, vType === t.value && styles.chipActive]}
                      >
                        <Text
                          style={[styles.chipText, vType === t.value && styles.chipTextActive]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Input
                    label="Vehicle name"
                    value={vName}
                    onChangeText={setVName}
                    placeholder="e.g. Toyota Hilux"
                  />
                  <Input
                    label="Plate number (optional)"
                    value={vPlate}
                    onChangeText={setVPlate}
                    placeholder="e.g. LT 1234"
                    autoCapitalize="characters"
                  />
                </>
              ) : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Create account" onPress={doSignup} loading={loading} size="lg" />
              <Pressable onPress={() => setMode("login")} style={styles.linkBtn}>
                <Text style={styles.link}>← Back to login</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.footer}>
            Safe rides · mPaisa & cash · 24/7 Bula support
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  hero: { alignItems: "center", paddingTop: 28, paddingBottom: 22 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: theme.accentSoft,
    borderWidth: 1,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 40 },
  brand: { color: theme.text, fontSize: 24, fontWeight: "900", letterSpacing: 0.3 },
  tagline: { color: theme.textMuted, fontSize: 13, marginTop: 6 },
  serverHint: { color: theme.accentBright, fontSize: 12, marginTop: 14, fontWeight: "600" },
  serverCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 18,
  },
  hintText: { color: theme.textFaint, fontSize: 11, marginTop: 8, lineHeight: 16 },
  sectionLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 10,
  },
  form: { marginTop: 14 },
  error: { color: theme.danger, fontSize: 13, marginBottom: 10 },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  link: { color: theme.accentBright, fontSize: 14, fontWeight: "600" },
  demoBtn: {
    marginTop: 6,
    backgroundColor: theme.successSoft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  demoText: { color: theme.success, fontSize: 13, fontWeight: "700" },
  devCode: {
    backgroundColor: theme.warningSoft,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  devCodeText: { color: theme.warning, fontSize: 13, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: theme.accentDeep, borderColor: theme.accent },
  chipText: { color: theme.textMuted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  footer: { textAlign: "center", color: theme.textFaint, fontSize: 11, marginTop: 24 },
});
