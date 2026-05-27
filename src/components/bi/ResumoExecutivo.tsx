import { useMemo } from "react";
import { useFilteredLeads as useLeads } from "@/hooks/useDateFilter";
import { Card } from "@/components/ui/card";
import { fmtInt, fmtPct, monthlyTrend, pct } from "@/lib/bi-utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Target, TrendingUp, Users } from "lucide-react";

const ACCENT = {
  blue: "oklch(0.72 0.2 240)",
  amber: "oklch(0.82 0.17 75)",
  green: "oklch(0.78 0.18 155)",
  coral: "oklch(0.7 0.24 15)",
  violet: "oklch(0.72 0.18 300)",
};

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass glass-hover rounded-xl p-6 ${className}`}>{children}</div>
  );
}

function TooltipDark({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[oklch(0.16_0.02_255_/_0.92)] backdrop-blur px-3 py-2 shadow-xl">
      {label && <div className="text-[11px] text-muted-foreground mb-1">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-foreground/80">{p.name}</span>
          <span className="text-foreground font-semibold tabular-nums ml-auto">
            {typeof p.value === "number" ? p.value.toLocaleString("pt-BR") : p.value}
          </span>
        </div>
      ))}
    </div>
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

  // Donut: andamento vs finalizados
  const donut = useMemo(() => {
    const finalizados = k.locados + k.perdidos;
    return [
      { name: "Em andamento", value: k.ativos, color: ACCENT.amber },
      { name: "Finalizados", value: finalizados, color: ACCENT.blue },
    ];
  }, [k]);

  // Distribuição por fonte (top 5) — proxy para regiões enquanto o campo não existir
  const regional = useMemo(() => {
    const map = new Map<string, number>();
    leads.filter((l) => l.status === "Locado").forEach((l) => {
      const key = l.fonte || "Não informado";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    const palette = [ACCENT.blue, ACCENT.amber, ACCENT.green, ACCENT.violet, ACCENT.coral];
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], i) => ({ name, value, color: palette[i] }));
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMini icon={Users} label="Total de Leads" value={fmtInt(k.total)} sub={`${k.ativos} em andamento`} accent={ACCENT.blue} />
        <KpiMini icon={Target} label="Conversão" value={fmtPct(k.conversao)} sub={`${k.locados} locados`} accent={ACCENT.green} />
        <KpiMini icon={TrendingUp} label="Perdidos" value={fmtInt(k.perdidos)} sub={`${fmtPct(pct(k.perdidos, k.total))} do total`} accent={ACCENT.coral} />
        <KpiMini
          icon={DollarSign}
          label="VGL"
          value={k.vgl.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          sub="Imóveis locados"
          accent={ACCENT.amber}
        />
      </div>

      {/* Donut + Regional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground tracking-wide">Leads hoje</h3>
            <span className="text-[11px] text-muted-foreground">Andamento × Finalizados</span>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                    stroke="none"
                    startAngle={220}
                    endAngle={-40}
                  >
                    {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<TooltipDark />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-3xl font-semibold tabular-nums">{fmtInt(k.total)}</div>
                <div className="text-[11px] text-muted-foreground">leads</div>
              </div>
            </div>
            <div className="space-y-3">
              {donut.map((d) => (
                <div key={d.name} className="rounded-lg bg-white/5 border border-white/5 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </div>
                  <div className="text-lg font-semibold tabular-nums mt-0.5">
                    {fmtInt(d.value)} <span className="text-[11px] text-muted-foreground font-normal">leads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground tracking-wide">Locações por região / canal</h3>
            <span className="text-[11px] text-muted-foreground">Top 5</span>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="h-56">
              {regional.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Sem locações no período</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regional}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {regional.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<TooltipDark />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-2">
              {regional.map((d) => {
                const total = regional.reduce((a, b) => a + b.value, 0);
                const p = total ? (d.value / total) * 100 : 0;
                return (
                  <div key={d.name} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-foreground/80 truncate">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="truncate">{d.name}</span>
                      </span>
                      <span className="text-muted-foreground tabular-nums">{p.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 mt-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${p}%`, background: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Smooth area chart */}
      <GlassCard>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Tendência mensal</h2>
            <p className="text-xs text-muted-foreground">Volume × Locações</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ACCENT.blue }} />Leads</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ACCENT.amber }} />Locados</span>
          </div>
        </div>
        <div className="h-80">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Carregando…</div>
          ) : trend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados ainda. Importe leads na aba Ajustes.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT.blue} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={ACCENT.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT.amber} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="oklch(0.72 0.02 250)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.02 250)" fontSize={11} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<TooltipDark />} cursor={{ stroke: ACCENT.blue, strokeOpacity: 0.3, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="total" name="Leads" stroke={ACCENT.blue} strokeWidth={2.5} fill="url(#gBlue)" />
                <Area type="monotone" dataKey="locados" name="Locados" stroke={ACCENT.amber} strokeWidth={2} strokeDasharray="5 4" fill="url(#gAmber)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function KpiMini({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: { icon: any; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="glass glass-hover rounded-xl p-5 relative overflow-hidden">
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between mb-3 relative">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span
          className="h-7 w-7 rounded-lg grid place-items-center"
          style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
