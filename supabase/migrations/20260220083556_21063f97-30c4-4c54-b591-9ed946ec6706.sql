-- No-op migration to regenerate types with all existing tables
-- Adding a comment to orders table to trigger types refresh
COMMENT ON TABLE public.orders IS 'Customer orders';