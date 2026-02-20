import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Search, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/hooks/useCustomersData";

const tierConfig = {
  bronze: { color: "bg-amber-700/10 text-amber-700 border-amber-700/20" },
  silver: { color: "bg-slate-400/10 text-slate-500 border-slate-400/20" },
  gold: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  platinum: { color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
};

const getLoyaltyTier = (totalSpent: number): keyof typeof tierConfig => {
  if (totalSpent >= 80000) return "platinum";
  if (totalSpent >= 50000) return "gold";
  if (totalSpent >= 20000) return "silver";
  return "bronze";
};

const getCustomerName = (customer: Customer): string =>
  customer.full_name || customer.email?.split("@")[0] || "Unknown";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

interface CustomerQuickLookupProps {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
}

export function CustomerQuickLookup({ customers, onSelect }: CustomerQuickLookupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (customerId: string) => {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        onSelect(customer);
        setOpen(false);
      }
    },
    [customers, onSelect]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-card text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Quick Search...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search by name, email, phone, or tag..." />
        <CommandList>
          <CommandEmpty>No customers found.</CommandEmpty>
          <CommandGroup heading="Customers">
            {customers.slice(0, 50).map((customer) => {
              const name = getCustomerName(customer);
              const tier = getLoyaltyTier(Number(customer.total_spent));

              return (
                <CommandItem
                  key={customer.id}
                  value={`${name} ${customer.email || ""} ${customer.phone || ""} ${(customer.tags || []).join(" ")}`}
                  onSelect={() => handleSelect(customer.id)}
                  className="flex items-center gap-3 py-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{name}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs gap-0.5 capitalize", tierConfig[tier].color)}
                      >
                        <Crown className="h-2.5 w-2.5" />
                        {tier}
                      </Badge>
                      {customer.status === "blocked" && (
                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                      )}
                      {customer.status === "flagged" && (
                        <Badge className="text-xs bg-yellow-500/20 text-yellow-700">Flagged</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{customer.total_orders} orders</p>
                    <p>৳{Number(customer.total_spent).toLocaleString()}</p>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
