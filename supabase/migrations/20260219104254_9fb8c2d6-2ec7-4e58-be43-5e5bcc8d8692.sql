
-- Ensure the database-backups bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('database-backups', 'database-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to read/download backups
CREATE POLICY "Admins can read backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'database-backups' AND auth.role() = 'authenticated');

-- Allow authenticated admins to upload backups
CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'database-backups' AND auth.role() = 'authenticated');

-- Allow authenticated admins to update backups
CREATE POLICY "Admins can update backups"
ON storage.objects FOR UPDATE
USING (bucket_id = 'database-backups' AND auth.role() = 'authenticated');

-- Allow authenticated admins to delete backups
CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'database-backups' AND auth.role() = 'authenticated');
