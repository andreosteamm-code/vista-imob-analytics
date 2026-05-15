import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumoExecutivo } from "@/components/bi/ResumoExecutivo";
import { DetalhesOperacionais } from "@/components/bi/DetalhesOperacionais";
import { AnalisePerdas } from "@/components/bi/AnalisePerdas";
import { GestaoDados } from "@/components/bi/GestaoDados";
import { Toaster } from "@/components/ui/sonner";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  component: BIDashboard,
});

function BIDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster theme="dark" />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">BI Locação</h1>
              <p className="text-xs text-muted-foreground">Inteligência operacional de locação de imóveis</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums hidden sm:block">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="bg-card border border-border h-11 p-1">
            <TabsTrigger value="resumo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Resumo Executivo</TabsTrigger>
            <TabsTrigger value="ops" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Detalhes Operacionais</TabsTrigger>
            <TabsTrigger value="perdas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Análise de Perdas</TabsTrigger>
            <TabsTrigger value="dados" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Gestão de Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo"><ResumoExecutivo /></TabsContent>
          <TabsContent value="ops"><DetalhesOperacionais /></TabsContent>
          <TabsContent value="perdas"><AnalisePerdas /></TabsContent>
          <TabsContent value="dados"><GestaoDados /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
