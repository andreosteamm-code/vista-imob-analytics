import { useRef, useState } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase, TABLE, FUNIL_ETAPAS, type Lead } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Stage → matching substring in CSV header "Data e Hora de entrada na fase X loc."
const STAGE_HEADER_HINTS: { stage: string; hints: string[] }[] = [
  { stage: "Oportunidade", hints: ["oportunidade"] },
  { stage: "Atendimento", hints: ["atendimento"] },
  { stage: "Confirmação de visita", hints: ["confirmação de visita", "confirmacao de visita"] },
  { stage: "Em visitação", hints: ["em visitação", "em visitacao"] },
  { stage: "Análise", hints: ["análise", "analise"] },
  { stage: "Proposta", hints: ["proposta"] },
  { stage: "Documentação", hints: ["documentação", "documentacao"] },
  { stage: "Contrato/Vistoria", hints: ["contrato/vistoria", "contrato / vistoria", "vistoria"] },
  { stage: "Envio de Contrato", hints: ["envio de contrato"] },
  { stage: "Aguardando Assinaturas", hints: ["aguardando assinatura"] },
];

// Parse "DD/MM/YYYY HH:MM" or ISO into ISO timestamp
function parseDate(v: any): string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  if (!s) return null;
  // DD/MM/YYYY [HH:MM[:SS]]
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const [, d, mo, y, hh = "0", mm = "0", ss = "0"] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const dt = new Date(year, Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

function parseMoney(v: any): number | null {
  if (v == null || v === "") return null;
  const cleaned = String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeRow(raw: Record<string, any>): Lead | null {
  // case-insensitive key lookup
  const keys = Object.keys(raw);
  const find = (...needles: string[]) => {
    for (const n of needles) {
      const k = keys.find((rk) => rk.toLowerCase().trim() === n.toLowerCase().trim());
      if (k && raw[k] !== "" && raw[k] != null) return raw[k];
    }
    return null;
  };
  const findContains = (needle: string) => {
    const k = keys.find((rk) => rk.toLowerCase().includes(needle.toLowerCase()));
    return k ? raw[k] : null;
  };

  // Collect all stage dates from "Data e Hora de entrada na fase X loc." headers
  const stageDates: { stage: string; ts: number; iso: string }[] = [];
  for (const { stage, hints } of STAGE_HEADER_HINTS) {
    for (const h of hints) {
      const k = keys.find((rk) => {
        const low = rk.toLowerCase();
        return low.includes("data") && low.includes("fase") && low.includes(h);
      });
      if (k && raw[k]) {
        const iso = parseDate(raw[k]);
        if (iso) {
          stageDates.push({ stage, ts: new Date(iso).getTime(), iso });
          break;
        }
      }
    }
  }

  // "Perdidos" date → status Perdido
  const perdidosKey = keys.find((rk) => {
    const low = rk.toLowerCase();
    return low.includes("data") && low.includes("fase") && low.includes("perdido");
  });
  const perdidosDate = perdidosKey ? parseDate(raw[perdidosKey]) : null;

  // Current Fase from CSV (string)
  const faseRaw = find("Fase", "fase", "etapa", "stage");
  const faseStr = faseRaw ? String(faseRaw).trim() : "";

  // Determine etapa: explicit Fase if it matches our funnel; else latest stage date
  let etapa: string | null = null;
  const matchByFase = FUNIL_ETAPAS.find((s) => faseStr.toLowerCase().includes(s.toLowerCase()));
  if (matchByFase) etapa = matchByFase;
  if (!etapa && stageDates.length) {
    stageDates.sort((a, b) => b.ts - a.ts);
    etapa = stageDates[0].stage;
  }

  // Status
  let status: Lead["status"] = "Em andamento";
  if (perdidosDate || /perdid/i.test(faseStr)) status = "Perdido";
  else if (/ganho|locad/i.test(faseStr)) status = "Locado";

  // created_at = entrada na fase Oportunidade (preferida); fallback = data mais antiga
  const oportunidadeISO = stageDates.find((s) => s.stage === "Oportunidade")?.iso
    ?? (stageDates.length ? stageDates.slice().sort((a, b) => a.ts - b.ts)[0].iso : null)
    ?? parseDate(find("created_at", "data", "data_criacao", "data criação", "data de criação"));

  const consultor = find("Corretor responsável", "Corretor responsavel", "Responsável", "Responsavel", "consultor", "vendedor", "corretor");
  const motivo = find("Motivo de Descarte", "motivo_perda", "motivo", "motivo da perda");
  const fonte = find("Fonte", "fonte", "origem", "source");
  const valor = find("Preço", "Preco", "valor_locacao", "valor", "price", "aluguel");
  const nome = find("Nome do negócio", "Nome do negocio", "nome_negocio", "negocio", "nome");

  const lead: Lead = {
    consultor: consultor ? String(consultor) : null,
    etapa,
    status,
    motivo_perda: motivo ? String(motivo) : null,
    fonte: fonte ? String(fonte) : null,
    valor_locacao: parseMoney(valor),
    nome_negocio: nome ? String(nome) : null,
    created_at: oportunidadeISO ?? undefined,
  };

  // Skip totally empty rows
  if (!lead.consultor && !lead.etapa && !lead.fonte && !lead.nome_negocio && !lead.created_at) return null;
  return lead;
}

export function GestaoDados() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; err: number; msg?: string } | null>(null);
  const qc = useQueryClient();

  async function handleFile(file: File) {
    setBusy(true);
    setResult(null);
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data
          .map(normalizeRow)
          .filter((r): r is Lead => r !== null);
        if (rows.length === 0) {
          setBusy(false);
          setResult({ ok: 0, err: 0, msg: "Nenhuma linha válida encontrada" });
          return;
        }
        // Insert in batches of 500
        let ok = 0;
        let lastErr: string | undefined;
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await supabase.from(TABLE).insert(batch);
          if (error) { lastErr = error.message; break; }
          ok += batch.length;
        }
        if (lastErr) {
          setResult({ ok, err: rows.length - ok, msg: lastErr });
          toast.error("Erro ao inserir: " + lastErr);
        } else {
          setResult({ ok, err: 0 });
          toast.success(`${ok} leads inseridos com sucesso`);
        }
        qc.invalidateQueries({ queryKey: ["leads"] });
        setBusy(false);
      },
      error: (err) => {
        setBusy(false);
        setResult({ ok: 0, err: 1, msg: err.message });
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card border-border">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/10 text-primary"><Upload className="h-6 w-6" /></div>
          <div>
            <h2 className="text-lg font-semibold">Importar Leads de Locação via CSV</h2>
            <p className="text-sm text-muted-foreground mt-1">Cada linha será inserida automaticamente em <code className="text-primary">leads_locacao</code>.</p>
          </div>
        </div>

        <div
          className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Arraste um arquivo CSV ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">UTF-8, separador vírgula</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Processando…" : "Selecionar arquivo"}
          </Button>
          {result && (
            <div className={`flex items-center gap-2 text-sm ${result.err ? "text-destructive" : "text-[oklch(0.7_0.17_155)]"}`}>
              {result.err ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {result.err
                ? `Falhou: ${result.msg ?? `${result.err} erros`}`
                : `${result.ok} leads inseridos`}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Mapeamento automático do CRM</h3>
        <p className="text-sm text-muted-foreground mb-4">
          O sistema lê o CSV exportado do CRM e mapeia automaticamente os campos abaixo.
          A <span className="text-foreground font-medium">data de criação do lead</span> é extraída de
          <code className="text-primary mx-1">Data e Hora de entrada na fase Oportunidade loc.</code>
          e usada nos filtros de período e na tendência mensal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {[
            ["Nome do negócio", "nome_negocio"],
            ["Corretor responsável / Responsável", "consultor"],
            ["Fonte", "fonte"],
            ["Fase", "etapa (atual)"],
            ["Preço", "valor_locacao"],
            ["Motivo de Descarte", "motivo_perda"],
            ["Data … fase Oportunidade loc.", "created_at"],
            ["Data … fase Perdidos loc.", "status = Perdido"],
            ["Data … cada fase loc.", "deriva etapa mais recente"],
          ].map(([from, to]) => (
            <div key={from} className="flex items-center gap-2 px-3 py-2 rounded bg-muted font-mono text-foreground">
              <span className="flex-1 truncate">{from}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-primary">{to}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
