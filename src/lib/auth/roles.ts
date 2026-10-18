import { createClient } from '@/lib/supabase/server';
import { resolveAppRole, type AppRole } from './role-utils';

export type { AppRole, RoleRequirement } from './role-utils';
export { resolveAppRole, homePathForRole, hasRole, isSellerRole } from './role-utils';

export type UserContext = {
  userId: string;
  email: string;
  role: AppRole;
  sellerProfileId?: string;
  sellerType?: 'particular' | 'empresa';
};

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: seller }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase
      .from('seller_profiles')
      .select('id, seller_type')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const role = resolveAppRole(profile?.role, seller?.seller_type, Boolean(seller));

  return {
    userId: user.id,
    email: user.email ?? '',
    role,
    sellerProfileId: seller?.id,
    sellerType: (seller?.seller_type as 'particular' | 'empresa') ?? undefined,
  };
}
