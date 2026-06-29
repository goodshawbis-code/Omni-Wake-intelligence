import { useState, useRef } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Btn from "@/src/components/Btn";
import Footer from "@/src/components/Footer";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING, RADIUS } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Mode = "text" | "audio" | "hybrid";

export default function Capture() {
  const { operator, lang } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [mode, setMode] = useState<Mode>("text");
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function toggleRecord() {
    if (recording) {
      if (recTimer.current) clearInterval(recTimer.current);
      recTimer.current = null;
      setRecording(false);
      return;
    }
    setRecording(true);
    setRecSec(0);
    setMode((m) => (m === "text" ? "audio" : "hybrid"));
    recTimer.current = setInterval(() => setRecSec((s) => s + 1), 1000);
  }

  async function submit() {
    if (!operator) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Title and body are required.");
      return;
    }
    if (recording && recTimer.current) {
      clearInterval(recTimer.current);
      recTimer.current = null;
      setRecording(false);
    }
    setSubmitting(true);
    try {
      await api.post("/thoughts", {
        operator_id: operator.operator_id,
        title: title.trim(),
        content: body.trim(),
        capture_mode: mode,
        audio_duration_sec: recSec,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      });
      setTitle("");
      setBody("");
      setTags("");
      setRecSec(0);
      setMode("text");
      Alert.alert("Ingested", t("captureSuccess", lang));
    } catch (e) {
      Alert.alert("Ingest failed", String(e).slice(0, 200));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.shell} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          testID="capture-screen"
        >
          <Text style={styles.tag}>{t("captureTag", lang)}</Text>
          <Text style={styles.title}>{t("captureTitle", lang)}</Text>
          <Text style={styles.subtitle}>{t("captureSubtitle", lang)}</Text>

          <View style={styles.modeRow}>
            {(["text", "audio", "hybrid"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modePill, mode === m && styles.modePillActive]}
                testID={`capture-mode-${m}`}
              >
                <Text style={[styles.modePillTxt, mode === m && styles.modePillTxtActive]}>
                  {m === "text" && t("captureModeText", lang)}
                  {m === "audio" && t("captureModeAudio", lang)}
                  {m === "hybrid" && t("captureModeHybrid", lang)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder={t("captureTitlePlaceholder", lang)}
              placeholderTextColor={COLORS.textTertiary}
              testID="capture-title"
            />
            <Text style={[styles.label, { marginTop: SPACING.md }]}>BODY</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              style={[styles.input, styles.inputMulti]}
              placeholder={t("captureBodyPlaceholder", lang)}
              placeholderTextColor={COLORS.textTertiary}
              multiline
              textAlignVertical="top"
              testID="capture-body"
            />
            <Text style={[styles.label, { marginTop: SPACING.md }]}>TAGS</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              style={styles.input}
              placeholder={t("captureTagsPlaceholder", lang)}
              placeholderTextColor={COLORS.textTertiary}
              testID="capture-tags"
            />

            <View style={styles.recRow}>
              <Pressable
                onPress={toggleRecord}
                style={[styles.recBtn, recording && styles.recBtnActive]}
                testID="capture-record"
              >
                <Ionicons
                  name={recording ? "stop-circle" : "mic-circle"}
                  size={24}
                  color={recording ? COLORS.danger : COLORS.primary}
                />
                <Text style={[styles.recBtnTxt, recording && { color: COLORS.danger }]}>
                  {recording ? t("captureStop", lang) : t("captureRecord", lang)}
                </Text>
              </Pressable>
              <Text style={styles.recHint}>
                {recording ? `${recSec.toString().padStart(2, "0")}s` : t("captureRecHint", lang)}
              </Text>
            </View>

            <View style={{ marginTop: SPACING.lg }}>
              <Btn
                label={submitting ? "…" : t("captureSubmit", lang)}
                onPress={submit}
                disabled={submitting}
                testID="capture-submit"
              />
            </View>
          </View>

          <Footer />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  tag: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },
  modeRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
  },
  modePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  modePillTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  modePillTxtActive: { color: COLORS.primary },
  card: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  label: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
  },
  input: {
    marginTop: 6,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
  },
  inputMulti: { minHeight: 140 },
  recRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  recBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  recBtnActive: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerDim },
  recBtnTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  recHint: { color: COLORS.textTertiary, fontSize: 11, flex: 1 },
});
