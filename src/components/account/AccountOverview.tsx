import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingBag, Truck, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
}

interface AccountOverviewProps {
  orders: Order[];
  profile: any;
}

export function AccountOverview({ orders, profile }: AccountOverviewProps) {
  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const pendingCount = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;
    const shippedCount = orders.filter(o => o.status === 'shipped').length;

    return {
      totalOrders: orders.length,
      totalSpent,
      deliveredCount,
      pendingCount,
      shippedCount,
    };
  }, [orders]);

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: Package,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Total Spent',
      value: `৳${stats.totalSpent.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Delivered',
      value: stats.deliveredCount,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'In Transit',
      value: stats.shippedCount,
      icon: Truck,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'Pending',
      value: stats.pendingCount,
      icon: Clock,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`p-2 rounded-full ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
