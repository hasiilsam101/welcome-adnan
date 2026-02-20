import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, ArrowRight, Phone, Hash, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderResult {
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: any;
  total: number;
  shippingCost: number;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderError, setOrderError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneResults, setPhoneResults] = useState<OrderResult[]>([]);
  const [showPhoneResults, setShowPhoneResults] = useState(false);

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");

    const trimmedOrder = orderNumber.trim().toUpperCase();
    
    const orderNumberRegex = /^ORD-\d{8}-\d{4}$/;
    if (!orderNumberRegex.test(trimmedOrder)) {
      setOrderError("Invalid order number. Correct format: ORD-YYYYMMDD-XXXX");
      return;
    }

    navigate(`/track/${trimmedOrder}`);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneResults([]);
    setShowPhoneResults(false);

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setPhoneError("Please enter a valid phone number");
      return;
    }

    if (!/^[\d+]+$/.test(cleanPhone)) {
      setPhoneError("Phone number can only contain digits and + sign");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('track-order', {
        body: { phone: cleanPhone }
      });

      if (error) throw error;

      if (data.error) {
        setPhoneError(data.error);
        return;
      }

      if (data.orders && data.orders.length > 0) {
        setPhoneResults(data.orders);
        setShowPhoneResults(true);
      } else {
        setPhoneError("No orders found for this phone number");
      }
    } catch (error: any) {
      console.error("Phone search error:", error);
      setPhoneError("Error searching for orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-store-primary/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-store-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Track Your Order
            </h1>
            <p className="text-muted-foreground">
              Check your order status using order number or phone number
            </p>
          </div>

          <Card className="border-store-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Find Your Order</CardTitle>
              <CardDescription>
                Search by order number or phone number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="order" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="order" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Order Number
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="order">
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="ORD-20260202-1234"
                        value={orderNumber}
                        onChange={(e) => {
                          setOrderNumber(e.target.value.toUpperCase());
                          setOrderError("");
                        }}
                        className="pl-10 h-12 text-lg font-mono"
                        maxLength={18}
                      />
                    </div>
                    
                    {orderError && (
                      <p className="text-sm text-destructive">{orderError}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-store-primary hover:bg-store-primary/90"
                      disabled={!orderNumber.trim()}
                    >
                      Track Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="phone">
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d+\s\-()]/g, '');
                          setPhoneNumber(value);
                          setPhoneError("");
                          setShowPhoneResults(false);
                        }}
                        className="pl-10 h-12 text-lg"
                        maxLength={15}
                      />
                    </div>
                    
                    {phoneError && (
                      <p className="text-sm text-destructive">{phoneError}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-store-primary hover:bg-store-primary/90"
                      disabled={!phoneNumber.trim() || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          Find Orders
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {showPhoneResults && phoneResults.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="font-medium text-sm text-foreground">
                        Found {phoneResults.length} order(s):
                      </h3>
                      {phoneResults.map((order) => (
                        <div 
                          key={order.orderNumber}
                          className="p-4 border rounded-lg hover:border-store-primary/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/track/${order.orderNumber}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-medium text-store-primary">
                              {order.orderNumber}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Date: {formatDate(order.createdAt)}</p>
                            <p>Total: ৳{order.total?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-sm text-foreground mb-3">
                  Where to find your order number?
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-store-primary">•</span>
                    In your order confirmation email
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-store-primary">•</span>
                    In your SMS notification
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-store-primary">•</span>
                    In your account order history
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}
