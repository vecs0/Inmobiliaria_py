import { createClient } from "@/lib/supabase/client";

export async function addFavorite(userId: string, propertyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .insert([{ user_id: userId, property_id: propertyId }]);
  return { data, error };
}

export async function removeFavorite(userId: string, propertyId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("property_id", propertyId);
  return { error };
}

export async function getUserFavorites(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", userId);
  return { data, error };
}

export async function isFavorited(userId: string, propertyId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single();
  return { isFavorited: !!data, error };
}
