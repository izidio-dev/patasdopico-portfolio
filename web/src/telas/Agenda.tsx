import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Alerta, botao, Campo, Selecao } from "../componentes/Campo";
import { Janela } from "../componentes/Janela";
import { ListaAtendimentos } from "../componentes/ListaAtendimentos";
import { api, ErroApi } from "../lib/api";
import { hojeISO, nomeEspecie, nomeServico, paraCentavos, precoSugerido, maiusculaInicial } from "../lib/formato";
import type { Atendimento, Pagina, Pet, Servico, Tutor, TutorResumo } from "../lib/tipos";

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function Agenda() {
  const [dia, setDia] = useState(hojeISO());
  const [itens, setItens] = useState<Atendimento[] | null>(null);
  const [novo, setNovo] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setItens(null);
    api<Atendimento[]>(`/api/atendimentos?data=${dia}`).then(setItens).catch((e) => setErro(e.message));
  }, [dia]);

  const rotuloDia = new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-3xl">Agenda</h1>
        <button type="button" onClick={() => setNovo(true)} className={botao}>
          <Plus className="size-4" aria-hidden /> Novo atendimento
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDia(somarDias(dia, -1))} aria-label="Dia anterior" className="grid size-9 place-items-center rounded-lg border border-linha bg-cartao">
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <input type="date" aria-label="Dia" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} className="rounded-lg border border-linha bg-cartao px-3 py-1.5" />
        <button type="button" onClick={() => setDia(somarDias(dia, 1))} aria-label="Próximo dia" className="grid size-9 place-items-center rounded-lg border border-linha bg-cartao">
          <ChevronRight className="size-4" aria-hidden />
        </button>
        {dia !== hojeISO() && (
          <button type="button" onClick={() => setDia(hojeISO())} className="text-sm font-semibold text-folha">
            Voltar para hoje
          </button>
        )}
        <p className="ml-1 text-suave">{maiusculaInicial(rotuloDia)}</p>
      </div>

      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}
      <div className="mt-5">
        {itens ? <ListaAtendimentos itens={itens} aoMudar={(n) => setItens((l) => l?.map((x) => (x.id === n.id ? n : x)) ?? null)} /> : <p className="text-suave">Carregando…</p>}
      </div>

      {novo && (
        <NovoAtendimento
          dia={dia}
          aoFechar={() => setNovo(false)}
          aoCriar={(a) => {
            setNovo(false);
            if (a.dataHora.startsWith(dia)) setItens((l) => [...(l ?? []).filter((x) => x.id !== a.id), a].sort((x, y) => x.dataHora.localeCompare(y.dataHora)));
          }}
        />
      )}
    </>
  );
}

type Opcao = { pet: Pet; tutor: Tutor };

function NovoAtendimento({ dia, aoFechar, aoCriar }: { dia: string; aoFechar: () => void; aoCriar: (a: Atendimento) => void }) {
  const [busca, setBusca] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [escolhido, setEscolhido] = useState<Opcao | null>(null);
  const [servico, setServico] = useState<Servico>("BANHO");
  const [data, setData] = useState(dia);
  const [horario, setHorario] = useState("10:00");
  const [valor, setValor] = useState("60,00");
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  // Busca tutores e mostra os pets de cada um para escolher.
  useEffect(() => {
    if (busca.trim().length < 2) return setOpcoes([]);
    const t = setTimeout(async () => {
      try {
        const lista = await api<Pagina<TutorResumo>>(`/api/tutores?busca=${encodeURIComponent(busca)}&tamanho=5`);
        const detalhes = await Promise.all(lista.itens.filter((x) => x.quantidadePets > 0).map((x) => api<Tutor>(`/api/tutores/${x.id}`)));
        setOpcoes(detalhes.flatMap((tutor) => tutor.pets.map((pet) => ({ pet, tutor }))));
      } catch {
        setOpcoes([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [busca]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const centavos = paraCentavos(valor);
    const locais: Record<string, string> = {};
    if (!escolhido) locais.petId = "Escolha o pet.";
    if (centavos === null) locais.valorCentavos = "Informe um valor como 70,00.";
    setErros(locais);
    if (Object.keys(locais).length) return;
    try {
      aoCriar(await api<Atendimento>("/api/atendimentos", { metodo: "POST", corpo: { petId: escolhido!.pet.id, servico, dataHora: `${data}T${horario}:00`, valorCentavos: centavos, observacoes } }));
    } catch (e) {
      if (e instanceof ErroApi) setErros(e.campos);
      setErro(e instanceof Error ? e.message : "Não foi possível agendar.");
    }
  }

  return (
    <Janela titulo="Novo atendimento" aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="space-y-4">
        {escolhido ? (
          <div className="flex items-center justify-between rounded-lg bg-folha-clara px-3 py-2 text-sm">
            <span>
              <strong>{escolhido.pet.nome}</strong> ({nomeEspecie[escolhido.pet.especie]}) · {escolhido.tutor.nome}
            </span>
            <button type="button" onClick={() => setEscolhido(null)} className="font-semibold text-folha-escura">
              Trocar
            </button>
          </div>
        ) : (
          <div>
            <Campo rotulo="Buscar tutor" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou telefone" erro={erros.petId} />
            <div className="mt-2 space-y-1">
              {opcoes.map((o) => (
                <button key={o.pet.id} type="button" onClick={() => setEscolhido(o)} className="block w-full rounded-lg border border-linha px-3 py-2 text-left text-sm hover:border-folha">
                  <strong>{o.pet.nome}</strong> · {o.tutor.nome}
                </button>
              ))}
              {busca.trim().length >= 2 && opcoes.length === 0 && <p className="text-xs text-suave">Nenhum pet encontrado. Cadastre o tutor e o pet em Tutores.</p>}
            </div>
          </div>
        )}
        <Selecao
          rotulo="Serviço"
          value={servico}
          onChange={(e) => {
            const s = e.target.value as Servico;
            setServico(s);
            setValor((precoSugerido[s] / 100).toFixed(2).replace(".", ","));
          }}
        >
          {(Object.keys(nomeServico) as Servico[]).map((s) => (
            <option key={s} value={s}>
              {nomeServico[s]}
            </option>
          ))}
        </Selecao>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} erro={erros.dataHora} />
          <Campo rotulo="Horário" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
        </div>
        <Campo rotulo="Valor (R$)" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} erro={erros.valorCentavos} />
        <Campo rotulo="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={500} placeholder="Ex.: laço rosa, perfume suave" />
        {erro && <Alerta>{erro}</Alerta>}
        <button type="submit" className={`${botao} w-full`}>
          Agendar
        </button>
      </form>
    </Janela>
  );
}
