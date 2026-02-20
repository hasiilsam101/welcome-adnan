import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch (e) {
      console.error("Failed to save sidebar state:", e);
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return { collapsed, setCollapsed, toggleCollapsed };
}
