import { 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  Plus, 
  Search, 
  RefreshCw,
  Truck,
  FileText,
  Ticket,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RoleQuickActionsProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export function RoleQuickActions({ onRefresh, loading }: RoleQuickActionsProps) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const basePath = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/support";

  const handleSync = () => {
    if (onRefresh) {
      onRefresh();
      toast.success("Dashboard data refreshed!");
    }
  };

  // Manager-specific actions
  const managerActions = [
    { label: "Orders", icon: ShoppingCart, onClick: () => navigate(`${basePath}/orders`) },
    { label: "Products", icon: Plus, onClick: () => navigate(`${basePath}/products?action=add`) },
    { label: "Shipping", icon: Truck, onClick: () => navigate(`${basePath}/shipping`) },
    { label: "Coupons", icon: Ticket, onClick: () => navigate(`${basePath}/coupons`) },
    { label: "Messages", icon: MessageSquare, onClick: () => navigate(`${basePath}/messages`) },
    { label: "Customers", icon: Users, onClick: () => navigate(`${basePath}/customers`) },
  ];

  // Support-specific actions
  const supportActions = [
    { label: "Messages/Tickets", icon: MessageSquare, onClick: () => navigate(`${basePath}/messages`) },
    { label: "Find Orders", icon: Search, onClick: () => navigate(`${basePath}/orders`) },
    { label: "Customers", icon: Users, onClick: () => navigate(`${basePath}/customers`) },
  ];

  const actions = role === "support" ? supportActions : managerActions;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs"
            onClick={action.onClick}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={handleSync}
        disabled={loading}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Refresh Dashboard
      </Button>
    </div>
  );
}
