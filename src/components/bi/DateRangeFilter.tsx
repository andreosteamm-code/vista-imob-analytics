import { useDateFilter } from "@/hooks/useDateFilter";
import { Button } from "@/components/ui/button";
import { CalendarRange, X } from "lucide-react";

export function DateRangeFilter() {
  const { from, to, setFrom, setTo, reset } = useDateFilter();
  const active = from || to;
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-card border border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground pr-2 border-r border-border">
        <CalendarRange className="h-4 w-4 text-primary" />
        <span className="font-medium uppercase tracking-wider">Data de criação</span>
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
      {active && (
        <Button variant="ghost" size="sm" onClick={reset} className="h-8 px-2 text-xs">
          <X className="h-3 w-3 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
