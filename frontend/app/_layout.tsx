import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider, useApp } from "@/src/context/AppContext";
import { EvolutionaryErrorBoundary } from "@/src/components/ErrorBoundary";
import { installGlobalKernel, dropBreadcrumb } from "@/src/kernel/reporter";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

function StackWithKernel() {
  const { operator } = useApp();
  useEffect(() => {
    installGlobalKernel(() => operator?.operator_id ?? null);
    dropBreadcrumb(`app.mount op=${operator?.operator_id ?? "anonymous"}`);
  }, [operator?.operator_id]);
  return (
    <EvolutionaryErrorBoundary getUserId={() => operator?.operator_id ?? null}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#020617" },
          animation: "fade",
        }}
      />
    </EvolutionaryErrorBoundary>
  );
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StackWithKernel />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
