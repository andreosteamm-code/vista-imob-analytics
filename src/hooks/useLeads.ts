import { useQuery } from "@tanstack/react-query";
import { supabase, TABLE, type Lead } from "@/integrations/supabase/client";

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });
}
