import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommunicationEntry {
  id: string;
  customer_id: string;
  type: 'email' | 'phone' | 'chat' | 'ticket' | 'note' | 'sms';
  subject: string | null;
  content: string;
  direction: 'inbound' | 'outbound';
  created_by: string | null;
  created_at: string;
}

export function useCommunicationLog(customerId: string | null) {
  const [entries, setEntries] = useState<CommunicationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_communication_log')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching communication log:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: {
    type: CommunicationEntry['type'];
    subject?: string;
    content: string;
    direction: 'inbound' | 'outbound';
    created_by?: string;
  }) => {
    if (!customerId) return;
    try {
      const { error } = await supabase
        .from('customer_communication_log')
        .insert({
          customer_id: customerId,
          type: entry.type,
          subject: entry.subject || null,
          content: entry.content,
          direction: entry.direction,
          created_by: entry.created_by || null,
        } as any);

      if (error) throw error;
      toast.success('Communication logged');
      await fetchEntries();
    } catch (error) {
      console.error('Error adding communication entry:', error);
      toast.error('Failed to log communication');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [customerId]);

  return { entries, loading, addEntry, refetch: fetchEntries };
}
