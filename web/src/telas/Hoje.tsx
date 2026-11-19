import { CalendarCheck, CircleDollarSign, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ListaAtendimentos } from "../componentes/ListaAtendimentos";
import { api } from "../lib/api";
import { hojeISO, reais, maiusculaInicial } from "../lib/formato";
import type { Atendimento, Resumo } from "../lib/tipos";

export function Hoje() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [agenda, setAgenda] = useState<Atendimento[] | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(() => {
    Promise.all([api<Resumo>("/api/resumo"), api<Atendimento[]>(`/api/atendimentos?data=${hojeISO()}`)])
      .then(([r, a]) => {
        setResumo(r);
        setAgenda(a);
      })
      .catch((e) => setErro(e.message));
  }, []);
  useEffect(carregar, [carregar]);

  const data = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
  // Faturamento só aparece para o dono (para o funcionário a API manda null).
  const cartoes = resumo && [
    { rotulo: "Agendados hoje", valor: String(resumo.hoje.agendados), icone: Clock, id: "agendados" },
    { rotulo: "Concluídos hoje", valor: String(resumo.hoje.concluidos), icone: CalendarCheck, id: "concluidos" },
    ...(resumo.faturamentoMesCentavos !== null ? [{ rotulo: "Faturamento do mês (serviços)", valor: reais(resumo.faturamentoMesCentavos), icone: CircleDollarSign, id: "faturamento" }] : []),
  ];

  return (
    <>
      <h1 className="titulo text-3xl">Hoje</h1>
      <p className="mt-1 text-suave">{maiusculaInicial(data)}</p>
      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}

      <div className={`mt-6 grid gap-3 ${cartoes && cartoes.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {cartoes?.map((c) => (
          <div key={c.id} className="rounded-xl border border-linha bg-cartao p-4">
            <p className="flex items-center gap-2 text-sm text-suave">
              <c.icone className="size-4 text-folha" aria-hidden /> {c.rotulo}
            </p>
            <p data-testid={c.id} className="titulo mt-2 text-3xl tabular-nums">
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <h2 className="titulo mt-10 text-xl">Agenda de hoje</h2>
      <div className="mt-3">
        {agenda ? (
          <ListaAtendimentos
            itens={agenda}
            aoMudar={(novo) => {
              setAgenda((l) => l?.map((x) => (x.id === novo.id ? novo : x)) ?? null);
              api<Resumo>("/api/resumo").then(setResumo).catch(() => {});
            }}
          />
        ) : (
          <p className="text-suave">Carregando…</p>
        )}
      </div>
    </>
  );
}
