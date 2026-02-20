import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Merge,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/hooks/useCustomersData";

interface DuplicateGroup {
  key: string;
  matchType: "email" | "phone" | "name";
  customers: Customer[];
}

interface MergeCustomersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onMerge: (primaryId: string, duplicateIds: string[]) => Promise<void>;
}

const getCustomerName = (customer: Customer): string => {
  return customer.full_name || customer.email?.split("@")[0] || "Unknown";
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export function MergeCustomersModal({
  open,
  onOpenChange,
  customers,
  onMerge,
}: MergeCustomersModalProps) {
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [merging, setMerging] = useState(false);

  // Find duplicate groups
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    // Group by email
    const emailMap = new Map<string, Customer[]>();
    customers.forEach((c) => {
      if (c.email) {
        const key = c.email.toLowerCase().trim();
        if (!emailMap.has(key)) emailMap.set(key, []);
        emailMap.get(key)!.push(c);
      }
    });
    emailMap.forEach((custs, email) => {
      if (custs.length > 1) {
        groups.push({
          key: `email:${email}`,
          matchType: "email",
          customers: custs,
        });
        custs.forEach((c) => processed.add(c.id));
      }
    });

    // Group by phone (exclude already processed)
    const phoneMap = new Map<string, Customer[]>();
    customers.forEach((c) => {
      if (c.phone && !processed.has(c.id)) {
        const key = c.phone.replace(/\D/g, "");
        if (key.length >= 8) {
          if (!phoneMap.has(key)) phoneMap.set(key, []);
          phoneMap.get(key)!.push(c);
        }
      }
    });
    phoneMap.forEach((custs, phone) => {
      if (custs.length > 1) {
        groups.push({
          key: `phone:${phone}`,
          matchType: "phone",
          customers: custs,
        });
        custs.forEach((c) => processed.add(c.id));
      }
    });

    // Group by exact name (exclude already processed)
    const nameMap = new Map<string, Customer[]>();
    customers.forEach((c) => {
      if (c.full_name && !processed.has(c.id)) {
        const key = c.full_name.toLowerCase().trim();
        if (key.length > 2) {
          if (!nameMap.has(key)) nameMap.set(key, []);
          nameMap.get(key)!.push(c);
        }
      }
    });
    nameMap.forEach((custs, name) => {
      if (custs.length > 1) {
        groups.push({
          key: `name:${name}`,
          matchType: "name",
          customers: custs,
        });
      }
    });

    return groups;
  }, [customers]);

  const handleSelectGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    // Default to the customer with most orders as primary
    const sorted = [...group.customers].sort(
      (a, b) => b.total_orders - a.total_orders
    );
    setPrimaryId(sorted[0].id);
  };

  const handleMerge = async () => {
    if (!primaryId || !selectedGroup) return;
    const duplicateIds = selectedGroup.customers
      .filter((c) => c.id !== primaryId)
      .map((c) => c.id);
    
    setMerging(true);
    try {
      await onMerge(primaryId, duplicateIds);
      setSelectedGroup(null);
      setPrimaryId(null);
      setConfirmOpen(false);
    } finally {
      setMerging(false);
    }
  };

  const matchTypeLabels = {
    email: "Same Email",
    phone: "Same Phone",
    name: "Same Name",
  };

  const matchTypeColors = {
    email: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    phone: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    name: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5" />
              Merge Duplicate Customers
            </DialogTitle>
            <DialogDescription>
              {duplicateGroups.length} potential duplicate group(s) found
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-semibold text-lg">No Duplicates Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All customer records appear to be unique
                </p>
              </div>
            ) : selectedGroup ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(null);
                    setPrimaryId(null);
                  }}
                >
                  ← Back to list
                </Button>

                <div className="flex items-center gap-2 mb-2">
                  <Badge className={matchTypeColors[selectedGroup.matchType]}>
                    {matchTypeLabels[selectedGroup.matchType]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Select the primary record to keep
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedGroup.customers.map((customer) => {
                    const name = getCustomerName(customer);
                    const isPrimary = primaryId === customer.id;

                    return (
                      <Card
                        key={customer.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isPrimary
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30"
                        )}
                        onClick={() => setPrimaryId(customer.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{name}</p>
                                {isPrimary && (
                                  <Badge variant="default" className="text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                <span>{customer.email || "No email"}</span>
                                <span>{customer.phone || "No phone"}</span>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium">
                                {customer.total_orders} orders
                              </p>
                              <p className="text-muted-foreground">
                                ৳{Number(customer.total_spent).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!isPrimary && primaryId && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                              <ArrowRight className="h-3 w-3" />
                              <span>Will be merged into primary record</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Separator />

                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-400">
                      Merge Warning
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-500 mt-1">
                      Orders from duplicate records will be reassigned to the
                      primary customer. Duplicate records will be deleted. This
                      action cannot be undone.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!primaryId}
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Merge{" "}
                  {selectedGroup.customers.length - 1} Duplicate(s) into
                  Primary
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {duplicateGroups.map((group) => (
                  <Card
                    key={group.key}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleSelectGroup(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {group.customers.slice(0, 3).map((c) => (
                              <Avatar
                                key={c.id}
                                className="h-8 w-8 border-2 border-card"
                              >
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(getCustomerName(c))}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <div>
                            <p className="font-medium">
                              {group.customers
                                .map((c) => getCustomerName(c))
                                .join(", ")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  matchTypeColors[group.matchType]
                                )}
                              >
                                {matchTypeLabels[group.matchType]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {group.customers.length} records
                              </span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Merge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to merge{" "}
              {selectedGroup
                ? selectedGroup.customers.length - 1
                : 0}{" "}
              duplicate record(s) into the primary customer? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={merging}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMerge} disabled={merging}>
              {merging ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Merge className="h-4 w-4 mr-2" />
              )}
              Merge Customers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
