-- ===========================================================================
-- MIGRACIÓN FASE 4: LEADS AVANZADO
-- Propósito: Implementar Scoring, Notificaciones Realtime y Gestión de Lectura
-- ===========================================================================

-- 1. Extensión de la tabla 'leads'
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_details JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- 2. Creación de tabla de notificaciones para seguimiento de alertas
CREATE TABLE IF NOT EXISTS lead_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Configuración de Supabase Realtime
-- Aseguramos que las tablas estén en la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_notifications;

-- 4. Políticas RLS (Row Level Security)
ALTER TABLE lead_notifications ENABLE ROW LEVEL SECURITY;

-- Los vendedores solo pueden ver sus propias notificaciones
CREATE POLICY "Sellers can view their own notifications"
ON lead_notifications FOR SELECT
USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own notifications"
ON lead_notifications FOR UPDATE
USING (seller_id = auth.uid());

-- Actualización de política de lectura de leads para Vendedores
-- El vendedor puede ver el lead si la propiedad asociada pertenece a su perfil de vendedor
DROP POLICY IF EXISTS "leads_read_auth" ON leads;
CREATE POLICY "leads_read_seller_and_admin" ON leads
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Es admin
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      -- Es el dueño de la propiedad asociada
      EXISTS (
        SELECT 1 FROM listings
        WHERE listings.id = leads.property_id
        AND listings.seller_profile_id IN (
            SELECT id FROM seller_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Permiso para marcar leads como leídos
CREATE POLICY "leads_update_read_status" ON leads
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      EXISTS (
        SELECT 1 FROM listings
        WHERE listings.id = leads.property_id
        AND listings.seller_profile_id IN (
            SELECT id FROM seller_profiles WHERE user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    -- Solo permitimos actualizar is_read y status, no los datos del cliente
    -- Nota: RLS de Supabase es limitado para columnas específicas,
    -- se recomienda manejar la validación en la Server Action.
    true
  );
