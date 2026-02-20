import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RefundStatus } from '@/components/orders/RefundProcessingModal';

interface ProcessRefundData {
  orderId: string;
  refund_status: RefundStatus;
  refund_amount: number;
  refund_reason: string;
}

export function useRefundProcessing() {
  const queryClient = useQueryClient();

  const processRefund = useMutation({
    mutationFn: async ({ orderId, refund_status, refund_amount, refund_reason }: ProcessRefundData) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: Record<string, unknown> = {
        refund_status,
        refund_amount,
        refund_reason,
        updated_at: new Date().toISOString(),
      };

      if (refund_status === 'refunded') {
        updateData.refunded_at = new Date().toISOString();
        updateData.refunded_by = user?.id || null;
        updateData.payment_status = 'refunded';
      }

      const { error } = await supabase
        .from('orders' as any)
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      const statusMsg = variables.refund_status === 'refunded' 
        ? 'Refund completed' 
        : `Refund ${variables.refund_status}`;
      toast.success(statusMsg);
    },
    onError: (error: any) => {
      toast.error(`Failed to process refund: ${error.message}`);
    },
  });

  return {
    processRefund: processRefund.mutate,
    isProcessing: processRefund.isPending,
  };
}
