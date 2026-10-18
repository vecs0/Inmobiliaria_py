// Utilidades de rol puras (sin I/O) — usables en servidor y cliente.
// Fuente de verdad: profiles.role ∈ user | seller | seller_empresa | agent | admin
//                   seller_profiles.seller_type ∈ particular | empresa

export type AppRole = 'buyer' | 'seller_particular' | 'seller_empresa' | 'admin' | 'agent';

/** Requisitos aceptados por hasRole: un AppRole o un alias de grupo. */
export type RoleRequirement =
  | AppRole
  | 'seller' // cualquier vendedor (particular o empresa)
  | 'seller_company' // alias de seller_empresa (CLAUDE.md)
  | 'user'; // alias de buyer

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
  if (profileRole === 'seller_empresa') return 'seller_empresa';
  if (profileRole === 'seller') return 'seller_particular';
  return 'buyer';
}

export function homePathForRole(role: AppRole): string {
  if (role === 'seller_particular' || role === 'seller_empresa') return '/vendedor';
  if (role === 'admin' || role === 'agent') return '/vendedor';
  return '/comprador';
}

export function isSellerRole(role: AppRole): boolean {
  return role === 'seller_particular' || role === 'seller_empresa';
}

function matches(role: AppRole, req: RoleRequirement): boolean {
  switch (req) {
    case 'seller':
      return isSellerRole(role);
    case 'seller_company':
      return role === 'seller_empresa';
    case 'user':
      return role === 'buyer';
    default:
      return role === req;
  }
}

/**
 * true si el sujeto cumple al menos uno de los requisitos. `admin` cumple cualquier requisito.
 * Acepta un AppRole, o un objeto con `role` (p.ej. UserContext de getUserContext()).
 */
export function hasRole(
  subject: AppRole | { role: AppRole } | null | undefined,
  required: RoleRequirement | RoleRequirement[]
): boolean {
  if (!subject) return false;
  const role = typeof subject === 'string' ? subject : subject.role;
  if (role === 'admin') return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((r) => matches(role, r));
}
