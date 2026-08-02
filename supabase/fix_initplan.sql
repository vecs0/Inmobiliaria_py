-- Fix Security Definer executable by public
REVOKE EXECUTE ON FUNCTION public.reset_api_key_daily_counters() FROM anon, authenticated;

-- Fix auth_rls_initplan (replace auth.uid() with (select auth.uid()))
DROP POLICY IF EXISTS "Sellers CRUD Own Profile" ON public.seller_profiles;
CREATE POLICY "Sellers CRUD Own Profile" ON public.seller_profiles FOR ALL TO public
USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO public
USING (((select auth.uid()) = id));

DROP POLICY IF EXISTS "pb_select_own" ON public.property_boosts;
CREATE POLICY "pb_select_own" ON public.property_boosts FOR SELECT TO public
USING ((((select auth.uid()) = seller_id) OR ((select auth.role()) = 'service_role'::text)));

DROP POLICY IF EXISTS "pb_insert_service" ON public.property_boosts;
CREATE POLICY "pb_insert_service" ON public.property_boosts FOR INSERT TO public
WITH CHECK ((((select auth.role()) = 'service_role'::text) OR ((select auth.uid()) = seller_id)));

DROP POLICY IF EXISTS "pb_update_service" ON public.property_boosts;
CREATE POLICY "pb_update_service" ON public.property_boosts FOR UPDATE TO public
USING ((((select auth.role()) = 'service_role'::text) OR ((select auth.uid()) = seller_id)));

DROP POLICY IF EXISTS "ak_select_own" ON public.api_keys;
CREATE POLICY "ak_select_own" ON public.api_keys FOR SELECT TO public
USING (((select auth.uid()) = seller_id));

DROP POLICY IF EXISTS "ak_insert_own" ON public.api_keys;
CREATE POLICY "ak_insert_own" ON public.api_keys FOR INSERT TO public
WITH CHECK (((select auth.uid()) = seller_id));

DROP POLICY IF EXISTS "ak_update_own" ON public.api_keys;
CREATE POLICY "ak_update_own" ON public.api_keys FOR UPDATE TO public
USING (((select auth.uid()) = seller_id));

DROP POLICY IF EXISTS "ak_delete_own" ON public.api_keys;
CREATE POLICY "ak_delete_own" ON public.api_keys FOR DELETE TO public
USING (((select auth.uid()) = seller_id));

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions" ON public.push_subscriptions FOR INSERT TO public
WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions" ON public.push_subscriptions FOR SELECT TO public
USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions" ON public.push_subscriptions FOR UPDATE TO public
USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions" ON public.push_subscriptions FOR DELETE TO public
USING (((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
CREATE POLICY "leads_select_policy" ON public.leads FOR SELECT TO authenticated
USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))))) OR (EXISTS ( SELECT 1
   FROM (listings l
     JOIN seller_profiles sp ON ((sp.id = l.seller_profile_id)))
  WHERE ((l.id = leads.property_id) AND (sp.user_id = (select auth.uid())))))));

DROP POLICY IF EXISTS "admins_insert_leads" ON public.leads;
CREATE POLICY "admins_insert_leads" ON public.leads FOR INSERT TO authenticated
WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))))));

DROP POLICY IF EXISTS "admins_update_leads" ON public.leads;
CREATE POLICY "admins_update_leads" ON public.leads FOR UPDATE TO authenticated
USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))))));

DROP POLICY IF EXISTS "admins_delete_leads" ON public.leads;
CREATE POLICY "admins_delete_leads" ON public.leads FOR DELETE TO authenticated
USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))))));

