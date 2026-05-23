import { useMemo, useState } from "react";
import { useFilteredLeads as useLeads } from "@/hooks/useDateFilter";
import { Card } from "@/components/ui/card";
import { bySource, fmtInt, fmtPct, lossReasons } from "@/lib/bi-utils";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["oklch(0.68 0.18 250)", "oklch(0.65 0.22 15)", "oklch(0.78 0.15 75)", "oklch(0.7 0.17 155)", "oklch(0.7 0.17 295)"];

export function AnalisePerdas() {
  const { data: leads = [] } = useLeads();
  const fontes = useMemo(() => Array.from(new Set(leads.map((l) => l.fonte || "Não informado"))), [leads]);
  const [fonte, setFonte] = useState<string>("__all__");

  const filtrados = useMemo(
    () => (fonte === "__all__" ? leads : leads.filter((l) => (l.fonte || "Não informado") === fonte)),
    [leads, fonte]
  );

  const motivos = useMemo(() => lossReasons(filtrados), [filtrados]);
  const fontesAgg = useMemo(() => bySource(leads), [leads]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Análise de Perdas</h2>
          <p className="text-xs text-muted-foreground">Entenda onde as locações estão sendo perdidas</p>
        </div>
        <Select value={fonte} onValueChange={setFonte}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filtrar por fonte" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as fontes</SelectItem>
            {fontes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Motivos de Perda</h3>
          <div className="h-72">
            {motivos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem perdas registradas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motivos} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" horizontal={false} />
                  <XAxis type="number" stroke="oklch(0.7 0.02 250)" fontSize={12} />
                  <YAxis
                    dataKey="motivo"
                    type="category"
                    stroke="oklch(0.7 0.02 250)"
                    fontSize={11}
                    width={200}
                    tick={{ fill: "oklch(0.85 0.02 250)", textAnchor: "end" }}
                    interval={0}
                  />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.22 0.02 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8 }} />
                  <Bar dataKey="total" fill="oklch(0.65 0.22 15)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Distribuição por Fonte</h3>
          <div className="h-72">
            {fontesAgg.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fontesAgg} dataKey="total" nameKey="fonte" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {fontesAgg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.22 0.02 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, color: "oklch(0.95 0.02 250)" }}
                    itemStyle={{ color: "oklch(0.95 0.02 250)" }}
                    labelStyle={{ color: "oklch(0.95 0.02 250)" }}
                  />
                  <Legend wrapperStyle={{ color: "oklch(0.9 0.02 250)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Taxa de Perda por Fonte</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Fonte</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Total</th>
                <th className="py-3 pr-4 font-medium tabular-nums text-right">Perdidos</th>
                <th className="py-3 pl-4 font-medium tabular-nums text-right">Taxa de Perda</th>
              </tr>
            </thead>
            <tbody>
              {fontesAgg.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Sem dados</td></tr>}
              {fontesAgg.map((f) => (
                <tr key={f.fonte} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium">{f.fonte}</td>
                  <td className="py-3 pr-4 tabular-nums text-right">{fmtInt(f.total)}</td>
                  <td className="py-3 pr-4 tabular-nums text-right text-destructive">{fmtInt(f.perdidos)}</td>
                  <td className="py-3 pl-4 tabular-nums text-right font-semibold">{fmtPct(f.taxa_perda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
