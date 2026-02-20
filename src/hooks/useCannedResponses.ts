import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  category?: string;
  created_by?: string | null;
}

export function useCannedResponses() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch canned responses from dedicated table
  const fetchResponses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("canned_responses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setResponses(data.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          shortcut: r.shortcut || undefined,
          category: r.category || undefined,
          created_by: r.created_by,
        })));
      } else {
        // Set default canned responses
        const defaults: CannedResponse[] = [
          { id: "1", title: "Welcome", content: "Hello! Welcome. How can I help you?", shortcut: "/hello", category: "General" },
          { id: "2", title: "Order Status", content: "Please provide your order number and I'll check the current status for you.", shortcut: "/order", category: "Orders" },
          { id: "3", title: "Thank You", content: "Thank you! Let us know if you need any further assistance.", shortcut: "/thanks", category: "General" },
          { id: "4", title: "Shipping Info", content: "Delivery typically takes 1-2 days within Dhaka and 3-5 days outside Dhaka.", shortcut: "/shipping", category: "Shipping" },
          { id: "5", title: "Payment Issue", content: "Sorry for the payment issue. Please provide your transaction ID and I'll look into it.", shortcut: "/payment", category: "Payment" },
        ];
        setResponses(defaults);
      }
    } catch (error) {
      console.error("Error fetching canned responses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Add new response to dedicated table
  const addResponse = useCallback(async (response: Omit<CannedResponse, "id">) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("canned_responses")
        .insert({
          title: response.title,
          content: response.content,
          shortcut: response.shortcut || null,
          category: response.category || null,
          created_by: userData.user?.id || null,
        });

      if (error) throw error;
      toast.success("New response added");
      fetchResponses();
      return true;
    } catch (error) {
      console.error("Error adding canned response:", error);
      toast.error("Failed to save");
      return false;
    }
  }, [fetchResponses]);

  // Update response
  const updateResponse = useCallback(async (id: string, updates: Partial<CannedResponse>) => {
    try {
      const { error } = await supabase
        .from("canned_responses")
        .update({
          title: updates.title,
          content: updates.content,
          shortcut: updates.shortcut || null,
          category: updates.category || null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Updated successfully");
      fetchResponses();
      return true;
    } catch (error) {
      console.error("Error updating canned response:", error);
      toast.error("Failed to update");
      return false;
    }
  }, [fetchResponses]);

  // Delete response
  const deleteResponse = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("canned_responses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Deleted successfully");
      fetchResponses();
      return true;
    } catch (error) {
      console.error("Error deleting canned response:", error);
      toast.error("Failed to delete");
      return false;
    }
  }, [fetchResponses]);

  // Get response by shortcut
  const getByShortcut = useCallback((shortcut: string) => {
    return responses.find((r) => r.shortcut === shortcut);
  }, [responses]);

  // Get unique categories
  const categories = [...new Set(responses.map((r) => r.category).filter(Boolean))];

  return {
    responses,
    isLoading,
    categories,
    addResponse,
    updateResponse,
    deleteResponse,
    getByShortcut,
    refetch: fetchResponses,
  };
}
