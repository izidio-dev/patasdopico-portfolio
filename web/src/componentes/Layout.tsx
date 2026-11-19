import { CalendarDays, Home, LogOut, PawPrint, Scissors, UserCog, Users, Wallet } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useSessao } from "../lib/sessao";

/** Menu do balcão. "soDono" some para o funcionário (e a API também recusa). */
const todosItens = [
  { para: "/", rotulo: "Hoje", icone: Home, soDono: false },
  { para: "/agenda", rotulo: "Agenda", icone: CalendarDays, soDono: false },
  { para: "/tutores", rotulo: "Tutores", icone: Users, soDono: false },
  { para: "/servicos", rotulo: "Serviços", icone: Scissors, soDono: false },
  { para: "/financeiro", rotulo: "Financeiro", icone: Wallet, soDono: true },
  { para: "/equipe", rotulo: "Equipe", icone: UserCog, soDono: true },
];

/** Menu lateral no computador e barra inferior no celular. */
export function Layout() {
  const { sessao, sair } = useSessao();
  const itens = todosItens.filter((i) => !i.soDono || sessao?.papel === "DONO");
  const classe = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-folha-clara text-folha-escura" : "text-suave hover:bg-fundo hover:text-tinta"}`;
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[230px_1fr]">
      <aside className="hidden flex-col border-r border-linha bg-cartao p-4 md:flex">
        <p className="titulo flex items-center gap-2 px-2 text-xl text-folha">
          <PawPrint className="size-6" aria-hidden /> Patas do Pico
        </p>
        <nav aria-label="Menu" className="mt-6 space-y-1">
          {itens.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.para === "/"} className={classe}>
              <i.icone className="size-4" aria-hidden /> {i.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-linha pt-4 text-sm">
          <p className="font-semibold">{sessao?.nome}</p>
          <p className="mt-1 text-xs text-suave">{sessao?.papel === "DONO" ? "Dono" : "Funcionário"}</p>
          {sessao?.demo && <p className="mt-1 inline-block rounded bg-sol/30 px-2 py-0.5 text-xs font-bold">Demonstração</p>}
          <button type="button" onClick={() => sair()} className="mt-3 flex items-center gap-2 text-suave hover:text-tinta">
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
        </div>
      </aside>

      <div className="min-w-0 pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-linha bg-cartao px-4 py-3 md:hidden">
          <p className="titulo flex items-center gap-2 text-lg text-folha">
            <PawPrint className="size-5" aria-hidden /> Patas do Pico
          </p>
          <button type="button" onClick={() => sair()} aria-label="Sair" className="grid size-9 place-items-center rounded-full hover:bg-fundo">
            <LogOut className="size-4" aria-hidden />
          </button>
        </header>
        {sessao?.demo && <p className="bg-sol/25 px-4 py-1.5 text-center text-xs">Modo demonstração · dados fictícios que voltam ao início quando o servidor reinicia</p>}
        <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Menu" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-linha bg-cartao md:hidden">
        {itens.map((i) => (
          <NavLink key={i.para} to={i.para} end={i.para === "/"} className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? "text-folha" : "text-suave"}`}>
            <i.icone className="size-5" aria-hidden /> {i.rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
