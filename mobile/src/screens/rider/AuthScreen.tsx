import React, { useState, useMemo } from "react";
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
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Segmented } from "../../components/Segmented";
import { api, StoredSession } from "../../api/client";
import { theme } from "../../theme";
import { detectCountry, toE164 } from "../../utils/phoneDetect";
import { BUILD_TARGET } from "../../config";

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
  const { login, keepSignedIn, setKeepSignedIn } = useAuth();
  const [tab, setTab] = useState<Tab>(BUILD_TARGET as Tab);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const detectedCountry = useMemo(() => detectCountry(phone), [phone]);

  // Driver vehicle fields
  const [vMode, setVMode] = useState<"land" | "sea">("land");
  const [vType, setVType] = useState("taxi");
  const [vName, setVName] = useState("");
  const [vPlate, setVPlate] = useState("");

  const role = BUILD_TARGET as Tab;

  const finish = (data: StoredSession) => {
    login(data, keepSignedIn);
  };

  const doLogin = async () => {
    setError(null);
    if (!phone) {
      setError("Enter your phone number.");
      return;
    }
    setLoading(true);
    setError("Connecting... first request may take 30 seconds");
    try {
      const e164 = toE164(phone, detectedCountry);
      const body: Record<string, string> = { phone: e164 };
      if (password) body.password = password;
      const data = await api.post<StoredSession>("/api/auth/login", body);
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
    setError("Connecting... first request may take 30 seconds");
    try {
      const e164 = toE164(phone, detectedCountry);
      const body: Record<string, unknown> = {
        name,
        phone: e164,
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
      const e164 = toE164(phone, detectedCountry);
      const data = await api.post<{ _dev_code?: string }>("/api/auth/otp/send", { phone: e164 });
      setOtpSent(true);
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
      const e164 = toE164(phone, detectedCountry);
      const data = await api.post<StoredSession>("/api/auth/otp/verify", {
        phone: e164,
        code: finalCode,
      });
      finish(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.brand}>
              {BUILD_TARGET === "driver" ? "PointBreak Captain" : "PointBreak Rides Fiji"}
            </Text>
            <Text style={styles.tagline}>
              {BUILD_TARGET === "driver"
                ? "Earn by driving passengers across Fiji 🧭"
                : "Ride, boat & charter across every island 🌊"}
            </Text>
          </View>

          <Text style={styles.appLabel}>
            {BUILD_TARGET === "driver" ? "🧭 Captain App" : "🚕 Passenger App"}
          </Text>

          {mode === "otp" ? (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>
                Verify {detectedCountry.flag} {detectedCountry.dial} {phone}
              </Text>
              <Input
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
                keyboardType="number-pad"
                maxLength={6}
              />
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
              <View style={styles.countryRow}>
                <Text style={styles.countryBadge}>
                  {detectedCountry.flag} {detectedCountry.dial}
                </Text>
                <Text style={styles.countryName}>{detectedCountry.name}</Text>
              </View>
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 712 3456"
                keyboardType="phone-pad"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
              />
              <Pressable
                onPress={() => setKeepSignedIn(!keepSignedIn)}
                style={styles.keepRow}
              >
                <View style={[styles.checkbox, keepSignedIn && styles.checkboxOn]}>
                  {keepSignedIn ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.keepLabel}>Keep me signed in</Text>
              </Pressable>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Log in" onPress={doLogin} loading={loading} size="lg" />
              <Pressable onPress={sendOtp} style={styles.linkBtn}>
                <Text style={styles.link}>Use phone OTP instead</Text>
              </Pressable>
              <Pressable onPress={() => setMode("signup")} style={styles.linkBtn}>
                <Text style={styles.link}>New here? Create account</Text>
              </Pressable>
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
              <View style={styles.countryRow}>
                <Text style={styles.countryBadge}>
                  {detectedCountry.flag} {detectedCountry.dial}
                </Text>
                <Text style={styles.countryName}>{detectedCountry.name}</Text>
              </View>
              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 712 3456"
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
              <Pressable
                onPress={() => setKeepSignedIn(!keepSignedIn)}
                style={styles.keepRow}
              >
                <View style={[styles.checkbox, keepSignedIn && styles.checkboxOn]}>
                  {keepSignedIn ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.keepLabel}>Keep me signed in</Text>
              </Pressable>
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
  appLabel: { color: theme.accentBright, fontSize: 13, fontWeight: "700", marginTop: 6, textAlign: "center", backgroundColor: theme.surfaceAlt, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, overflow: "hidden" },
  tagline: { color: theme.textMuted, fontSize: 13, marginTop: 6 },
  sectionLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 10,
  },
  form: { marginTop: 14 },
  error: { color: theme.danger, fontSize: 13, marginBottom: 10 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  countryBadge: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.text,
    backgroundColor: theme.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  countryName: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: "500",
  },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  link: { color: theme.accentBright, fontSize: 14, fontWeight: "600" },
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
  keepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingVertical: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.textFaint,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceAlt,
  },
  checkboxOn: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  checkMark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 15,
  },
  keepLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
