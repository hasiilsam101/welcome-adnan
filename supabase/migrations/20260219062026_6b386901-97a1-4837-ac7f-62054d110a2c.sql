
INSERT INTO storage.buckets (id, name, public)
VALUES ('database-backups', 'database-backups', false);

CREATE POLICY "Admin can upload backups"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'database-backups');

CREATE POLICY "Admin can read backups"
ON storage.objects FOR SELECT
USING (bucket_id = 'database-backups');

CREATE POLICY "Admin can delete backups"
ON storage.objects FOR DELETE
USING (bucket_id = 'database-backups');
