import { supabase } from "@/src/lib/supabase";
import type { User } from "@supabase/supabase-js";

export async function ensureProfileForUser(user?: User | null) {
  if (!user?.id) {
    return null;
  }

  const existingProfile = await getProfileById(user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackDisplayName =
    getUserDisplayName(user) ?? user.email?.split("@")[0] ?? "BookTrade reader";

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: fallbackDisplayName,
    })
    .select("*")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      return getProfileById(user.id);
    }
    throw insertError;
  }

  return insertedProfile;
}

export function getUserDisplayName(user?: Pick<User, "email" | "user_metadata"> | null) {
  const metadata = user?.user_metadata;

  if (!metadata || typeof metadata !== "object") {
    return user?.email?.split("@")[0] ?? null;
  }

  const name =
    readString(metadata.display_name) ??
    readString(metadata.full_name) ??
    readString(metadata.name);

  return name ?? user?.email?.split("@")[0] ?? null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
