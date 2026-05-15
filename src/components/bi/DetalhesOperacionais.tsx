import { useMemo } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { byConsultor, fmtInt, fmtPct, funnelCounts, pct } from "@/lib/bi-utils";

export function DetalhesOperacionais() {
  const { data: leads = [] } = useLeads();
  const f = useMemo(() => funnelCounts(leads), [leads]);
  const consultores = useMemo(() => byConsultor(leads), [leads]);

  const stages = [
    { key: "Oportunidade", count: f.Oportunidade, base: f.Oportunidade },
    { key: "Visita", count: f.Visita, base: f.Oportunidade },
    { key: "Contrato", count: f.Contrato, base: f.Oportunidade },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-1">Funil de Vendas</h2>
        <p className="text-xs text-muted-foreground mb-6">Oportunidade → Visita → Contrato</p>
        <div className="space-y-4">
          {stages.map((s, i) => {
            const ratio = pct(s.count, s.base || 1);
            const widths = [100, 70, 45];
            return (
              <div key={s.key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{s.key}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {fmtInt(s.count)} <span className="text-primary ml-2">{fmtPct(ratio)}</span>
                  </span>
                </div>
                <div className="h-10 rounded-md bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                    style={{ width: `${widths[i]}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4">Desempenho por Consultor</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Consultor</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Leads</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Visitas</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Contratos</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Ganhos</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Perdidos</th>
                <th className="py-3 pl-4 font-medium tabular-nums text-right">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {consultores.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Sem dados</td></tr>
              )}
              {consultores.map((c) => (
                <tr key={c.consultor} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-3 pr-4 font-medium">{c.consultor}</td>
                  <td className="py-3 pr-4 tabular-nums text-right">{fmtInt(c.total)}</td>
                  <td className="py-3 pr-4 tabular-nums text-right">{fmtInt(c.visitas)}</td>
                  <td className="py-3 pr-4 tabular-nums text-right">{fmtInt(c.contratos)}</td>
                  <td className="py-3 pr-4 tabular-nums text-right text-[oklch(0.7_0.17_155)]">{fmtInt(c.ganhos)}</td>
                  <td className="py-3 pr-4 tabular-nums text-right text-destructive">{fmtInt(c.perdidos)}</td>
                  <td className="py-3 pl-4 tabular-nums text-right font-semibold text-primary">{fmtPct(c.conversao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
