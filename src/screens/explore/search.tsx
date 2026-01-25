import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { StyleSheet } from "react-native";

export function SearchScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Search</ThemedText>
      <ThemedText>Search functionality goes here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
