import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/theme/colors";
import { useApp } from "@/src/context/AppContext";
import { t } from "@/src/i18n/translations";

export default function TabsLayout() {
  const { lang } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingTop: 6,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontFamily: "Courier",
          fontSize: 10,
          letterSpacing: 1.5,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="capture"
        options={{
          title: t("tabCapture", lang).toUpperCase(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="blueprints"
        options={{
          title: t("tabBlueprints", lang).toUpperCase(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-stacked-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="custody"
        options={{
          title: t("tabCustody", lang).toUpperCase(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabSettings", lang).toUpperCase(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
