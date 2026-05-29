import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import LangToggle from "@/src/components/LangToggle";
import Btn from "@/src/components/Btn";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Doc = {
  id: string;
  title: string;
  portal: string;
  portal_name: string;
  doc_type: string;
  student_name: string;
  gpa: string;
  credits: string;
  retrieved_at: string;
  verified_watermark: boolean;
  encrypted: boolean;
};

export default function VaultScreen() {
  const { user, lang } = useApp();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await api.get<Doc[]>(`/vault/${user.user_id}`);
    if (data) setDocs(data);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScreenShell testID="vault-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.tag}>⬢ {t("encryption", lang).toUpperCase()} AES-256-GCM</Text>
          <Text style={styles.title}>{t("vaultTitle", lang)}</Text>
          <Text style={styles.subtitle}>{t("vaultSub", lang)}</Text>
        </View>
        <LangToggle compact />
      </View>

      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="lock-closed-outline"
              size={56}
              color={COLORS.primary}
            />
            <Text style={styles.emptyText}>{t("vaultEmpty", lang)}</Text>
            <Btn
              label={t("retrieveTranscript", lang)}
              onPress={() => router.push("/agent/portal")}
              testID="empty-retrieve"
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/document/${item.id}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            testID={`vault-doc-${item.id}`}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <View style={styles.docIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {item.portal_name}
                  </Text>
                </View>
              </View>
              {item.verified_watermark && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={10}
                    color={COLORS.primary}
                  />
                  <Text style={styles.verifiedTxt}>VERIFIED</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBottom}>
              <Meta label="GPA" value={item.gpa} />
              <View style={styles.divCol} />
              <Meta label={t("credits", lang).toUpperCase()} value={item.credits} />
              <View style={styles.divCol} />
              <Meta
                label={t("retrievedOn", lang).toUpperCase()}
                value={new Date(item.retrieved_at).toLocaleDateString()}
              />
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          docs.length > 0 ? (
            <View style={{ marginTop: SPACING.lg }}>
              <Btn
                label={`+ ${t("retrieveTranscript", lang)}`}
                variant="secondary"
                onPress={() => router.push("/agent/portal")}
                testID="vault-retrieve-more"
              />
            </View>
          ) : null
        }
      />
    </ScreenShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tag: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: 0,
    gap: SPACING.md,
    flexGrow: 1,
  },
  empty: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
    gap: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 15,
    fontWeight: "700",
  },
  cardSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: "Courier",
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: COLORS.primaryDim,
  },
  verifiedTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  cardBottom: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  meta: { flex: 1, gap: 2 },
  metaLabel: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 13,
    fontWeight: "700",
  },
  divCol: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
});
