import { useDateFilter } from "@/hooks/useDateFilter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarRange, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

function toIso(d?: Date) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIso(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DateRangeFilter() {
  const { from, to, setFrom, setTo, reset } = useDateFilter();
  const active = from || to;

  const range: DateRange | undefined = from || to
    ? { from: fromIso(from), to: fromIso(to) }
    : undefined;

  const label = range?.from
    ? range.to
      ? `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
      : format(range.from, "dd/MM/yyyy", { locale: ptBR })
    : "Selecionar período";

  return (
    <div className="glass glass-hover flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pr-2 border-r border-white/10">
        <CalendarRange className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium uppercase tracking-wider">Período</span>
      </div>


      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        De
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        Até
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>

      <span className="text-xs text-muted-foreground px-1">ou</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 justify-start gap-2 text-xs font-normal",
              !active && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            locale={ptBR}
            selected={range}
            onSelect={(r) => {
              setFrom(toIso(r?.from));
              setTo(toIso(r?.to));
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {active && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 px-2 text-xs">
          <X className="h-3 w-3 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
