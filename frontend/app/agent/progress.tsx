import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Session = {
  session_id: string;
  stage: string;
  document_id?: string;
  steps: { label: string; status: "complete" | "active" | "pending" }[];
};

export default function ProgressScreen() {
  const { session, portal } = useLocalSearchParams<{
    session: string;
    portal: string;
  }>();
  const { lang } = useApp();
  const [data, setData] = useState<Session | null>(null);
  const [stage, setStage] = useState<"retrieving" | "complete">("retrieving");

  // Walk through the retrieval steps with realistic pacing, then call /complete.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let stepIdx = 4; // first pending step in our 7-step list

    async function fetchSession() {
      const s = await api.get<Session>(`/agent/session/${session}`);
      if (!cancelled && s) setData(s);
    }

    fetchSession();

    const interval = setInterval(async () => {
      if (cancelled) return;
      const s = await api.get<Session>(`/agent/session/${session}`);
      if (!s) return;
      // Locally advance the next pending step to active/complete for visual flow
      const steps = s.steps.map((st, i) => {
        if (i < stepIdx) return { ...st, status: "complete" as const };
        if (i === stepIdx) return { ...st, status: "active" as const };
        return st;
      });
      setData({ ...s, steps });
      stepIdx += 1;
      if (stepIdx >= steps.length) {
        clearInterval(interval);
        // Final transition: finalize on server
        const done = await api.post<{ document_id: string }>(
          `/agent/complete/${session}`,
        );
        if (!cancelled && done?.document_id) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  document_id: done.document_id,
                  steps: prev.steps.map((st) => ({ ...st, status: "complete" })),
                }
              : prev,
          );
          setStage("complete");
        }
      }
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  if (stage === "complete" && data?.document_id) {
    return (
      <ScreenShell tacticalBg testID="agent-complete">
        <View style={styles.completeShell}>
          <View style={styles.checkRing}>
            <Ionicons name="checkmark" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.tag}>⬢ MISSION COMPLETE</Text>
          <Text style={styles.title}>{t("retrievalComplete", lang)}</Text>
          <Text style={styles.body}>{t("documentVaulted", lang)}</Text>
          <View style={{ height: SPACING.lg }} />
          <Btn
            label={t("viewDocument", lang)}
            onPress={() => router.replace(`/document/${data.document_id}`)}
            testID="view-document-btn"
          />
          <Btn
            label={t("returnToCenter", lang)}
            variant="secondary"
            onPress={() => router.replace("/(tabs)")}
            testID="return-center-btn"
          />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell tacticalBg testID="agent-progress">
      <View style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{portal} • AGENT</Text>
          <LangToggle compact />
        </View>

        <View style={styles.intro}>
          <Text style={styles.tag}>⬢ STEP 04 / 04 • RETRIEVING</Text>
          <Text style={styles.title}>{t("agentWorking", lang)}</Text>
          <Text style={styles.body}>{t("agentWorkingSub", lang)}</Text>
        </View>

        <TacticalCard>
          <View style={styles.spinRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.spinTxt}>AI LIAISON ACTIVE</Text>
          </View>
          <View style={styles.div} />
          {data?.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  s.status === "complete" && {
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primary,
                  },
                  s.status === "active" && { borderColor: COLORS.primary },
                ]}
              >
                {s.status === "complete" && (
                  <Ionicons name="checkmark" size={10} color={COLORS.accentNavy} />
                )}
                {s.status === "active" && (
                  <View style={styles.activeDotInner} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  s.status === "pending" && { color: COLORS.textTertiary },
                  s.status === "active" && {
                    color: COLORS.primary,
                    fontWeight: "700",
                  },
                ]}
              >
                {s.label}
              </Text>
              {s.status === "complete" && (
                <Text style={styles.stepStatus}>✓ OK</Text>
              )}
              {s.status === "active" && (
                <Text style={[styles.stepStatus, { color: COLORS.primary }]}>
                  …
                </Text>
              )}
            </View>
          ))}
        </TacticalCard>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, padding: SPACING.lg, gap: SPACING.md },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 12,
    letterSpacing: 2.5,
    fontWeight: "700",
  },
  intro: { gap: SPACING.sm, marginVertical: SPACING.md },
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
    fontSize: 22,
    fontWeight: "700",
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  spinRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  spinTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 11,
  },
  div: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: 6,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.textTertiary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1,
  },
  stepStatus: {
    color: COLORS.success,
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "700",
  },
  completeShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  checkRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.1)",
  },
});
