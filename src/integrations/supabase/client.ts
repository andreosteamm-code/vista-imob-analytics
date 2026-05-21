import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export const FUNIL_ETAPAS = [
  "Oportunidade",
  "Atendimento",
  "Confirmação de visita",
  "Em visitação",
  "Análise",
  "Proposta",
  "Documentação",
  "Contrato/Vistoria",
  "Envio de Contrato",
  "Aguardando Assinaturas",
] as const;

export type EtapaLocacao = (typeof FUNIL_ETAPAS)[number];

export type Lead = {
  id?: string;
  id_crm: string;
  created_at?: string;
  data_criacao?: string | null;
  consultor: string | null;
  etapa: EtapaLocacao | string | null;
  status: "Em andamento" | "Locado" | "Perdido" | string | null;
  motivo_perda: string | null;
  fonte: string | null;
  valor_locacao: number | null;
  nome_negocio?: string | null;
  contato?: string | null;
  telefone?: string | null;
};

export const TABLE = "leads_locacao";
