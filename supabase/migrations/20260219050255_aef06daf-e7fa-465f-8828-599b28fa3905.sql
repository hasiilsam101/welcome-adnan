
-- Add deleted_at to entities that don't have it yet
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create trash activity log
CREATE TABLE public.trash_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text NOT NULL,
  action text NOT NULL,
  performed_by uuid,
  performed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trash_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trash log" ON public.trash_log
  FOR ALL USING (has_admin_role(auth.uid()));

CREATE POLICY "Authenticated users can insert trash log" ON public.trash_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
