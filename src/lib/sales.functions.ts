import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SalesEntry = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string | null;
  soldAt: string;
  createdAt: string;
  canEdit: boolean;
};

export type TargetWithProgress = {
  id: string;
  userId: string;
  userName: string;
  periodStart: string;
  periodEnd: string;
  targetAmount: number;
  achievedAmount: number;
  percentage: number;
  remaining: number;
  status: string;
  isBehindPace: boolean;
};

/** Record a sale atomically with automatic target tracking */
export const recordSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive().max(100000),
        totalAmount: z.number().positive().max(999999999.99),
        customerName: z.string().trim().max(200).optional(),
        soldAt: z.string().datetime().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("record_sale", {
      _product_id: data.productId,
      _quantity: data.quantity,
      _total_amount: data.totalAmount,
      _customer_name: data.customerName ?? null,
      _sold_at: data.soldAt ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** List sales entries for the current user (sales rep view) */
export const listMySales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SalesEntry[]> => {
    const { data: profile } = await context.supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", context.userId)
      .single();

    if (!profile) throw new Error("Profile not found");

    const { data, error } = await context.supabase
      .from("sales_entries")
      .select(
        "id, product_id, quantity, unit_price, total_amount, customer_name, sold_at, created_at, products(name)",
      )
      .eq("sold_by", profile.id)
      .order("sold_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    type Joined = { products: { name: string } | null };
    const now = new Date();

    return (data ?? []).map((s) => {
      const row = s as unknown as Joined;
      const createdAt = new Date(s.created_at);
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      return {
        id: s.id,
        productId: s.product_id,
        productName: row.products?.name ?? "Unknown",
        quantity: s.quantity,
        unitPrice: Number(s.unit_price),
        totalAmount: Number(s.total_amount),
        customerName: s.customer_name,
        soldAt: s.sold_at,
        createdAt: s.created_at,
        canEdit: hoursSinceCreation < 24,
      };
    });
  });

/** Update a sales entry (within 24-hour window) */
export const updateSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        quantity: z.number().int().positive().max(100000),
        totalAmount: z.number().positive().max(999999999.99),
        customerName: z.string().trim().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("sales_entries")
      .update({
        quantity: data.quantity,
        unit_price: data.totalAmount / data.quantity,
        total_amount: data.totalAmount,
        customer_name: data.customerName ?? null,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Delete a sales entry (within 24-hour window) */
export const deleteSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("sales_entries").delete().eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Get my current month's target with progress */
export const getMyTarget = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TargetWithProgress | null> => {
    const { data: profile } = await context.supabase
      .from("users")
      .select("id, full_name, email")
      .eq("auth_user_id", context.userId)
      .single();

    if (!profile) throw new Error("Profile not found");

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: target } = await context.supabase
      .from("targets")
      .select("id, user_id, period_start, period_end, target_amount, status")
      .eq("user_id", profile.id)
      .eq("period_start", periodStart.toISOString().split("T")[0])
      .eq("period_end", periodEnd.toISOString().split("T")[0])
      .single();

    if (!target) return null;

    // Get achieved amount by calling the function
    const { data: achievedData } = await context.supabase.rpc("get_target_achieved", {
      _target_id: target.id,
    });

    const achievedAmount = Number(achievedData ?? 0);
    const targetAmount = Number(target.target_amount);
    const percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
    const remaining = Math.max(0, targetAmount - achievedAmount);

    // Check if behind pace
    const { data: behindPaceData } = await context.supabase.rpc("is_behind_pace", {
      _target_amount: targetAmount,
      _achieved_amount: achievedAmount,
      _period_start: target.period_start,
      _period_end: target.period_end,
      _current_date: now.toISOString().split("T")[0],
    });

    return {
      id: target.id,
      userId: target.user_id,
      userName: profile.full_name ?? profile.email,
      periodStart: target.period_start,
      periodEnd: target.period_end,
      targetAmount,
      achievedAmount,
      percentage: Math.min(100, percentage),
      remaining,
      status: target.status,
      isBehindPace: behindPaceData ?? false,
    };
  });

/** Get today's fulfillment count for storekeeper */
export const getTodayFulfilmentCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await context.supabase
      .from("stock_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "fulfilled")
      .gte("reviewed_at", `${today}T00:00:00`)
      .lt("reviewed_at", `${today}T23:59:59`);

    if (error) throw new Error(error.message);
    return count ?? 0;
  });

/** List all targets with progress (manager/owner view) */
export const listTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TargetWithProgress[]> => {
    const { data: targets, error } = await context.supabase
      .from("targets")
      .select(
        "id, user_id, period_start, period_end, target_amount, status, users(full_name, email)",
      )
      .order("period_start", { ascending: false })
      .order("user_id");

    if (error) throw new Error(error.message);

    type Joined = { users: { full_name: string | null; email: string } | null };

    const results = await Promise.all(
      (targets ?? []).map(async (t) => {
        const row = t as unknown as Joined;

        const { data: achievedData } = await context.supabase.rpc("get_target_achieved", {
          _target_id: t.id,
        });

        const achievedAmount = Number(achievedData ?? 0);
        const targetAmount = Number(t.target_amount);
        const percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;
        const remaining = Math.max(0, targetAmount - achievedAmount);

        const { data: behindPaceData } = await context.supabase.rpc("is_behind_pace", {
          _target_amount: targetAmount,
          _achieved_amount: achievedAmount,
          _period_start: t.period_start,
          _period_end: t.period_end,
          _current_date: new Date().toISOString().split("T")[0],
        });

        return {
          id: t.id,
          userId: t.user_id,
          userName: row.users?.full_name ?? row.users?.email ?? "Unknown",
          periodStart: t.period_start,
          periodEnd: t.period_end,
          targetAmount,
          achievedAmount,
          percentage: Math.min(100, percentage),
          remaining,
          status: t.status,
          isBehindPace: behindPaceData ?? false,
        };
      }),
    );

    return results;
  });

/** Create or update a target (manager/owner only) */
export const setTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        targetAmount: z.number().nonnegative().max(999999999.99),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: profile } = await context.supabase
      .from("users")
      .select("id, tenant_id")
      .eq("auth_user_id", context.userId)
      .single();

    if (!profile) throw new Error("Profile not found");

    // Check if target already exists
    const { data: existing } = await context.supabase
      .from("targets")
      .select("id")
      .eq("user_id", data.userId)
      .eq("period_start", data.periodStart)
      .eq("period_end", data.periodEnd)
      .single();

    if (existing) {
      // Update existing target
      const { error } = await context.supabase
        .from("targets")
        .update({
          target_amount: data.targetAmount,
        })
        .eq("id", existing.id);

      if (error) throw new Error(error.message);
    } else {
      // Create new target
      const { error } = await context.supabase.from("targets").insert({
        tenant_id: profile.tenant_id,
        user_id: data.userId,
        period_type: "monthly",
        period_start: data.periodStart,
        period_end: data.periodEnd,
        target_amount: data.targetAmount,
        created_by: profile.id,
      });

      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

/** Get daily submission tracker - who submitted today */
export const getDailySubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().split("T")[0];

    // Get all sales reps in the tenant
    const { data: reps, error: repsError } = await context.supabase
      .from("user_roles")
      .select("users(id, full_name, email)")
      .eq("role", "sales_rep");

    if (repsError) throw new Error(repsError.message);

    type RepRow = { users: { id: string; full_name: string | null; email: string } | null };

    const repList = (reps ?? [])
      .map((r) => (r as unknown as RepRow).users)
      .filter((u): u is NonNullable<typeof u> => u !== null);

    // Check submissions for today
    const results = await Promise.all(
      repList.map(async (rep) => {
        const { count } = await context.supabase
          .from("sales_entries")
          .select("*", { count: "exact", head: true })
          .eq("sold_by", rep.id)
          .gte("sold_at", `${today}T00:00:00`)
          .lt("sold_at", `${today}T23:59:59`);

        return {
          repId: rep.id,
          repName: rep.full_name ?? rep.email,
          submitted: (count ?? 0) > 0,
        };
      }),
    );

    return results;
  });

/** Get revenue MTD vs target for owner dashboard */
export const getRevenueMTD = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    // Get total revenue this month
    const { data: sales } = await context.supabase
      .from("sales_entries")
      .select("total_amount")
      .gte("sold_at", monthStart);

    const revenue = (sales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0);

    // Get total target for this month
    const { data: targets } = await context.supabase
      .from("targets")
      .select("target_amount")
      .eq("period_start", monthStart);

    const target = (targets ?? []).reduce((sum, t) => sum + Number(t.target_amount), 0);

    return {
      revenue,
      target,
      percentage: target > 0 ? (revenue / target) * 100 : 0,
    };
  });

/** Get submission compliance percentage */
export const getSubmissionCompliance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const today = new Date().toISOString().split("T")[0];

    // Get all sales reps in the tenant
    const { data: reps, error: repsError } = await context.supabase
      .from("user_roles")
      .select("users(id)")
      .eq("role", "sales_rep");

    if (repsError || !reps || reps.length === 0) return 100;

    type RepRow = { users: { id: string } | null };
    const repList = (reps as unknown as RepRow[])
      .map((r) => r.users)
      .filter((u): u is NonNullable<typeof u> => u !== null);

    if (repList.length === 0) return 100;

    // Count how many submitted today
    let submittedCount = 0;
    for (const rep of repList) {
      const { count } = await context.supabase
        .from("sales_entries")
        .select("*", { count: "exact", head: true })
        .eq("sold_by", rep.id)
        .gte("sold_at", `${today}T00:00:00`)
        .lt("sold_at", `${today}T23:59:59`);

      if ((count ?? 0) > 0) submittedCount++;
    }

    return Math.round((submittedCount / repList.length) * 100);
  });

/** Get inventory health count */
export const getInventoryHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { count, error } = await context.supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lte("stock_on_hand", "reorder_level")
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    return count ?? 0;
  });

/** Get pending approvals count */
export const getPendingApprovalsCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { count, error } = await context.supabase
      .from("stock_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) throw new Error(error.message);
    return count ?? 0;
  });

/** Generate report data for export */
export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reportType: z.enum(["monthly", "weekly", "custom"]).default("monthly"),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: reportData, error } = await context.supabase.rpc("get_report_data", {
      _period_start: data.periodStart,
      _period_end: data.periodEnd,
      _report_type: data.reportType,
    });

    if (error) throw new Error(error.message);
    return reportData;
  });

/** Get recent audit log entries */
export const getRecentAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_recent_audit_logs", {
      _limit: 5,
    });

    if (error) throw new Error(error.message);
    return data ?? [];
  });
