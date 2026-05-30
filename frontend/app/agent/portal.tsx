import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenShell from "@/src/components/ScreenShell";
import TacticalCard from "@/src/components/TacticalCard";
import LangToggle from "@/src/components/LangToggle";
import Btn from "@/src/components/Btn";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";
import { COLORS, SPACING } from "@/src/theme/colors";
import { api } from "@/src/api/client";

type Portal = {
  id: string;
  name: string;
  short: string;
  color: string;
  url: string;
  mfa_method: string;
  mascot: string;
  region: "US" | "INTL";
  category: string;
  accreditor: string;
  ipeds_id?: string | null;
};

type SearchResponse = { total: number; results: Portal[] };
type Meta = {
  catalog_size: number;
  categories: { id: string; label: string }[];
  regions: { id: string; label: string }[];
};

type Filter = "ALL" | "US" | "INTL";

export default function PortalSelect() {
  const { lang } = useApp();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [results, setResults] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(false);

  // Load meta + initial top schools
  useEffect(() => {
    api.get<Meta>("/agent/portals/meta").then((m) => m && setMeta(m));
    runSearch("", "ALL");
  }, []);

  // Debounce search input
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(query, filter), 220);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, filter]);

  async function runSearch(q: string, f: Filter) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (f !== "ALL") params.set("region", f);
    params.set("limit", "60");
    const res = await api.get<SearchResponse>(
      `/agent/portals/search?${params.toString()}`,
    );
    if (res) setResults(res.results);
    setLoading(false);
  }

  // Group by category for sectioned display
  const sections = useMemo(() => {
    const groups: Record<string, Portal[]> = {};
    for (const p of results) {
      (groups[p.category] ||= []).push(p);
    }
    const order = [
      "ivy_league",
      "hbcu",
      "big_ten",
      "public_flagship",
      "private_research",
      "uc_system",
      "csu_system",
      "liberal_arts",
      "study_abroad",
    ];
    return order
      .filter((k) => groups[k]?.length)
      .map((k) => ({
        key: k,
        label: meta?.categories.find((c) => c.id === k)?.label ?? k,
        items: groups[k],
      }));
  }, [results, meta]);

  return (
    <ScreenShell tacticalBg testID="portal-select">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="portal-back">
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>AI LIAISON • DEPLOY</Text>
        <LangToggle compact />
      </View>

      <View style={styles.intro}>
        <Text style={styles.tag}>⬢ STEP 01 / 04 • UNIVERSAL SEARCH</Text>
        <Text style={styles.title}>{t("universalSearch", lang)}</Text>
        <Text style={styles.body}>{t("searchHint", lang)}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.primary}
          style={{ marginHorizontal: SPACING.md }}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchPlaceholder", lang)}
          placeholderTextColor={COLORS.textTertiary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="words"
          testID="portal-search-input"
        />
        {!!query && (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={12}
            style={{ paddingRight: SPACING.md }}
            testID="portal-search-clear"
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Region filter */}
      <View style={styles.filterRow}>
        {(["ALL", "US", "INTL"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            testID={`filter-${f.toLowerCase()}`}
          >
            <Text
              style={[
                styles.filterTxt,
                filter === f && styles.filterTxtActive,
              ]}
            >
              {f === "ALL"
                ? t("filterAll", lang).toUpperCase()
                : f === "US"
                  ? t("filterUS", lang).toUpperCase()
                  : t("filterINTL", lang).toUpperCase()}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={styles.countTxt}>
          {results.length} / {meta?.catalog_size ?? "—"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingTxt}>SCANNING CATALOG…</Text>
          </View>
        )}

        {!loading && sections.length === 0 && (
          <TacticalCard testID="empty-results">
            <Text style={styles.emptyTitle}>{t("noResults", lang)}</Text>
            <Text style={styles.emptyBody}>{t("cantFind", lang)}</Text>
            <View style={{ height: SPACING.md }} />
            <Btn
              label={t("launchDiscovery", lang)}
              onPress={() => router.push("/agent/discovery")}
              testID="empty-discovery-btn"
            />
          </TacticalCard>
        )}

        {sections.map((sec) => (
          <View key={sec.key} style={{ gap: SPACING.sm }}>
            <Text style={styles.sectionLabel}>
              ⬢ {sec.label.toUpperCase()} • {sec.items.length}
            </Text>
            {sec.items.map((p) => (
              <Pressable
                key={p.id}
                onPress={() =>
                  router.push(`/agent/credentials?portal=${p.id}`)
                }
                testID={`portal-${p.id}`}
              >
                <View style={styles.row}>
                  <View
                    style={[
                      styles.crest,
                      { borderColor: p.color, backgroundColor: `${p.color}1A` },
                    ]}
                  >
                    <Text style={[styles.crestTxt, { color: p.color }]}>
                      {p.short.slice(0, 7)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {p.mascot.toUpperCase()} • {p.mfa_method.replace("_", " ").toUpperCase()}
                      {p.region === "INTL" ? " • INTL" : ""}
                    </Text>
                    <Text style={styles.url} numberOfLines={1}>
                      🔒 {p.url}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {/* Always show Discovery CTA at the bottom */}
        <View style={{ height: SPACING.md }} />
        <TacticalCard testID="discovery-cta-card">
          <View style={styles.discRow}>
            <Ionicons name="planet-outline" size={26} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.discTitle}>{t("cantFind", lang)}</Text>
              <Text style={styles.discBody}>{t("discoverySub", lang)}</Text>
            </View>
          </View>
          <View style={{ height: SPACING.sm }} />
          <Btn
            label={t("launchDiscovery", lang)}
            variant="secondary"
            onPress={() => router.push("/agent/discovery")}
            small
            testID="discovery-cta-btn"
          />
        </TacticalCard>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
          <Text style={styles.noticeTxt}>
            ZERO-KNOWLEDGE • CREDENTIALS NEVER STORED
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
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
  intro: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
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
  body: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  searchWrap: {
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.background,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: "Courier",
    fontSize: 14,
    paddingVertical: 14,
    paddingRight: SPACING.md,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  filterTxt: {
    color: COLORS.textSecondary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  filterTxtActive: { color: COLORS.primary },
  countTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  scroll: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingTxt: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2,
  },
  sectionLabel: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  crest: {
    width: 54,
    height: 54,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  crestTxt: {
    fontFamily: "Georgia",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  name: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: COLORS.primary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  url: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    marginTop: 3,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  discRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  discTitle: {
    color: COLORS.textPrimary,
    fontFamily: "Georgia",
    fontSize: 15,
    fontWeight: "700",
  },
  discBody: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: SPACING.md,
  },
  noticeTxt: {
    color: COLORS.textTertiary,
    fontFamily: "Courier",
    fontSize: 9,
    letterSpacing: 2,
  },
});
