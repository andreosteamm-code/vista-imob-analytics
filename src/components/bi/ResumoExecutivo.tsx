import { useMemo } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { fmtInt, fmtPct, monthlyTrend, pct } from "@/lib/bi-utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5 bg-card border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

export function ResumoExecutivo() {
  const { data: leads = [], isLoading } = useLeads();

  const k = useMemo(() => {
    const total = leads.length;
    const locados = leads.filter((l) => l.status === "Locado").length;
    const perdidos = leads.filter((l) => l.status === "Perdido").length;
    const ativos = total - locados - perdidos;
    const vgl = leads
      .filter((l) => l.status === "Locado")
      .reduce((acc, l) => acc + (Number(l.valor_locacao) || 0), 0);
    return { total, locados, perdidos, ativos, vgl, conversao: pct(locados, total) };
  }, [leads]);

  const trend = useMemo(() => monthlyTrend(leads), [leads]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Total de Leads" value={fmtInt(k.total)} sub={`${k.ativos} em andamento`} />
        <Kpi icon={Target} label="Taxa de Conversão" value={fmtPct(k.conversao)} sub={`${k.locados} imóveis locados`} />
        <Kpi icon={TrendingUp} label="Negócios Perdidos" value={fmtInt(k.perdidos)} sub={`${fmtPct(pct(k.perdidos, k.total))} do total`} />
        <Kpi
          icon={DollarSign}
          label="VGL — Valor Geral de Locação"
          value={k.vgl.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          sub="Soma dos imóveis locados"
        />
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold">Tendência Mensal</h2>
          <span className="text-xs text-muted-foreground">Volume × Locações</span>
        </div>
        <div className="h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Carregando…</div>
          ) : trend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados ainda. Importe leads na aba Gestão de Dados.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.68 0.18 250)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="oklch(0.68 0.18 250)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" />
                <XAxis dataKey="label" stroke="oklch(0.7 0.02 250)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.22 0.02 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8 }}
                  labelStyle={{ color: "oklch(0.97 0.005 250)" }}
                />
                <Area type="monotone" dataKey="total" stroke="oklch(0.68 0.18 250)" fill="url(#g1)" strokeWidth={2} name="Leads" />
                <Area type="monotone" dataKey="locados" stroke="oklch(0.7 0.17 155)" fill="transparent" strokeWidth={2} name="Locados" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
