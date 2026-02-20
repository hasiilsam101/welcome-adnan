
-- 4.4 SEO Fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_keywords TEXT[];

-- 4.5 Product Scheduling
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP WITH TIME ZONE;

-- 4.7 Low Stock Alerts Config (per product threshold)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- 4.6 Related Products junction table
CREATE TABLE IF NOT EXISTS public.related_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, related_product_id),
  CHECK (product_id != related_product_id)
);

ALTER TABLE public.related_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage related products"
  ON public.related_products FOR ALL
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Related products are viewable by everyone"
  ON public.related_products FOR SELECT
  USING (true);

CREATE INDEX idx_related_products_product_id ON public.related_products(product_id);
CREATE INDEX idx_related_products_related_id ON public.related_products(related_product_id);
