import { KeyRound, Plus, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { Alerta, botao, Campo } from "../componentes/Campo";
import { Janela } from "../componentes/Janela";
import { api, ErroApi } from "../lib/api";
import type { Membro } from "../lib/tipos";

/** Equipe (só o dono): criar funcionário, ativar/desativar e redefinir senha. */
export function Equipe() {
  const [lista, setLista] = useState<Membro[]>([]);
  const [novo, setNovo] = useState(false);
  const [senhaDe, setSenhaDe] = useState<Membro | null>(null);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    api<Membro[]>("/api/equipe").then(setLista).catch((e) => setErro(e.message));
  }, []);

  function avisar(t: string) {
    setAviso(t);
    setTimeout(() => setAviso(""), 2500);
  }

  async function alternar(m: Membro) {
    try {
      const novoM = await api<Membro>(`/api/equipe/${m.id}/ativo`, { metodo: "PATCH", corpo: { ativo: !m.ativo } });
      setLista((l) => l.map((x) => (x.id === m.id ? novoM : x)));
      avisar(novoM.ativo ? `${m.nome} pode entrar de novo` : `Acesso de ${m.nome} desativado`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível alterar.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-3xl">Equipe</h1>
        <button type="button" onClick={() => setNovo(true)} className={botao}>
          <Plus className="size-4" aria-hidden /> Novo funcionário
        </button>
      </div>
      <p className="mt-1 text-suave">Funcionários veem agenda, tutores, pets e serviços. Não veem o financeiro.</p>
      {erro && <p role="alert" className="mt-4 text-coral">{erro}</p>}
      <ul className="mt-6 divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-cartao">
        {lista.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className={`grid size-10 place-items-center rounded-full font-bold ${m.ativo ? "bg-folha-clara text-folha-escura" : "bg-linha text-suave"}`}>{m.nome.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {m.nome} {!m.ativo && <span className="ml-1 rounded bg-linha px-1.5 py-0.5 text-[11px] text-suave">Desativado</span>}
              </p>
              <p className="text-sm text-suave">
                {m.login} · {m.papel === "DONO" ? "Dono" : "Funcionário"}
              </p>
            </div>
            {m.papel !== "DONO" && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setSenhaDe(m)} className="flex items-center gap-1.5 rounded-lg border border-linha px-3 py-1.5 text-xs font-semibold hover:border-folha">
                  <KeyRound className="size-3.5" aria-hidden /> Nova senha
                </button>
                <button type="button" onClick={() => alternar(m)} className="flex items-center gap-1.5 rounded-lg border border-linha px-3 py-1.5 text-xs font-semibold hover:border-coral">
                  {m.ativo ? <UserX className="size-3.5" aria-hidden /> : <UserCheck className="size-3.5" aria-hidden />}
                  {m.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-folha">{aviso}</p>

      {novo && (
        <NovoFuncionario
          aoFechar={() => setNovo(false)}
          aoCriar={(m) => {
            // Se a lista recarregou nesse meio-tempo, o novo já pode estar nela: não duplica.
            setLista((l) => [...l.filter((x) => x.id !== m.id), m]);
            setNovo(false);
            avisar(`${m.nome} adicionado à equipe`);
          }}
        />
      )}
      {senhaDe && (
        <NovaSenha
          membro={senhaDe}
          aoFechar={() => setSenhaDe(null)}
          aoSalvar={() => {
            avisar(`Senha de ${senhaDe.nome} redefinida`);
            setSenhaDe(null);
          }}
        />
      )}
    </>
  );
}

function NovoFuncionario({ aoFechar, aoCriar }: { aoFechar: () => void; aoCriar: (m: Membro) => void }) {
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErros({});
    setErro("");
    try {
      aoCriar(await api<Membro>("/api/equipe", { metodo: "POST", corpo: { nome, login: login.trim().toLowerCase(), senha } }));
    } catch (e) {
      if (e instanceof ErroApi && Object.keys(e.campos).length) setErros(e.campos);
      else setErro(e instanceof Error ? e.message : "Não foi possível criar.");
    }
  }

  return (
    <Janela titulo="Novo funcionário" aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="space-y-4">
        <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
        <Campo rotulo="Login" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ex.: marta" erro={erros.login} />
        <Campo rotulo="Senha provisória" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" erro={erros.senha} />
        <p className="text-xs text-suave">Passe a senha pessoalmente para o funcionário.</p>
        {erro && <Alerta>{erro}</Alerta>}
        <button type="submit" className={`${botao} w-full`}>Criar acesso</button>
      </form>
    </Janela>
  );
}

function NovaSenha({ membro, aoFechar, aoSalvar }: { membro: Membro; aoFechar: () => void; aoSalvar: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    try {
      await api(`/api/equipe/${membro.id}/senha`, { metodo: "PATCH", corpo: { senha } });
      aoSalvar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }
  return (
    <Janela titulo={`Nova senha para ${membro.nome}`} aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="space-y-4">
        <Campo rotulo="Nova senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        {erro && <Alerta>{erro}</Alerta>}
        <button type="submit" className={`${botao} w-full`}>Salvar senha</button>
      </form>
    </Janela>
  );
}
