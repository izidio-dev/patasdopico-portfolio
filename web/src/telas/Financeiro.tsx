import { ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight, Plus, Scale, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alerta, botao, Campo, Selecao } from "../componentes/Campo";
import { Janela } from "../componentes/Janela";
import { api, ErroApi } from "../lib/api";
import { dataCurta, hojeISO, maiusculaInicial, mesAbreviado, mesAtual, nomeMes, nomeServico, paraCentavos, reais, somarMeses } from "../lib/formato";
import type { Servico } from "../lib/tipos";
import type { Lancamento, ResumoFinanceiro, TipoLancamento } from "../lib/tipos";

const categoriasSugeridas: Record<TipoLancamento, string[]> = {
  ENTRADA: ["Vendas", "Serviços", "Outros"],
  SAIDA: ["Aluguel", "Salários", "Produtos", "Contas", "Manutenção", "Impostos", "Outros"],
};

/** Financeiro (só o dono): entradas, saídas, saldo, categorias e últimos 6 meses. */
export function Financeiro() {
  const [mes, setMes] = useState(mesAtual());
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [novo, setNovo] = useState<TipoLancamento | null>(null);
  const [todos, setTodos] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(() => {
    setTodos(false);
    Promise.all([api<ResumoFinanceiro>(`/api/financeiro/resumo?mes=${mes}`), api<Lancamento[]>(`/api/financeiro/lancamentos?mes=${mes}`)])
      .then(([r, l]) => {
        setResumo(r);
        setLancamentos(l);
      })
      .catch((e) => setErro(e.message));
  }, [mes]);
  useEffect(carregar, [carregar]);

  async function apagar(l: Lancamento) {
    try {
      await api(`/api/financeiro/lancamentos/${l.id}`, { metodo: "DELETE" });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível apagar.");
    }
  }

  const visiveis = todos ? lancamentos : lancamentos.slice(0, 15);
  const maior = Math.max(1, ...(resumo?.ultimosMeses.flatMap((m) => [m.entradasCentavos, m.saidasCentavos]) ?? [1]));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-3xl">Financeiro</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setNovo("ENTRADA")} className={botao}>
            <Plus className="size-4" aria-hidden /> Nova entrada
          </button>
          <button type="button" onClick={() => setNovo("SAIDA")} className={`${botao} bg-coral hover:bg-coral/90`}>
            <Plus className="size-4" aria-hidden /> Nova saída
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => setMes(somarMeses(mes, -1))} aria-label="Mês anterior" className="grid size-9 place-items-center rounded-lg border border-linha bg-cartao">
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="titulo min-w-44 text-center text-lg">{maiusculaInicial(nomeMes(mes))}</p>
        <button type="button" onClick={() => setMes(somarMeses(mes, 1))} disabled={mes >= mesAtual()} aria-label="Próximo mês" className="grid size-9 place-items-center rounded-lg border border-linha bg-cartao disabled:opacity-40">
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}

      {resumo && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-linha bg-cartao p-4">
              <p className="flex items-center gap-2 text-sm text-suave"><ArrowUpCircle className="size-4 text-folha" aria-hidden /> Entradas</p>
              <p data-testid="entradas" className="titulo mt-2 text-2xl text-folha-escura tabular-nums">{reais(resumo.entradasCentavos)}</p>
            </div>
            <div className="rounded-xl border border-linha bg-cartao p-4">
              <p className="flex items-center gap-2 text-sm text-suave"><ArrowDownCircle className="size-4 text-coral" aria-hidden /> Saídas</p>
              <p data-testid="saidas" className="titulo mt-2 text-2xl text-coral tabular-nums">{reais(resumo.saidasCentavos)}</p>
            </div>
            <div className="rounded-xl border border-linha bg-cartao p-4">
              <p className="flex items-center gap-2 text-sm text-suave"><Scale className="size-4" aria-hidden /> Saldo do mês</p>
              <p data-testid="saldo" className={`titulo mt-2 text-2xl tabular-nums ${resumo.saldoCentavos < 0 ? "text-coral" : ""}`}>{reais(resumo.saldoCentavos)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section aria-label="Últimos 6 meses" className="rounded-xl border border-linha bg-cartao p-4">
              <h2 className="titulo text-lg">Últimos 6 meses</h2>
              <div className="mt-4 flex h-44 items-end gap-3">
                {resumo.ultimosMeses.map((m) => (
                  <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-36 w-full items-end justify-center gap-1">
                      <span title={`Entradas: ${reais(m.entradasCentavos)}`} className="w-1/3 max-w-5 rounded-t bg-folha" style={{ height: `${(m.entradasCentavos / maior) * 100}%` }} />
                      <span title={`Saídas: ${reais(m.saidasCentavos)}`} className="w-1/3 max-w-5 rounded-t bg-coral/80" style={{ height: `${(m.saidasCentavos / maior) * 100}%` }} />
                    </div>
                    <span className={`text-xs capitalize ${m.mes === mes ? "font-bold" : "text-suave"}`}>{mesAbreviado(m.mes)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex gap-4 text-xs text-suave">
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-folha" /> Entradas</span>
                <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-coral/80" /> Saídas</span>
              </p>
            </section>
            <section aria-label="Por categoria" className="rounded-xl border border-linha bg-cartao p-4">
              <h2 className="titulo text-lg">Por categoria</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {resumo.porCategoria.map((c) => (
                  <li key={c.tipo + c.categoria} className="flex justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${c.tipo === "ENTRADA" ? "bg-folha" : "bg-coral"}`} aria-hidden />
                      {c.categoria}
                    </span>
                    <span className="tabular-nums">{c.tipo === "SAIDA" ? "− " : ""}{reais(c.totalCentavos)}</span>
                  </li>
                ))}
                {resumo.porCategoria.length === 0 && <li className="text-suave">Sem lançamentos neste mês.</li>}
              </ul>
            </section>
          </div>

          <section aria-label="Lançamentos" className="mt-6">
            <h2 className="titulo text-lg">Lançamentos</h2>
            <ul className="mt-3 divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-cartao">
              {visiveis.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-20 text-suave tabular-nums">{dataCurta(l.data).slice(0, 5)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{l.categoria}</span>
                    {l.descricao && <span className="text-suave"> · {nomeServico[l.descricao as Servico] ?? l.descricao}</span>}
                    {l.automatico && <span className="ml-2 rounded bg-folha-clara px-1.5 py-0.5 text-[11px] font-bold text-folha-escura">automático</span>}
                  </span>
                  <span className={`font-semibold tabular-nums ${l.tipo === "SAIDA" ? "text-coral" : "text-folha-escura"}`}>
                    {l.tipo === "SAIDA" ? "− " : "+ "}{reais(l.valorCentavos)}
                  </span>
                  {!l.automatico ? (
                    <button type="button" onClick={() => apagar(l)} aria-label={`Apagar ${l.categoria}`} className="grid size-8 place-items-center rounded-full text-coral hover:bg-coral/10">
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  ) : (
                    <span className="size-8" />
                  )}
                </li>
              ))}
              {lancamentos.length === 0 && <li className="p-6 text-center text-suave">Nenhum lançamento neste mês.</li>}
            </ul>
            {lancamentos.length > 15 && (
              <button type="button" onClick={() => setTodos(!todos)} className="mt-3 text-sm font-semibold text-folha">
                {todos ? "Mostrar menos" : `Mostrar todos (${lancamentos.length})`}
              </button>
            )}
          </section>
        </>
      )}

      {novo && (
        <NovoLancamento
          tipo={novo}
          aoFechar={() => setNovo(null)}
          aoSalvar={() => {
            setNovo(null);
            carregar();
          }}
        />
      )}
    </>
  );
}

function NovoLancamento({ tipo, aoFechar, aoSalvar }: { tipo: TipoLancamento; aoFechar: () => void; aoSalvar: () => void }) {
  const [categoria, setCategoria] = useState(categoriasSugeridas[tipo][0]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hojeISO());
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const centavos = paraCentavos(valor);
    if (centavos === null || centavos <= 0) return setErros({ valorCentavos: "Informe um valor como 150,00." });
    try {
      await api("/api/financeiro/lancamentos", { metodo: "POST", corpo: { tipo, categoria, descricao, valorCentavos: centavos, data } });
      aoSalvar();
    } catch (e) {
      if (e instanceof ErroApi) setErros(e.campos);
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <Janela titulo={tipo === "ENTRADA" ? "Nova entrada" : "Nova saída"} aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="space-y-4">
        <Selecao rotulo="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} erro={erros.categoria}>
          {categoriasSugeridas[tipo].map((c) => <option key={c}>{c}</option>)}
        </Selecao>
        <Campo rotulo="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} placeholder={tipo === "SAIDA" ? "Ex.: conta de luz de outubro" : "Ex.: venda de ração"} />
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor (R$)" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" erro={erros.valorCentavos} />
          <Campo rotulo="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        {erro && <Alerta>{erro}</Alerta>}
        <button type="submit" className={`${botao} w-full`}>Salvar</button>
      </form>
    </Janela>
  );
}
