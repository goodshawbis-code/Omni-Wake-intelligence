import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import Btn from "@/src/components/Btn";
import LangToggle from "@/src/components/LangToggle";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

const PAPER_BG =
  "https://static.prod-images.emergentagent.com/jobs/5d50ab59-b2b1-4ae9-8bd1-7d38f183a391/images/526e39afe9744f89f6c503dff2d941de6f19e4ba12ba585b7beee1f7f33d81db.png";
const GOLD_SEAL =
  "https://static.prod-images.emergentagent.com/jobs/5d50ab59-b2b1-4ae9-8bd1-7d38f183a391/images/3a7a5fe1dc994fc9d457cebe840cc70f7999afd619f94d15e916df116376a787.png";

type Doc = {
  id: string;
  title: string;
  portal_name: string;
  doc_type: string;
  student_name: string;
  gpa: string;
  credits: string;
  institution: string;
  retrieved_at: string;
  verified_watermark: boolean;
  content_lines: string[];
};

export default function DocumentViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useApp();
  const [doc, setDoc] = useState<Doc | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const d = await api.get<Doc>(`/vault/document/${id}`);
    if (d) setDoc(d);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDelete() {
    if (!id) return;
    Alert.alert(
      t("delete", lang),
      doc?.title || "",
      [
        { text: t("cancel", lang), style: "cancel" },
        {
          text: t("confirm", lang),
          style: "destructive",
          onPress: async () => {
            await api.del(`/vault/document/${id}`);
            router.back();
          },
        },
      ],
    );
  }

  if (!doc) {
    return (
      <ScreenShell testID="document-loading">
        <View style={styles.loading}>
          <Text style={styles.loadingTxt}>DECRYPTING…</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell testID="document-viewer">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="doc-back">
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.topTitle}>{t("documentViewer", lang)}</Text>
        <LangToggle compact />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Document paper with watermark */}
        <ImageBackground
          source={{ uri: PAPER_BG }}
          style={styles.paper}
          imageStyle={styles.paperBg}
        >
          {/* Watermark overlay */}
          {doc.verified_watermark && (
            <View style={styles.watermark} pointerEvents="none">
              <Image source={{ uri: GOLD_SEAL }} style={styles.watermarkSeal} />
              <Text style={styles.watermarkText}>VERIFIED STUDENT</Text>
              <Text style={styles.watermarkSub}>ID.ME • TIER-1</Text>
            </View>
          )}

          <View style={styles.paperHeader}>
            <Text style={styles.paperInstitution}>
              {doc.institution.toUpperCase()}
            </Text>
            <Text style={styles.paperDocType}>{doc.doc_type}</Text>
            <View style={styles.paperDivider} />
            <View style={styles.paperRow}>
              <Text style={styles.paperLabel}>STUDENT</Text>
              <Text style={styles.paperVal}>{doc.student_name.toUpperCase()}</Text>
            </View>
            <View style={styles.paperRow}>
              <Text style={styles.paperLabel}>GPA</Text>
              <Text style={styles.paperVal}>{doc.gpa}</Text>
              <Text style={styles.paperLabel}>CREDITS</Text>
              <Text style={styles.paperVal}>{doc.credits}</Text>
            </View>
            <View style={styles.paperDivider} />
          </View>

          <View style={styles.transcriptBody}>
            {doc.content_lines.map((line, idx) => {
              const isHeader = line.includes("Semester GPA") || line.includes("Term GPA");
              return (
                <Text
                  key={idx}
                  style={[
                    styles.transcriptLine,
                    isHeader && styles.transcriptHeader,
                  ]}
                >
                  {line}
                </Text>
              );
            })}
          </View>

          <View style={styles.paperFooter}>
            <View style={styles.paperDivider} />
            <Text style={styles.paperFooterTxt}>
              RETRIEVED {new Date(doc.retrieved_at).toLocaleString().toUpperCase()}
            </Text>
            <Text style={styles.paperFooterTxt}>
              DOC ID: {doc.id.toUpperCase()}
            </Text>
            <Text style={styles.paperFooterTxt}>
              UNOFFICIAL • FOR RECIPIENT REVIEW ONLY
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.actionRow}>
          <Btn
            label={t("oneTapShare", lang)}
            onPress={() => router.push(`/share/${doc.id}`)}
            style={{ flex: 1 }}
            testID="one-tap-share-btn"
          />
        </View>

        <View style={styles.actionRow}>
          <Btn
            label={t("delete", lang)}
            variant="danger"
            onPress={handleDelete}
            style={{ flex: 1 }}
            small
            testID="delete-doc-btn"
          />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    letterSpacing: 3,
  },
  topBar: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 12,
    letterSpacing: 2.5,
    fontWeight: "700",
  },
  scroll: {
    padding: SPACING.lg,
    paddingTop: 0,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  paper: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#0E1A2F",
    padding: SPACING.lg,
    position: "relative",
    overflow: "hidden",
    minHeight: 520,
  },
  paperBg: {
    opacity: 0.12,
    resizeMode: "cover",
  },
  watermark: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-22deg" }],
    opacity: 0.18,
  },
  watermarkSeal: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  watermarkText: {
    color: COLORS.primary,
    fontFamily: "Georgia",
    fontWeight: "900",
    fontSize: 28,
    letterSpacing: 4,
    marginTop: -SPACING.lg,
  },
  watermarkSub: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: "700",
  },
  paperHeader: { gap: SPACING.sm },
  paperInstitution: {
    color: COLORS.primary,
    fontFamily: "Georgia",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  paperDocType: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  paperDivider: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.5,
    marginVertical: SPACING.sm,
  },
  paperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flexWrap: "wrap",
  },
  paperLabel: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "700",
  },
  paperVal: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  transcriptBody: { gap: 4, marginTop: SPACING.sm },
  transcriptLine: {
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  transcriptHeader: {
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: SPACING.sm,
    letterSpacing: 1,
  },
  paperFooter: { marginTop: SPACING.md, gap: 4 },
  paperFooterTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  actionRow: { flexDirection: "row" },
});
