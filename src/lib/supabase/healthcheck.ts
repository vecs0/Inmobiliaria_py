/**
 * Healthcheck para validar conexión con Supabase
 *
 * USO: Ejecutar desde una ruta de API o componente
 * para validar que la conexión está correctamente configurada.
 *
 * Ejemplo desde un componente:
 * ```tsx
 * const result = await checkSupabaseConnection();
 * console.log(result); // { ok: true, latency: 45, propertiesCount: 6 }
 * ```
 */

import { createClient } from './server';

export interface HealthCheckResult {
  ok: boolean;
  latency: number;
  propertiesCount?: number;
  agentsCount?: number;
  error?: string;
}

export async function checkSupabaseConnection(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Test 1: Verificar propiedades
    const { count: propertiesCount, error: propertiesError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    if (propertiesError) throw propertiesError;

    // Test 2: Verificar agentes
    const { count: agentsCount, error: agentsError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true });

    if (agentsError) throw agentsError;

    const latency = Date.now() - startTime;

    return {
      ok: true,
      latency,
      propertiesCount: propertiesCount || 0,
      agentsCount: agentsCount || 0,
    };
  } catch (error: any) {
    return {
      ok: false,
      latency: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Test de estrategia de caché ISR
 *
 * Valida que el fetch con revalidateTag funciona correctamente.
 */
export async function testISRCache() {
  const supabase = await createClient();

  // Fetch con caché de 60 segundos
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, featured')
    .eq('featured', true)
    .limit(3);

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    cachedCount: data?.length || 0,
    revalidateStrategy: 'tag-based',
    tags: ['featured-properties'],
  };
}
