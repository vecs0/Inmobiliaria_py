-- =============================================================
-- PERFORMANCE FIXES — InmobiliariaPY V3
-- Resuelve advertencias del Asesor de Rendimiento Supabase
-- =============================================================

-- ---------------------------------------------------------------
-- FIX 1: unindexed_foreign_keys
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites (property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads (property_id);
CREATE INDEX IF NOT EXISTS idx_listings_agent_id ON public.listings (agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_entity_id ON public.listings (entity_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_profile_id ON public.listings (seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON public.payments (plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_seller_profile_id ON public.payments (seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON public.seller_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches (user_id);

-- ---------------------------------------------------------------
-- FIX 2: auth_rls_initplan
-- Reemplazar auth.uid() con (select auth.uid())
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Sellers Manage Own Listings" ON public.listings;
DROP POLICY IF EXISTS "payments_read_own" ON public.payments;

DROP POLICY IF EXISTS "pb_select_own" ON public.property_boosts;
DROP POLICY IF EXISTS "pb_insert_service" ON public.property_boosts;
DROP POLICY IF EXISTS "pb_update_service" ON public.property_boosts;

DROP POLICY IF EXISTS "sellers_see_own_leads" ON public.leads;
DROP POLICY IF EXISTS "admins_manage_leads" ON public.leads;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = (select auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = (select auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Sellers Manage Own Listings" ON public.listings FOR ALL USING (
    (select auth.uid()) IN (
        SELECT sp.user_id FROM public.seller_profiles sp WHERE sp.id = seller_profile_id
    )
);

CREATE POLICY "payments_read_own" ON public.payments FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "pb_select_own" ON public.property_boosts FOR SELECT USING (
    (select auth.uid()) = seller_id OR (select auth.role()) = 'service_role'
);
CREATE POLICY "pb_insert_service" ON public.property_boosts FOR INSERT WITH CHECK (
    (select auth.role()) = 'service_role' OR (select auth.uid()) = seller_id
);
CREATE POLICY "pb_update_service" ON public.property_boosts FOR UPDATE USING (
    (select auth.role()) = 'service_role' OR (select auth.uid()) = seller_id
);

CREATE POLICY "sellers_see_own_leads" ON public.leads FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings l
        JOIN public.seller_profiles sp ON sp.id = l.seller_profile_id
        WHERE l.id = leads.property_id AND sp.user_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid()) AND role IN ('admin', 'agent')
    )
);

CREATE POLICY "admins_manage_leads" ON public.leads FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (select auth.uid()) AND role IN ('admin', 'agent')
    )
);

-- ---------------------------------------------------------------
-- FIX 3: multiple_permissive_policies en saved_searches
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "saved_searches_select_own" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_insert_own" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_update_own" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_delete_own" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_service_select" ON public.saved_searches;
DROP POLICY IF EXISTS "saved_searches_service_update" ON public.saved_searches;

CREATE POLICY "saved_searches_select" ON public.saved_searches FOR SELECT USING (
    (select auth.uid()) = user_id OR (select auth.role()) = 'service_role'
);
CREATE POLICY "saved_searches_insert" ON public.saved_searches FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
);
CREATE POLICY "saved_searches_update" ON public.saved_searches FOR UPDATE USING (
    (select auth.uid()) = user_id OR (select auth.role()) = 'service_role'
);
CREATE POLICY "saved_searches_delete" ON public.saved_searches FOR DELETE USING (
    (select auth.uid()) = user_id
);
