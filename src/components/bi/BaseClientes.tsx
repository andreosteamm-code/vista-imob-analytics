import { useMemo, useState } from "react";
import { useFilteredLeads as useLeads } from "@/hooks/useDateFilter";
import { useFonteFilter } from "@/hooks/useFonteFilter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Phone, User, Search, Mail, Building2, Tag, DollarSign, Calendar, ClipboardList, X } from "lucide-react";
import type { Lead } from "@/integrations/supabase/client";
import { fmtInt } from "@/lib/bi-utils";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(n?: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function telHref(t?: string | null) {
  if (!t) return "";
  return "tel:" + t.replace(/[^\d+]/g, "");
}

function statusColor(s?: string | null) {
  if (s === "Locado") return "bg-[oklch(0.7_0.17_155)]/15 text-[oklch(0.7_0.17_155)] border-[oklch(0.7_0.17_155)]/30";
  if (s === "Perdido") return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-primary/10 text-primary border-primary/30";
}

export function BaseClientes() {
  const { data: leads = [] } = useLeads();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Lead | null>(null);
  const { fonte, clear: clearFonte } = useFonteFilter();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = fonte
      ? leads.filter((l) => (l.fonte || "Não informado") === fonte)
      : leads;
    const sorted = [...base].sort((a, b) => {
      const ta = a.data_criacao || a.created_at || "";
      const tb = b.data_criacao || b.created_at || "";
      return tb.localeCompare(ta);
    });
    if (!term) return sorted;
    return sorted.filter((l) =>
      [l.nome_negocio, l.contato, l.telefone, l.consultor, l.etapa, l.fonte]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [leads, q, fonte]);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Base de Clientes</h2>
            <p className="text-xs text-muted-foreground">
              {fmtInt(filtered.length)} de {fmtInt(leads.length)} leads · clique em uma linha para ver os detalhes
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, contato, telefone…"
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Negócio</th>
                <th className="py-3 px-3 font-medium">Contato</th>
                <th className="py-3 px-3 font-medium">Consultor</th>
                <th className="py-3 px-3 font-medium">Fase atual</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 pl-3 font-medium text-right whitespace-nowrap">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Sem leads</td></tr>
              )}
              {filtered.slice(0, 500).map((l) => (
                <tr
                  key={l.id ?? l.id_crm}
                  onClick={() => { setSel(l); setOpen(true); }}
                  className="border-b border-border/50 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4 font-medium truncate max-w-[240px]">{l.nome_negocio || "—"}</td>
                  <td className="py-3 px-3 text-muted-foreground truncate max-w-[180px]">{l.contato || "—"}</td>
                  <td className="py-3 px-3 text-muted-foreground truncate max-w-[160px]">{l.consultor || "—"}</td>
                  <td className="py-3 px-3 text-muted-foreground">{l.etapa || "—"}</td>
                  <td className="py-3 px-3">
                    <Badge variant="outline" className={`text-[10px] font-medium ${statusColor(l.status)}`}>
                      {l.status || "—"}
                    </Badge>
                  </td>
                  <td className="py-3 pl-3 tabular-nums text-right text-muted-foreground whitespace-nowrap">
                    {fmtDate(l.data_criacao ?? l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Mostrando os primeiros 500 resultados. Refine a busca para ver outros leads.
            </p>
          )}
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base font-semibold">Ficha do Cliente</SheetTitle>
          </SheetHeader>

          {sel && (
            <div className="mt-6 space-y-6">
              {/* Destaque: contato e telefone */}
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Contato</p>
                    <p className="text-lg font-semibold leading-tight truncate">
                      {sel.contato || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-primary/20">
                  <div className="h-11 w-11 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Telefone</p>
                    {sel.telefone ? (
                      <a
                        href={telHref(sel.telefone)}
                        className="text-2xl font-bold tabular-nums tracking-tight text-primary hover:underline block truncate"
                      >
                        {sel.telefone}
                      </a>
                    ) : (
                      <p className="text-base text-muted-foreground">Não informado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo do lead */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Resumo do lead
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <InfoRow icon={Building2} label="Negócio" value={sel.nome_negocio} />
                  <InfoRow icon={DollarSign} label="Valor de locação" value={fmtMoney(sel.valor_locacao)} highlight />
                  <InfoRow icon={ClipboardList} label="Etapa atual" value={sel.etapa} />
                  <InfoRow icon={Tag} label="Status" value={sel.status} />
                  <InfoRow icon={Mail} label="Fonte / Origem" value={sel.fonte} />
                  <InfoRow icon={User} label="Consultor" value={sel.consultor} />
                  <InfoRow icon={Calendar} label="Criado em" value={fmtDate(sel.data_criacao ?? sel.created_at)} />
                  {sel.status === "Perdido" && (
                    <InfoRow icon={Tag} label="Motivo de perda" value={sel.motivo_perda} />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground pt-2 font-mono">ID CRM: {sel.id_crm}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof User;
  label: string;
  value?: string | number | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={`flex-1 truncate text-right ${highlight ? "font-semibold text-primary tabular-nums" : "text-foreground"}`}>
        {value || "—"}
      </span>
    </div>
  );
}
