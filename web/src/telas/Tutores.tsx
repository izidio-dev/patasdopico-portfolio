import { ChevronRight, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { botao } from "../componentes/Campo";
import { FormTutor } from "../componentes/FormTutor";
import { api } from "../lib/api";
import { telefone } from "../lib/formato";
import type { Pagina, TutorResumo } from "../lib/tipos";

export function Tutores() {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<Pagina<TutorResumo> | null>(null);
  const [novo, setNovo] = useState(false);
  const [erro, setErro] = useState("");
  const ir = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      api<Pagina<TutorResumo>>(`/api/tutores?busca=${encodeURIComponent(busca)}&pagina=${pagina}`).then(setDados).catch((e) => setErro(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [busca, pagina]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-3xl">Tutores</h1>
        <button type="button" onClick={() => setNovo(true)} className={botao}>
          <Plus className="size-4" aria-hidden /> Novo tutor
        </button>
      </div>

      <label className="relative mt-5 block">
        <span className="sr-only">Buscar por nome ou telefone</span>
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-suave" aria-hidden />
        <input
          aria-label="Buscar por nome ou telefone"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
          placeholder="Buscar por nome ou telefone"
          className="w-full rounded-xl border border-linha bg-cartao py-3 pr-3 pl-10 outline-none focus:border-folha"
        />
      </label>

      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}

      <ul className="mt-5 divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-cartao">
        {dados?.itens.map((t) => (
          <li key={t.id}>
            <Link to={`/tutores/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fundo">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-folha-clara font-bold text-folha-escura">{t.nome.charAt(0)}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{t.nome}</span>
                <span className="block text-sm text-suave">
                  {telefone(t.telefone)} · {t.quantidadePets} {t.quantidadePets === 1 ? "pet" : "pets"}
                </span>
              </span>
              <ChevronRight className="size-4 text-suave" aria-hidden />
            </Link>
          </li>
        ))}
        {dados && dados.itens.length === 0 && <li className="p-6 text-center text-suave">Nenhum tutor encontrado.</li>}
      </ul>

      {dados && dados.totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} className="rounded-lg border border-linha px-3 py-1.5 disabled:opacity-40">
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {dados.totalPaginas}
          </span>
          <button type="button" disabled={pagina + 1 >= dados.totalPaginas} onClick={() => setPagina(pagina + 1)} className="rounded-lg border border-linha px-3 py-1.5 disabled:opacity-40">
            Próxima
          </button>
        </div>
      )}

      {novo && <FormTutor aoFechar={() => setNovo(false)} aoSalvar={(t) => ir(`/tutores/${t.id}`)} />}
    </>
  );
}
