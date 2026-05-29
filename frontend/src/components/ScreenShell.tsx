import { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "@/src/theme/colors";
import Footer from "./Footer";

const TACTICAL_BG =
  "https://static.prod-images.emergentagent.com/jobs/5d50ab59-b2b1-4ae9-8bd1-7d38f183a391/images/743759ae9df1eb4ae6b25eecabb00595dab7a3c8e4d273b5d9cfe73ca58672ce.png";

export default function ScreenShell({
  children,
  withFooter = true,
  tacticalBg = false,
  testID,
}: {
  children: ReactNode;
  withFooter?: boolean;
  tacticalBg?: boolean;
  testID?: string;
}) {
  const inner = (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right"]}
      testID={testID}
    >
      <StatusBar style="light" />
      <View style={styles.body}>{children}</View>
      {withFooter && <Footer />}
    </SafeAreaView>
  );

  if (tacticalBg) {
    return (
      <ImageBackground
        source={{ uri: TACTICAL_BG }}
        style={styles.bg}
        imageStyle={{ opacity: 0.18 }}
      >
        <View style={styles.bgOverlay}>{inner}</View>
      </ImageBackground>
    );
  }
  return <View style={styles.root}>{inner}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  bg: { flex: 1, backgroundColor: COLORS.background },
  bgOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.7)" },
  safe: { flex: 1 },
  body: { flex: 1 },
});
