import { ArrowLeft, Cat, Dog, Download, PawPrint, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { botao, botaoSecundario } from "../componentes/Campo";
import { FormPet } from "../componentes/FormPet";
import { FormTutor } from "../componentes/FormTutor";
import { api, baixarJson } from "../lib/api";
import { dataCurta, idade, nomeEspecie, nomePorte, nomeServico, nomeStatus, reais, telefone } from "../lib/formato";
import type { Atendimento, Pet, Tutor } from "../lib/tipos";

const iconeEspecie = { CAO: Dog, GATO: Cat, OUTRO: PawPrint };

export function TutorDetalhe() {
  const { id } = useParams();
  const ir = useNavigate();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(false);
  const [formPet, setFormPet] = useState<Pet | "novo" | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [historico, setHistorico] = useState<Record<number, Atendimento[]>>({});

  useEffect(() => {
    api<Tutor>(`/api/tutores/${id}`).then(setTutor).catch((e) => setErro(e.message));
  }, [id]);

  if (erro)
    return (
      <div>
        <p role="alert" className="text-coral">{erro}</p>
        <Link to="/tutores" className="mt-4 inline-block font-semibold text-folha">Voltar para tutores</Link>
      </div>
    );
  if (!tutor) return <p className="text-suave">Carregando…</p>;

  async function exportar() {
    baixarJson(`tutor-${tutor!.id}-dados.json`, await api(`/api/tutores/${tutor!.id}/exportacao`));
  }

  async function excluir() {
    try {
      await api(`/api/tutores/${tutor!.id}`, { metodo: "DELETE" });
      ir("/tutores");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  }

  async function excluirPet(p: Pet) {
    await api(`/api/pets/${p.id}`, { metodo: "DELETE" });
    setTutor({ ...tutor!, pets: tutor!.pets.filter((x) => x.id !== p.id) });
  }

  async function verHistorico(p: Pet) {
    const lista = await api<Atendimento[]>(`/api/pets/${p.id}/atendimentos`);
    setHistorico((h) => ({ ...h, [p.id]: lista }));
  }

  return (
    <>
      <Link to="/tutores" className="inline-flex items-center gap-1.5 text-sm text-suave hover:text-tinta">
        <ArrowLeft className="size-4" aria-hidden /> Tutores
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="titulo text-3xl">{tutor.nome}</h1>
          <p className="mt-1 text-suave">
            {telefone(tutor.telefone)}
            {tutor.email && ` · ${tutor.email}`}
          </p>
          {tutor.observacoes && <p className="mt-2 text-sm italic text-suave">“{tutor.observacoes}”</p>}
        </div>
        <button type="button" onClick={() => setEditando(true)} className={botaoSecundario}>
          <Pencil className="size-4" aria-hidden /> Editar
        </button>
      </div>

      <section aria-label="Pets" className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="titulo text-xl">Pets</h2>
          <button type="button" onClick={() => setFormPet("novo")} className={botao}>
            <Plus className="size-4" aria-hidden /> Adicionar pet
          </button>
        </div>
        {tutor.pets.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-linha p-6 text-center text-suave">Nenhum pet cadastrado.</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {tutor.pets.map((p) => {
            const Icone = iconeEspecie[p.especie];
            const lista = historico[p.id];
            return (
              <article key={p.id} className="rounded-xl border border-linha bg-cartao p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-folha-clara text-folha-escura">
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="titulo text-lg">{p.nome}</h3>
                    <p className="text-sm text-suave">
                      {nomeEspecie[p.especie]} · {nomePorte[p.porte]}
                      {p.raca && ` · ${p.raca}`}
                      {idade(p.nascimento) && ` · ${idade(p.nascimento)}`}
                    </p>
                    {p.observacoes && <p className="mt-1 text-sm text-coral">⚠ {p.observacoes}</p>}
                  </div>
                  <button type="button" onClick={() => setFormPet(p)} aria-label={`Editar ${p.nome}`} className="grid size-8 place-items-center rounded-full hover:bg-fundo">
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => excluirPet(p)} aria-label={`Excluir ${p.nome}`} className="grid size-8 place-items-center rounded-full text-coral hover:bg-coral/10">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                {lista ? (
                  <ul className="mt-3 space-y-1 border-t border-linha pt-3 text-sm">
                    {lista.length === 0 && <li className="text-suave">Sem atendimentos ainda.</li>}
                    {lista.map((a) => (
                      <li key={a.id} className="flex justify-between gap-2">
                        <span>
                          {dataCurta(a.dataHora)} · {nomeServico[a.servico]} <span className="text-suave">({nomeStatus[a.status]})</span>
                        </span>
                        <span className="tabular-nums">{reais(a.valorCentavos)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <button type="button" onClick={() => verHistorico(p)} className="mt-3 text-sm font-semibold text-folha">
                    Ver histórico
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-label="Privacidade" className="mt-10 rounded-xl border border-linha bg-cartao p-5">
        <h2 className="titulo text-xl">Privacidade (LGPD)</h2>
        <p className="mt-1 text-sm text-suave">O tutor pode pedir uma cópia dos dados ou a exclusão a qualquer momento.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={exportar} className={botaoSecundario}>
            <Download className="size-4" aria-hidden /> Exportar dados (LGPD)
          </button>
          {!confirmandoExclusao && (
            <button type="button" onClick={() => setConfirmandoExclusao(true)} className={`${botaoSecundario} text-coral`}>
              <Trash2 className="size-4" aria-hidden /> Excluir tutor
            </button>
          )}
        </div>
        {confirmandoExclusao && (
          <div className="mt-4 rounded-lg border border-coral/40 bg-coral/10 p-4 text-sm">
            <p className="font-bold">Excluir {tutor.nome} e os pets?</p>
            <p className="mt-1">
              Nome, telefone, e-mail e os dados dos pets serão apagados. Os atendimentos continuam no faturamento como registro financeiro anônimo, sem nome e sem
              observações. Não dá para desfazer.
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={excluir} className="rounded-lg bg-coral px-4 py-2 font-bold text-white">
                Sim, excluir dados
              </button>
              <button type="button" onClick={() => setConfirmandoExclusao(false)} className="px-3 py-2 font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {editando && (
        <FormTutor
          tutor={tutor}
          aoFechar={() => setEditando(false)}
          aoSalvar={(t) => {
            setTutor(t);
            setEditando(false);
          }}
        />
      )}
      {formPet && (
        <FormPet
          tutorId={tutor.id}
          pet={formPet === "novo" ? undefined : formPet}
          aoFechar={() => setFormPet(null)}
          aoSalvar={(p) => {
            setTutor({ ...tutor, pets: formPet === "novo" ? [...tutor.pets, p] : tutor.pets.map((x) => (x.id === p.id ? p : x)) });
            setFormPet(null);
          }}
        />
      )}
    </>
  );
}
