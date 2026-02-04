import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { Image } from "expo-image";

import { Cloudinary } from '@cloudinary/url-gen';
import { thumbnail } from "@cloudinary/url-gen/actions/resize";
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function HomeScreen() {
  const { navigateToScreen } = useAppNavigation();

  // 1. Get the current theme and colors
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // 2. Generate the styles by passing the theme variables
  const styles = getStyles(colors, colorScheme);

  const handleGoToDetails = () => {
    navigateToScreen("home", "home-details");
  };

  const cld = new Cloudinary({
    cloud: { cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME }
  });

  const imageUrl = cld.image('main-sample')
    .resize(thumbnail().width(500).height(500))
    .toURL();

  const localGreyPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>API & Layout Debug</Text>

      <Text style={styles.label}>1. Cloudinary 'demo' Dog (API Test)</Text>
      <Image
        source={{ uri: imageUrl }}
        style={styles.imageBox}
        contentFit="cover"
        onLoad={() => console.log("Cloudinary Image Loaded!")}
        onError={(e) => console.log("Cloudinary Load Error:", e.error)}
      />

      <Text style={styles.label}>2. Guaranteed Grey Image (Local Test)</Text>
      <Image
        source={{ uri: localGreyPixel }}
        style={styles.imageBox}
        contentFit="cover"
        onLoad={() => console.log("Local Grey Image Loaded!")}
      />

      <View style={styles.infoBox}>
        <Text style={styles.urlCode}>Generated URL: {imageUrl}</Text>
      </View>
    </ScrollView>
  );
}

// 3. The Style Function (Defined outside to keep the component clean)
const getStyles = (colors: any, colorScheme: 'light' | 'dark') => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 24,
    marginBottom: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
    overflow: 'hidden',
  },
  infoBox: {
    marginTop: 30,
    padding: 16,
    backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F9F9F9',
    borderRadius: 12,
    width: '100%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.text + '33', // Adding transparency to the border
  },
  urlCode: {
    fontSize: 11,
    color: '#E91E63',
    lineHeight: 16,
    textAlign: 'center',
  },
});