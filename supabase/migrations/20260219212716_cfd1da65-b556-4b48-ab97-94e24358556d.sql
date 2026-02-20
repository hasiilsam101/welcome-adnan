
-- Create homepage_sections table for CMS
CREATE TABLE public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  badge_text TEXT,
  content JSONB DEFAULT '{}',
  image_url TEXT,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Public can read enabled sections (with date check)
CREATE POLICY "Anyone can view enabled homepage sections"
ON public.homepage_sections
FOR SELECT
USING (
  is_enabled = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (expires_at IS NULL OR expires_at > now())
);

-- Admins can manage all sections
CREATE POLICY "Admins can manage homepage sections"
ON public.homepage_sections
FOR ALL
USING (has_admin_role(auth.uid()));

-- Seed default data
INSERT INTO public.homepage_sections (section_type, title, subtitle, badge_text, content, image_url, sort_order) VALUES
('hero', 'Elevate Your Style Game', 'Discover premium fashion that speaks to your unique personality. Quality fabrics, bold designs, affordable prices.', 'New Collection 2024', '{"cta_text": "Shop Now", "cta_link": "/products", "secondary_cta_text": "View New Arrivals", "secondary_cta_link": "/products?filter=new", "highlight_text": "Style Game"}', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop', 0),
('announcement', '🎉 Free shipping on orders over ৳2,000! Use code FREESHIP', NULL, NULL, '{"link": "/products", "link_text": "Shop Now"}', NULL, 1),
('feature_bar', NULL, NULL, NULL, '{"features": [{"icon": "Truck", "title": "Free Shipping", "desc": "On orders over ৳2,000"}, {"icon": "Shield", "title": "Secure Payment", "desc": "100% protected"}, {"icon": "RefreshCw", "title": "Easy Returns", "desc": "7-day return policy"}, {"icon": "Headphones", "title": "24/7 Support", "desc": "Always here to help"}]}', NULL, 2),
('sale_banner', 'Up to 50% Off', 'Don''t miss out on our biggest sale of the season!', 'Limited Time', '{"cta_text": "Shop Sale", "cta_link": "/products?filter=sale"}', NULL, 3),
('newsletter', 'Stay in the Loop', 'Subscribe to our newsletter for exclusive deals and new arrivals.', NULL, '{"button_text": "Subscribe", "placeholder": "Enter your email"}', NULL, 4);
