
-- Add refund processing fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'processing', 'refunded', 'rejected')),
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason text,
ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
ADD COLUMN IF NOT EXISTS refunded_by uuid;

-- Add tags to orders for issue tagging
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add tags to support_tickets if not exists (for issue tagging enhancement)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'tags') THEN
    ALTER TABLE public.support_tickets ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create index for faster tag queries
CREATE INDEX IF NOT EXISTS idx_orders_tags ON public.orders USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON public.orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tags ON public.support_tickets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
