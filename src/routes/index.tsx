import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ResumoExecutivo } from "@/components/bi/ResumoExecutivo";
import { DetalhesOperacionais } from "@/components/bi/DetalhesOperacionais";
import { AnalisePerdas } from "@/components/bi/AnalisePerdas";
import { GestaoDados } from "@/components/bi/GestaoDados";
import { BaseClientes } from "@/components/bi/BaseClientes";
import { AnaliseCanais } from "@/components/bi/AnaliseCanais";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Activity, ChevronDown, LayoutDashboard, BarChart3, Users, Settings as SettingsIcon } from "lucide-react";
import { DateFilterProvider } from "@/hooks/useDateFilter";
import { FonteFilterProvider } from "@/hooks/useFonteFilter";
import { DateRangeFilter } from "@/components/bi/DateRangeFilter";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: BIDashboard,
});

type View = "resumo" | "ops" | "canais" | "perdas" | "clientes" | "dados";

const ANALISES: { id: View; label: string }[] = [
  { id: "ops", label: "Detalhes Operacionais" },
  { id: "canais", label: "Análise de Canais" },
  { id: "perdas", label: "Análise de Perdas" },
];

const TITLES: Record<View, string> = {
  resumo: "Dashboard",
  ops: "Detalhes Operacionais",
  canais: "Análise de Canais",
  perdas: "Análise de Perdas",
  clientes: "Base de Clientes",
  dados: "Ajustes — Gestão de Dados",
};

function BIDashboard() {
  const [view, setView] = useState<View>("resumo");
  const analiseActive = ANALISES.some((a) => a.id === view);

  return (
    <DateFilterProvider>
      <FonteFilterProvider>
        <div className="min-h-screen text-foreground">
          <Toaster theme="dark" />

          {/* Top navigation */}
          <header className="sticky top-0 z-20 border-b border-white/5 bg-[oklch(0.14_0.02_255_/_0.6)] backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl grid place-items-center bg-gradient-to-br from-primary to-[oklch(0.72_0.18_300)] text-primary-foreground shadow-[var(--glow-primary)]">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-tight">BI Locação</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Real estate intelligence</div>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                <NavBtn
                  active={view === "resumo"}
                  onClick={() => setView("resumo")}
                  icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                  label="Dashboard"
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm transition-colors",
                        analiseActive
                          ? "text-foreground bg-white/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                      )}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Análises
                      <ChevronDown className="h-3 w-3 opacity-70" />
                      {analiseActive && <span className="ml-1 h-1 w-1 rounded-full bg-primary" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass border-white/10 min-w-[200px]">
                    {ANALISES.map((a) => (
                      <DropdownMenuItem
                        key={a.id}
                        onSelect={() => setView(a.id)}
                        className={cn(
                          "cursor-pointer text-sm",
                          view === a.id && "bg-primary/15 text-primary focus:bg-primary/20",
                        )}
                      >
                        {a.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <NavBtn
                  active={view === "clientes"}
                  onClick={() => setView("clientes")}
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Clientes"
                />
                <NavBtn
                  active={view === "dados"}
                  onClick={() => setView("dados")}
                  icon={<SettingsIcon className="h-3.5 w-3.5" />}
                  label="Ajustes"
                />
              </nav>

              <div className="text-xs text-muted-foreground tabular-nums hidden lg:block">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{TITLES[view]}</h1>
                <p className="text-xs text-muted-foreground">Inteligência operacional de locação de imóveis</p>
              </div>
              <DateRangeFilter />
            </div>

            {view === "resumo" && <ResumoExecutivo />}
            {view === "ops" && <DetalhesOperacionais />}
            {view === "canais" && <AnaliseCanais onDrillDown={() => setView("clientes")} />}
            {view === "perdas" && <AnalisePerdas />}
            {view === "clientes" && <BaseClientes />}
            {view === "dados" && <GestaoDados />}
          </main>
        </div>
      </FonteFilterProvider>
    </DateFilterProvider>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm transition-colors relative",
        active
          ? "text-foreground bg-white/5"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
      )}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute -bottom-[17px] left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-primary to-[oklch(0.72_0.18_300)]" />
      )}
    </button>
  );
}
