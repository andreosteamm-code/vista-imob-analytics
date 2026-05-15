import type { Lead } from "@/integrations/supabase/client";

export const FUNIL = ["Oportunidade", "Visita", "Contrato"] as const;

export function pct(n: number, d: number) {
  if (!d) return 0;
  return (n / d) * 100;
}

export function fmtPct(n: number) {
  return `${n.toFixed(1).replace(".", ",")}%`;
}

export function fmtInt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function monthlyTrend(leads: Lead[]) {
  const map = new Map<string, { total: number; ganhos: number }>();
  leads.forEach((l) => {
    const d = l.created_at ? new Date(l.created_at) : null;
    if (!d || Number.isNaN(d.getTime())) return;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = map.get(k) ?? { total: 0, ganhos: 0 };
    cur.total++;
    if (l.status === "Ganho") cur.ganhos++;
    map.set(k, cur);
  });
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({
      mes: k,
      label: new Date(k + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      total: v.total,
      ganhos: v.ganhos,
      conversao: pct(v.ganhos, v.total),
    }));
}

export function funnelCounts(leads: Lead[]) {
  // count leads that reached each stage; we infer reach by ordering
  const rank: Record<string, number> = { Oportunidade: 1, Visita: 2, Contrato: 3 };
  const counts = { Oportunidade: 0, Visita: 0, Contrato: 0 };
  leads.forEach((l) => {
    const r = rank[l.etapa ?? ""] ?? 0;
    if (r >= 1) counts.Oportunidade++;
    if (r >= 2) counts.Visita++;
    if (r >= 3) counts.Contrato++;
  });
  return counts;
}

export function byConsultor(leads: Lead[]) {
  const map = new Map<string, { total: number; ganhos: number; perdidos: number; visitas: number; contratos: number }>();
  leads.forEach((l) => {
    const k = l.consultor || "—";
    const cur = map.get(k) ?? { total: 0, ganhos: 0, perdidos: 0, visitas: 0, contratos: 0 };
    cur.total++;
    if (l.status === "Ganho") cur.ganhos++;
    if (l.status === "Perdido") cur.perdidos++;
    if (l.etapa === "Visita" || l.etapa === "Contrato") cur.visitas++;
    if (l.etapa === "Contrato") cur.contratos++;
    map.set(k, cur);
  });
  return [...map.entries()].map(([consultor, v]) => ({
    consultor,
    ...v,
    conversao: pct(v.ganhos, v.total),
  })).sort((a, b) => b.total - a.total);
}

export function lossReasons(leads: Lead[]) {
  const map = new Map<string, number>();
  leads.filter((l) => l.status === "Perdido").forEach((l) => {
    const k = l.motivo_perda || "Não informado";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map.entries()].map(([motivo, total]) => ({ motivo, total }))
    .sort((a, b) => b.total - a.total);
}

export function bySource(leads: Lead[]) {
  const map = new Map<string, { total: number; perdidos: number }>();
  leads.forEach((l) => {
    const k = l.fonte || "Não informado";
    const cur = map.get(k) ?? { total: 0, perdidos: 0 };
    cur.total++;
    if (l.status === "Perdido") cur.perdidos++;
    map.set(k, cur);
  });
  return [...map.entries()].map(([fonte, v]) => ({
    fonte,
    ...v,
    taxa_perda: pct(v.perdidos, v.total),
  })).sort((a, b) => b.total - a.total);
}
