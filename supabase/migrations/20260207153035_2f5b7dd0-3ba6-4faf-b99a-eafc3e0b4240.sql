
-- CSAT (Customer Satisfaction) ratings table
CREATE TABLE public.csat_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.live_chat_conversations(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.csat_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all CSAT ratings" ON public.csat_ratings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'support'))
  );

CREATE POLICY "Anyone can insert CSAT ratings" ON public.csat_ratings
  FOR INSERT WITH CHECK (true);

-- Add escalated_to and escalation_reason to support_tickets
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS escalated_to UUID,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;

-- Add transfer history to live_chat_conversations
ALTER TABLE public.live_chat_conversations
  ADD COLUMN IF NOT EXISTS transferred_from UUID,
  ADD COLUMN IF NOT EXISTS transfer_note TEXT;

-- Enable realtime for csat_ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.csat_ratings;
