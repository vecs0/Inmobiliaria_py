// Tipos generados para Supabase - InmobiliariaPY
// Estos tipos pueden auto-generarse con: npx supabase gen types typescript --project-id YOUR_PROJECT_ID

export interface Json {
  [key: string]: any;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  photo: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

// Modelo Antiguo (Mantener por compatibilidad temporal)
export interface Property {
  id: string;
  title: string;
  location: string;
  neighborhood: string;
  city: string;
  price: number;
  currency: 'USD' | 'PYG';
  type: 'Casa' | 'Apartamento' | 'Penthouse' | 'Terreno' | 'Oficina';
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  featured: boolean;
  tag?: string | null;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  agent_id?: string | null;
  yearBuilt?: number | null;
  floor?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
}

// FASE 2: MODELO DE ENTIDAD ÚNICA
export interface PropertyEntity {
  id: string;
  city: string;
  neighborhood: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  type: 'Casa' | 'Apartamento' | 'Penthouse' | 'Terreno' | 'Oficina' | 'Local';
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  year_built?: number | null;
  floor?: number | null;
  similarity_hash?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ListingStatus = 'pending' | 'active' | 'paused' | 'rejected' | 'expired';
export type ListingSource = 'direct' | 'xml_import' | 'csv_import' | 'api_import';
export type OperationType = 'venta' | 'alquiler';

export interface Listing {
  id: string;
  entity_id: string;
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'PYG';
  operation_type: OperationType;
  image: string;
  images: string[];
  amenities: string[];
  tag?: string | null;
  featured: boolean;
  status: ListingStatus;
  source: ListingSource;
  external_id?: string | null;
  source_url?: string | null;
  agent_id?: string | null;
  seller_profile_id?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Vista completa (Join de Entity + Listing + Agent)
export interface PropertyFull extends Listing {
  city: string;
  neighborhood: string;
  location: string; // Mapeado de address
  latitude?: number | null;
  longitude?: number | null;
  type: PropertyEntity['type'];
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  parking: number;
  yearBuilt?: number | null;
  floor?: number | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  agent_whatsapp?: string | null;
  agent_email?: string | null;
  agent_photo?: string | null;
  agent_title?: string | null;
}

// Fase 1: Perfiles de Vendedor y Suscripciones
export interface SubscriptionPlan {
  id: number;
  name: string;
  plan_type: 'trial' | 'particular' | 'empresa_basic' | 'empresa_pro' | 'enterprise';
  price_usd: number;
  max_properties: number;
  max_agents: number;
  features: Json;
  stripe_price_id?: string | null;
  is_active: boolean;
  created_at?: string;
}


export interface SellerProfile {
  id: string;
  user_id: string;
  seller_type: 'particular' | 'empresa';
  company_name?: string | null;
  ruc?: string | null;
  subscription_plan: 'basic' | 'premium' | 'pro' | 'trial';
  subscription_status: 'active' | 'inactive' | 'trialing' | 'canceled';
  max_properties: number;
  properties_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  seller_profile_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripe_payment_id?: string | null;
  plan_id?: string | null;
  created_at?: string;
}

// Tipo con agente incluido (para uso en componentes antiguos)
export interface PropertyWithAgent extends Property {
  agent?: Agent;
}

// Tipos para filtros y paginación
export interface PropertyFilters {
  ciudad?: string;
  tipo?: string;
  precioMax?: number;
  bedsMin?: number;
  featured?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id: string;
  status: 'pending' | 'contacted' | 'discarded';
  score: number;
  score_details: string[];
  is_read: boolean;
  assigned_to?: string | null;
  created_at: string;
}

export interface LeadNotification {
  id: string;
  lead_id: string;
  seller_id: string;
  read_at?: string | null;
  created_at: string;
}

// Tipo para el formulario de contacto
export interface ContactForm {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
}

// FASE 6-A++: Alertas de Oportunidad
export interface SavedSearchFilters {
  ciudad?: string;
  tipo?: string;
  precioMin?: number;
  precioMax?: number;
  bedrooms?: number;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SavedSearchFilters;
  active: boolean;
  last_notified_at?: string | null;
  created_at: string;
  updated_at: string;
}

// FASE 6-B+: Destacados / Ads
export interface PropertyBoost {
  id: string;
  property_id: string;
  seller_id: string;
  plan_key: '7d' | '15d' | '30d';
  price_usd: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  stripe_session_id?: string | null;
  stripe_payment_intent?: string | null;
  starts_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

// FASE 6-D: Infraestructura B2B — API Keys
export interface ApiKey {
  id: string;
  seller_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  active: boolean;
  requests_today: number;
  requests_total: number;
  last_used_at?: string | null;
  created_at: string;
}
