import { ReactNode, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapse();

  return (
    <div className="min-h-screen bg-background">
      {/* Command Palette (⌘K) */}
      <CommandPalette />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-transform lg:translate-x-0",
        collapsed ? "w-[68px]" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[68px]" : "lg:ml-64"
      )}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} collapsed={collapsed} />
        <main className="p-3 sm:p-4 md:p-6">
          <AdminBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
