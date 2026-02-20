import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { RefreshCw } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { SalesChart } from "@/components/admin/SalesChart";
import { TopProducts } from "@/components/admin/TopProducts";
import { DateRangeSelector, DateRangePreset } from "@/components/admin/DateRangeSelector";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { DashboardWidget } from "@/components/admin/DashboardWidget";
import { AgentWorkloadStats } from "@/components/admin/AgentWorkloadStats";
import { AssignedToMeWidget } from "@/components/admin/AssignedToMeWidget";
import { ShiftSummaryWidget } from "@/components/admin/ShiftSummaryWidget";
import { RoleQuickActions } from "@/components/admin/RoleQuickActions";
import { PriorityQueue } from "@/components/admin/PriorityQueue";
import { ManagerApprovalQueue } from "@/components/admin/ManagerApprovalQueue";
import { SupportKeyboardShortcuts } from "@/components/admin/SupportKeyboardShortcuts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/admin/StatsCard";
import { ShoppingCart, Package, Users, TrendingUp, AlertCircle, Clock } from "lucide-react";

const RoleDashboard = () => {
  const { role, user } = useAuth();
  const { t } = useLanguage();
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last30days");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();

  const {
    stats,
    recentOrders,
    topProducts,
    salesData,
    loading,
    refetch,
    dateRange,
  } = useDashboardData(dateRangePreset, customRange);

  const handleDateRangeChange = (preset: DateRangePreset, range?: { from: Date; to: Date }) => {
    setDateRangePreset(preset);
    if (range) setCustomRange(range);
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

  const greetingName = user?.user_metadata?.full_name?.split(" ")[0] || "User";
  const roleLabel = role === "manager" ? "Manager" : "Support Agent";

  // Stats cards data
  const statsData = [
    { title: t("dashboard.totalSales"), value: formatCurrency(stats.totalSales), change: stats.salesChange, icon: TrendingUp, iconBg: "accent" as const },
    { title: t("dashboard.totalOrders"), value: stats.totalOrders.toString(), change: stats.ordersChange, icon: ShoppingCart, iconBg: "primary" as const },
    { title: t("dashboard.totalProducts"), value: stats.totalProducts.toString(), change: stats.productsChange, icon: Package, iconBg: "warning" as const },
    { title: t("dashboard.totalCustomers"), value: stats.totalCustomers.toString(), change: stats.customersChange, icon: Users, iconBg: "success" as const },
  ];

  // --- Manager Dashboard ---
  if (role === "manager") {
    return (
      <AdminLayout>
        {/* Keyboard Shortcuts */}
        <SupportKeyboardShortcuts />
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Welcome, {greetingName}! 👋
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {roleLabel} Dashboard — View today's activities
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <DateRangeSelector
                value={dateRangePreset}
                customRange={customRange}
                onChange={handleDateRangeChange}
              />
              <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
          {/* Stats Cards */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
                : statsData.map((stat) => <StatsCard key={stat.title} {...stat} />)}
            </div>
          </div>

          {/* Alerts */}
          {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
            <div className="lg:col-span-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.pendingOrders > 0 && (
                  <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
                    <Clock className="h-5 w-5 text-warning" />
                    <span className="text-sm font-medium">{stats.pendingOrders} pending orders need attention</span>
                  </div>
                )}
                {stats.lowStockProducts > 0 && (
                  <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium">{stats.lowStockProducts} products low on stock</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned to Me */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">📌 Assigned to Me</h3>
              <AssignedToMeWidget />
            </div>
          </div>

          {/* Team Performance */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">👥 Team Performance</h3>
              <AgentWorkloadStats />
            </div>
          </div>

          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">📈 Sales Chart</h3>
              <SalesChart data={salesData} loading={loading} />
            </div>
          </div>

          {/* Shift Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">📋 Shift Report</h3>
              <ShiftSummaryWidget />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">⚡ Quick Actions</h3>
              <RoleQuickActions onRefresh={refetch} loading={loading} />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">🛒 Recent Orders</h3>
              <RecentOrders orders={recentOrders} loading={loading} />
            </div>
          </div>

          {/* Priority Queue */}
          <div className="lg:col-span-2">
            <PriorityQueue />
          </div>

          {/* Approval Queue */}
          <div className="lg:col-span-2">
            <ManagerApprovalQueue />
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <ActivityFeed limit={8} />
          </div>
        </div>
      </AdminLayout>
    );
  }

  // --- Support Dashboard ---
    return (
    <AdminLayout>
      {/* Keyboard Shortcuts */}
      <SupportKeyboardShortcuts />
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Welcome, {greetingName}! 👋
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Support Dashboard — Manage customer support
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Assigned to Me - Primary focus */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">📌 Assigned to Me</h3>
            <AssignedToMeWidget />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">⚡ Quick Actions</h3>
            <RoleQuickActions onRefresh={refetch} loading={loading} />
          </div>
        </div>

        {/* Shift Summary */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">📋 Today's Shift</h3>
            <ShiftSummaryWidget />
          </div>
        </div>

        {/* Priority Queue */}
        <div className="lg:col-span-2">
          <PriorityQueue />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed limit={8} />
        </div>

        {/* Recent Orders (read-only context) */}
        <div className="lg:col-span-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">🛒 Recent Orders</h3>
            <RecentOrders orders={recentOrders} loading={loading} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RoleDashboard;
