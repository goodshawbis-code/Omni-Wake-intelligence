import { useEffect, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api, PUBLIC_SHARE_URL } from "@/src/api/client";

type Share = {
  id: string;
  token: string;
  recipient_label: string;
  created_at: string;
  expires_at: string;
  max_views: number;
  views: number;
  destroyed: boolean;
  document_id: string;
};

const HOUR_OPTS = [1, 24, 72, 168];
const VIEW_OPTS = [1, 3, 5];

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, lang } = useApp();
  const [recipient, setRecipient] = useState("");
  const [hours, setHours] = useState(24);
  const [maxViews, setMaxViews] = useState(1);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [shares, setShares] = useState<Share[]>([]);

  async function loadHistory() {
    if (!user) return;
    const list = await api.get<Share[]>(`/share/list/${user.user_id}`);
    if (list) {
      setShares(list.filter((s) => s.document_id === id));
    }
  }

  useEffect(() => {
    loadHistory();
  }, [user, id]);

  async function create() {
    if (!user || !id) return;
    setCreating(true);
    const res = await api.post<{ token: string; expires_at: string }>(
      "/share/create",
      {
        user_id: user.user_id,
        document_id: id,
        expires_in_hours: hours,
        max_views: maxViews,
        recipient_label: recipient.trim() || "Recruiter",
      },
    );
    setCreating(false);
    if (res?.token) {
      setNewToken(res.token);
      await Clipboard.setStringAsync(PUBLIC_SHARE_URL(res.token));
      loadHistory();
    }
  }

  async function copyAgain() {
    if (newToken) {
      await Clipboard.setStringAsync(PUBLIC_SHARE_URL(newToken));
      Alert.alert(t("copied", lang));
    }
  }

  async function revoke(shareId: string) {
    Alert.alert(
      t("revoke", lang),
      "Self-destruct this link now?",
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("confirm", lang),
          style: "destructive",
          onPress: async () => {
            await api.del(`/share/${shareId}`);
            loadHistory();
          },
        },
      ],
    );
  }

  function shareStatus(s: Share): { label: string; color: string } {
    if (s.destroyed) return { label: t("destroyed", lang), color: COLORS.danger };
    const expires = new Date(s.expires_at).getTime();
    if (Date.now() > expires) return { label: t("expired", lang), color: COLORS.textTertiary };
    return { label: t("active", lang), color: COLORS.success };
  }

  return (
    <ScreenShell testID="share-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} testID="share-back">
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>{t("oneTapShare", lang).toUpperCase()}</Text>
            <LangToggle compact />
          </View>

          <View style={styles.intro}>
            <Text style={styles.tag}>⬢ SELF-DESTRUCT • SECURE LINK</Text>
            <Text style={styles.title}>{t("shareTitle", lang)}</Text>
            <Text style={styles.body}>{t("shareSub", lang)}</Text>
          </View>

          {newToken ? (
            <TacticalCard style={{ gap: SPACING.md }}>
              <View style={styles.linkBadge}>
                <Ionicons name="link" size={16} color={COLORS.primary} />
                <Text style={styles.linkBadgeTxt}>{t("yourLink", lang).toUpperCase()}</Text>
              </View>
              <View style={styles.linkBox}>
                <Text style={styles.linkTxt} numberOfLines={3} testID="generated-link">
                  {PUBLIC_SHARE_URL(newToken)}
                </Text>
              </View>
              <Text style={styles.copiedHint}>✓ {t("linkCopied", lang)}</Text>
              <Btn label={t("copy", lang)} onPress={copyAgain} testID="copy-link-btn" />
              <Btn
                label={t("done", lang)}
                variant="secondary"
                onPress={() => setNewToken(null)}
                testID="share-done-btn"
              />
            </TacticalCard>
          ) : (
            <TacticalCard style={{ gap: SPACING.md }}>
              <View>
                <Text style={styles.label}>{t("recipient", lang).toUpperCase()}</Text>
                <TextInput
                  value={recipient}
                  onChangeText={setRecipient}
                  placeholder={t("recipientPlaceholder", lang)}
                  placeholderTextColor={COLORS.textTertiary}
                  style={styles.input}
                  testID="recipient-input"
                />
              </View>
              <View>
                <Text style={styles.label}>{t("expiresIn", lang).toUpperCase()}</Text>
                <View style={styles.chipRow}>
                  {HOUR_OPTS.map((h) => (
                    <Pressable
                      key={h}
                      onPress={() => setHours(h)}
                      style={[styles.chip, hours === h && styles.chipActive]}
                      testID={`expire-${h}h`}
                    >
                      <Text
                        style={[
                          styles.chipTxt,
                          hours === h && styles.chipTxtActive,
                        ]}
                      >
                        {h < 24 ? `${h}H` : `${h / 24}D`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text style={styles.label}>{t("maxViews", lang).toUpperCase()}</Text>
                <View style={styles.chipRow}>
                  {VIEW_OPTS.map((v) => (
                    <Pressable
                      key={v}
                      onPress={() => setMaxViews(v)}
                      style={[styles.chip, maxViews === v && styles.chipActive]}
                      testID={`views-${v}`}
                    >
                      <Text
                        style={[
                          styles.chipTxt,
                          maxViews === v && styles.chipTxtActive,
                        ]}
                      >
                        {v} {v === 1 ? "VIEW" : "VIEWS"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Btn
                label={t("generateLink", lang)}
                onPress={create}
                loading={creating}
                testID="generate-link-btn"
              />
            </TacticalCard>
          )}

          {/* Share History */}
          {shares.length > 0 && (
            <>
              <Text style={styles.section}>⬢ {t("shareHistory", lang).toUpperCase()}</Text>
              {shares.map((s) => {
                const status = shareStatus(s);
                return (
                  <View key={s.id} style={styles.shareCard} testID={`share-${s.id}`}>
                    <View style={styles.shareCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shareRecipient}>
                          {s.recipient_label.toUpperCase()}
                        </Text>
                        <Text style={styles.shareMeta}>
                          {t("views", lang).toUpperCase()} {s.views}/{s.max_views}
                          {" • "}
                          {new Date(s.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.shareStatus,
                          { borderColor: status.color },
                        ]}
                      >
                        <Text style={[styles.shareStatusTxt, { color: status.color }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    {!s.destroyed && (
                      <Pressable
                        onPress={() => revoke(s.id)}
                        style={styles.revokeBtn}
                        testID={`revoke-${s.id}`}
                      >
                        <Ionicons name="close-circle" size={14} color={COLORS.danger} />
                        <Text style={styles.revokeTxt}>
                          {t("revoke", lang).toUpperCase()}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
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
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontFamily: "Courier",
    fontSize: 14,
  },
  chipRow: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  chipTxt: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  chipTxtActive: { color: COLORS.primary },
  linkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  linkBadgeTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  linkBox: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  linkTxt: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  copiedHint: {
    color: COLORS.success,
    fontFamily: "Courier",
    fontSize: 11,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  section: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
  shareCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  shareCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  shareRecipient: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  shareMeta: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    marginTop: 4,
  },
  shareStatus: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  shareStatusTxt: {
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  revokeTxt: {
    color: COLORS.danger,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
});
