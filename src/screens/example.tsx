import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { StyleSheet } from "react-native";

/**
 * Pantalla de Ejemplo
 *
 * Esta es una pantalla de ejemplo. Para crear nuevas pantallas:
 *
 * 1. Crea un archivo en src/screens/[seccion]/[nombre].tsx
 * 2. Exporta un componente que retorne JSX
 * 3. Importalo en src/navigation/navigation-config.ts
 * 4. Agrégalo a la configuración de la sección
 *
 * Ejemplo:
 *
 * export function MiPantalla() {
 *   return (
 *     <ThemedView style={styles.container}>
 *       <ThemedText type="title">Mi Pantalla</ThemedText>
 *     </ThemedView>
 *   );
 * }
 */

export function ExampleScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Pantalla de Ejemplo</ThemedText>
      <ThemedText type="subtitle">Guía para crear nuevas pantallas</ThemedText>
      <ThemedText style={styles.info}>
        Sigue el comentario en este archivo para entender cómo agregar nuevas
        pantallas y secciones.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  info: {
    marginTop: 16,
    lineHeight: 24,
  },
});
