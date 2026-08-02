import { createClient } from "./client";

export type UserRole = "admin" | "agent" | "user";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  return profile as UserProfile;
}

export function hasRole(requiredRoles: UserRole[]): boolean {
  // Esta función debe llamarse desde el cliente después de obtener el perfil
  // Se usa en componentes para conditionally renderizar based on role
  return true; // Placeholder - usar getUserProfile() para verificación real
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin";
}

export async function isAgent(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin" || profile?.role === "agent";
}