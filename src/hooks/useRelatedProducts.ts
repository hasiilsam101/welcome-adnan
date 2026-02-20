import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RelatedProduct {
  id: string;
  product_id: string;
  related_product_id: string;
  sort_order: number;
  related_product?: {
    id: string;
    name: string;
    images: string[] | null;
    price: number;
  };
}

export function useRelatedProducts(productId: string | null) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRelated = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('related_products')
        .select(`
          *,
          related_product:products!related_products_related_product_id_fkey (
            id, name, images, price
          )
        `)
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setRelatedProducts((data || []) as any[]);
    } catch (error: any) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRelated = async (relatedProductId: string) => {
    if (!productId) return;
    try {
      const { error } = await supabase
        .from('related_products')
        .insert({
          product_id: productId,
          related_product_id: relatedProductId,
          sort_order: relatedProducts.length,
        });

      if (error) throw error;
      await fetchRelated();
      toast.success('Related product added');
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('Already linked as related product');
      } else {
        toast.error(`Failed: ${error.message}`);
      }
    }
  };

  const removeRelated = async (id: string) => {
    try {
      const { error } = await supabase
        .from('related_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRelatedProducts(prev => prev.filter(r => r.id !== id));
      toast.success('Related product removed');
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchRelated();
  }, [productId]);

  return { relatedProducts, loading, addRelated, removeRelated, refetch: fetchRelated };
}
