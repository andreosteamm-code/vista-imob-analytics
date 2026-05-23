import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLeads } from "./useLeads";
import type { Lead } from "@/integrations/supabase/client";

type Ctx = {
  from: string; // YYYY-MM-DD
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  reset: () => void;
};

const DateFilterContext = createContext<Ctx | null>(null);

export function DateFilterProvider({ children }: { children: ReactNode }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const reset = () => { setFrom(""); setTo(""); };
  return (
    <DateFilterContext.Provider value={{ from, to, setFrom, setTo, reset }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  const ctx = useContext(DateFilterContext);
  if (!ctx) throw new Error("useDateFilter must be used within DateFilterProvider");
  return ctx;
}

export function useFilteredLeads() {
  const query = useLeads();
  const { from, to } = useDateFilter();
  const data = useMemo(() => {
    const leads = query.data ?? [];
    if (!from && !to) return leads;
    // Bounds fixados no fuso América/São_Paulo (UTC-3, sem horário de verão).
    // From = 00:00:00.000 -03:00  /  To = 23:59:59.999 -03:00
    const fromTs = from ? new Date(`${from}T00:00:00.000-03:00`).getTime() : -Infinity;
    const toTs = to ? new Date(`${to}T23:59:59.999-03:00`).getTime() : Infinity;
    return leads.filter((l: Lead) => {
      const raw = l.created_at ?? l.data_criacao;
      if (!raw) return false;
      const t = new Date(raw).getTime();
      if (Number.isNaN(t)) return false;
      return t >= fromTs && t <= toTs;
    });
  }, [query.data, from, to]);
  return { ...query, data };

}
