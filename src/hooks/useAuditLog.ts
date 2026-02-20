import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string | null;
  old_value: any;
  new_value: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  user_email?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      if (filters.action) {
        query = query.eq("action", filters.action);
      }
      if (filters.resource_type) {
        query = query.eq("resource_type", filters.resource_type);
      }
      if (filters.user_email) {
        query = query.ilike("user_email", `%${filters.user_email}%`);
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      const entries = (data || []) as AuditLogEntry[];
      setHasMore(entries.length === pageSize);

      if (reset) {
        setLogs(entries);
        setPage(0);
      } else {
        setLogs(entries);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs(true);
  }, [filters]);

  useEffect(() => {
    if (page > 0) fetchLogs();
  }, [page]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("audit-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const newEntry = payload.new as AuditLogEntry;
          setLogs((prev) => [newEntry, ...prev].slice(0, pageSize));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const logAction = async (params: {
    action: string;
    resource_type: string;
    resource_id?: string;
    description?: string;
    old_value?: any;
    new_value?: any;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email,
        user_role: roleData?.role || "user",
        action: params.action,
        resource_type: params.resource_type,
        resource_id: params.resource_id || null,
        description: params.description || null,
        old_value: params.old_value || null,
        new_value: params.new_value || null,
        user_agent: navigator.userAgent,
      } as any);
    } catch (error) {
      console.error("Error logging audit action:", error);
    }
  };

  // Get unique values for filter dropdowns
  const actionTypes = [...new Set(logs.map((l) => l.action))];
  const resourceTypes = [...new Set(logs.map((l) => l.resource_type))];
  const staffMembers = [...new Set(logs.filter((l) => l.user_email).map((l) => l.user_email!))];

  return {
    logs,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    hasMore,
    refetch: () => fetchLogs(true),
    logAction,
    actionTypes,
    resourceTypes,
    staffMembers,
  };
}
