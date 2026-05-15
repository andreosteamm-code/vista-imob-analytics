import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export type Lead = {
  id?: string;
  created_at?: string;
  consultor: string | null;
  etapa: "Oportunidade" | "Visita" | "Contrato" | string | null;
  status: "Em andamento" | "Ganho" | "Perdido" | string | null;
  motivo_perda: string | null;
  fonte: string | null;
  valor: number | null;
  nome_cliente?: string | null;
};

export const TABLE = "leads_imobiliarios";
