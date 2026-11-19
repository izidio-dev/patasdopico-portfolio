import { Link } from "react-router";
import { useState } from "react";
import { api } from "../lib/api";
import { hora, nomeServico, nomeStatus, reais, telefone } from "../lib/formato";
import type { Atendimento, StatusAtendimento } from "../lib/tipos";

const corStatus: Record<StatusAtendimento, string> = {
  SOLICITADO: "bg-coral/15 text-coral",
  AGENDADO: "bg-sol/30 text-tinta",
  CONCLUIDO: "bg-folha-clara text-folha-escura",
  CANCELADO: "bg-linha text-suave line-through",
};

/** Lista de atendimentos com botões de concluir/cancelar para os agendados. */
export function ListaAtendimentos({ itens, aoMudar }: { itens: Atendimento[]; aoMudar: (a: Atendimento) => void }) {
  const [erro, setErro] = useState("");
  async function mudar(a: Atendimento, status: StatusAtendimento) {
    try {
      setErro("");
      aoMudar(await api<Atendimento>(`/api/atendimentos/${a.id}/status`, { metodo: "PATCH", corpo: { status } }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível mudar o status.");
    }
  }
  if (itens.length === 0) return <p className="rounded-xl border border-dashed border-linha p-6 text-center text-suave">Nenhum atendimento neste dia.</p>;
  return (
    <>
      {erro && <p role="alert" className="mb-3 text-sm text-coral">{erro}</p>}
      <ul className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-cartao">
        {itens.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
            <p className="titulo w-14 text-lg tabular-nums">{hora(a.dataHora)}</p>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {nomeServico[a.servico]} · {a.petNome ?? "Pet removido"}
              </p>
              <p className="text-sm text-suave">
                {a.tutorId ? (
                  <Link to={`/tutores/${a.tutorId}`} className="hover:underline">
                    {a.tutorNome}
                  </Link>
                ) : (
                  "Tutor excluído (LGPD)"
                )}
                {a.tutorTelefone && ` · ${telefone(a.tutorTelefone)}`}
              </p>
              {a.observacoes && <p className="mt-1 text-sm italic text-suave">“{a.observacoes}”</p>}
            </div>
            <p className="font-semibold tabular-nums">{reais(a.valorCentavos)}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${corStatus[a.status]}`}>{nomeStatus[a.status]}</span>
            {a.status === "SOLICITADO" && (
              <div className="flex gap-2">
                <button type="button" onClick={() => mudar(a, "AGENDADO")} className="rounded-lg bg-folha px-3 py-1.5 text-xs font-bold text-white hover:bg-folha-escura">
                  Confirmar
                </button>
                <button type="button" onClick={() => mudar(a, "CANCELADO")} className="rounded-lg border border-linha px-3 py-1.5 text-xs font-semibold hover:border-coral">
                  Recusar
                </button>
              </div>
            )}
            {a.status === "AGENDADO" && (
              <div className="flex gap-2">
                <button type="button" onClick={() => mudar(a, "CONCLUIDO")} className="rounded-lg bg-folha px-3 py-1.5 text-xs font-bold text-white hover:bg-folha-escura">
                  Concluir
                </button>
                <button type="button" onClick={() => mudar(a, "CANCELADO")} className="rounded-lg border border-linha px-3 py-1.5 text-xs font-semibold hover:border-coral">
                  Cancelar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
