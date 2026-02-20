import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useOrderTags() {
  const queryClient = useQueryClient();

  const updateTags = useMutation({
    mutationFn: async ({ orderId, tags }: { orderId: string; tags: string[] }) => {
      const { error } = await supabase
        .from('orders' as any)
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Tags updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update tags: ${error.message}`);
    },
  });

  return {
    updateTags: updateTags.mutate,
    isUpdating: updateTags.isPending,
  };
}
