import { useMemo, useState, useEffect } from "react";
import { useFilteredLeads as useLeads } from "@/hooks/useDateFilter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ChevronDown } from "lucide-react";
import { byConsultor, ETAPAS_CONSULTOR, fmtInt, fmtPct, funnelCounts, pct } from "@/lib/bi-utils";
import { FUNIL_ETAPAS } from "@/integrations/supabase/client";

const ETAPA_LABEL: Record<string, string> = {
  "Contrato/Vistoria": "Contrato",
};

export function DetalhesOperacionais() {
  const { data: leads = [] } = useLeads();
  const counts = useMemo(() => funnelCounts(leads), [leads]);
  const allConsultores = useMemo(() => byConsultor(leads), [leads]);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  // initialize / sync selection when consultor list changes
  useEffect(() => {
    setSelected((prev) => {
      const names = allConsultores.map((c) => c.consultor);
      if (!prev) return new Set(names);
      const next = new Set<string>();
      prev.forEach((n) => { if (names.includes(n)) next.add(n); });
      // include any new consultor by default
      names.forEach((n) => { if (!prev.has(n) && prev.size === allConsultores.length - 1 ? false : false) next.add(n); });
      return next.size ? next : new Set(names);
    });
  }, [allConsultores.length]);

  const sel = selected ?? new Set(allConsultores.map((c) => c.consultor));
  const consultores = allConsultores.filter((c) => sel.has(c.consultor));

  const toggle = (name: string) =>
    setSelected((prev) => {
      const base = new Set(prev ?? allConsultores.map((c) => c.consultor));
      if (base.has(name)) base.delete(name); else base.add(name);
      return base;
    });
  const allSelected = sel.size === allConsultores.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(allConsultores.map((c) => c.consultor)));

  const base = counts[FUNIL_ETAPAS[0]] || 0;
  const stages = FUNIL_ETAPAS.map((key, i) => ({
    key,
    count: counts[key] ?? 0,
    width: 100 - i * (90 / (FUNIL_ETAPAS.length - 1)),
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-1">Funil de Locação</h2>
        <p className="text-xs text-muted-foreground mb-6">
          {FUNIL_ETAPAS.join(" → ")}
        </p>
        <div className="space-y-3">
          {stages.map((s) => {
            const ratio = pct(s.count, base || 1);
            return (
              <div key={s.key}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{s.key}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {fmtInt(s.count)} <span className="text-primary ml-2">{fmtPct(ratio)}</span>
                  </span>
                </div>
                <div className="h-8 rounded-md bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${Math.max(s.width, 8)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Desempenho por Consultor</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Consultores
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                  {sel.size}/{allConsultores.length}
                </span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2 bg-popover">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Filtrar
                </span>
                <button
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {allSelected ? "Limpar" : "Todos"}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {allConsultores.length === 0 && (
                  <p className="px-2 py-2 text-xs text-muted-foreground">Sem dados</p>
                )}
                {allConsultores.map((c) => (
                  <label
                    key={c.consultor}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={sel.has(c.consultor)}
                      onCheckedChange={() => toggle(c.consultor)}
                    />
                    <span className="text-sm flex-1 truncate">{c.consultor}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{c.total}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium sticky left-0 bg-card">Consultor</th>
                <th className="py-3 px-3 font-medium tabular-nums text-right">Leads</th>
                {ETAPAS_CONSULTOR.map((e) => (
                  <th key={e} className="py-3 px-3 font-medium tabular-nums text-right whitespace-nowrap">
                    {ETAPA_LABEL[e] ?? e}
                  </th>
                ))}
                <th className="py-3 px-3 font-medium tabular-nums text-right">Locados</th>
                <th className="py-3 px-3 font-medium tabular-nums text-right">Perdidos</th>
                <th className="py-3 pl-3 font-medium tabular-nums text-right">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {consultores.length === 0 && (
                <tr><td colSpan={5 + ETAPAS_CONSULTOR.length} className="py-8 text-center text-muted-foreground">Sem dados</td></tr>
              )}
              {consultores.map((c) => (
                <tr key={c.consultor} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-3 pr-4 font-medium sticky left-0 bg-card">{c.consultor}</td>
                  <td className="py-3 px-3 tabular-nums text-right">{fmtInt(c.total)}</td>
                  {ETAPAS_CONSULTOR.map((e) => (
                    <td key={e} className="py-3 px-3 tabular-nums text-right">{fmtInt(c.etapas[e] ?? 0)}</td>
                  ))}
                  <td className="py-3 px-3 tabular-nums text-right text-[oklch(0.7_0.17_155)]">{fmtInt(c.locados)}</td>
                  <td className="py-3 px-3 tabular-nums text-right text-destructive">{fmtInt(c.perdidos)}</td>
                  <td className="py-3 pl-3 tabular-nums text-right font-semibold text-primary">{fmtPct(c.conversao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
