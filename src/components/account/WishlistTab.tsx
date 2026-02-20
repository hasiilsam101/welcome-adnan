import { useNavigate } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function WishlistTab() {
  const navigate = useNavigate();
  const { items, removeItem, loading } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.images?.[0] || '/placeholder.svg',
    });
    toast.success(`${item.name} added to cart`);
  };

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          My Wishlist
          {items.length > 0 && (
            <Badge variant="secondary" className="ml-1">{items.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Products you've saved for later</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-4">
              Browse products and save your favorites
            </p>
            <Button onClick={() => navigate('/store/products')} className="bg-gradient-store">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const hasDiscount = item.compare_at_price && item.compare_at_price > item.price;
              const discountPercent = hasDiscount
                ? Math.round(((item.compare_at_price! - item.price) / item.compare_at_price!) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow flex gap-4"
                >
                  <div
                    className="w-20 h-20 rounded-md bg-muted overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => navigate(`/store/product/${item.product_id}`)}
                  >
                    <img
                      src={item.images?.[0] || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/store/product/${item.product_id}`)}
                    >
                      {item.name}
                    </h4>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm">৳{item.price}</span>
                      {hasDiscount && (
                        <>
                          <span className="text-xs line-through text-muted-foreground">
                            ৳{item.compare_at_price}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            -{discountPercent}%
                          </Badge>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleAddToCart(item)}
                        disabled={item.quantity <= 0}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {item.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleRemove(item.product_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
