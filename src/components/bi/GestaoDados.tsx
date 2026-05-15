import { useRef, useState } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase, TABLE, type Lead } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const COLS = ["consultor", "etapa", "status", "motivo_perda", "fonte", "valor", "nome_cliente", "created_at"];

function normalizeRow(raw: Record<string, any>): Lead {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(raw).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
      if (found && raw[found] !== "" && raw[found] != null) return raw[found];
    }
    return null;
  };
  const valor = get("valor", "value", "preço", "preco");
  return {
    consultor: get("consultor", "vendedor", "responsavel", "responsável"),
    etapa: get("etapa", "stage", "fase"),
    status: get("status", "situacao", "situação"),
    motivo_perda: get("motivo_perda", "motivo", "motivo da perda"),
    fonte: get("fonte", "origem", "source"),
    valor: valor != null ? Number(String(valor).replace(/[^\d.,-]/g, "").replace(",", ".")) || null : null,
    nome_cliente: get("nome_cliente", "cliente", "nome"),
    created_at: get("created_at", "data", "data_criacao", "data criação") || undefined,
  };
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
        const rows = res.data.map(normalizeRow).filter((r) => r.consultor || r.etapa || r.status);
        if (rows.length === 0) {
          setBusy(false);
          setResult({ ok: 0, err: 0, msg: "Nenhuma linha válida encontrada" });
          return;
        }
        const { error } = await supabase.from(TABLE).insert(rows);
        if (error) {
          setResult({ ok: 0, err: rows.length, msg: error.message });
          toast.error("Erro ao inserir: " + error.message);
        } else {
          setResult({ ok: rows.length, err: 0 });
          toast.success(`${rows.length} leads inseridos com sucesso`);
          qc.invalidateQueries({ queryKey: ["leads"] });
        }
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
            <h2 className="text-lg font-semibold">Importar Leads via CSV</h2>
            <p className="text-sm text-muted-foreground mt-1">Cada linha será inserida automaticamente em <code className="text-primary">leads_imobiliarios</code>.</p>
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
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Schema esperado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          A tabela <code className="text-primary">leads_imobiliarios</code> deve conter as colunas abaixo. Aceitamos variantes em PT-BR (consultor/vendedor, etapa/fase, fonte/origem, valor/preço, etc.).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {COLS.map((c) => (
            <div key={c} className="px-3 py-2 rounded bg-muted font-mono text-foreground">{c}</div>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Valores esperados — <span className="text-foreground">etapa</span>: Oportunidade, Visita, Contrato &nbsp;·&nbsp;
          <span className="text-foreground">status</span>: Em andamento, Ganho, Perdido
        </div>
      </Card>
    </div>
  );
}
