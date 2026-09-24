-- ============================================================
-- Phase 5: Automation and notifications
-- ============================================================

-- Table to track notification preferences per user
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification channels
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  
  -- Notification types
  daily_reminder_enabled boolean DEFAULT true,
  low_stock_alerts_enabled boolean DEFAULT true,
  behind_pace_alerts_enabled boolean DEFAULT true,
  monthly_report_enabled boolean DEFAULT true,
  
  -- Timing preferences
  reminder_time time DEFAULT '08:00:00', -- 8 AM by default
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, user_id)
);

-- RLS for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (true);

-- Table to track notification history (audit trail)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  notification_type text NOT NULL, -- 'daily_reminder', 'low_stock', 'behind_pace', 'monthly_report'
  channel text NOT NULL, -- 'email', 'sms', 'in_app'
  subject text,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

-- Index for querying notification history
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON public.notifications(sent_at);
CREATE INDEX idx_notifications_type ON public.notifications(notification_type);

-- RLS for notifications (users can see their own notifications)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Function to get users who need daily submission reminders
CREATE OR REPLACE FUNCTION public.get_users_needing_daily_reminder()
RETURNS TABLE(
  user_id uuid,
  tenant_id uuid,
  email text,
  full_name text,
  has_submitted_today boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.tenant_id,
    u.email,
    u.full_name,
    EXISTS(
      SELECT 1 FROM public.sales_entries se
      WHERE se.sold_by = u.id
        AND se.sold_at::date = CURRENT_DATE
    ) AS has_submitted_today
  FROM public.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  JOIN public.notification_preferences np ON np.user_id = u.id
  WHERE ur.role = 'sales_rep'
    AND np.daily_reminder_enabled = true
    AND np.email_enabled = true
    AND NOT EXISTS(
      SELECT 1 FROM public.sales_entries se
      WHERE se.sold_by = u.id
        AND se.sold_at::date = CURRENT_DATE
    );
END;
$$;

-- Function to get low stock items requiring alerts
CREATE OR REPLACE FUNCTION public.get_low_stock_items()
RETURNS TABLE(
  product_id uuid,
  tenant_id uuid,
  product_name text,
  stock_on_hand int,
  reorder_level int,
  stock_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.tenant_id,
    p.name AS product_name,
    p.stock_on_hand,
    p.reorder_level,
    CASE 
      WHEN p.reorder_level > 0 THEN ROUND((p.stock_on_hand::numeric / p.reorder_level::numeric) * 100, 2)
      ELSE 100
    END AS stock_percentage
  FROM public.products p
  WHERE p.stock_on_hand <= p.reorder_level
    AND p.reorder_level > 0
  ORDER BY stock_percentage ASC, p.stock_on_hand ASC;
END;
$$;

-- Function to get users behind pace who need alerts
CREATE OR REPLACE FUNCTION public.get_users_behind_pace()
RETURNS TABLE(
  user_id uuid,
  tenant_id uuid,
  full_name text,
  email text,
  target_value numeric,
  achieved_value numeric,
  expected_value numeric,
  behind_by_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_month int := EXTRACT(MONTH FROM CURRENT_DATE);
  _current_year int := EXTRACT(YEAR FROM CURRENT_DATE);
  _day_of_month int := EXTRACT(DAY FROM CURRENT_DATE);
  _days_in_month int := EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'));
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.tenant_id,
    u.full_name,
    u.email,
    t.target_value,
    t.achieved_value,
    (t.target_value * _day_of_month::numeric / _days_in_month::numeric) AS expected_value,
    (
      ((t.target_value * _day_of_month::numeric / _days_in_month::numeric) - t.achieved_value) 
      / NULLIF(t.target_value * _day_of_month::numeric / _days_in_month::numeric, 0)
    ) * 100 AS behind_by_percentage
  FROM public.users u
  JOIN public.targets t ON t.rep_id = u.id
  JOIN public.notification_preferences np ON np.user_id = u.id
  WHERE t.month = _current_month
    AND t.year = _current_year
    AND t.target_value > 0
    AND np.behind_pace_alerts_enabled = true
    AND public.is_behind_pace(t.achieved_value, t.target_value) = true;
END;
$$;

-- Function to send notification (logs to notifications table)
CREATE OR REPLACE FUNCTION public.log_notification(
  _user_id uuid,
  _tenant_id uuid,
  _type text,
  _channel text,
  _subject text,
  _message text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    tenant_id,
    notification_type,
    channel,
    subject,
    message,
    metadata,
    status
  ) VALUES (
    _user_id,
    _tenant_id,
    _type,
    _channel,
    _subject,
    _message,
    _metadata,
    'pending'
  )
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Function to mark notification as sent/failed
CREATE OR REPLACE FUNCTION public.update_notification_status(
  _notification_id uuid,
  _status text,
  _error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    status = _status,
    error_message = _error_message
  WHERE id = _notification_id;
END;
$$;

-- Function to export report as CSV format (simplified for server-side generation)
CREATE OR REPLACE FUNCTION public.export_report_csv(
  _period_start date,
  _period_end date,
  _report_type text DEFAULT 'monthly'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant uuid := public.current_tenant_id();
  _csv_output text := '';
  _row record;
BEGIN
  -- Validate authentication
  IF _tenant IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate permissions (owner or manager only)
  IF NOT (public.current_is_owner() OR public.current_has_role('manager')) THEN
    RAISE EXCEPTION 'Not permitted to export reports';
  END IF;

  -- Build CSV header
  _csv_output := 'Date,Product,Sales Rep,Quantity,Amount,Customer' || E'\n';

  -- Build CSV rows
  FOR _row IN
    SELECT 
      se.sold_at::date AS date,
      p.name AS product,
      u.full_name AS rep,
      se.quantity,
      se.total_amount,
      COALESCE(se.customer_name, '') AS customer
    FROM public.sales_entries se
    JOIN public.products p ON p.id = se.product_id
    JOIN public.users u ON u.id = se.sold_by
    WHERE se.tenant_id = _tenant
      AND se.sold_at::date BETWEEN _period_start AND _period_end
    ORDER BY se.sold_at DESC
  LOOP
    _csv_output := _csv_output || 
      _row.date || ',' ||
      '"' || REPLACE(_row.product, '"', '""') || '",' ||
      '"' || REPLACE(_row.rep, '"', '""') || '",' ||
      _row.quantity || ',' ||
      _row.amount || ',' ||
      '"' || REPLACE(_row.customer, '"', '""') || '"' ||
      E'\n';
  END LOOP;

  -- Log audit entry
  INSERT INTO public.audit_logs (tenant_id, user_id, action, entity, entity_id, details)
  VALUES (
    _tenant,
    auth.uid(),
    'EXPORT',
    'report',
    NULL,
    jsonb_build_object(
      'report_type', _report_type,
      'period_start', _period_start,
      'period_end', _period_end,
      'format', 'csv'
    )
  );

  RETURN _csv_output;
END;
$$;

-- Create default notification preferences for existing users
INSERT INTO public.notification_preferences (tenant_id, user_id)
SELECT DISTINCT u.tenant_id, u.id
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences np
  WHERE np.user_id = u.id
);
