-- ============================================================
-- Phase 4: Reporting and dashboard enhancements
-- ============================================================

-- Function to generate report data (aggregation only, export formatting done client-side for now)
CREATE OR REPLACE FUNCTION public.get_report_data(
  _period_start date,
  _period_end date,
  _report_type text DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant uuid := public.current_tenant_id();
  _result jsonb;
  _sales_data jsonb;
  _targets_data jsonb;
  _stock_data jsonb;
BEGIN
  -- Validate authentication
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate permissions (owner or manager only)
  IF NOT (public.current_is_owner() OR public.current_has_role('manager')) THEN
    RAISE EXCEPTION 'Not permitted to generate reports';
  END IF;

  -- Aggregate sales entries
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', sold_at::date,
      'product', p.name,
      'rep', u.full_name,
      'quantity', se.quantity,
      'amount', se.total_amount,
      'customer', se.customer_name
    )
  ) INTO _sales_data
  FROM public.sales_entries se
  JOIN public.products p ON p.id = se.product_id
  JOIN public.users u ON u.id = se.sold_by
  WHERE se.tenant_id = _tenant
    AND se.sold_at::date BETWEEN _period_start AND _period_end
  ORDER BY se.sold_at DESC;

  -- Aggregate targets
  SELECT jsonb_agg(
    jsonb_build_object(
      'rep', u.full_name,
      'target', t.target_amount,
      'status', t.status,
      'period_start', t.period_start,
      'period_end', t.period_end
    )
  ) INTO _targets_data
  FROM public.targets t
  JOIN public.users u ON u.id = t.user_id
  WHERE t.tenant_id = _tenant
    AND t.period_start >= _period_start
    AND t.period_end <= _period_end;

  -- Aggregate stock levels
  SELECT jsonb_agg(
    jsonb_build_object(
      'product', name,
      'sku', sku,
      'stock_on_hand', stock_on_hand,
      'reorder_level', reorder_level,
      'low_stock', stock_on_hand <= reorder_level
    )
  ) INTO _stock_data
  FROM public.products
  WHERE tenant_id = _tenant
    AND is_active = true
  ORDER BY name;

  -- Build result
  _result := jsonb_build_object(
    'period_start', _period_start,
    'period_end', _period_end,
    'generated_at', now(),
    'report_type', _report_type,
    'sales', COALESCE(_sales_data, '[]'::jsonb),
    'targets', COALESCE(_targets_data, '[]'::jsonb),
    'stock', COALESCE(_stock_data, '[]'::jsonb)
  );

  -- Log report generation in audit
  INSERT INTO public.audit_logs (tenant_id, actor_id, action, entity_type, metadata)
  VALUES (
    _tenant,
    public.current_profile_id(),
    'report.generated',
    'report',
    jsonb_build_object(
      'period_start', _period_start,
      'period_end', _period_end,
      'report_type', _report_type
    )
  );

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_report_data(date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_report_data(date, date, text) TO authenticated;

-- View for recent audit log entries (last 5 for owner dashboard)
CREATE OR REPLACE FUNCTION public.get_recent_audit_logs(_limit integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  action text,
  entity_type text,
  actor_name text,
  created_at timestamptz
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
    RAISE EXCEPTION 'Not permitted to view audit logs';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.entity_type,
    COALESCE(u.full_name, u.email, 'System') as actor_name,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.users u ON u.id = al.actor_id
  WHERE al.tenant_id = _tenant
  ORDER BY al.created_at DESC
  LIMIT _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_recent_audit_logs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recent_audit_logs(integer) TO authenticated;
