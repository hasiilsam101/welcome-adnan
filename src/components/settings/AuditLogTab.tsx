import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  User,
  Activity,
  FileText,
} from "lucide-react";
import { useAuditLog, AuditLogEntry } from "@/hooks/useAuditLog";
import { formatDistanceToNow, format } from "date-fns";

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  export: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  settings_change: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  status_change: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const resourceIcons: Record<string, React.ElementType> = {
  order: FileText,
  product: FileText,
  customer: User,
  settings: Shield,
  user: User,
  default: Activity,
};

export function AuditLogTab() {
  const {
    logs,
    loading,
    filters,
    setFilters,
    page,
    setPage,
    hasMore,
  } = useAuditLog();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.description?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resource_type.toLowerCase().includes(query)
    );
  });

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Audit Log
              </CardTitle>
              <CardDescription>
                Track all admin actions for security and accountability
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions, users, resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <Select
                value={filters.action || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, action: v === "all" ? undefined : v })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="settings_change">Settings</SelectItem>
                  <SelectItem value="status_change">Status Change</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.resource_type || "all"}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    resource_type: v === "all" ? undefined : v,
                  })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="coupon">Coupons</SelectItem>
                  <SelectItem value="category">Categories</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From date"
                className="w-[160px]"
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value || undefined })
                }
              />
              <Input
                type="date"
                placeholder="To date"
                className="w-[160px]"
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value || undefined })
                }
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Log Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No audit logs found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Actions will appear here as staff members interact with the system
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span title={format(new Date(log.created_at), "PPpp")}>
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[120px]">
                              {log.user_email?.split("@")[0] || "System"}
                            </p>
                            {log.user_role && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {log.user_role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || "bg-muted text-muted-foreground"}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const Icon = resourceIcons[log.resource_type] || resourceIcons.default;
                            return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                          })()}
                          <span className="text-sm capitalize">{log.resource_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                          {log.description || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} · {filteredLogs.length} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(Math.max(0, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Activity Summary */}
      <StaffActivitySummary logs={logs} />

      {/* Detail Dialog */}
      <AuditLogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
}

function StaffActivitySummary({ logs }: { logs: AuditLogEntry[] }) {
  // Group by staff member
  const staffMap = new Map<
    string,
    { email: string; role: string; actions: AuditLogEntry[] }
  >();

  logs.forEach((log) => {
    const key = log.user_email || "unknown";
    if (!staffMap.has(key)) {
      staffMap.set(key, { email: key, role: log.user_role || "user", actions: [] });
    }
    staffMap.get(key)!.actions.push(log);
  });

  const staffList = Array.from(staffMap.values()).sort(
    (a, b) => b.actions.length - a.actions.length
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Staff Activity Summary
        </CardTitle>
        <CardDescription>
          See who did what and when — staff member activity overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        {staffList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No staff activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {staffList.map((staff) => {
              const lastAction = staff.actions[0];
              const actionCounts = staff.actions.reduce(
                (acc, a) => {
                  acc[a.action] = (acc[a.action] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              );

              return (
                <div
                  key={staff.email}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{staff.email}</p>
                      <Badge variant="outline" className="text-xs">
                        {staff.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {staff.actions.length} action{staff.actions.length !== 1 ? "s" : ""} recorded
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(actionCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([action, count]) => (
                          <Badge
                            key={action}
                            variant="secondary"
                            className="text-xs"
                          >
                            {action.replace(/_/g, " ")} ({count})
                          </Badge>
                        ))}
                    </div>
                    {lastAction && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last active:{" "}
                        {formatDistanceToNow(new Date(lastAction.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Audit Log Detail
          </DialogTitle>
          <DialogDescription>
            Full details of this action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Action</p>
              <Badge className={actionColors[log.action] || "bg-muted text-muted-foreground"}>
                {log.action.replace(/_/g, " ")}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resource</p>
              <p className="text-sm font-medium capitalize">{log.resource_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">User</p>
              <p className="text-sm font-medium">{log.user_email || "System"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge variant="outline">{log.user_role || "—"}</Badge>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Timestamp</p>
              <p className="text-sm">
                {format(new Date(log.created_at), "PPpp")}
              </p>
            </div>
          </div>

          {log.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{log.description}</p>
            </div>
          )}

          {log.resource_id && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Resource ID</p>
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {log.resource_id}
              </code>
            </div>
          )}

          {log.old_value && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Previous Value</p>
              <pre className="text-xs bg-red-50 dark:bg-red-900/10 p-3 rounded-lg overflow-auto max-h-32">
                {JSON.stringify(log.old_value, null, 2)}
              </pre>
            </div>
          )}

          {log.new_value && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">New Value</p>
              <pre className="text-xs bg-green-50 dark:bg-green-900/10 p-3 rounded-lg overflow-auto max-h-32">
                {JSON.stringify(log.new_value, null, 2)}
              </pre>
            </div>
          )}

          {log.user_agent && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">User Agent</p>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded break-all">
                {log.user_agent}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
