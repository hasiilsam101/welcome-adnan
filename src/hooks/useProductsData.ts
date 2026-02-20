import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ProductType = 'simple' | 'variable' | 'grouped' | 'bundle';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  quantity: number;
  category: string | null;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  barcode: string | null;
  weight: number | null;
  dimensions: any | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[];
  publish_at: string | null;
  low_stock_threshold: number;
  brand: string | null;
  product_type: ProductType;
}

export function useProductsData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchProducts = async (includeDeleted = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('products' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const productsList = ((data as any[]) || []).map((row: any): Product => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        price: row.price,
        compare_at_price: row.compare_at_price,
        cost_price: row.cost_price,
        quantity: row.quantity,
        category: row.category,
        category_id: row.category_id,
        images: row.images || [],
        is_active: row.is_active ?? true,
        is_featured: row.is_featured ?? false,
        description: row.description,
        barcode: row.barcode,
        weight: row.weight,
        dimensions: row.dimensions,
        tags: row.tags || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
        meta_title: row.meta_title || null,
        meta_description: row.meta_description || null,
        meta_keywords: row.meta_keywords || [],
        publish_at: row.publish_at || null,
        low_stock_threshold: row.low_stock_threshold ?? 10,
        brand: row.brand || null,
        product_type: row.product_type || 'simple',
      }));
      setProducts(productsList);
      
      const uniqueCategories = [...new Set(productsList.map(p => p.category).filter(Boolean) as string[])];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (product: Partial<Product>) => {
    try {
      const slug = product.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';
      
      const { data, error } = await supabase
        .from('products' as any)
        .insert([{
          name: product.name || 'Unnamed Product',
          slug: slug + '-' + Date.now(),
          sku: product.sku,
          price: product.price || 0,
          compare_at_price: product.compare_at_price,
          cost_price: product.cost_price,
          quantity: product.quantity || 0,
          category: product.category,
          category_id: product.category_id,
          images: product.images || [],
          is_active: product.is_active ?? true,
          is_featured: product.is_featured ?? false,
          description: product.description,
          barcode: product.barcode,
          weight: product.weight,
          dimensions: product.dimensions,
          tags: product.tags || [],
          meta_title: product.meta_title,
          meta_description: product.meta_description,
          meta_keywords: product.meta_keywords || [],
          publish_at: product.publish_at,
          low_stock_threshold: product.low_stock_threshold ?? 10,
          brand: product.brand || null,
          product_type: product.product_type || 'simple',
        }])
        .select()
        .single();

      if (error) throw error;

      const newProduct = data as unknown as Product;
      setProducts(prev => [newProduct, ...prev]);
      toast.success('Product created successfully!');
      return newProduct;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products' as any)
        .update({
          name: updates.name,
          sku: updates.sku,
          price: updates.price,
          compare_at_price: updates.compare_at_price,
          cost_price: updates.cost_price,
          quantity: updates.quantity,
          category: updates.category,
          category_id: updates.category_id,
          images: updates.images,
          is_active: updates.is_active,
          is_featured: updates.is_featured,
          description: updates.description,
          barcode: updates.barcode,
          weight: updates.weight,
          dimensions: updates.dimensions,
          tags: updates.tags,
          meta_title: updates.meta_title,
          meta_description: updates.meta_description,
          meta_keywords: updates.meta_keywords,
          publish_at: updates.publish_at,
          low_stock_threshold: updates.low_stock_threshold,
          brand: updates.brand,
          product_type: updates.product_type,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = data as unknown as Product;
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('Product updated successfully!');
      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
      throw error;
    }
  };

  // 4.3 - Duplicate product
  const duplicateProduct = async (productId: string) => {
    try {
      const source = products.find(p => p.id === productId);
      if (!source) throw new Error('Product not found');

      const slug = source.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-copy-' + Date.now();

      const { data, error } = await supabase
        .from('products' as any)
        .insert([{
          name: `${source.name} (Copy)`,
          slug,
          sku: source.sku ? `${source.sku}-COPY` : null,
          price: source.price,
          compare_at_price: source.compare_at_price,
          cost_price: source.cost_price,
          quantity: source.quantity,
          category: source.category,
          category_id: source.category_id,
          images: source.images,
          is_active: false, // Start as draft
          is_featured: false,
          description: source.description,
          barcode: null,
          weight: source.weight,
          dimensions: source.dimensions,
          tags: source.tags,
          meta_title: source.meta_title,
          meta_description: source.meta_description,
          meta_keywords: source.meta_keywords,
          low_stock_threshold: source.low_stock_threshold,
          brand: source.brand,
          product_type: source.product_type || 'simple',
        }])
        .select()
        .single();

      if (error) throw error;

      // Also duplicate variants
      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      if (variants && variants.length > 0 && data) {
        const newVariants = variants.map((v: any) => ({
          product_id: (data as any).id,
          name: v.name,
          sku: v.sku ? `${v.sku}-COPY` : null,
          price: v.price,
          compare_at_price: v.compare_at_price,
          quantity: v.quantity,
          options: v.options,
          image_url: v.image_url,
          is_active: v.is_active,
        }));

        await supabase.from('product_variants').insert(newVariants);
      }

      const newProduct = data as unknown as Product;
      setProducts(prev => [newProduct, ...prev]);
      toast.success('Product duplicated successfully!');
      return newProduct;
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      toast.error(error.message || 'Failed to duplicate product');
      throw error;
    }
  };

  // Soft delete - move to trash
  const trashProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product moved to trash!');
    } catch (error: any) {
      console.error('Error trashing product:', error);
      toast.error(error.message || 'Failed to trash product');
      throw error;
    }
  };

  // Bulk soft delete
  const bulkTrash = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
      toast.success(`${ids.length} products moved to trash`);
    } catch (error: any) {
      console.error('Error trashing products:', error);
      toast.error(error.message || 'Failed to trash products');
      throw error;
    }
  };

  // Restore from trash
  const restoreProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product restored!');
    } catch (error: any) {
      console.error('Error restoring product:', error);
      toast.error(error.message || 'Failed to restore product');
      throw error;
    }
  };

  // Bulk restore
  const bulkRestore = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .update({ deleted_at: null })
        .in('id', ids);

      if (error) throw error;
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
      toast.success(`${ids.length} products restored`);
    } catch (error: any) {
      console.error('Error restoring products:', error);
      toast.error(error.message || 'Failed to restore products');
      throw error;
    }
  };

  // Permanent delete
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product permanently deleted!');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
      throw error;
    }
  };

  const bulkDelete = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .delete()
        .in('id', ids);

      if (error) throw error;
      setProducts(prev => prev.filter(p => !ids.includes(p.id)));
      toast.success(`${ids.length} products permanently deleted`);
    } catch (error: any) {
      console.error('Error deleting products:', error);
      toast.error(error.message || 'Failed to delete products');
      throw error;
    }
  };

  // Bulk publish
  const bulkPublish = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .update({ is_active: true })
        .in('id', ids);

      if (error) throw error;
      setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_active: true } : p));
      toast.success(`${ids.length} products published`);
    } catch (error: any) {
      console.error('Error publishing products:', error);
      toast.error(error.message || 'Failed to publish products');
      throw error;
    }
  };

  // Bulk unpublish (draft)
  const bulkUnpublish = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('products' as any)
        .update({ is_active: false })
        .in('id', ids);

      if (error) throw error;
      setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_active: false } : p));
      toast.success(`${ids.length} products unpublished`);
    } catch (error: any) {
      console.error('Error unpublishing products:', error);
      toast.error(error.message || 'Failed to unpublish products');
      throw error;
    }
  };

  const bulkImport = async (productsToImport: Partial<Product>[]) => {
    try {
      const { data, error } = await supabase
        .from('products' as any)
        .insert(productsToImport.map((p, idx) => ({
          name: p.name || 'Unnamed Product',
          slug: (p.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'product') + '-' + Date.now() + '-' + idx,
          sku: p.sku,
          price: p.price || 0,
          compare_at_price: p.compare_at_price,
          quantity: p.quantity || 0,
          category: p.category,
          images: p.images || [],
          is_active: p.is_active ?? true,
          description: p.description,
        })))
        .select();

      if (error) throw error;

      const importedProducts = ((data as any[]) || []) as Product[];
      setProducts(prev => [...importedProducts, ...prev]);
      toast.success(`${importedProducts.length} products imported successfully!`);
      return importedProducts;
    } catch (error: any) {
      console.error('Error importing products:', error);
      toast.error(error.message || 'Failed to import products');
      throw error;
    }
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => { fetchProducts(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return {
    products,
    loading,
    categories,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    bulkDelete,
    bulkImport,
    trashProduct,
    bulkTrash,
    restoreProduct,
    bulkRestore,
    bulkPublish,
    bulkUnpublish,
    refetch: fetchProducts,
  };
}
