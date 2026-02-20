
-- Add status column to customers table (currently computed in frontend, now stored)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create customer communication log table
CREATE TABLE public.customer_communication_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'email', 'phone', 'chat', 'ticket', 'note', 'sms'
  subject text,
  content text NOT NULL,
  direction text NOT NULL DEFAULT 'outbound', -- 'inbound' or 'outbound'
  created_by text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_communication_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_communication_log (admin access)
CREATE POLICY "Authenticated users can view communication logs"
  ON public.customer_communication_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert communication logs"
  ON public.customer_communication_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete communication logs"
  ON public.customer_communication_log FOR DELETE
  TO authenticated
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_communication_log_customer ON public.customer_communication_log(customer_id);
CREATE INDEX idx_communication_log_type ON public.customer_communication_log(type);
CREATE INDEX idx_customers_status ON public.customers(status);

-- Enable realtime for communication log
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_communication_log;
