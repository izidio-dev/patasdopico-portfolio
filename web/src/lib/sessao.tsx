import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, gravarSessao, lerSessao, quandoExpirar, type Sessao } from "./api";
import type { Papel } from "./tipos";

export type DadosCadastro = { nome: string; email: string; telefone: string; senha: string; aceitePrivacidade: boolean };

type ContextoSessao = {
  sessao: Sessao | null;
  aviso: string;
  entrar: (login: string, senha: string) => Promise<void>;
  entrarDemo: (papel: Papel) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: (aviso?: string) => void;
};

const Contexto = createContext<ContextoSessao | null>(null);

type RespostaLogin = { token: string; nome: string; papel: Papel };

export function ProvedorSessao({ children }: { children: ReactNode }) {
  // Sessão antiga (sem papel) é descartada para não abrir a tela errada.
  const [sessao, setSessao] = useState<Sessao | null>(() => {
    const s = lerSessao();
    return s?.papel ? s : null;
  });
  const [aviso, setAviso] = useState("");

  function sair(texto = "") {
    gravarSessao(null);
    setSessao(null);
    setAviso(texto);
  }

  useEffect(() => {
    quandoExpirar(() => sair("Sua sessão expirou. Entre de novo para continuar."));
  }, []);

  async function iniciar(caminho: string, corpo?: unknown, demo = false) {
    const r = await api<RespostaLogin>(caminho, { metodo: "POST", corpo });
    const nova = { token: r.token, nome: r.nome, demo, papel: r.papel };
    gravarSessao(nova);
    setAviso("");
    setSessao(nova);
  }

  return (
    <Contexto.Provider
      value={{
        sessao,
        aviso,
        entrar: (login, senha) => iniciar("/api/auth/login", { login, senha }),
        entrarDemo: (papel) => iniciar(`/api/auth/demo?papel=${papel}`, undefined, true),
        cadastrar: (dados) => iniciar("/api/auth/cadastro", dados),
        sair,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useSessao() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useSessao fora do ProvedorSessao");
  return c;
}
