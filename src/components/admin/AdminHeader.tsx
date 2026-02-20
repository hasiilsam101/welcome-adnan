import { useState, useEffect } from "react";
import { Search, Menu, LogOut, User, Settings, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { AgentAvailabilityToggle } from "@/components/admin/AgentAvailabilityToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminHeaderProps {
  onMenuClick?: () => void;
  collapsed?: boolean;
}

export function AdminHeader({ onMenuClick, collapsed }: AdminHeaderProps) {
  const { t } = useLanguage();
  const { user, signOut, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const basePath = role === 'admin' ? '/admin' : role === 'manager' ? '/manager' : '/support';

  useEffect(() => {
    if (user) {
      fetchAvatar();
    }
  }, [user]);

  const fetchAvatar = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: t('logout'),
      description: 'You have been logged out successfully.',
    });
    navigate('/login');
  };

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'AD';
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Search bar with ⌘K hint */}
        <button
          onClick={openCommandPalette}
          className="relative hidden md:flex items-center gap-2 w-60 lg:w-80 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>{t('header.search')}</span>
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={openCommandPalette}>
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2">
        {(role === 'support' || role === 'manager' || role === 'admin') && (
          <AgentAvailabilityToggle />
        )}
        <ThemeToggle />
        <div className="hidden xs:block">
          <LanguageToggle />
        </div>
        <NotificationCenter />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-1 sm:px-2 h-9">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs sm:text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <p className="text-sm font-medium">
                  {user?.user_metadata?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'admin@ekta.com'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`${basePath}/profile`)}>
              <User className="mr-2 h-4 w-4" />
              {t('header.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${basePath}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
