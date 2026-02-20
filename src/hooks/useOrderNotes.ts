import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderNote {
  id: string;
  order_id: string;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrderNotes(orderId: string | null) {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['order-notes', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as OrderNote[];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ orderId, content }: { orderId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          content,
          created_by: user?.id || null,
          created_by_name: user?.email?.split('@')[0] || 'Admin',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', orderId] });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('order_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-notes', orderId] });
      toast.success('Note deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    isAdding: addNoteMutation.isPending,
  };
}
