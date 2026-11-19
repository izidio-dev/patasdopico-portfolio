import { PawPrint } from "lucide-react";
import { useState } from "react";
import { Alerta, botao, botaoSecundario, Campo } from "../componentes/Campo";
import { useSessao } from "../lib/sessao";

export function Login() {
  const { entrar, entrarDemo, aviso } = useSessao();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function executar(acao: () => Promise<void>) {
    setErro("");
    setEnviando(true);
    try {
      await acao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-folha p-10 text-white md:flex">
        <p className="titulo flex items-center gap-2 text-2xl">
          <PawPrint className="size-7" aria-hidden /> Patas do Pico
        </p>
        <div>
          <p className="titulo text-4xl leading-tight">Agenda, tutores e pets do balcão num só lugar.</p>
          <p className="mt-4 max-w-sm text-white/80">Banho, tosa, vacina e consulta organizados por dia, com o histórico de cada pet.</p>
        </div>
        <p className="text-sm text-white/70">Projeto de demonstração · pet shop fictício</p>
      </section>

      <section className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="titulo flex items-center gap-2 text-2xl text-folha md:hidden">
            <PawPrint className="size-6" aria-hidden /> Patas do Pico
          </p>
          <h1 className="titulo mt-6 text-3xl md:mt-0">Entrar no sistema</h1>
          <p className="mt-1 text-sm text-suave">Acesso da equipe do pet shop.</p>

          {aviso && <div className="mt-5"><Alerta>{aviso}</Alerta></div>}

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              executar(() => entrar(login, senha));
            }}
          >
            <Campo rotulo="Usuário" id="login" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required />
            <Campo rotulo="Senha" id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            {erro && <Alerta>{erro}</Alerta>}
            <button type="submit" disabled={enviando} className={`${botao} w-full`}>
              Entrar
            </button>
          </form>

          <div className="mt-8 border-t border-linha pt-6">
            <button type="button" disabled={enviando} onClick={() => executar(entrarDemo)} className={`${botaoSecundario} w-full`}>
              Entrar como demonstração
            </button>
            <p className="mt-2 text-center text-xs text-suave">Dados fictícios. Não cadastre informações reais.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
