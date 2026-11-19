import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, gravarSessao, lerSessao, quandoExpirar, type Sessao } from "./api";

type ContextoSessao = {
  sessao: Sessao | null;
  aviso: string;
  entrar: (login: string, senha: string) => Promise<void>;
  entrarDemo: () => Promise<void>;
  sair: (aviso?: string) => void;
};

const Contexto = createContext<ContextoSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao);
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
    const r = await api<{ token: string; nome: string }>(caminho, { metodo: "POST", corpo });
    const nova = { token: r.token, nome: r.nome, demo };
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
        entrarDemo: () => iniciar("/api/auth/demo", undefined, true),
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
