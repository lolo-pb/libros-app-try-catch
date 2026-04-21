import { supabase } from "@/src/lib/supabase";
import type * as ImagePicker from "expo-image-picker";

export async function uploadBookCover(
  userId: string,
  asset: ImagePicker.ImagePickerAsset,
  prefix = "book",
) {
  const mimeType = asset.mimeType ?? "image/jpeg";
  const extension = mimeType.split("/")[1] ?? "jpg";
  const normalizedExtension = extension === "jpeg" ? "jpg" : extension;
  const filePath = `${userId}/${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${normalizedExtension}`;
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from("book-covers")
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return filePath;
}

export async function removeBookCover(path: string | null) {
  if (!path || path.startsWith("http")) {
    return;
  }

  await supabase.storage.from("book-covers").remove([path]);
}
