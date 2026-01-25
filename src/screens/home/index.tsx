import { Image } from "expo-image";
import { Platform, Pressable, StyleSheet } from "react-native";

import { HelloWave } from "@/src/components/hello-wave";
import ParallaxScrollView from "@/src/components/parallax-scroll-view";
import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";

export function HomeScreen() {
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleGoToDetails = () => {
    navigateToScreen("home", "home-details");
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">
            src/screens/home/index.tsx
          </ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Navegar a otra pantalla</ThemedText>
        <ThemedText>
          Usa el hook{" "}
          <ThemedText type="defaultSemiBold">useAppNavigation</ThemedText> para
          navegar entre pantallas dentro de la misma sección.
        </ThemedText>
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={handleGoToDetails}
        >
          <ThemedText
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Ir a Detalles
          </ThemedText>
        </Pressable>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Explore some more</ThemedText>
        <ThemedText>
          Usa la barra de navegación en la parte inferior para cambiar entre
          secciones. Cada sección muestra su propia pantalla.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
