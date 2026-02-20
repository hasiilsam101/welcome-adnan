import { useNavigate } from 'react-router-dom';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ShoppingCart, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function RecentlyViewedTab() {
  const navigate = useNavigate();
  const { items, clearAll } = useRecentlyViewed();
  const { addItem } = useCart();

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image || '/placeholder.svg',
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Viewed
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-1">{items.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Products you've browsed recently</CardDescription>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No recently viewed items</h3>
            <p className="text-muted-foreground mb-4">
              Products you view will appear here
            </p>
            <Button onClick={() => navigate('/store/products')} className="bg-primary">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const hasDiscount = item.compare_at_price && item.compare_at_price > item.price;
              const discountPercent = hasDiscount
                ? Math.round(((item.compare_at_price! - item.price) / item.compare_at_price!) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow flex gap-3"
                >
                  <div
                    className="w-16 h-16 rounded-md bg-muted overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => navigate(`/store/product/${item.id}`)}
                  >
                    <img
                      src={item.image || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/store/product/${item.id}`)}
                    >
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-sm">৳{item.price}</span>
                      {hasDiscount && (
                        <>
                          <span className="text-xs line-through text-muted-foreground">
                            ৳{item.compare_at_price}
                          </span>
                          <Badge variant="secondary" className="text-xs px-1">
                            -{discountPercent}%
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Viewed {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true })}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs mt-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
