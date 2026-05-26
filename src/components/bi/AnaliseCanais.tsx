import { useMemo } from "react";
import { useFilteredLeads as useLeads } from "@/hooks/useDateFilter";
import { useFonteFilter } from "@/hooks/useFonteFilter";
import { Card } from "@/components/ui/card";
import { fmtInt, fmtPct, pct } from "@/lib/bi-utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, TrendingDown, MousePointerClick } from "lucide-react";
import type { Lead } from "@/integrations/supabase/client";

type Props = { onDrillDown: (fonte: string) => void };

const COLORS = [
  "oklch(0.68 0.18 250)",
  "oklch(0.7 0.17 155)",
  "oklch(0.78 0.15 75)",
  "oklch(0.65 0.22 15)",
  "oklch(0.7 0.17 295)",
  "oklch(0.72 0.15 200)",
  "oklch(0.75 0.16 50)",
  "oklch(0.6 0.2 330)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "oklch(0.22 0.02 250)",
  border: "1px solid oklch(0.3 0.02 250)",
  borderRadius: 8,
  color: "oklch(0.95 0.02 250)",
};

function fmtMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

type ChannelAgg = {
  fonte: string;
  total: number;
  locados: number;
  perdidos: number;
  vgl: number;
  vglPerdido: number;
  ticketMedio: number;
  conversao: number;
  tempoMedio: number | null;
};

function aggregateChannels(leads: Lead[]): ChannelAgg[] {
  const map = new Map<string, {
    total: number;
    locados: number;
    perdidos: number;
    vgl: number;
    vglPerdido: number;
    diasSoma: number;
    diasCount: number;
  }>();
  leads.forEach((l) => {
    const k = l.fonte || "Não informado";
    const cur = map.get(k) ?? {
      total: 0, locados: 0, perdidos: 0, vgl: 0, vglPerdido: 0, diasSoma: 0, diasCount: 0,
    };
    cur.total++;
    const v = Number(l.valor_locacao) || 0;
    if (l.status === "Locado") {
      cur.locados++;
      cur.vgl += v;
      const start = l.data_criacao ?? l.created_at;
      const end = l.created_at && l.data_criacao && l.created_at !== l.data_criacao ? l.created_at : null;
      if (start && end) {
        const d = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
        if (Number.isFinite(d) && d >= 0) { cur.diasSoma += d; cur.diasCount++; }
      }
    }
    if (l.status === "Perdido") {
      cur.perdidos++;
      cur.vglPerdido += v;
    }
    map.set(k, cur);
  });
  return [...map.entries()].map(([fonte, v]) => ({
    fonte,
    total: v.total,
    locados: v.locados,
    perdidos: v.perdidos,
    vgl: v.vgl,
    vglPerdido: v.vglPerdido,
    ticketMedio: v.locados ? v.vgl / v.locados : 0,
    conversao: pct(v.locados, v.total),
    tempoMedio: v.diasCount ? v.diasSoma / v.diasCount : null,
  })).sort((a, b) => b.total - a.total);
}

function Kpi({ icon: Icon, label, value, sub, tone = "primary" }: {
  icon: typeof Award; label: string; value: string; sub?: string; tone?: "primary" | "danger" | "success";
}) {
  const toneCls = tone === "danger" ? "text-destructive"
    : tone === "success" ? "text-[oklch(0.7_0.17_155)]"
    : "text-primary";
  return (
    <Card className="p-5 bg-card border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <div className={`text-2xl font-semibold tabular-nums leading-tight ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

export function AnaliseCanais({ onDrillDown }: Props) {
  const { data: leads = [], isLoading } = useLeads();
  const { setFonte } = useFonteFilter();
  const channels = useMemo(() => aggregateChannels(leads), [leads]);

  const fonteOuro = useMemo(() => {
    const eligible = channels.filter((c) => c.total >= 3);
    return [...eligible].sort((a, b) => b.conversao - a.conversao)[0] ?? null;
  }, [channels]);

  const custoOportunidade = useMemo(() => {
    const top = channels[0];
    return top ? { fonte: top.fonte, valor: top.vglPerdido, perdidos: top.perdidos } : null;
  }, [channels]);

  const ranking = useMemo(
    () => [...channels].sort((a, b) => b.conversao - a.conversao),
    [channels],
  );

  const handleClick = (fonte: string) => {
    setFonte(fonte);
    onDrillDown(fonte);
  };

  if (isLoading) {
    return <Card className="p-10 text-center text-sm text-muted-foreground bg-card border-border">Carregando…</Card>;
  }
  if (leads.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground bg-card border-border">Sem dados no período selecionado.</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Análise de Canais</h2>
        <p className="text-xs text-muted-foreground">
          Origem e captação · clique em uma fonte para abrir a base de clientes filtrada
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi
          icon={Award}
          tone="success"
          label="Fonte de Ouro"
          value={fonteOuro?.fonte ?? "—"}
          sub={fonteOuro ? `${fmtPct(fonteOuro.conversao)} de conversão · ${fmtInt(fonteOuro.locados)}/${fmtInt(fonteOuro.total)}` : "Sem dados suficientes"}
        />
        <Kpi
          icon={TrendingDown}
          tone="danger"
          label="Custo de Oportunidade"
          value={custoOportunidade ? fmtMoney(custoOportunidade.valor) : "—"}
          sub={custoOportunidade ? `VGL perdido em ${custoOportunidade.fonte} · ${fmtInt(custoOportunidade.perdidos)} negócios` : ""}
        />
        <Kpi
          icon={MousePointerClick}
          label="Canais Ativos"
          value={fmtInt(channels.length)}
          sub="Fontes com leads no período"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Volume vs. Qualidade</h3>
          <p className="text-xs text-muted-foreground mb-4">Leads criados × imóveis locados por fonte</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channels} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" />
                <XAxis dataKey="fonte" stroke="oklch(0.7 0.02 250)" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="oklch(0.7 0.02 250)" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "oklch(0.3 0.02 250 / 0.3)" }} />
                <Legend wrapperStyle={{ color: "oklch(0.9 0.02 250)", fontSize: 12 }} />
                <Bar dataKey="total" name="Leads criados" fill="oklch(0.68 0.18 250)" radius={[4, 4, 0, 0]}
                  onClick={(d: any) => d?.fonte && handleClick(d.fonte)} style={{ cursor: "pointer" }} />
                <Bar dataKey="locados" name="Imóveis locados" fill="oklch(0.7 0.17 155)" radius={[4, 4, 0, 0]}
                  onClick={(d: any) => d?.fonte && handleClick(d.fonte)} style={{ cursor: "pointer" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">VGL por Canal</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição do valor de contratos fechados</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channels.filter((c) => c.vgl > 0)}
                  dataKey="vgl"
                  nameKey="fonte"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={2}
                  onClick={(d: any) => d?.fonte && handleClick(d.fonte)}
                  style={{ cursor: "pointer" }}
                >
                  {channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={{ color: "oklch(0.95 0.02 250)" }}
                  formatter={(v: number) => fmtMoney(v)}
                />
                <Legend wrapperStyle={{ color: "oklch(0.9 0.02 250)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Eficiência de Conversão</h3>
        <p className="text-xs text-muted-foreground mb-4">Ranking das fontes por % de leads convertidos em locação</p>
        <div style={{ height: Math.max(280, ranking.length * 38) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking} layout="vertical" margin={{ top: 8, right: 32, bottom: 8, left: 8 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.7 0.02 250)" fontSize={12} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <YAxis
                dataKey="fonte"
                type="category"
                stroke="oklch(0.7 0.02 250)"
                fontSize={11}
                width={140}
                tick={{ fill: "oklch(0.85 0.02 250)", textAnchor: "end" }}
                interval={0}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmtPct(v)} cursor={{ fill: "oklch(0.3 0.02 250 / 0.3)" }} />
              <Bar dataKey="conversao" name="Conversão" fill="oklch(0.7 0.17 155)" radius={[0, 4, 4, 0]} barSize={18}
                onClick={(d: any) => d?.fonte && handleClick(d.fonte)} style={{ cursor: "pointer" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ROI de Captação</h3>
          <span className="text-xs text-muted-foreground">Clique em uma linha para filtrar a base</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Fonte</th>
                <th className="py-3 px-3 font-medium text-right tabular-nums">Leads Totais</th>
                <th className="py-3 px-3 font-medium text-right tabular-nums">% Conversão</th>
                <th className="py-3 px-3 font-medium text-right tabular-nums">Ticket Médio</th>
                <th className="py-3 pl-3 font-medium text-right tabular-nums">Tempo Médio</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr
                  key={c.fonte}
                  onClick={() => handleClick(c.fonte)}
                  className="border-b border-border/50 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4 font-medium">{c.fonte}</td>
                  <td className="py-3 px-3 tabular-nums text-right">{fmtInt(c.total)}</td>
                  <td className="py-3 px-3 tabular-nums text-right font-semibold text-[oklch(0.7_0.17_155)]">{fmtPct(c.conversao)}</td>
                  <td className="py-3 px-3 tabular-nums text-right">{c.locados ? fmtMoney(c.ticketMedio) : "—"}</td>
                  <td className="py-3 pl-3 tabular-nums text-right text-muted-foreground">
                    {c.tempoMedio != null ? `${c.tempoMedio.toFixed(1)} dias` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
