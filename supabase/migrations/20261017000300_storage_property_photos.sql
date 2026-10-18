-- =====================================================================
-- Storage: bucket `property-photos` (lectura pública)
-- InmobiliariaPY V3 · 2026-10-17
--
-- Ruta usada por src/app/api/seller/upload/route.ts:
--   sellers/<auth.uid()>/<uuid>.<ext>
-- Se acepta también <auth.uid()>/... (convención estándar de Supabase).
-- =====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos',
  'property-photos',
  true,
  8388608,                                   -- 8 MB (igual que la API)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "property_photos_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "property_photos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "property_photos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "property_photos_owner_delete" ON storage.objects;

CREATE POLICY "property_photos_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-photos');

CREATE POLICY "property_photos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (
        (storage.foldername(name))[1] = 'sellers'
        AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
      )
    )
  );

CREATE POLICY "property_photos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (
        (storage.foldername(name))[1] = 'sellers'
        AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
      )
    )
  )
  WITH CHECK (
    bucket_id = 'property-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (
        (storage.foldername(name))[1] = 'sellers'
        AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
      )
    )
  );

CREATE POLICY "property_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (
        (storage.foldername(name))[1] = 'sellers'
        AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
      )
    )
  );
