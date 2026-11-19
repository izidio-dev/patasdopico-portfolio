/**
 * Cliente da API Java. Guarda o token do login e transforma respostas de erro
 * (ProblemDetail) em ErroApi com a mensagem e os erros por campo.
 */
export const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const CHAVE = "patas-sessao";

export type Sessao = { token: string; nome: string; demo: boolean };

export class ErroApi extends Error {
  status: number;
  campos: Record<string, string>;
  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

export function lerSessao(): Sessao | null {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "null");
  } catch {
    return null;
  }
}

export function gravarSessao(s: Sessao | null) {
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* navegador sem armazenamento: a sessão vale só nesta aba */
  }
}

/** Avisado quando a API responde 401 (token vencido): a tela volta para o login. */
let aoExpirar: () => void = () => {};
export const quandoExpirar = (f: () => void) => (aoExpirar = f);

export async function api<T>(caminho: string, opcoes: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const sessao = lerSessao();
  let resposta: Response;
  try {
    resposta = await fetch(API + caminho, {
      method: opcoes.metodo ?? "GET",
      headers: { ...(opcoes.corpo !== undefined ? { "Content-Type": "application/json" } : {}), ...(sessao ? { Authorization: `Bearer ${sessao.token}` } : {}) },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, "Sem conexão com o servidor. Verifique a internet e tente de novo.");
  }
  if (resposta.status === 204) return undefined as T;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (resposta.status === 401 && sessao && !caminho.startsWith("/api/auth/")) aoExpirar();
    throw new ErroApi(resposta.status, dados.detail ?? "Algo deu errado. Tente de novo.", dados.campos ?? {});
  }
  return dados as T;
}

/** Baixa um JSON como arquivo (exportação LGPD). */
export function baixarJson(nomeArquivo: string, dados: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
