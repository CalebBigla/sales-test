/**
 * Phase 5: Notification and automation server functions
 */

import { createServerFn } from "@tanstack/react-start";
import { supabase } from "../integrations/supabase/client";

/**
 * Get notification preferences for current user
 */
export const getNotificationPreferences = createServerFn()
  .validator((data: void) => data)
  .handler(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === "PGRST116") {
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            tenant_id: user.user_metadata.tenant_id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs;
      }
      throw error;
    }

    return data;
  });

/**
 * Update notification preferences for current user
 */
export const updateNotificationPreferences = createServerFn()
  .validator(
    (data: {
      email_enabled?: boolean;
      sms_enabled?: boolean;
      daily_reminder_enabled?: boolean;
      low_stock_alerts_enabled?: boolean;
      behind_pace_alerts_enabled?: boolean;
      monthly_report_enabled?: boolean;
      reminder_time?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: updated, error } = await supabase
      .from("notification_preferences")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return updated;
  });

/**
 * Get notification history for current user
 */
export const getNotificationHistory = createServerFn()
  .validator((data: { limit?: number } = {}) => data)
  .handler(async ({ data }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(data.limit || 50);

    if (error) throw error;

    return notifications;
  });

/**
 * Export report as CSV
 */
export const exportReportCSV = createServerFn()
  .validator((data: { periodStart: string; periodEnd: string; reportType?: string }) => data)
  .handler(async ({ data }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: csvData, error } = await supabase.rpc("export_report_csv", {
      _period_start: data.periodStart,
      _period_end: data.periodEnd,
      _report_type: data.reportType || "monthly",
    });

    if (error) throw error;

    return csvData as string;
  });

/**
 * Trigger daily submission reminders (for scheduled job)
 * This would typically be called by a cron job or edge function
 */
export const triggerDailyReminders = createServerFn()
  .validator((data: void) => data)
  .handler(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get users needing reminders
    const { data: usersNeedingReminders, error } = await supabase.rpc(
      "get_users_needing_daily_reminder",
    );

    if (error) throw error;

    // In a production environment, this would:
    // 1. Send actual emails via a service like SendGrid, AWS SES, etc.
    // 2. Send SMS via Twilio or similar
    // 3. Create in-app notifications

    // For now, we log the notifications
    const notifications = [];
    for (const user of usersNeedingReminders || []) {
      const { data: notification } = await supabase.rpc("log_notification", {
        _user_id: user.user_id,
        _tenant_id: user.tenant_id,
        _type: "daily_reminder",
        _channel: "email",
        _subject: "Daily Sales Submission Reminder",
        _message: `Hi ${user.full_name}, please remember to submit your sales for today.`,
      });

      notifications.push(notification);
    }

    return {
      count: notifications.length,
      users: usersNeedingReminders,
    };
  });

/**
 * Trigger low stock alerts (for scheduled job)
 */
export const triggerLowStockAlerts = createServerFn()
  .validator((data: void) => data)
  .handler(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get low stock items
    const { data: lowStockItems, error } = await supabase.rpc("get_low_stock_items");

    if (error) throw error;

    if (!lowStockItems || lowStockItems.length === 0) {
      return { count: 0, items: [] };
    }

    // Get storekeepers and managers for each tenant
    const tenantIds = [...new Set(lowStockItems.map((item) => item.tenant_id))];
    const notifications = [];

    for (const tenantId of tenantIds) {
      // Get users who should receive low stock alerts
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, tenant_id")
        .eq("tenant_id", tenantId)
        .in(
          "id",
          (
            await supabase
              .from("user_roles")
              .select("user_id")
              .in("role", ["storekeeper", "manager"])
          ).data?.map((r) => r.user_id) || [],
        );

      if (!users) continue;

      const tenantItems = lowStockItems.filter((item) => item.tenant_id === tenantId);

      for (const targetUser of users) {
        // Check if user has low stock alerts enabled
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("low_stock_alerts_enabled, email_enabled")
          .eq("user_id", targetUser.id)
          .single();

        if (prefs?.low_stock_alerts_enabled && prefs?.email_enabled) {
          const itemsList = tenantItems
            .map(
              (item) =>
                `${item.product_name}: ${item.stock_on_hand} units (${item.stock_percentage}%)`,
            )
            .join("\n");

          const { data: notification } = await supabase.rpc("log_notification", {
            _user_id: targetUser.id,
            _tenant_id: tenantId,
            _type: "low_stock",
            _channel: "email",
            _subject: `Low Stock Alert: ${tenantItems.length} item(s)`,
            _message: `The following items are running low:\n\n${itemsList}`,
            _metadata: { items: tenantItems },
          });

          notifications.push(notification);
        }
      }
    }

    return {
      count: notifications.length,
      items: lowStockItems,
    };
  });

/**
 * Trigger behind pace alerts (for scheduled job)
 */
export const triggerBehindPaceAlerts = createServerFn()
  .validator((data: void) => data)
  .handler(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get users behind pace
    const { data: usersBehindPace, error } = await supabase.rpc("get_users_behind_pace");

    if (error) throw error;

    if (!usersBehindPace || usersBehindPace.length === 0) {
      return { count: 0, users: [] };
    }

    // Send alerts to managers
    const tenantIds = [...new Set(usersBehindPace.map((u) => u.tenant_id))];
    const notifications = [];

    for (const tenantId of tenantIds) {
      // Get managers for this tenant
      const { data: managers } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("tenant_id", tenantId)
        .in(
          "id",
          (await supabase.from("user_roles").select("user_id").eq("role", "manager")).data?.map(
            (r) => r.user_id,
          ) || [],
        );

      if (!managers) continue;

      const tenantUsers = usersBehindPace.filter((u) => u.tenant_id === tenantId);

      for (const manager of managers) {
        // Check if manager has behind pace alerts enabled
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("behind_pace_alerts_enabled, email_enabled")
          .eq("user_id", manager.id)
          .single();

        if (prefs?.behind_pace_alerts_enabled && prefs?.email_enabled) {
          const usersList = tenantUsers
            .map((u) => `${u.full_name}: ${Math.round(u.behind_by_percentage)}% behind pace`)
            .join("\n");

          const { data: notification } = await supabase.rpc("log_notification", {
            _user_id: manager.id,
            _tenant_id: tenantId,
            _type: "behind_pace",
            _channel: "email",
            _subject: `Behind Pace Alert: ${tenantUsers.length} rep(s)`,
            _message: `The following reps are behind pace:\n\n${usersList}`,
            _metadata: { users: tenantUsers },
          });

          notifications.push(notification);
        }
      }
    }

    return {
      count: notifications.length,
      users: usersBehindPace,
    };
  });
