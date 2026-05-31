import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, SPACING } from "@/src/theme/colors";
import {
  reportError,
  KernelReport,
  KernelAnalysis,
} from "@/src/kernel/reporter";

type Props = {
  children: React.ReactNode;
  getUserId?: () => string | null;
  onReset?: () => void;
};

type State = {
  error: Error | null;
  componentStack: string;
  report: KernelReport | null;
  analyzing: boolean;
};

/**
 * Tactical error boundary — catches any render-time crash inside its subtree,
 * ships the trace to the Evolutionary Kernel, and renders a recoverable
 * "SYSTEM ANOMALY DETECTED" screen so the user is never stranded.
 */
export class EvolutionaryErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
    componentStack: "",
    report: null,
    analyzing: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ componentStack: info.componentStack, analyzing: true });
    reportError({
      user_id: this.props.getUserId?.() ?? null,
      error,
      component_stack: info.componentStack,
      route: "react.errorBoundary",
    })
      .then((report) => this.setState({ report, analyzing: false }))
      .catch(() => this.setState({ analyzing: false }));
  }

  reset = () => {
    this.setState({ error: null, componentStack: "", report: null, analyzing: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const { error, report, analyzing, componentStack } = this.state;
    const analysis: KernelAnalysis | null = report?.analysis ?? null;
    const severity = analysis?.severity ?? "PENDING";
    const sevColor =
      severity === "CRITICAL"
        ? COLORS.danger
        : severity === "HIGH"
          ? COLORS.danger
          : severity === "MEDIUM"
            ? COLORS.warning
            : COLORS.primary;
    return (
      <ScrollView
        style={styles.shell}
        contentContainerStyle={styles.scroll}
        testID="kernel-crash-screen"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="warning" size={48} color={COLORS.warning} />
        </View>
        <Text style={styles.tag}>⬢ SYSTEM ANOMALY DETECTED</Text>
        <Text style={styles.title}>The Vault Encountered an Error</Text>
        <Text style={styles.body}>
          The Evolutionary Kernel has captured this anomaly and is triaging it.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>ERROR</Text>
          <Text style={styles.errName}>{error.name}</Text>
          <Text style={styles.errMsg} numberOfLines={6}>
            {error.message}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>AI TRIAGE</Text>
            <View style={[styles.sevPill, { borderColor: sevColor }]}>
              <Text style={[styles.sevTxt, { color: sevColor }]}>{severity}</Text>
            </View>
          </View>
          {analyzing && (
            <Text style={styles.analyzing} testID="kernel-analyzing">
              Analyzing with AI…
            </Text>
          )}
          {analysis && (
            <>
              <Text style={styles.fieldLabel}>Root Cause</Text>
              <Text style={styles.fieldValue}>{analysis.root_cause}</Text>
              <Text style={styles.fieldLabel}>Suggested Fix</Text>
              <Text style={styles.fieldValue}>{analysis.suggested_fix}</Text>
              {!!analysis.suspected_file && (
                <>
                  <Text style={styles.fieldLabel}>Suspected File</Text>
                  <Text style={styles.mono}>{analysis.suspected_file}</Text>
                </>
              )}
              <Text style={styles.fieldLabel}>
                Confidence {Math.round(analysis.confidence * 100)}%
              </Text>
            </>
          )}
          {!analyzing && !analysis && report?.analysis_status === "failed" && (
            <Text style={styles.analyzing}>
              AI triage failed: {report.analysis_error ?? "unknown"}
            </Text>
          )}
          {!analyzing && !analysis && !report && (
            <Text style={styles.analyzing}>
              Offline — trace not shipped. Restore connection to triage.
            </Text>
          )}
        </View>

        {!!componentStack && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>COMPONENT STACK</Text>
            <Text style={styles.mono} numberOfLines={10}>
              {componentStack.trim()}
            </Text>
          </View>
        )}

        <Pressable
          style={styles.btnPrimary}
          onPress={this.reset}
          testID="kernel-return-home"
        >
          <Text style={styles.btnPrimaryTxt}>RETURN TO SAFETY</Text>
        </Pressable>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
    alignItems: "stretch",
  },
  iconWrap: { alignItems: "center", marginBottom: SPACING.sm },
  tag: {
    color: COLORS.warning,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    textAlign: "center",
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: 6,
    marginTop: SPACING.md,
  },
  cardLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  errName: {
    color: COLORS.danger,
    fontFamily: "Courier",
    fontWeight: "700",
    fontSize: 13,
  },
  errMsg: { color: COLORS.textPrimary, fontSize: 12, marginTop: 2 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sevPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sevTxt: {
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  fieldLabel: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  fieldValue: { color: COLORS.textPrimary, fontSize: 12, marginTop: 2 },
  mono: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 11,
    marginTop: 2,
  },
  analyzing: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 11,
    marginTop: 6,
  },
  btnPrimary: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  btnPrimaryTxt: {
    color: COLORS.background,
    fontFamily: "Courier",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
