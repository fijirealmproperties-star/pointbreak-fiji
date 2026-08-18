import React, { useEffect, useState, useCallback } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { EmptyState } from "../../components/EmptyState";
import { theme } from "../../theme";
import type { Transaction, Wallet } from "../../types";
import { fjd, timeAgo } from "../../utils";

const TOPUPS = [10, 20, 50, 100];

export function WalletScreen() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("20");
  const [topuping, setTopuping] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, t] = await Promise.all([
        api.get<Wallet>("/api/wallet"),
        api.get<Transaction[]>("/api/wallet/transactions?limit=30"),
      ]);
      setWallet(w);
      setTxs(t);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const topup = async (value: string) => {
    setTopuping(true);
    try {
      const res = await api.post<{ balance: number; transactionId: string }>("/api/wallet/topup", {
        amount: +value,
      });
      setWallet((w) => (w ? { ...w, balance: res.balance } : w));
      Alert.alert("Top-up complete", `Added ${fjd(+value)} via mPaisa.`);
      load();
    } catch (e) {
      Alert.alert("Top-up failed", (e as Error).message);
    } finally {
      setTopuping(false);
    }
  };

  return (
    <Screen>
      <Header title="Wallet" showBack />
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>mPaisa wallet balance</Text>
        <Text style={styles.balance}>{fjd(wallet?.balance)}</Text>
        <Text style={styles.balanceCurrency}>Fijian Dollars (FJD)</Text>
      </View>

      <Text style={styles.sectionLabel}>Top up</Text>
      <View style={styles.chips}>
        {TOPUPS.map((t) => (
          <Button
            key={t}
            title={fjd(t)}
            size="sm"
            variant={amount === String(t) ? "gold" : "outline"}
            onPress={() => setAmount(String(t))}
          />
        ))}
      </View>
      <Input
        value={amount}
        onChangeText={setAmount}
        placeholder="Custom amount"
        keyboardType="numeric"
      />
      <Button
        title="Top up with mPaisa"
        onPress={() => topup(amount)}
        loading={topuping}
        size="lg"
      />

      <Text style={styles.sectionLabel}>Transactions</Text>
      {txs.length === 0 ? (
        <EmptyState icon="👛" title="No transactions yet" subtitle="Top up your wallet to get started." />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.tx}>
              <View style={styles.txLeft}>
                <Text style={styles.txType}>
                  {item.type === "top_up" ? "💰 Top-up" : item.type === "ride_payment" ? "🚕 Ride payment" : item.type}
                </Text>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {item.description || item.id}
                </Text>
                <Text style={styles.txTime}>{timeAgo(item.created_at)}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, item.amount < 0 ? styles.amountOut : styles.amountIn]}>
                  {item.amount > 0 ? "+" : ""}
                  {fjd(item.amount)}
                </Text>
                <Text style={styles.txBalance}>bal {fjd(item.balance_after)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    marginHorizontal: 16,
    backgroundColor: theme.accentSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.accent,
    padding: 22,
    alignItems: "center",
    marginTop: 6,
  },
  balanceLabel: { color: theme.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  balance: { color: theme.text, fontSize: 40, fontWeight: "900", marginTop: 6 },
  balanceCurrency: { color: theme.textFaint, fontSize: 12, marginTop: 2 },
  sectionLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  chips: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginBottom: 10, flexWrap: "wrap" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  tx: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 8,
  },
  txLeft: { flex: 1 },
  txType: { color: theme.text, fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
  txDesc: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  txTime: { color: theme.textFaint, fontSize: 10, marginTop: 2 },
  txRight: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "800" },
  amountIn: { color: theme.success },
  amountOut: { color: theme.danger },
  txBalance: { color: theme.textFaint, fontSize: 10, marginTop: 3 },
});
