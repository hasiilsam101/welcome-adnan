
-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read brands" ON public.brands
  FOR SELECT USING (true);

-- Allow authenticated users to manage brands
CREATE POLICY "Allow authenticated insert brands" ON public.brands
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update brands" ON public.brands
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete brands" ON public.brands
  FOR DELETE USING (auth.role() = 'authenticated');

-- Enable realtime for brands
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
