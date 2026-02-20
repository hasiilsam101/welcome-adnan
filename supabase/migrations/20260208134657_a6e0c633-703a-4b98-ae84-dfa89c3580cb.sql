
-- Create the database-backups storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('database-backups', 'database-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload backups
CREATE POLICY "Admins can upload backups"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'database-backups'
  AND public.has_admin_role(auth.uid())
);

-- Allow authenticated admins to read backups
CREATE POLICY "Admins can read backups"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'database-backups'
  AND public.has_admin_role(auth.uid())
);

-- Allow authenticated admins to delete backups
CREATE POLICY "Admins can delete backups"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'database-backups'
  AND public.has_admin_role(auth.uid())
);
