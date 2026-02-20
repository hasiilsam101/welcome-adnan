import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Tag,
  Award,
  Truck,
  MessageSquare,
  FileText,
  Boxes,
  Ticket,
  UserCog,
  User,
  ShoppingBasket,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";

interface CommandRoute {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  const basePath = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/support";

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const routes: CommandRoute[] = useMemo(
    () => [
      { label: "Dashboard", icon: LayoutDashboard, path: `${basePath}/dashboard`, roles: ["admin", "manager", "support"], keywords: ["home", "main"] },
      { label: "Products", icon: Package, path: `${basePath}/products`, roles: ["admin", "manager"], keywords: ["items", "store"] },
      { label: "Orders", icon: ShoppingCart, path: `${basePath}/orders`, roles: ["admin", "manager", "support"], keywords: ["sales", "purchase"] },
      { label: "Customers", icon: Users, path: `${basePath}/customers`, roles: ["admin", "manager", "support"], keywords: ["users", "clients"] },
      { label: "Categories", icon: Tag, path: "/admin/categories", roles: ["admin"] },
      { label: "Brands", icon: Award, path: "/admin/brands", roles: ["admin"], keywords: ["brand", "manufacturer"] },
      { label: "Analytics", icon: BarChart3, path: "/admin/analytics", roles: ["admin"], keywords: ["stats", "chart"] },
      { label: "Shipping", icon: Truck, path: `${role === "admin" ? "/admin" : "/manager"}/shipping`, roles: ["admin", "manager"], keywords: ["delivery", "courier"] },
      { label: "Inventory", icon: Boxes, path: "/admin/inventory", roles: ["admin"], keywords: ["stock"] },
      { label: "Coupons", icon: Ticket, path: `${role === "admin" ? "/admin" : "/manager"}/coupons`, roles: ["admin", "manager"], keywords: ["discount", "promo"] },
      { label: "Messages", icon: MessageSquare, path: `${basePath}/messages`, roles: ["admin", "manager", "support"], keywords: ["chat", "support", "ticket"] },
      { label: "Reports", icon: FileText, path: "/admin/reports", roles: ["admin"] },
      { label: "Abandoned Carts", icon: ShoppingBasket, path: "/admin/abandoned-carts", roles: ["admin"] },
      { label: "Role Management", icon: UserCog, path: "/admin/roles", roles: ["admin"] },
      { label: "Profile", icon: User, path: `${basePath}/profile`, roles: ["admin", "manager", "support"] },
      { label: "Settings", icon: Settings, path: "/admin/settings", roles: ["admin"] },
    ],
    [basePath, role]
  );

  const filteredRoutes = routes.filter((r) => role && r.roles.includes(role));

  const mainRoutes = filteredRoutes.filter((r) =>
    ["Dashboard", "Products", "Orders", "Customers", "Categories", "Brands", "Analytics"].includes(r.label)
  );
  const managementRoutes = filteredRoutes.filter((r) =>
    ["Shipping", "Inventory", "Coupons", "Messages", "Reports", "Abandoned Carts", "Role Management"].includes(r.label)
  );
  const settingsRoutes = filteredRoutes.filter((r) =>
    ["Profile", "Settings"].includes(r.label)
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages... (Type to search)" />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        
        {mainRoutes.length > 0 && (
          <CommandGroup heading="Main Menu">
            {mainRoutes.map((route) => (
              <CommandItem
                key={route.path}
                value={`${route.label} ${(route.keywords || []).join(" ")}`}
                onSelect={() => handleSelect(route.path)}
                className="gap-3 cursor-pointer"
              >
                <route.icon className="h-4 w-4 text-muted-foreground" />
                <span>{route.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {managementRoutes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Management">
              {managementRoutes.map((route) => (
                <CommandItem
                  key={route.path}
                  value={`${route.label} ${(route.keywords || []).join(" ")}`}
                  onSelect={() => handleSelect(route.path)}
                  className="gap-3 cursor-pointer"
                >
                  <route.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{route.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {settingsRoutes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              {settingsRoutes.map((route) => (
                <CommandItem
                  key={route.path}
                  value={`${route.label} ${(route.keywords || []).join(" ")}`}
                  onSelect={() => handleSelect(route.path)}
                  className="gap-3 cursor-pointer"
                >
                  <route.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{route.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
