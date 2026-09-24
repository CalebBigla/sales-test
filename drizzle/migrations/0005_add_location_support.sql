-- ============================================================
-- Location Support: Add location field to enable multi-location tracking
-- within a single tenant (e.g., Friscontech Lagos, Abuja, Port Harcourt)
-- ============================================================

-- Add location field to users (which branch they work at)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS location text;

-- Add location field to products (which branch's inventory)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS location text;

-- Add location field to sales_entries (which branch the sale was made at)
ALTER TABLE public.sales_entries 
ADD COLUMN IF NOT EXISTS location text;

-- Add location field to stock_requests (which branch is requesting)
ALTER TABLE public.stock_requests 
ADD COLUMN IF NOT EXISTS location text;

-- Add location field to targets (location-specific targets)
ALTER TABLE public.targets 
ADD COLUMN IF NOT EXISTS location text;

-- Create index for faster location filtering
CREATE INDEX IF NOT EXISTS users_location_idx ON public.users(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_location_idx ON public.products(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_entries_location_idx ON public.sales_entries(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS targets_location_idx ON public.targets(location) WHERE location IS NOT NULL;

-- Function to get revenue by location
CREATE OR REPLACE FUNCTION public.get_revenue_by_location(
  _period_start date DEFAULT DATE_TRUNC('month', CURRENT_DATE)::date,
  _period_end date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  location text,
  revenue numeric,
  sales_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant uuid := public.current_tenant_id();
BEGIN
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (public.current_is_owner() OR public.current_has_role('manager')) THEN
    RAISE EXCEPTION 'Not permitted to view revenue by location';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(se.location, 'Not Assigned') AS location,
    SUM(se.total_amount) AS revenue,
    COUNT(*)::bigint AS sales_count
  FROM public.sales_entries se
  WHERE se.tenant_id = _tenant
    AND se.sold_at::date BETWEEN _period_start AND _period_end
  GROUP BY se.location
  ORDER BY revenue DESC;
END;
$$;

-- Function to get rep performance by location
CREATE OR REPLACE FUNCTION public.get_rep_performance_by_location(
  _location text DEFAULT NULL
)
RETURNS TABLE(
  rep_id uuid,
  rep_name text,
  rep_location text,
  sales_count bigint,
  total_revenue numeric,
  target_amount numeric,
  achievement_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant uuid := public.current_tenant_id();
  _current_month int := EXTRACT(MONTH FROM CURRENT_DATE);
  _current_year int := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (public.current_is_owner() OR public.current_has_role('manager')) THEN
    RAISE EXCEPTION 'Not permitted to view rep performance';
  END IF;

  RETURN QUERY
  SELECT 
    u.id AS rep_id,
    u.full_name AS rep_name,
    u.location AS rep_location,
    COUNT(se.id)::bigint AS sales_count,
    COALESCE(SUM(se.total_amount), 0) AS total_revenue,
    COALESCE(t.target_amount, 0) AS target_amount,
    CASE 
      WHEN COALESCE(t.target_amount, 0) > 0 THEN
        ROUND((COALESCE(SUM(se.total_amount), 0) / t.target_amount) * 100, 2)
      ELSE 0
    END AS achievement_percentage
  FROM public.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  LEFT JOIN public.sales_entries se ON se.sold_by = u.id 
    AND se.sold_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND se.sold_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  LEFT JOIN public.targets t ON t.user_id = u.id
    AND EXTRACT(MONTH FROM t.period_start) = _current_month
    AND EXTRACT(YEAR FROM t.period_start) = _current_year
  WHERE u.tenant_id = _tenant
    AND ur.role = 'sales_rep'
    AND (_location IS NULL OR u.location = _location)
  GROUP BY u.id, u.full_name, u.location, t.target_amount
  ORDER BY total_revenue DESC;
END;
$$;

-- Function to get inventory by location
CREATE OR REPLACE FUNCTION public.get_inventory_by_location(
  _location text DEFAULT NULL
)
RETURNS TABLE(
  location text,
  product_id uuid,
  product_name text,
  stock_on_hand integer,
  reorder_level integer,
  stock_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant uuid := public.current_tenant_id();
BEGIN
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(p.location, 'Not Assigned') AS location,
    p.id AS product_id,
    p.name AS product_name,
    p.stock_on_hand,
    p.reorder_level,
    CASE 
      WHEN p.stock_on_hand = 0 THEN 'Out of Stock'
      WHEN p.stock_on_hand <= p.reorder_level THEN 'Low Stock'
      ELSE 'In Stock'
    END AS stock_status
  FROM public.products p
  WHERE p.tenant_id = _tenant
    AND (_location IS NULL OR p.location = _location)
  ORDER BY 
    CASE 
      WHEN p.stock_on_hand = 0 THEN 1
      WHEN p.stock_on_hand <= p.reorder_level THEN 2
      ELSE 3
    END,
    p.name;
END;
$$;

-- Update record_sale function to include location from user profile
CREATE OR REPLACE FUNCTION public.record_sale(
  _product_id uuid,
  _quantity integer,
  _total_amount numeric,
  _customer_name text DEFAULT NULL,
  _sold_at timestamptz DEFAULT now()
)
RETURNS public.sales_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _entry public.sales_entries;
  _tenant uuid := public.current_tenant_id();
  _actor uuid := public.current_profile_id();
  _user_location text;
  _sale_date date := _sold_at::date;
  _period_start date;
  _period_end date;
BEGIN
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.current_has_role('sales_rep') THEN
    RAISE EXCEPTION 'Only sales reps can record sales';
  END IF;

  -- Get user's location
  SELECT location INTO _user_location
  FROM public.users
  WHERE id = _actor;

  -- Calculate period dates (current month)
  _period_start := DATE_TRUNC('month', _sale_date)::date;
  _period_end := (DATE_TRUNC('month', _sale_date) + INTERVAL '1 month' - INTERVAL '1 day')::date;

  -- Insert sale with location
  INSERT INTO public.sales_entries (
    tenant_id,
    product_id,
    sold_by,
    quantity,
    unit_price,
    total_amount,
    customer_name,
    sold_at,
    location
  ) VALUES (
    _tenant,
    _product_id,
    _actor,
    _quantity,
    _total_amount / _quantity,
    _total_amount,
    _customer_name,
    _sold_at,
    _user_location
  )
  RETURNING * INTO _entry;

  -- Update target progress
  UPDATE public.targets
  SET target_amount = target_amount + _total_amount
  WHERE tenant_id = _tenant
    AND user_id = _actor
    AND period_start = _period_start
    AND period_end = _period_end;

  -- Log audit entry
  INSERT INTO public.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    _tenant,
    _actor,
    'sale.recorded',
    'sales_entries',
    _entry.id,
    jsonb_build_object(
      'amount', _total_amount,
      'quantity', _quantity,
      'location', _user_location
    )
  );

  RETURN _entry;
END;
$$;

COMMENT ON COLUMN public.users.location IS 'Physical location/branch where user works (e.g., Lagos, Abuja, Port Harcourt)';
COMMENT ON COLUMN public.products.location IS 'Physical location/branch where inventory is stored';
COMMENT ON COLUMN public.sales_entries.location IS 'Location where sale was made';
COMMENT ON COLUMN public.targets.location IS 'Location-specific target (optional)';
