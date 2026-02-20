import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TrashEntityType = 'product' | 'order' | 'brand' | 'category' | 'coupon';

export interface TrashedItem {
  id: string;
  entity_type: TrashEntityType;
  name: string;
  deleted_at: string;
  extra?: Record<string, any>;
}

export interface TrashLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  action: string;
  performed_by: string | null;
  performed_by_email: string | null;
  created_at: string;
}

const ENTITY_CONFIGS: Record<TrashEntityType, { table: string; nameCol: string; extraCols?: string[] }> = {
  product: { table: 'products', nameCol: 'name', extraCols: ['sku', 'price', 'quantity', 'category', 'images'] },
  order: { table: 'orders', nameCol: 'order_number', extraCols: ['total_amount', 'status', 'payment_status'] },
  brand: { table: 'brands', nameCol: 'name', extraCols: ['slug', 'logo_url'] },
  category: { table: 'categories', nameCol: 'name', extraCols: ['slug', 'image_url'] },
  coupon: { table: 'coupons', nameCol: 'code', extraCols: ['discount_type', 'discount_value', 'is_active'] },
};

export function useGlobalTrash() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [activityLog, setActivityLog] = useState<TrashLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [filter, setFilter] = useState<TrashEntityType | 'all'>('all');
  const { user } = useAuth();

  const fetchTrashedItems = useCallback(async () => {
    try {
      setLoading(true);
      const allItems: TrashedItem[] = [];
      const typesToFetch: TrashEntityType[] = filter === 'all' 
        ? ['product', 'order', 'brand', 'category', 'coupon'] 
        : [filter];

      await Promise.all(typesToFetch.map(async (entityType) => {
        const config = ENTITY_CONFIGS[entityType];
        const cols = ['id', config.nameCol, 'deleted_at', ...(config.extraCols || [])].join(', ');
        
        const { data, error } = await supabase
          .from(config.table as any)
          .select(cols)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });

        if (error) {
          console.error(`Error fetching trashed ${entityType}:`, error);
          return;
        }

        (data as any[] || []).forEach((row: any) => {
          const extra: Record<string, any> = {};
          (config.extraCols || []).forEach(col => { extra[col] = row[col]; });
          
          allItems.push({
            id: row.id,
            entity_type: entityType,
            name: row[config.nameCol] || 'Unknown',
            deleted_at: row.deleted_at,
            extra,
          });
        });
      }));

      allItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching trash:', error);
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchActivityLog = useCallback(async () => {
    try {
      setLogLoading(true);
      const { data, error } = await supabase
        .from('trash_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLog((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching trash log:', error);
    } finally {
      setLogLoading(false);
    }
  }, []);

  const logTrashAction = async (entityType: string, entityId: string, entityName: string, action: string) => {
    try {
      await supabase.from('trash_log' as any).insert({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        action,
        performed_by: user?.id || null,
        performed_by_email: user?.email || null,
      });
    } catch (error) {
      console.error('Error logging trash action:', error);
    }
  };

  const restoreItem = async (item: TrashedItem) => {
    const config = ENTITY_CONFIGS[item.entity_type];
    const { error } = await supabase
      .from(config.table as any)
      .update({ deleted_at: null })
      .eq('id', item.id);

    if (error) { toast.error('Failed to restore'); return false; }
    
    await logTrashAction(item.entity_type, item.id, item.name, 'restored');
    setItems(prev => prev.filter(i => i.id !== item.id));
    return true;
  };

  const permanentDelete = async (item: TrashedItem) => {
    const config = ENTITY_CONFIGS[item.entity_type];
    const { error } = await supabase
      .from(config.table as any)
      .delete()
      .eq('id', item.id);

    if (error) { toast.error('Failed to delete'); return false; }
    
    await logTrashAction(item.entity_type, item.id, item.name, 'permanently_deleted');
    setItems(prev => prev.filter(i => i.id !== item.id));
    return true;
  };

  const bulkRestore = async (selectedItems: TrashedItem[]) => {
    const grouped = new Map<TrashEntityType, TrashedItem[]>();
    selectedItems.forEach(item => {
      const list = grouped.get(item.entity_type) || [];
      list.push(item);
      grouped.set(item.entity_type, list);
    });

    let restored = 0;
    for (const [entityType, itemList] of grouped) {
      const config = ENTITY_CONFIGS[entityType];
      const ids = itemList.map(i => i.id);
      const { error } = await supabase
        .from(config.table as any)
        .update({ deleted_at: null })
        .in('id', ids);

      if (!error) {
        restored += ids.length;
        for (const item of itemList) {
          await logTrashAction(entityType, item.id, item.name, 'restored');
        }
      }
    }

    setItems(prev => prev.filter(i => !selectedItems.find(s => s.id === i.id)));
    toast.success(`${restored} items restored`);
    return restored;
  };

  const bulkPermanentDelete = async (selectedItems: TrashedItem[]) => {
    const grouped = new Map<TrashEntityType, TrashedItem[]>();
    selectedItems.forEach(item => {
      const list = grouped.get(item.entity_type) || [];
      list.push(item);
      grouped.set(item.entity_type, list);
    });

    let deleted = 0;
    for (const [entityType, itemList] of grouped) {
      const config = ENTITY_CONFIGS[entityType];
      const ids = itemList.map(i => i.id);
      const { error } = await supabase
        .from(config.table as any)
        .delete()
        .in('id', ids);

      if (!error) {
        deleted += ids.length;
        for (const item of itemList) {
          await logTrashAction(entityType, item.id, item.name, 'permanently_deleted');
        }
      }
    }

    setItems(prev => prev.filter(i => !selectedItems.find(s => s.id === i.id)));
    toast.success(`${deleted} items permanently deleted`);
    return deleted;
  };

  // Undo support: soft-delete an item (for undo from other pages)
  const trashItem = async (entityType: TrashEntityType, id: string, name: string) => {
    const config = ENTITY_CONFIGS[entityType];
    const { error } = await supabase
      .from(config.table as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { toast.error('Failed to trash'); return false; }
    await logTrashAction(entityType, id, name, 'trashed');
    return true;
  };

  const undoTrash = async (entityType: TrashEntityType, id: string, name: string) => {
    const config = ENTITY_CONFIGS[entityType];
    const { error } = await supabase
      .from(config.table as any)
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) return false;
    await logTrashAction(entityType, id, name, 'restored');
    return true;
  };

  useEffect(() => { fetchTrashedItems(); }, [fetchTrashedItems]);

  return {
    items,
    activityLog,
    loading,
    logLoading,
    filter,
    setFilter,
    restoreItem,
    permanentDelete,
    bulkRestore,
    bulkPermanentDelete,
    trashItem,
    undoTrash,
    fetchActivityLog,
    refetch: fetchTrashedItems,
  };
}
