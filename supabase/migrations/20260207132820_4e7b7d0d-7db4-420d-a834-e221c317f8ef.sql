
-- Order Activity Log table for tracking status changes
CREATE TABLE public.order_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order Notes table for internal team collaboration
CREATE TABLE public.order_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_activity_log (admin/manager only)
CREATE POLICY "Admins can view order activity logs"
  ON public.order_activity_log FOR SELECT
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can insert order activity logs"
  ON public.order_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_admin_role(auth.uid()));

-- RLS policies for order_notes (admin/manager only)
CREATE POLICY "Admins can view order notes"
  ON public.order_notes FOR SELECT
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can create order notes"
  ON public.order_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can update order notes"
  ON public.order_notes FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete order notes"
  ON public.order_notes FOR DELETE
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_order_activity_log_order_id ON public.order_activity_log(order_id);
CREATE INDEX idx_order_activity_log_created_at ON public.order_activity_log(created_at DESC);
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX idx_order_notes_created_at ON public.order_notes(created_at DESC);

-- Trigger to auto-log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_activity_log (order_id, action, old_value, new_value, description)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, 'Order status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO public.order_activity_log (order_id, action, old_value, new_value, description)
    VALUES (NEW.id, 'payment_status_change', OLD.payment_status, NEW.payment_status, 'Payment status changed from ' || COALESCE(OLD.payment_status, 'none') || ' to ' || NEW.payment_status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();
