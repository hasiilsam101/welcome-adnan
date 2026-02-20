import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  customers: "Customers",
  categories: "Categories",
  analytics: "Analytics",
  shipping: "Shipping",
  inventory: "Inventory",
  coupons: "Coupons",
  messages: "Messages",
  reports: "Reports",
  roles: "Roles",
  profile: "Profile",
  settings: "Settings",
  "abandoned-carts": "Abandoned Carts",
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const { role } = useAuth();
  const { t } = useLanguage();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Skip if we're at root or only have role prefix
  if (pathSegments.length <= 1) return null;

  // The first segment is the role prefix (admin/manager/support)
  const rolePrefix = pathSegments[0];
  const pageSegments = pathSegments.slice(1);

  const basePath = `/${rolePrefix}`;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link
        to={`${basePath}/dashboard`}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {rolePrefix === "admin" ? "Admin" : rolePrefix === "manager" ? "Manager" : "Support"}
        </span>
      </Link>
      {pageSegments.map((segment, index) => {
        const path = `${basePath}/${pageSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === pageSegments.length - 1;
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
