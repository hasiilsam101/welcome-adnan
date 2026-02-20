import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogEntry {
  id: string;
  order_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  performed_by: string | null;
  created_at: string;
}

export function useOrderActivityLog(orderId: string | null) {
  return useQuery({
    queryKey: ['order-activity-log', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_activity_log')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ActivityLogEntry[];
    },
  });
}
