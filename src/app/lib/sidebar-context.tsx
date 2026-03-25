import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  sidebarWidth: number;
}

const Ctx = createContext<SidebarCtx>({ collapsed: false, toggle: () => {}, sidebarWidth: 224 });

const STORAGE_KEY = "qaradakor_sidebar_collapsed";
const WIDTH_EXPANDED = 240;
const WIDTH_COLLAPSED = 56;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  const toggle = () => {
    setCollapsed(v => {
      const next = !v;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const sidebarWidth = collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED;

  return (
    <Ctx.Provider value={{ collapsed, toggle, sidebarWidth }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSidebar() { return useContext(Ctx); }
export { WIDTH_EXPANDED, WIDTH_COLLAPSED };