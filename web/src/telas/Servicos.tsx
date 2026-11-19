import { useEffect, useState } from "react";
import { botao } from "../componentes/Campo";
import { api } from "../lib/api";
import { nomeServico, paraCentavos, reais } from "../lib/formato";
import { useSessao } from "../lib/sessao";
import type { ServicoPreco } from "../lib/tipos";

/** Tabela de serviços: todos veem; só o dono edita preço e duração. */
export function Servicos() {
  const { sessao } = useSessao();
  const dono = sessao?.papel === "DONO";
  const [lista, setLista] = useState<ServicoPreco[]>([]);
  const [rascunho, setRascunho] = useState<Record<string, { preco: string; duracao: string }>>({});
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api<ServicoPreco[]>("/api/servicos").then(setLista).catch((e) => setErro(e.message));
  }, []);

  async function salvar(s: ServicoPreco) {
    const r = rascunho[s.servico];
    const preco = paraCentavos(r.preco);
    if (preco === null) return setErro("Informe um preço como 65,00.");
    try {
      setErro("");
      const novo = await api<ServicoPreco>(`/api/servicos/${s.servico}`, { metodo: "PUT", corpo: { precoCentavos: preco, duracaoMin: Number(r.duracao) } });
      setLista((l) => l.map((x) => (x.servico === novo.servico ? novo : x)));
      setRascunho(({ [s.servico]: _, ...resto }) => resto);
      setAviso(`${nomeServico[s.servico]} atualizado`);
      setTimeout(() => setAviso(""), 2500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <>
      <h1 className="titulo text-3xl">Serviços</h1>
      <p className="mt-1 text-suave">{dono ? "Altere preço e duração. Os clientes veem o preço novo ao agendar." : "Preços e duração dos serviços. Só o dono altera."}</p>
      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}
      <ul className="mt-6 divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-cartao">
        {lista.map((s) => {
          const r = rascunho[s.servico];
          return (
            <li key={s.servico} className="flex flex-wrap items-center gap-3 p-4">
              <p className="min-w-40 flex-1 font-bold">{nomeServico[s.servico]}</p>
              {dono && r ? (
                <>
                  <label className="text-sm">
                    <span className="sr-only">Preço de {nomeServico[s.servico]}</span>
                    <span className="mr-1 text-suave">R$</span>
                    <input aria-label={`Preço de ${nomeServico[s.servico]}`} value={r.preco} onChange={(e) => setRascunho({ ...rascunho, [s.servico]: { ...r, preco: e.target.value } })}
                      className="w-24 rounded-lg border border-linha px-2 py-1.5 tabular-nums" />
                  </label>
                  <label className="text-sm">
                    <input aria-label={`Duração de ${nomeServico[s.servico]}`} type="number" min={15} step={15} value={r.duracao}
                      onChange={(e) => setRascunho({ ...rascunho, [s.servico]: { ...r, duracao: e.target.value } })} className="w-20 rounded-lg border border-linha px-2 py-1.5" />
                    <span className="ml-1 text-suave">min</span>
                  </label>
                  <button type="button" onClick={() => salvar(s)} className={botao}>Salvar</button>
                </>
              ) : (
                <>
                  <p className="text-sm text-suave">{s.duracaoMin} min</p>
                  <p className="w-28 text-right font-semibold tabular-nums">{reais(s.precoCentavos)}</p>
                  {dono && (
                    <button type="button" onClick={() => setRascunho({ ...rascunho, [s.servico]: { preco: (s.precoCentavos / 100).toFixed(2).replace(".", ","), duracao: String(s.duracaoMin) } })}
                      className="text-sm font-semibold text-folha" aria-label={`Editar ${nomeServico[s.servico]}`}>
                      Editar
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-folha">{aviso}</p>
    </>
  );
}
