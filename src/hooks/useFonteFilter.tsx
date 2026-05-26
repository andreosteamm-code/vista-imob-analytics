import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  fonte: string | null;
  setFonte: (v: string | null) => void;
  clear: () => void;
};

const FonteFilterContext = createContext<Ctx | null>(null);

export function FonteFilterProvider({ children }: { children: ReactNode }) {
  const [fonte, setFonte] = useState<string | null>(null);
  return (
    <FonteFilterContext.Provider value={{ fonte, setFonte, clear: () => setFonte(null) }}>
      {children}
    </FonteFilterContext.Provider>
  );
}

export function useFonteFilter() {
  const ctx = useContext(FonteFilterContext);
  if (!ctx) throw new Error("useFonteFilter must be used within FonteFilterProvider");
  return ctx;
}
