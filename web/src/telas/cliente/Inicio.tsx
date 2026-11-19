import { CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { botao } from "../../componentes/Campo";
import { api } from "../../lib/api";
import { dataCurta, hora, nomeServico, nomeStatus, reais } from "../../lib/formato";
import type { Atendimento, StatusAtendimento, Tutor } from "../../lib/tipos";

const cor: Record<StatusAtendimento, string> = {
  SOLICITADO: "bg-sol/30",
  AGENDADO: "bg-folha-clara text-folha-escura",
  CONCLUIDO: "bg-linha text-suave",
  CANCELADO: "bg-linha text-suave line-through",
};
const explicacao: Partial<Record<StatusAtendimento, string>> = {
  SOLICITADO: "Aguardando a equipe confirmar",
  AGENDADO: "Confirmado pela equipe",
};

export function ClienteInicio() {
  const [perfil, setPerfil] = useState<Tutor | null>(null);
  const [agendamentos, setAgendamentos] = useState<Atendimento[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([api<Tutor>("/api/cliente/perfil"), api<Atendimento[]>("/api/cliente/agendamentos")])
      .then(([p, a]) => {
        setPerfil(p);
        setAgendamentos(a);
      })
      .catch((e) => setErro(e.message));
  }, []);

  async function cancelar(a: Atendimento) {
    try {
      const novo = await api<Atendimento>(`/api/cliente/agendamentos/${a.id}/cancelar`, { metodo: "PATCH" });
      setAgendamentos((l) => l?.map((x) => (x.id === a.id ? novo : x)) ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cancelar.");
    }
  }

  const agora = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T");
  const proximos = agendamentos?.filter((a) => a.dataHora > agora && (a.status === "SOLICITADO" || a.status === "AGENDADO")).reverse() ?? [];
  const historico = agendamentos?.filter((a) => !proximos.includes(a)) ?? [];

  return (
    <>
      <h1 className="titulo text-3xl">Olá, {perfil?.nome.split(" ")[0] ?? ""}!</h1>
      <p className="mt-1 text-suave">
        {perfil && (perfil.pets.length ? `${perfil.pets.map((p) => p.nome).join(", ")} ${perfil.pets.length > 1 ? "estão" : "está"} em boas mãos.` : "Cadastre seu primeiro pet para agendar.")}
      </p>
      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={perfil?.pets.length ? "/agendar" : "/pets"} className={botao}>
          <CalendarPlus className="size-4" aria-hidden /> {perfil?.pets.length ? "Agendar horário" : "Cadastrar pet"}
        </Link>
      </div>

      <section aria-label="Próximos agendamentos" className="mt-8">
        <h2 className="titulo text-xl">Próximos agendamentos</h2>
        <ul className="mt-3 space-y-3">
          {proximos.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-linha bg-cartao p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{nomeServico[a.servico]} · {a.petNome}</p>
                <p className="text-sm text-suave">
                  {dataCurta(a.dataHora)} às {hora(a.dataHora)} · {reais(a.valorCentavos)}
                </p>
                {explicacao[a.status] && <p className="mt-1 text-xs text-suave">{explicacao[a.status]}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cor[a.status]}`}>{nomeStatus[a.status]}</span>
              <button type="button" onClick={() => cancelar(a)} className="rounded-lg border border-linha px-3 py-1.5 text-xs font-semibold hover:border-coral">
                Cancelar
              </button>
            </li>
          ))}
          {agendamentos && proximos.length === 0 && <li className="rounded-xl border border-dashed border-linha p-6 text-center text-suave">Nenhum agendamento futuro.</li>}
        </ul>
      </section>

      {historico.length > 0 && (
        <section aria-label="Histórico" className="mt-8">
          <h2 className="titulo text-xl">Histórico</h2>
          <ul className="mt-3 divide-y divide-linha rounded-xl border border-linha bg-cartao text-sm">
            {historico.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 px-4 py-3">
                <span>
                  {dataCurta(a.dataHora)} · {nomeServico[a.servico]} · {a.petNome}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cor[a.status]}`}>{nomeStatus[a.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
