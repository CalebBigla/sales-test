-- Fix for missing sales_entries table
-- Run this in Supabase SQL Editor if sales_entries table is missing

-- Create sales_entries table
CREATE TABLE IF NOT EXISTS public.sales_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  sold_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL,
  total_amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  customer_name text,
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS sales_entries_tenant_sold_at_idx 
  ON public.sales_entries (tenant_id, sold_at DESC);

-- Grant permissions
GRANT SELECT, INSERT ON public.sales_entries TO authenticated;
GRANT ALL ON public.sales_entries TO service_role;

-- Enable RLS
ALTER TABLE public.sales_entries ENABLE ROW LEVEL SECURITY;

-- Create trigger
DROP TRIGGER IF EXISTS sales_entries_touch ON public.sales_entries;
CREATE TRIGGER sales_entries_touch 
  BEFORE UPDATE ON public.sales_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Create SELECT policy
DROP POLICY IF EXISTS sales_entries_select ON public.sales_entries;
CREATE POLICY sales_entries_select ON public.sales_entries
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND (public.current_is_manager_or_owner() OR sold_by = public.current_profile_id())
  );

-- Create INSERT policy
DROP POLICY IF EXISTS sales_entries_insert_rep ON public.sales_entries;
CREATE POLICY sales_entries_insert_rep ON public.sales_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND public.current_has_role('sales_rep')
    AND sold_by = public.current_profile_id()
  );
