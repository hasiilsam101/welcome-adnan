
-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'support', 'user');

-- ============================================
-- Create user_roles table FIRST (needed by has_admin_role function)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- ============================================
-- SECURITY DEFINER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.has_admin_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role IN ('admin', 'manager')
  )
$$;

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  bio text,
  date_of_birth date,
  gender text,
  company_name text,
  language_preference text DEFAULT 'bn'::text,
  notify_order_updates boolean DEFAULT true,
  notify_order_shipped boolean DEFAULT true,
  notify_order_delivered boolean DEFAULT true,
  notify_promotions boolean DEFAULT true,
  notify_new_arrivals boolean DEFAULT true,
  notify_price_drops boolean DEFAULT true,
  notify_account_activity boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  parent_id uuid,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  cost_price numeric,
  sku text,
  barcode text,
  quantity integer NOT NULL DEFAULT 0,
  category text,
  category_id uuid,
  images text[],
  tags text[],
  weight numeric,
  dimensions jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  address jsonb,
  notes text,
  tags text[],
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text,
  description text,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  minimum_order_amount numeric,
  maximum_discount numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  user_limit integer,
  max_uses integer,
  first_order_only boolean DEFAULT false,
  applicable_products jsonb,
  applicable_categories jsonb,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  user_id uuid,
  customer_id uuid,
  status text NOT NULL DEFAULT 'pending'::text,
  payment_status text DEFAULT 'pending'::text,
  payment_method text,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  tracking_number text,
  coupon_id uuid,
  coupon_code text,
  is_gift boolean DEFAULT false,
  gift_message text,
  payment_verified_at timestamp with time zone,
  payment_verified_by uuid,
  payment_verification_notes text,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  countries text[],
  regions text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.live_chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_avatar text,
  customer_notes text,
  subject text,
  status text NOT NULL DEFAULT 'open'::text,
  priority text DEFAULT 'normal'::text,
  category text,
  tags text[],
  notes text,
  assigned_to uuid,
  unread_count integer DEFAULT 0,
  first_response_at timestamp with time zone,
  response_time_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL,
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  subject text NOT NULL,
  description text NOT NULL,
  category text,
  priority text DEFAULT 'normal'::text,
  status text DEFAULT 'open'::text,
  order_id uuid,
  assigned_to uuid,
  resolved_at timestamp with time zone,
  first_response_at timestamp with time zone,
  response_time_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  customer_id uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  first_name text,
  last_name text,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new'::text,
  is_read boolean DEFAULT false,
  replied_at timestamp with time zone,
  replied_by uuid,
  first_response_at timestamp with time zone,
  response_time_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  customer_name text,
  customer_email text,
  cart_items jsonb NOT NULL,
  cart_total numeric NOT NULL,
  last_activity_at timestamp with time zone NOT NULL DEFAULT now(),
  abandoned_at timestamp with time zone,
  recovered_at timestamp with time zone,
  recovered_order_id uuid,
  reminder_sent_count integer DEFAULT 0,
  first_reminder_sent_at timestamp with time zone,
  second_reminder_sent_at timestamp with time zone,
  final_reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reason text,
  failed_attempts integer DEFAULT 0,
  unlock_at timestamp with time zone NOT NULL,
  is_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.admin_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  is_online boolean DEFAULT false,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  session_id text,
  page_url text,
  referrer text,
  user_agent text,
  ip_address text,
  event_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.auto_discount_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  min_purchase numeric,
  max_discount numeric,
  conditions jsonb,
  priority integer DEFAULT 0,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.auto_reply_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  message text,
  delay_seconds integer DEFAULT 0,
  schedule jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  reason text,
  blocked_by text,
  blocked_until timestamp with time zone,
  is_permanent boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.blocked_login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text,
  ip_address text,
  reason text,
  blocked_until timestamp with time zone,
  is_permanent boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.canned_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  shortcut text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.conversation_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_orders integer DEFAULT 0,
  new_customers integer DEFAULT 0,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  average_order_value numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.database_backups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  backup_type text NOT NULL,
  file_format text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  tables_included text[] NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  error_message text,
  created_by uuid,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text,
  subject text NOT NULL,
  body_html text,
  body_text text,
  variables text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.enabled_payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  method_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  name_bn text,
  description text,
  instructions text,
  logo_url text,
  account_details jsonb,
  is_active boolean DEFAULT true,
  supports_verification boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  reason text,
  attempt_count integer DEFAULT 1,
  last_attempt_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.geo_blocking_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text,
  is_blocked boolean DEFAULT false,
  reason text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.ip_rate_limit_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  endpoint text,
  max_requests integer DEFAULT 100,
  window_seconds integer DEFAULT 60,
  time_window_seconds integer DEFAULT 60,
  block_duration_seconds integer DEFAULT 300,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text,
  request_count integer DEFAULT 0,
  window_start timestamp with time zone,
  is_blocked boolean DEFAULT false,
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.login_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  status text NOT NULL,
  ip_address text,
  user_agent text,
  device_info jsonb,
  location text,
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pathao_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id text,
  client_secret text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  default_store_id text,
  is_enabled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  display_name text,
  description text,
  instructions text,
  logo_url text,
  is_active boolean DEFAULT true,
  is_manual boolean DEFAULT true,
  supports_verification boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  config jsonb,
  account_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.quick_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  shortcut text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.recovery_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_used boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.security_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  require_2fa boolean DEFAULT false,
  login_notification boolean DEFAULT true,
  session_timeout_minutes integer DEFAULT 60,
  password_expires_days integer,
  last_password_change timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.steadfast_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  api_key text,
  secret_key text,
  is_enabled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text,
  setting_value text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  device_name text,
  device_type text,
  browser text,
  os text,
  ip_address text,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  secret text NOT NULL,
  is_enabled boolean DEFAULT false,
  backup_codes text[],
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text,
  full_name text NOT NULL,
  phone text NOT NULL,
  street_address text NOT NULL,
  area text,
  city text NOT NULL,
  postal_code text,
  country text DEFAULT 'Bangladesh'::text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  device_info jsonb,
  ip_address text,
  user_agent text,
  is_current boolean DEFAULT false,
  last_active_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  last_activity_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.contact_message_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  reply_subject text,
  reply_content text NOT NULL,
  recipient_email text,
  replied_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  user_id uuid,
  order_id uuid,
  discount_applied numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  conversation_id uuid,
  content text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.inventory_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  quantity_change integer NOT NULL,
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid,
  sender_name text,
  sender_type text NOT NULL,
  sender text,
  content text NOT NULL,
  attachments jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.order_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  description text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  price numeric,
  compare_at_price numeric,
  quantity integer DEFAULT 0,
  options jsonb,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  variant_id uuid,
  quantity integer DEFAULT 0,
  sku text,
  low_stock_threshold integer DEFAULT 5,
  warehouse_location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid,
  customer_name text,
  rating integer NOT NULL,
  title text,
  content text,
  review_text text,
  is_verified boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  courier text NOT NULL,
  tracking_number text,
  consignment_id text,
  status text DEFAULT 'pending'::text,
  courier_response jsonb,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL,
  name text NOT NULL,
  rate_type text,
  rate numeric NOT NULL,
  min_order_amount numeric,
  max_order_amount numeric,
  min_weight numeric,
  max_weight numeric,
  min_days integer,
  max_days integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid,
  sender_name text,
  sender_type text,
  message text NOT NULL,
  attachments jsonb,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================
ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);
ALTER TABLE public.contact_message_replies ADD CONSTRAINT contact_message_replies_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.contact_messages(id);
ALTER TABLE public.coupon_usage ADD CONSTRAINT coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);
ALTER TABLE public.coupon_usage ADD CONSTRAINT coupon_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.customer_notes ADD CONSTRAINT customer_notes_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.live_chat_conversations(id);
ALTER TABLE public.customer_notes ADD CONSTRAINT customer_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.inventory_history ADD CONSTRAINT inventory_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.live_chat_messages ADD CONSTRAINT live_chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.live_chat_conversations(id);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.order_tracking ADD CONSTRAINT order_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.product_inventory ADD CONSTRAINT product_inventory_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);
ALTER TABLE public.product_inventory ADD CONSTRAINT product_inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.product_reviews ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);
ALTER TABLE public.shipments ADD CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.shipping_rates ADD CONSTRAINT shipping_rates_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.shipping_zones(id);
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.ticket_replies ADD CONSTRAINT ticket_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id);
ALTER TABLE public.wishlists ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);

-- ============================================
-- UNIQUE INDEXES
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS abandoned_carts_session_id_key ON public.abandoned_carts USING btree (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS admin_presence_user_id_key ON public.admin_presence USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS conversation_tags_name_key ON public.conversation_tags USING btree (name);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_key ON public.coupons USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS daily_stats_date_key ON public.daily_stats USING btree (date);
CREATE UNIQUE INDEX IF NOT EXISTS email_templates_slug_key ON public.email_templates USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS enabled_payment_methods_code_key ON public.enabled_payment_methods USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS geo_blocking_rules_country_code_key ON public.geo_blocking_rules USING btree (country_code);
CREATE UNIQUE INDEX IF NOT EXISTS ip_rate_limit_settings_setting_key_key ON public.ip_rate_limit_settings USING btree (setting_key);
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON public.orders USING btree (order_number);
CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_code_key ON public.payment_methods USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS security_settings_user_id_key ON public.security_settings USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS store_settings_key_key ON public.store_settings USING btree (key);
CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_ticket_number_key ON public.support_tickets USING btree (ticket_number);
CREATE UNIQUE INDEX IF NOT EXISTS two_factor_auth_user_id_key ON public.two_factor_auth USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_session_token_key ON public.user_sessions USING btree (session_token);
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_user_id_product_id_key ON public.wishlists USING btree (user_id, product_id);

-- ============================================
-- REGULAR INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages USING btree (status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers USING btree (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON public.database_backups USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON public.database_backups USING btree (status);
CREATE INDEX IF NOT EXISTS idx_live_chat_conversations_status ON public.live_chat_conversations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_is_used ON public.recovery_codes USING btree (user_id, is_used);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON public.support_tickets USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets USING btree (status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enabled_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_blocking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rate_limit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathao_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steadfast_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can view all abandoned carts" ON public.abandoned_carts FOR SELECT TO authenticated USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can create abandoned carts" ON public.abandoned_carts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update abandoned carts by session" ON public.abandoned_carts FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage account lockouts" ON public.account_lockouts FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage admin presence" ON public.admin_presence FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage analytics events" ON public.analytics_events FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can track analytics events" ON public.analytics_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage auto discount rules" ON public.auto_discount_rules FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage auto reply settings" ON public.auto_reply_settings FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage blocked ips" ON public.blocked_ips FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage blocked login attempts" ON public.blocked_login_attempts FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage canned responses" ON public.canned_responses FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage contact message replies" ON public.contact_message_replies FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage conversation tags" ON public.conversation_tags FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Conversation tags are viewable by everyone" ON public.conversation_tags FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage coupon usage" ON public.coupon_usage FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage customer notes" ON public.customer_notes FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage daily stats" ON public.daily_stats FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can create backups" ON public.database_backups FOR INSERT TO public WITH CHECK (has_admin_role(auth.uid()));
CREATE POLICY "Admins can delete backups" ON public.database_backups FOR DELETE TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can update backups" ON public.database_backups FOR UPDATE TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can view all backups" ON public.database_backups FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Active payment methods are viewable by everyone" ON public.enabled_payment_methods FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage enabled payment methods" ON public.enabled_payment_methods FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage failed login attempts" ON public.failed_login_attempts FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can insert failed login attempts" ON public.failed_login_attempts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage geo blocking rules" ON public.geo_blocking_rules FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage inventory history" ON public.inventory_history FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage ip rate limit settings" ON public.ip_rate_limit_settings FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage ip rate limits" ON public.ip_rate_limits FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage live chat" ON public.live_chat_conversations FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can start live chat" ON public.live_chat_conversations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Customers can update their own conversations" ON public.live_chat_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Customers can view their own conversations" ON public.live_chat_conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage live chat messages" ON public.live_chat_messages FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can send live chat messages" ON public.live_chat_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Customers can update messages" ON public.live_chat_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Customers can view messages in conversations" ON public.live_chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can view login activity" ON public.login_activity FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "System can insert login activity" ON public.login_activity FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view their own login activity" ON public.login_activity FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM orders WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));
CREATE POLICY "Admins can manage order tracking" ON public.order_tracking FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can view their order tracking" ON public.order_tracking FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM orders WHERE ((orders.id = order_tracking.order_id) AND (orders.user_id = auth.uid())))));
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view password history" ON public.password_history FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage pathao settings" ON public.pathao_settings FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage product inventory" ON public.product_inventory FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage product reviews" ON public.product_reviews FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Anyone can submit product reviews" ON public.product_reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Approved reviews are viewable by everyone" ON public.product_reviews FOR SELECT TO public USING ((is_approved = true));
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage quick replies" ON public.quick_replies FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Quick replies are viewable by everyone" ON public.quick_replies FOR SELECT TO public USING (true);
CREATE POLICY "Admins can view recovery codes" ON public.recovery_codes FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can manage their own recovery codes" ON public.recovery_codes FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view security settings" ON public.security_settings FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can insert their own security settings" ON public.security_settings FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own security settings" ON public.security_settings FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own security settings" ON public.security_settings FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage shipments" ON public.shipments FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Active shipping rates are viewable by everyone" ON public.shipping_rates FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage shipping rates" ON public.shipping_rates FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Active shipping zones are viewable by everyone" ON public.shipping_zones FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage steadfast settings" ON public.steadfast_settings FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Store settings readable for edge functions" ON public.store_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can create support tickets" ON public.support_tickets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view their own support tickets" ON public.support_tickets FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage ticket replies" ON public.ticket_replies FOR ALL TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can view their ticket replies" ON public.ticket_replies FOR SELECT TO public USING ((EXISTS ( SELECT 1 FROM support_tickets WHERE ((support_tickets.id = ticket_replies.ticket_id) AND (support_tickets.user_id = auth.uid())))));
CREATE POLICY "Admins can view trusted devices" ON public.trusted_devices FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can manage their own trusted devices" ON public.trusted_devices FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view 2FA settings" ON public.two_factor_auth FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can manage their own 2FA" ON public.two_factor_auth FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view user addresses" ON public.user_addresses FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can delete their own addresses" ON public.user_addresses FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own addresses" ON public.user_addresses FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own addresses" ON public.user_addresses FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own addresses" ON public.user_addresses FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_admin_role(auth.uid()));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_admin_role(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_admin_role(auth.uid())) WITH CHECK (has_admin_role(auth.uid()));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view user sessions" ON public.user_sessions FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can delete their own sessions" ON public.user_sessions FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own sessions" ON public.user_sessions FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view wishlists" ON public.wishlists FOR SELECT TO public USING (has_admin_role(auth.uid()));
CREATE POLICY "Users can add to their own wishlist" ON public.wishlists FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can remove from their own wishlist" ON public.wishlists FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own wishlist" ON public.wishlists FOR SELECT TO public USING ((auth.uid() = user_id));

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
