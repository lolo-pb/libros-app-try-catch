import { supabase } from "@/src/lib/supabase";
import type { Book, GlobalBook } from "@/src/types/database";

const NO_COVER_IMAGE = require("../../assets/images/no-cover-available.png");

type Coverable = Pick<Book, "cover_path"> | Pick<GlobalBook, "cover_path">;

export function resolveCoverSource(coverable?: Coverable | null) {
  if (!coverable?.cover_path) {
    return NO_COVER_IMAGE;
  }

  if (coverable.cover_path.startsWith("http")) {
    return { uri: coverable.cover_path };
  }

  return {
    uri: supabase.storage.from("book-covers").getPublicUrl(coverable.cover_path)
      .data.publicUrl,
  };
}

export { NO_COVER_IMAGE };
