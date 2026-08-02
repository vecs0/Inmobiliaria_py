-- Fix Performance Advisor Warnings - Part 2

-- 1. Fix api_keys: drop the redundant service_role policy.
-- service_role automatically bypasses RLS, so having an explicit policy just creates duplicate policy evaluations.
DROP POLICY IF EXISTS "ak_service_role" ON public.api_keys;

-- 2. Fix leads: combine SELECT policies and split admins ALL to avoid duplicate SELECT policies
DROP POLICY IF EXISTS "admins_manage_leads" ON public.leads;
DROP POLICY IF EXISTS "sellers_see_own_leads" ON public.leads;

-- Combined SELECT for leads: Admins/Agents can see all, Sellers can see their own
CREATE POLICY "leads_select_policy" ON public.leads
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))
  OR
  EXISTS (
    SELECT 1 FROM listings l
    JOIN seller_profiles sp ON sp.id = l.seller_profile_id
    WHERE l.id = leads.property_id AND sp.user_id = auth.uid()
  )
);

-- Admin/Agent INSERT, UPDATE, DELETE for leads
CREATE POLICY "admins_insert_leads" ON public.leads
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))
);

CREATE POLICY "admins_update_leads" ON public.leads
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))
);

CREATE POLICY "admins_delete_leads" ON public.leads
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'agent'::user_role]))
);
