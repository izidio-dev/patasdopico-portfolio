import { CalendarPlus, Home, LogOut, PawPrint, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useSessao } from "../lib/sessao";

const itens = [
  { para: "/", rotulo: "Início", icone: Home },
  { para: "/agendar", rotulo: "Agendar", icone: CalendarPlus },
  { para: "/pets", rotulo: "Meus pets", icone: PawPrint },
  { para: "/dados", rotulo: "Meus dados", icone: UserRound },
];

/** Área do cliente: menu no topo (computador) e na parte de baixo (celular). */
export function LayoutCliente() {
  const { sessao, sair } = useSessao();
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="border-b border-linha bg-cartao">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <p className="titulo flex items-center gap-2 text-xl text-folha">
            <PawPrint className="size-6" aria-hidden /> Patas do Pico
          </p>
          <nav aria-label="Menu" className="hidden gap-1 md:flex">
            {itens.map((i) => (
              <NavLink key={i.para} to={i.para} end={i.para === "/"}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-folha-clara text-folha-escura" : "text-suave hover:text-tinta"}`}>
                {i.rotulo}
              </NavLink>
            ))}
          </nav>
          <button type="button" onClick={() => sair()} className="flex items-center gap-1.5 text-sm text-suave hover:text-tinta">
            <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>
      {sessao?.demo && <p className="bg-sol/25 px-4 py-1.5 text-center text-xs">Demonstração · você está vendo a conta fictícia da Ana Beatriz</p>}
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-linha bg-cartao md:hidden">
        {itens.map((i) => (
          <NavLink key={i.para} to={i.para} end={i.para === "/"}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? "text-folha" : "text-suave"}`}>
            <i.icone className="size-5" aria-hidden /> {i.rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
