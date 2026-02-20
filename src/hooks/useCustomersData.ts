import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerOrder {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: string;
  items_count?: number;
}

export interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: any | null;
  user_id: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  tags?: string[] | null;
  orders?: CustomerOrder[];
  last_order_date?: string | null;
  status?: 'active' | 'inactive' | 'blocked' | 'flagged';
}

export function useCustomersData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch orders for each customer to get last order date
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders' as any)
        .select('customer_id, created_at, order_number, total_amount, status')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Group orders by customer
      const ordersByCustomer: Record<string, CustomerOrder[]> = {};
      ((ordersData as any[]) || []).forEach((order: any) => {
        if (order.customer_id) {
          if (!ordersByCustomer[order.customer_id]) {
            ordersByCustomer[order.customer_id] = [];
          }
          ordersByCustomer[order.customer_id].push({
            id: order.customer_id,
            order_number: order.order_number,
            created_at: order.created_at,
            total: Number(order.total_amount),
            status: order.status,
          });
        }
      });

      // Enrich customers with orders data
      const enrichedCustomers: Customer[] = ((customersData as any[]) || []).map((customer: any) => {
        const customerOrders = ordersByCustomer[customer.id] || [];
        const lastOrder = customerOrders[0];
        
        // Use stored status if blocked/flagged, otherwise compute from activity
        let status: 'active' | 'inactive' | 'blocked' | 'flagged' = customer.status || 'active';
        if (status !== 'blocked' && status !== 'flagged') {
          if (lastOrder) {
            const daysSinceLastOrder = Math.floor(
              (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceLastOrder > 90) {
              status = 'inactive';
            } else {
              status = 'active';
            }
          } else if (customer.total_orders === 0) {
            status = 'inactive';
          }
        }

        // Parse address if it's a JSON string
        let parsedAddress = customer.address;
        if (typeof customer.address === 'string') {
          try {
            parsedAddress = JSON.parse(customer.address);
          } catch {
            parsedAddress = { street: customer.address };
          }
        }

        return {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          address: parsedAddress,
          user_id: customer.user_id,
          total_orders: customer.total_orders || 0,
          total_spent: customer.total_spent || 0,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          notes: customer.notes || null,
          tags: customer.tags || null,
          orders: customerOrders.slice(0, 5),
          last_order_date: lastOrder?.created_at || null,
          status,
        };
      });

      setCustomers(enrichedCustomers);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const updateData: any = {};
      if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await supabase
        .from('customers' as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...(data as any) } : c));
      return data;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
      throw error;
    }
  };

  const updateCustomerNotes = async (id: string, notes: string) => {
    await updateCustomer(id, { notes } as Partial<Customer>);
    toast.success('Notes saved successfully!');
  };

  const updateCustomerTags = async (id: string, tags: string[]) => {
    await updateCustomer(id, { tags } as Partial<Customer>);
    toast.success('Tags updated successfully!');
  };

  const updateCustomerStatus = async (id: string, status: string, reason?: string) => {
    try {
      const updateData: any = { status };
      const { error } = await supabase
        .from('customers' as any)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Log status change as communication
      if (reason) {
        await supabase
          .from('customer_communication_log' as any)
          .insert({
            customer_id: id,
            type: 'note',
            content: `Status changed to ${status}. Reason: ${reason}`,
            direction: 'outbound',
          });
      }

      setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
      toast.success(`Customer ${status === 'blocked' ? 'blocked' : status === 'flagged' ? 'flagged' : 'activated'} successfully`);
    } catch (error: any) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update status');
      throw error;
    }
  };

  const fetchCustomerAllOrders = async (customerId: string): Promise<CustomerOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('orders' as any)
        .select('id, order_number, created_at, total, status, customer_id')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        total: Number(order.total),
        status: order.status,
      }));
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  };

  const mergeCustomers = async (primaryId: string, duplicateIds: string[]) => {
    try {
      // Reassign all orders from duplicates to primary
      for (const dupId of duplicateIds) {
        const { error: orderError } = await supabase
          .from('orders' as any)
          .update({ customer_id: primaryId })
          .eq('customer_id', dupId);

        if (orderError) throw orderError;

        // Delete duplicate customer
        const { error: deleteError } = await supabase
          .from('customers' as any)
          .delete()
          .eq('id', dupId);

        if (deleteError) throw deleteError;
      }

      // Refresh data
      await fetchCustomers();
      toast.success(`Successfully merged ${duplicateIds.length} duplicate(s)`);
    } catch (error: any) {
      console.error('Error merging customers:', error);
      toast.error('Failed to merge customers');
      throw error;
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      newThisMonth: customers.filter(c => {
        const joined = new Date(c.created_at);
        return joined.getMonth() === thisMonth && joined.getFullYear() === thisYear;
      }).length,
      totalRevenue: customers.reduce((sum, c) => sum + Number(c.total_spent), 0),
      avgSpent: customers.length > 0 
        ? Math.round(customers.reduce((sum, c) => sum + Number(c.total_spent), 0) / customers.length)
        : 0,
    };
  }, [customers]);

  useEffect(() => {
    fetchCustomers();

    // Set up realtime subscriptions
    const customersChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-for-customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  return {
    customers,
    loading,
    stats,
    updateCustomer,
    updateCustomerNotes,
    updateCustomerTags,
    updateCustomerStatus,
    fetchCustomerAllOrders,
    mergeCustomers,
    refetch: fetchCustomers,
  };
}
