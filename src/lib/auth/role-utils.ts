export type AppRole = 'buyer' | 'seller_particular' | 'seller_empresa' | 'admin' | 'agent';

export function resolveAppRole(
  profileRole: string | null | undefined,
  sellerType: string | null | undefined,
  hasSellerProfile: boolean
): AppRole {
  if (profileRole === 'admin') return 'admin';
  if (profileRole === 'agent') return 'agent';
  if (hasSellerProfile) {
    return sellerType === 'empresa' ? 'seller_empresa' : 'seller_particular';
  }
  return 'buyer';
}

export function homePathForRole(role: AppRole): string {
  if (role === 'seller_particular' || role === 'seller_empresa') return '/vendedor';
  if (role === 'admin' || role === 'agent') return '/vendedor';
  return '/comprador';
}
