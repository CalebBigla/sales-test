-- ============================================================
-- Phase 3: Sales entries, target tracking, and progress calculation
-- ============================================================

-- Add UPDATE policy for sales_entries with 24-hour edit window
CREATE POLICY sales_entries_update_rep ON public.sales_entries
  FOR UPDATE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND sold_by = public.current_profile_id()
    AND created_at > (now() - interval '24 hours')
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND sold_by = public.current_profile_id()
    AND created_at > (now() - interval '24 hours')
  );

-- Add DELETE policy for sales_entries with 24-hour edit window
CREATE POLICY sales_entries_delete_rep ON public.sales_entries
  FOR DELETE TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND sold_by = public.current_profile_id()
    AND created_at > (now() - interval '24 hours')
  );

-- Grant UPDATE and DELETE permissions
GRANT UPDATE, DELETE ON public.sales_entries TO authenticated;

-- Atomic sales recording function that updates target progress
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
  _sale_date date := _sold_at::date;
  _period_start date;
  _period_end date;
  _target_id uuid;
BEGIN
  -- Validate authentication
  IF _tenant IS NULL OR _actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate sales rep role
  IF NOT public.current_has_role('sales_rep') THEN
    RAISE EXCEPTION 'Only sales reps can record sales';
  END IF;

  -- Validate product exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = _product_id AND tenant_id = _tenant
  ) THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Insert the sales entry
  INSERT INTO public.sales_entries (
    tenant_id, product_id, sold_by, quantity, 
    unit_price, total_amount, customer_name, sold_at
  )
  VALUES (
    _tenant, _product_id, _actor, _quantity,
    (_total_amount / _quantity), _total_amount, _customer_name, _sold_at
  )
  RETURNING * INTO _entry;

  -- Calculate period (first day of the month to last day)
  _period_start := date_trunc('month', _sale_date)::date;
  _period_end := (date_trunc('month', _sale_date) + interval '1 month' - interval '1 day')::date;

  -- Find or create the target for this rep and month
  SELECT id INTO _target_id
  FROM public.targets
  WHERE tenant_id = _tenant
    AND user_id = _actor
    AND period_start = _period_start
    AND period_end = _period_end
  FOR UPDATE;

  IF _target_id IS NULL THEN
    -- Create a default target with 0 target_amount if none exists
    INSERT INTO public.targets (
      tenant_id, user_id, period_type, period_start, period_end,
      target_amount, currency, status
    )
    VALUES (
      _tenant, _actor, 'monthly', _period_start, _period_end,
      0, 'USD', 'pending'
    )
    RETURNING id INTO _target_id;
  END IF;

  -- Update the target's achieved value (add the new sale)
  UPDATE public.targets
  SET updated_at = now()
  WHERE id = _target_id;

  RETURN _entry;
END;
$$;

REVOKE ALL ON FUNCTION public.record_sale(uuid, integer, numeric, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_sale(uuid, integer, numeric, text, timestamptz) TO authenticated;

-- Function to calculate current achieved value for a target
CREATE OR REPLACE FUNCTION public.get_target_achieved(_target_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(se.total_amount), 0)
  FROM public.targets t
  JOIN public.sales_entries se ON 
    se.tenant_id = t.tenant_id 
    AND se.sold_by = t.user_id
    AND se.sold_at::date BETWEEN t.period_start AND t.period_end
  WHERE t.id = _target_id
    AND t.tenant_id = public.current_tenant_id()
$$;

-- Function to check if a rep is behind pace (>20% behind expected progress)
CREATE OR REPLACE FUNCTION public.is_behind_pace(
  _target_amount numeric,
  _achieved_amount numeric,
  _period_start date,
  _period_end date,
  _current_date date DEFAULT CURRENT_DATE
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  _total_days integer;
  _elapsed_days integer;
  _expected_percentage numeric;
  _actual_percentage numeric;
BEGIN
  -- If target is 0 or negative, can't be behind pace
  IF _target_amount <= 0 THEN
    RETURN false;
  END IF;

  -- Calculate total days in period
  _total_days := _period_end - _period_start + 1;
  
  -- Calculate elapsed days (capped at period end)
  IF _current_date > _period_end THEN
    _elapsed_days := _total_days;
  ELSIF _current_date < _period_start THEN
    _elapsed_days := 0;
  ELSE
    _elapsed_days := _current_date - _period_start + 1;
  END IF;

  -- Calculate expected percentage based on elapsed days
  _expected_percentage := (_elapsed_days::numeric / _total_days::numeric) * 100;
  
  -- Calculate actual achievement percentage
  _actual_percentage := (_achieved_amount / _target_amount) * 100;
  
  -- Behind pace if actual is more than 20 percentage points behind expected
  RETURN (_expected_percentage - _actual_percentage) > 20;
END;
$$;

-- Audit trigger for sales entries
CREATE OR REPLACE FUNCTION public.audit_sales_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      OLD.tenant_id,
      public.current_profile_id(),
      'sale.deleted',
      'sale',
      OLD.id,
      jsonb_build_object(
        'product_id', OLD.product_id,
        'quantity', OLD.quantity,
        'total_amount', OLD.total_amount,
        'sold_at', OLD.sold_at
      )
    );
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.tenant_id,
      public.current_profile_id(),
      CASE WHEN TG_OP = 'INSERT' THEN 'sale.created' ELSE 'sale.updated' END,
      'sale',
      NEW.id,
      jsonb_build_object(
        'product_id', NEW.product_id,
        'quantity', NEW.quantity,
        'total_amount', NEW.total_amount,
        'sold_by', NEW.sold_by,
        'sold_at', NEW.sold_at
      )
    );
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS sales_entries_audit ON public.sales_entries;
CREATE TRIGGER sales_entries_audit
AFTER INSERT OR UPDATE OR DELETE ON public.sales_entries
FOR EACH ROW EXECUTE FUNCTION public.audit_sales_entries();

-- Audit trigger for targets
CREATE OR REPLACE FUNCTION public.audit_targets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.tenant_id,
    public.current_profile_id(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'target.created'
      WHEN NEW.status = 'approved' AND OLD.status <> 'approved' THEN 'target.approved'
      ELSE 'target.updated'
    END,
    'target',
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'period_start', NEW.period_start,
      'period_end', NEW.period_end,
      'target_amount', NEW.target_amount,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS targets_audit ON public.targets;
CREATE TRIGGER targets_audit
AFTER INSERT OR UPDATE ON public.targets
FOR EACH ROW EXECUTE FUNCTION public.audit_targets();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS sales_entries_sold_by_date_idx 
  ON public.sales_entries (sold_by, sold_at DESC);
CREATE INDEX IF NOT EXISTS targets_user_period_idx 
  ON public.targets (user_id, period_start, period_end);
