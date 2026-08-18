import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { Header } from "../../components/Header";
import { theme } from "../../theme";

interface Msg {
  id: string;
  role: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "Best seafood near Nadi?",
  "What's the weather like today?",
  "Nearest hospital?",
  "How to get around Fiji?",
  "Fijian customs & etiquette?",
];

export function GuideScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Bula! 🤙 I'm your PointBreak guide. Ask me about food, attractions, transport, weather, or Fijian customs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text: msg };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const res = await api.post<{ response: string }>("/api/ai/chat", { message: msg });
      setMessages((m) => [...m, { id: `b-${Date.now()}`, role: "bot", text: res.response }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `b-${Date.now()}`, role: "bot", text: "Vinaka for asking — I couldn't reach the guide service. Try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Header title="Bula Bot guide" subtitle="Food, culture & island tips" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.flex}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <View key={s} style={styles.chipWrap}>
                  <Text
                    style={styles.chip}
                    onPress={() => send(s)}
                  >
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.botBubble]}>
              <Text style={item.role === "user" ? styles.userText : styles.botText}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about Fiji..."
            placeholderTextColor={theme.textFaint}
            style={styles.input}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
          />
          <View style={styles.sendBtn}>
            <Text style={styles.sendText} onPress={() => send()}>
              ➤
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chipWrap: { backgroundColor: theme.accentSoft, borderRadius: 999, borderWidth: 1, borderColor: theme.accent },
  chip: { color: theme.accentBright, fontSize: 12, paddingHorizontal: 12, paddingVertical: 7, fontWeight: "600" },
  bubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    maxWidth: "88%",
  },
  botBubble: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignSelf: "flex-start" },
  userBubble: { backgroundColor: theme.accentDeep, alignSelf: "flex-end" },
  botText: { color: theme.text, fontSize: 14, lineHeight: 20 },
  userText: { color: "#fff", fontSize: 14, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 110,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.accentDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
