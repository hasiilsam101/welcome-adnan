import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ShoppingCart, Tag, Ticket, Copy, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, isAfter } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount: number | null;
  expires_at: string | null;
  is_active: boolean;
}

interface BuyAgainItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  last_ordered: string;
  times_ordered: number;
}

interface ShoppingTabProps {
  orders: {
    id: string;
    created_at: string;
    items: {
      id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      product_id?: string | null;
    }[];
  }[];
}

export function ShoppingTab({ orders }: ShoppingTabProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Build "Buy Again" from order history
  const buyAgainItems = useMemo(() => {
    const productMap = new Map<string, BuyAgainItem>();
    
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.product_id || item.product_name;
        const existing = productMap.get(key);
        if (existing) {
          existing.times_ordered += item.quantity;
          if (order.created_at > existing.last_ordered) {
            existing.last_ordered = order.created_at;
            existing.unit_price = item.unit_price;
          }
        } else {
          productMap.set(key, {
            product_id: item.product_id || item.id,
            product_name: item.product_name,
            unit_price: item.unit_price,
            last_ordered: order.created_at,
            times_ordered: item.quantity,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.times_ordered - a.times_ordered)
      .slice(0, 10);
  }, [orders]);

  // Fetch available coupons
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to only show valid (not expired) coupons
      const validCoupons = (data || []).filter((c: any) => {
        if (!c.expires_at) return true;
        return isAfter(new Date(c.expires_at), new Date());
      });

      setCoupons(validCoupons as Coupon[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleBuyAgain = (item: BuyAgainItem) => {
    addItem({
      id: item.product_id,
      name: item.product_name,
      price: item.unit_price,
      image: '/placeholder.svg',
    });
    toast.success(`${item.product_name} added to cart`);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `৳${coupon.discount_value} OFF`;
  };

  return (
    <div className="space-y-6">
      {/* Buy Again Section (#20) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Buy Again
            {buyAgainItems.length > 0 && (
              <Badge variant="secondary" className="ml-1">{buyAgainItems.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Quickly reorder products you've purchased before</CardDescription>
        </CardHeader>
        <CardContent>
          {buyAgainItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No previous purchases to show</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => navigate('/store/products')}
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {buyAgainItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{item.product_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-foreground">৳{item.unit_price}</span>
                      <span>•</span>
                      <span>Ordered {item.times_ordered}×</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 ml-2"
                    onClick={() => handleBuyAgain(item)}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Wallet (#21) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Available Coupons
            {coupons.length > 0 && (
              <Badge variant="secondary" className="ml-1">{coupons.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Copy a coupon code and use it at checkout</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCoupons ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No coupons available right now</p>
              <p className="text-xs mt-1">Check back later for new offers!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow relative overflow-hidden"
                >
                  {/* Decorative dashed border on left */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  
                  <div className="flex items-start justify-between pl-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="font-bold text-sm">
                          {formatDiscount(coupon)}
                        </Badge>
                        {coupon.title && (
                          <span className="font-medium text-sm">{coupon.title}</span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                        {coupon.minimum_order_amount && (
                          <span>Min. order: ৳{coupon.minimum_order_amount}</span>
                        )}
                        {coupon.maximum_discount && (
                          <span>Max. discount: ৳{coupon.maximum_discount}</span>
                        )}
                        {coupon.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {formatDistanceToNow(new Date(coupon.expires_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 ml-3 font-mono"
                      onClick={() => handleCopyCode(coupon.code)}
                    >
                      {copiedCode === coupon.code ? (
                        <><Check className="h-3 w-3 mr-1 text-green-600" />Copied</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" />{coupon.code}</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Drop Alerts Info (#22) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Price Drop Alerts
          </CardTitle>
          <CardDescription>
            Get notified when prices drop on products you've viewed or wishlisted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            <div className="p-2 rounded-full bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Price alerts are enabled</p>
              <p className="text-xs text-muted-foreground">
                You'll receive notifications when prices drop on your wishlist items. 
                Manage this in Settings → Notification Preferences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
