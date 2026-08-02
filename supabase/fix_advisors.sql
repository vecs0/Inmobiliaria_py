-- Fix Performance Advisor Warnings

-- 1. Fix duplicate index on saved_searches
DROP INDEX IF EXISTS public.saved_searches_user_id_idx;

-- 2. Fix multiple permissive policies on profiles (Duplicate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 3. Fix multiple permissive policies on listings by combining SELECT rules and splitting ALL
DROP POLICY IF EXISTS "Public Read Listings" ON public.listings;
DROP POLICY IF EXISTS "Sellers Manage Own Listings" ON public.listings;

-- Combined SELECT policy: Public can read active, Sellers can read their own
CREATE POLICY "listings_select_policy" ON public.listings
FOR SELECT USING (
  status = 'active' OR
  (( SELECT auth.uid() AS uid) IN ( SELECT sp.user_id FROM seller_profiles sp WHERE sp.id = listings.seller_profile_id ))
);

-- Separate INSERT, UPDATE, DELETE policies for sellers
CREATE POLICY "listings_insert_policy" ON public.listings
FOR INSERT WITH CHECK (
  (( SELECT auth.uid() AS uid) IN ( SELECT sp.user_id FROM seller_profiles sp WHERE sp.id = listings.seller_profile_id ))
);

CREATE POLICY "listings_update_policy" ON public.listings
FOR UPDATE USING (
  (( SELECT auth.uid() AS uid) IN ( SELECT sp.user_id FROM seller_profiles sp WHERE sp.id = listings.seller_profile_id ))
);

CREATE POLICY "listings_delete_policy" ON public.listings
FOR DELETE USING (
  (( SELECT auth.uid() AS uid) IN ( SELECT sp.user_id FROM seller_profiles sp WHERE sp.id = listings.seller_profile_id ))
);
