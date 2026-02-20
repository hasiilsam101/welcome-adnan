import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductAttributeDefinition {
  id: string;
  product_id: string;
  attribute_name: string;
  attribute_values: string[];
  sort_order: number;
  created_at: string;
}

export function useProductAttributes(productId: string | null) {
  const [attributes, setAttributes] = useState<ProductAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttributes = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_attribute_definitions')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setAttributes((data || []) as ProductAttributeDefinition[]);
    } catch (error: any) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = async (name: string, values: string[]) => {
    if (!productId) return;
    try {
      const { data, error } = await supabase
        .from('product_attribute_definitions')
        .insert({
          product_id: productId,
          attribute_name: name,
          attribute_values: values,
          sort_order: attributes.length,
        })
        .select()
        .single();

      if (error) throw error;
      setAttributes(prev => [...prev, data as ProductAttributeDefinition]);
      toast.success(`Attribute "${name}" added`);
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error(`Attribute "${name}" already exists`);
      } else {
        toast.error(`Failed: ${error.message}`);
      }
    }
  };

  const updateAttribute = async (id: string, updates: Partial<ProductAttributeDefinition>) => {
    try {
      const { error } = await supabase
        .from('product_attribute_definitions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setAttributes(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success('Attribute updated');
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const deleteAttribute = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_attribute_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAttributes(prev => prev.filter(a => a.id !== id));
      toast.success('Attribute removed');
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [productId]);

  return { attributes, loading, addAttribute, updateAttribute, deleteAttribute, refetch: fetchAttributes };
}
