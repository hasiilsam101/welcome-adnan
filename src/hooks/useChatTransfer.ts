import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useChatTransfer() {
  const queryClient = useQueryClient();

  const transferChat = useMutation({
    mutationFn: async ({
      conversationId,
      toAgentId,
      transferNote,
      fromAgentId,
    }: {
      conversationId: string;
      toAgentId: string;
      transferNote?: string;
      fromAgentId?: string;
    }) => {
      const { error } = await supabase
        .from("live_chat_conversations")
        .update({
          assigned_to: toAgentId,
          transferred_from: fromAgentId || null,
          transfer_note: transferNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (error) throw error;

      // Add a system message about the transfer
      const { error: msgError } = await supabase
        .from("live_chat_messages")
        .insert({
          conversation_id: conversationId,
          content: `💬 Chat transferred${transferNote ? `: ${transferNote}` : ""}`,
          sender: "agent",
          sender_type: "system",
        });

      if (msgError) console.error("Error adding transfer message:", msgError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("Chat transferred successfully");
    },
    onError: (error) => {
      console.error("Error transferring chat:", error);
      toast.error("Failed to transfer chat");
    },
  });

  return {
    transferChat: transferChat.mutate,
    isTransferring: transferChat.isPending,
  };
}
