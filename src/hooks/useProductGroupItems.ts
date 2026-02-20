import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductGroupItem {
  id: string;
  parent_product_id: string;
  child_product_id: string;
  quantity: number;
  sort_order: number;
  discount_percentage: number;
  created_at: string;
}

export function useProductGroupItems(parentProductId: string | null) {
  const [items, setItems] = useState<ProductGroupItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!parentProductId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_group_items')
        .select('*')
        .eq('parent_product_id', parentProductId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems((data || []) as ProductGroupItem[]);
    } catch (error: any) {
      console.error('Error fetching group items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (childProductId: string, quantity = 1, discountPercentage = 0) => {
    if (!parentProductId) return;
    try {
      const { data, error } = await supabase
        .from('product_group_items')
        .insert({
          parent_product_id: parentProductId,
          child_product_id: childProductId,
          quantity,
          discount_percentage: discountPercentage,
          sort_order: items.length,
        })
        .select()
        .single();

      if (error) throw error;
      setItems(prev => [...prev, data as ProductGroupItem]);
      toast.success('Product added to group');
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('This product is already in the group');
      } else {
        toast.error(`Failed to add: ${error.message}`);
      }
    }
  };

  const updateItem = async (id: string, updates: Partial<ProductGroupItem>) => {
    try {
      const { error } = await supabase
        .from('product_group_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      toast.success('Updated');
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_group_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Removed from group');
    } catch (error: any) {
      toast.error(`Failed to remove: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [parentProductId]);

  return { items, loading, addItem, updateItem, removeItem, refetch: fetchItems };
}
