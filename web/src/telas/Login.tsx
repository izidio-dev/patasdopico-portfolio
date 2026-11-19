import { PawPrint } from "lucide-react";
import { useState } from "react";
import { Alerta, botao, botaoSecundario, Campo } from "../componentes/Campo";
import { Politica } from "../componentes/Politica";
import { ErroApi } from "../lib/api";
import { useSessao } from "../lib/sessao";
import type { Papel } from "../lib/tipos";

type Modo = "equipe" | "cliente" | "cadastro";

export function Login() {
  const { entrar, entrarDemo, cadastrar, aviso } = useSessao();
  const [modo, setModo] = useState<Modo>("equipe");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [politica, setPolitica] = useState(false);
  const [erro, setErro] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  async function executar(acao: () => Promise<void>) {
    setErro("");
    setErros({});
    setEnviando(true);
    try {
      await acao();
    } catch (e) {
      if (e instanceof ErroApi && Object.keys(e.campos).length) setErros(e.campos);
      else setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  const abas: { id: Modo; nome: string }[] = [
    { id: "equipe", nome: "Sou da equipe" },
    { id: "cliente", nome: "Sou cliente" },
  ];
  const demos: { papel: Papel; rotulo: string }[] = [
    { papel: "DONO", rotulo: "Entrar como dono" },
    { papel: "FUNCIONARIO", rotulo: "Entrar como funcionário" },
    { papel: "CLIENTE", rotulo: "Entrar como cliente" },
  ];

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-folha p-10 text-white md:flex">
        <p className="titulo flex items-center gap-2 text-2xl">
          <PawPrint className="size-7" aria-hidden /> Patas do Pico
        </p>
        <div>
          <p className="titulo text-4xl leading-tight">Banho, tosa e cuidado, com agenda online.</p>
          <p className="mt-4 max-w-sm text-white/80">Clientes agendam pelo site. A equipe organiza o dia. O dono acompanha o financeiro.</p>
        </div>
        <p className="text-sm text-white/70">Projeto de demonstração · pet shop fictício</p>
      </section>

      <section className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-sm">
          <p className="titulo flex items-center gap-2 text-2xl text-folha md:hidden">
            <PawPrint className="size-6" aria-hidden /> Patas do Pico
          </p>

          {modo === "cadastro" ? (
            <>
              <h1 className="titulo mt-6 text-3xl md:mt-0">Criar conta</h1>
              <p className="mt-1 text-sm text-suave">Cadastre-se para agendar banho, tosa e consultas.</p>
              <p className="mt-4 rounded-lg bg-sol/25 px-3 py-2 text-xs">Loja de demonstração: use dados de teste. Tudo é apagado automaticamente.</p>
              <form
                className="mt-5 space-y-3"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  executar(() => cadastrar({ nome, email: login, telefone, senha, aceitePrivacidade: aceite }));
                }}
              >
                <Campo rotulo="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" erro={erros.nome} />
                <Campo rotulo="E-mail" type="email" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="email" erro={erros.email} />
                <Campo rotulo="Telefone (WhatsApp)" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 91234-5678" erro={erros.telefone} />
                <Campo rotulo="Crie uma senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" erro={erros.senha} />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 size-4 accent-[#2f7d5b]" />
                  <span>
                    Li e aceito a{" "}
                    <button type="button" onClick={() => setPolitica(true)} className="font-semibold text-folha underline underline-offset-2">
                      Política de Privacidade
                    </button>
                  </span>
                </label>
                {erros.aceitePrivacidade && <p className="text-xs text-coral">{erros.aceitePrivacidade}</p>}
                {erro && <Alerta>{erro}</Alerta>}
                <button type="submit" disabled={enviando} className={`${botao} w-full`}>
                  Criar minha conta
                </button>
              </form>
              <button type="button" onClick={() => setModo("cliente")} className="mt-4 text-sm font-semibold text-folha">
                Já tenho conta
              </button>
            </>
          ) : (
            <>
              <h1 className="titulo mt-6 text-3xl md:mt-0">Entrar</h1>
              <div role="tablist" aria-label="Tipo de acesso" className="mt-5 grid grid-cols-2 rounded-lg bg-fundo p-1">
                {abas.map((a) => (
                  <button key={a.id} type="button" role="tab" aria-selected={modo === a.id} onClick={() => { setModo(a.id); setErro(""); }}
                    className={`rounded-md py-2 text-sm font-semibold ${modo === a.id ? "bg-cartao shadow-sm" : "text-suave"}`}>
                    {a.nome}
                  </button>
                ))}
              </div>
              {aviso && <div className="mt-5"><Alerta>{aviso}</Alerta></div>}
              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  executar(() => entrar(login, senha));
                }}
              >
                <Campo rotulo={modo === "equipe" ? "Usuário" : "E-mail"} id="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required />
                <Campo rotulo="Senha" id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                {erro && <Alerta>{erro}</Alerta>}
                <button type="submit" disabled={enviando} className={`${botao} w-full`}>
                  Entrar
                </button>
              </form>
              {modo === "cliente" && (
                <p className="mt-4 text-center text-sm">
                  Ainda não tem conta?{" "}
                  <button type="button" onClick={() => setModo("cadastro")} className="font-semibold text-folha">
                    Criar conta
                  </button>
                </p>
              )}
            </>
          )}

          <div className="mt-8 border-t border-linha pt-6">
            <p className="text-center text-xs font-semibold text-suave">DEMONSTRAÇÃO · dados fictícios</p>
            <div className="mt-3 grid gap-2">
              {demos.map((d) => (
                <button key={d.papel} type="button" disabled={enviando} onClick={() => executar(() => entrarDemo(d.papel))} className={`${botaoSecundario} w-full`}>
                  {d.rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      {politica && <Politica aoFechar={() => setPolitica(false)} />}
    </main>
  );
}
