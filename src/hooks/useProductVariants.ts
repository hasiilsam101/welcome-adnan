import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  compare_at_price: number | null;
  quantity: number | null;
  options: any | null;
  image_url: string | null;
  is_active: boolean;
}

export function useProductVariants(productId: string | null) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVariants = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVariants((data || []) as ProductVariant[]);
    } catch (error: any) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVariant = async (variant: Omit<ProductVariant, 'id' | 'is_active'>) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert({
          product_id: variant.product_id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          compare_at_price: variant.compare_at_price,
          quantity: variant.quantity || 0,
          options: variant.options,
          image_url: variant.image_url,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setVariants(prev => [...prev, data as ProductVariant]);
      toast.success('Variant added');
      return data;
    } catch (error: any) {
      toast.error(`Failed to add variant: ${error.message}`);
      throw error;
    }
  };

  const updateVariant = async (id: string, updates: Partial<ProductVariant> | string, batchData?: any) => {
    try {
      const actualUpdates = updates === 'batch' && batchData ? batchData : updates;
      const { error } = await supabase
        .from('product_variants')
        .update(actualUpdates)
        .eq('id', id);

      if (error) throw error;
      setVariants(prev => prev.map(v => v.id === id ? { ...v, ...actualUpdates } : v));
      toast.success('Variant updated');
    } catch (error: any) {
      toast.error(`Failed to update variant: ${error.message}`);
    }
  };

  const deleteVariant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVariants(prev => prev.filter(v => v.id !== id));
      toast.success('Variant deleted');
    } catch (error: any) {
      toast.error(`Failed to delete variant: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  return { variants, loading, addVariant, updateVariant, deleteVariant, refetch: fetchVariants };
}
