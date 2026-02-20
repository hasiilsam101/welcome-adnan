import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HomepageSection {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  badge_text: string | null;
  content: Record<string, any>;
  image_url: string | null;
  is_enabled: boolean;
  sort_order: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useHomepageSections() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching homepage sections:", error);
    } else {
      setSections((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const getSection = (type: string) => sections.find((s) => s.section_type === type);

  const updateSection = async (id: string, updates: Partial<HomepageSection>) => {
    const { error } = await supabase
      .from("homepage_sections")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update section", variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Section updated successfully" });
    await fetchSections();
    return true;
  };

  const createSection = async (section: Partial<HomepageSection>) => {
    const { error } = await supabase
      .from("homepage_sections")
      .insert(section as any);

    if (error) {
      toast({ title: "Error", description: "Failed to create section", variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Section created successfully" });
    await fetchSections();
    return true;
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from("homepage_sections")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete section", variant: "destructive" });
      return false;
    }
    toast({ title: "Success", description: "Section deleted successfully" });
    await fetchSections();
    return true;
  };

  const toggleSection = async (id: string, enabled: boolean) => {
    return updateSection(id, { is_enabled: enabled });
  };

  return {
    sections,
    loading,
    getSection,
    updateSection,
    createSection,
    deleteSection,
    toggleSection,
    refetch: fetchSections,
  };
}
