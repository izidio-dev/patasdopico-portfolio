import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Alerta, botao, Campo, Selecao } from "../../componentes/Campo";
import { api } from "../../lib/api";
import { dataCurta, hojeISO, nomeServico, reais } from "../../lib/formato";
import type { Atendimento, Servico, ServicoPreco, Tutor } from "../../lib/tipos";

/** Cliente escolhe pet, serviço, dia e um horário livre. A equipe confirma depois. */
export function ClienteAgendar() {
  const [perfil, setPerfil] = useState<Tutor | null>(null);
  const [servicos, setServicos] = useState<ServicoPreco[]>([]);
  const [petId, setPetId] = useState<number | "">("");
  const [servico, setServico] = useState<Servico>("BANHO");
  const [data, setData] = useState(hojeISO());
  const [horarios, setHorarios] = useState<string[] | null>(null);
  const [horario, setHorario] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState<Atendimento | null>(null);

  useEffect(() => {
    Promise.all([api<Tutor>("/api/cliente/perfil"), api<ServicoPreco[]>("/api/servicos")]).then(([p, s]) => {
      setPerfil(p);
      setServicos(s);
      if (p.pets.length === 1) setPetId(p.pets[0].id);
    });
  }, []);

  useEffect(() => {
    setHorario("");
    setHorarios(null);
    api<string[]>(`/api/cliente/horarios?data=${data}`).then(setHorarios).catch(() => setHorarios([]));
  }, [data]);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) return setErro("Escolha o pet.");
    if (!horario) return setErro("Escolha um horário.");
    setErro("");
    try {
      setFeito(await api<Atendimento>("/api/cliente/agendamentos", { metodo: "POST", corpo: { petId, servico, dataHora: `${data}T${horario}:00`, observacoes } }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível agendar.");
      api<string[]>(`/api/cliente/horarios?data=${data}`).then(setHorarios).catch(() => {});
    }
  }

  if (feito)
    return (
      <div role="status" className="mx-auto max-w-md rounded-2xl border border-linha bg-cartao p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-folha" aria-hidden />
        <h1 className="titulo mt-3 text-2xl">Pedido enviado!</h1>
        <p className="mt-2 text-suave">
          {nomeServico[feito.servico]} para {feito.petNome} em {dataCurta(feito.dataHora)} às {feito.dataHora.slice(11, 16)}. A equipe vai confirmar o horário.
        </p>
        <Link to="/" className={`${botao} mt-6`}>Ver meus agendamentos</Link>
      </div>
    );

  if (perfil && perfil.pets.length === 0)
    return (
      <p className="rounded-xl border border-dashed border-linha p-6 text-center text-suave">
        Cadastre um pet primeiro em <Link to="/pets" className="font-semibold text-folha">Meus pets</Link>.
      </p>
    );

  const precoAtual = servicos.find((s) => s.servico === servico);

  return (
    <>
      <h1 className="titulo text-3xl">Agendar</h1>
      <p className="mt-1 text-suave">Escolha o horário. A equipe confirma pelo sistema e você acompanha no Início.</p>
      <form onSubmit={confirmar} noValidate className="mt-6 max-w-xl space-y-5">
        <Selecao rotulo="Pet" value={petId} onChange={(e) => setPetId(Number(e.target.value) || "")}>
          <option value="">Escolha…</option>
          {perfil?.pets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </Selecao>
        <Selecao rotulo="Serviço" value={servico} onChange={(e) => setServico(e.target.value as Servico)}>
          {servicos.map((s) => (
            <option key={s.servico} value={s.servico}>
              {nomeServico[s.servico]} · {reais(s.precoCentavos)}
            </option>
          ))}
        </Selecao>
        <Campo rotulo="Dia" type="date" min={hojeISO()} value={data} onChange={(e) => e.target.value && setData(e.target.value)} />
        <fieldset>
          <legend className="text-sm font-semibold">Horários livres</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {horarios?.map((h) => (
              <label key={h} className="relative cursor-pointer rounded-lg border border-linha px-3 py-2 text-sm font-semibold tabular-nums has-checked:border-folha has-checked:bg-folha has-checked:text-white">
                <input type="radio" name="horario" value={h} checked={horario === h} onChange={() => setHorario(h)} aria-label={h} className="absolute inset-0 cursor-pointer appearance-none" />
                {h}
              </label>
            ))}
            {horarios === null && <p className="text-sm text-suave">Carregando horários…</p>}
            {horarios?.length === 0 && <p className="text-sm text-suave">Sem horários livres neste dia. Tente outro.</p>}
          </div>
        </fieldset>
        <Campo rotulo="Observações (opcional)" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={500} placeholder="Ex.: usar shampoo neutro" />
        {erro && <Alerta>{erro}</Alerta>}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-folha-clara p-4">
          <p className="text-sm">
            Total: <strong className="text-lg tabular-nums">{precoAtual ? reais(precoAtual.precoCentavos) : "—"}</strong>
            <span className="block text-xs text-suave">Pagamento no atendimento</span>
          </p>
          <button type="submit" className={botao}>Solicitar horário</button>
        </div>
      </form>
    </>
  );
}
