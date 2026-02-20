
-- Add deleted_at column to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add deleted_at column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add deleted_at column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add deleted_at column to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;
