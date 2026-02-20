import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
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
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  LayoutTemplate,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const { t } = useLanguage();
  const { signOut, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: t('logout'),
      description: 'You have been logged out successfully.',
    });
    navigate('/login');
  };

  const getBasePath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'manager') return '/manager';
    if (role === 'support') return '/support';
    return '/admin';
  };

  const basePath = getBasePath();

  const getPanelName = () => {
    if (role === 'admin') return 'Admin Panel';
    if (role === 'manager') return 'Manager Panel';
    if (role === 'support') return 'Support Panel';
    return 'Dashboard';
  };

  const allMenuItems = [
    { title: t('nav.dashboard'), url: `${basePath}/dashboard`, icon: LayoutDashboard, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.products'), url: `${basePath}/products`, icon: Package, roles: ['admin', 'manager'] },
    { title: t('nav.orders'), url: `${basePath}/orders`, icon: ShoppingCart, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.customers'), url: `${basePath}/customers`, icon: Users, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.categories'), url: "/admin/categories", icon: Tag, roles: ['admin'] },
    { title: "Brands", url: "/admin/brands", icon: Award, roles: ['admin'] },
    { title: t('nav.analytics'), url: "/admin/analytics", icon: BarChart3, roles: ['admin'] },
  ];

  const allManagementItems = [
    { title: t('nav.shipping'), url: `${role === 'admin' ? '/admin' : '/manager'}/shipping`, icon: Truck, roles: ['admin', 'manager'] },
    { title: t('nav.inventory'), url: "/admin/inventory", icon: Boxes, roles: ['admin'] },
    { title: t('nav.coupons'), url: `${role === 'admin' ? '/admin' : '/manager'}/coupons`, icon: Ticket, roles: ['admin', 'manager'] },
    { title: "Abandoned Carts", url: "/admin/abandoned-carts", icon: ShoppingBasket, roles: ['admin'] },
    { title: "Trash", url: "/admin/trash", icon: Trash2, roles: ['admin', 'manager'] },
    { title: t('nav.messages'), url: `${basePath}/messages`, icon: MessageSquare, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.reports'), url: "/admin/reports", icon: FileText, roles: ['admin'] },
    { title: "Homepage", url: "/admin/homepage", icon: LayoutTemplate, roles: ['admin'] },
    { title: t('nav.roles'), url: "/admin/roles", icon: UserCog, roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter(item => role && item.roles.includes(role));
  const managementItems = allManagementItems.filter(item => role && item.roles.includes(role));

  const bottomMenuItems = [
    { title: t('nav.profile'), url: `${basePath}/profile`, icon: User, roles: ['admin', 'manager', 'support'] },
    { title: t('nav.settings'), url: role === 'manager' ? '/manager/settings' : '/admin/settings', icon: Settings, roles: ['admin', 'manager'] },
  ].filter(item => role && item.roles.includes(role));

  const renderNavItem = (item: { title: string; url: string; icon: React.ElementType }, isEnd?: boolean) => {
    const linkContent = (
      <NavLink
        key={item.url}
        to={item.url}
        end={isEnd}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
          collapsed && "justify-center px-2"
        )}
        activeClassName="bg-sidebar-accent text-sidebar-foreground"
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.url} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
      collapsed ? "w-[68px]" : "w-64"
    )}>
      <div className="flex h-full flex-col overflow-y-auto px-3 py-6">
        {/* Logo */}
        <div className={cn("mb-8 flex items-center gap-3 px-2", collapsed && "justify-center px-0")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
            <span className="font-display text-lg font-bold text-sidebar-primary-foreground">E</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-bold text-sidebar-foreground">Ekta</h1>
              <p className="text-xs text-sidebar-muted">{getPanelName()}</p>
            </div>
          )}
        </div>

        {/* Main Menu */}
        <nav className="flex-1 space-y-6">
          <div>
            {!collapsed && (
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                {t('nav.menu')}
              </p>
            )}
            <div className="space-y-1">
              {menuItems.map((item) => renderNavItem(item, item.url.endsWith('/dashboard')))}
            </div>
          </div>

          {managementItems.length > 0 && (
            <div>
              {!collapsed && (
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                  {t('nav.management')}
                </p>
              )}
              {collapsed && <div className="my-3 border-t border-sidebar-border" />}
              <div className="space-y-1">
                {managementItems.map((item) => renderNavItem(item))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Menu */}
        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-4">
          {bottomMenuItems.map((item) => renderNavItem(item))}
          
          {/* Logout */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {t('nav.logout')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('nav.logout')}</span>
            </button>
          )}

          {/* Collapse toggle - only visible on desktop */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className={cn(
                "w-full mt-2 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex",
                collapsed ? "justify-center px-2" : "justify-start px-3 gap-3"
              )}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="text-xs">সাইডবার গুটিয়ে রাখুন</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
