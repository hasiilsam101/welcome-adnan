
-- ============================================
-- 1. Add product_type to products table
-- ============================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'simple';

-- Add comment for clarity
COMMENT ON COLUMN public.products.product_type IS 'simple | variable | grouped | bundle';

-- ============================================
-- 2. Enhance product_variants with color/size
-- ============================================
ALTER TABLE public.product_variants 
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS color_code text,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS cost_price numeric,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- ============================================
-- 3. Create product_group_items table 
--    (for Grouped & Bundle products)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_group_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  child_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  sort_order integer DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parent_product_id, child_product_id)
);

-- Enable RLS
ALTER TABLE public.product_group_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage product group items"
  ON public.product_group_items FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Product group items are viewable by everyone"
  ON public.product_group_items FOR SELECT
  USING (true);

-- ============================================
-- 4. Create variant_attributes table 
--    (define what attributes a product has: Color, Size etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_attribute_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name text NOT NULL, -- e.g., 'Color', 'Size'
  attribute_values text[] NOT NULL DEFAULT '{}', -- e.g., ['Red','Blue','White']
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, attribute_name)
);

ALTER TABLE public.product_attribute_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage product attribute definitions"
  ON public.product_attribute_definitions FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Product attribute definitions are viewable by everyone"
  ON public.product_attribute_definitions FOR SELECT
  USING (true);

-- ============================================
-- 5. Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON public.product_variants(color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON public.product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_group_items_parent ON public.product_group_items(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_product_group_items_child ON public.product_group_items(child_product_id);
CREATE INDEX IF NOT EXISTS idx_product_attribute_defs_product ON public.product_attribute_definitions(product_id);
