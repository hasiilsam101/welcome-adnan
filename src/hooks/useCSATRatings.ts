import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CSATRating {
  id: string;
  ticket_id: string | null;
  conversation_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  rating: number;
  feedback: string | null;
  agent_id: string | null;
  created_at: string;
}

export function useCSATRatings() {
  const queryClient = useQueryClient();

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ["csat-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("csat_ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CSATRating[];
    },
  });

  const submitRating = useMutation({
    mutationFn: async (data: {
      ticket_id?: string;
      conversation_id?: string;
      customer_email?: string;
      customer_name?: string;
      rating: number;
      feedback?: string;
      agent_id?: string;
    }) => {
      const { error } = await supabase
        .from("csat_ratings")
        .insert({
          ticket_id: data.ticket_id || null,
          conversation_id: data.conversation_id || null,
          customer_email: data.customer_email || null,
          customer_name: data.customer_name || null,
          rating: data.rating,
          feedback: data.feedback || null,
          agent_id: data.agent_id || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csat-ratings"] });
      toast.success("Rating saved successfully");
    },
    onError: (error) => {
      console.error("Error submitting CSAT:", error);
      toast.error("Failed to save rating");
    },
  });

  // Stats
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const ratingDistribution = {
    1: ratings.filter(r => r.rating === 1).length,
    2: ratings.filter(r => r.rating === 2).length,
    3: ratings.filter(r => r.rating === 3).length,
    4: ratings.filter(r => r.rating === 4).length,
    5: ratings.filter(r => r.rating === 5).length,
  };

  const satisfactionRate = ratings.length > 0
    ? (ratings.filter(r => r.rating >= 4).length / ratings.length) * 100
    : 0;

  return {
    ratings,
    isLoading,
    submitRating: submitRating.mutate,
    isSubmitting: submitRating.isPending,
    averageRating,
    ratingDistribution,
    satisfactionRate,
    totalRatings: ratings.length,
  };
}
