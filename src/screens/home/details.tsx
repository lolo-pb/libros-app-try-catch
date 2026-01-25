import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { Pressable, StyleSheet } from "react-native";

export function HomeDetailsScreen() {
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleGoBack = () => {
    navigateToScreen("home", "home-main");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home Details</ThemedText>
      <ThemedText style={{ marginTop: 16 }}>
        Esta es una pantalla secundaria dentro de la sección "Home". Puedes
        navegar entre pantallas de la misma sección usando el hook{" "}
        <ThemedText type="defaultSemiBold">useAppNavigation</ThemedText>.
      </ThemedText>
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: colors.tint,
          },
        ]}
        onPress={handleGoBack}
      >
        <ThemedText
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          Volver a Home
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
});
