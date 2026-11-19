import { Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alerta, botao, botaoSecundario, Campo } from "../../componentes/Campo";
import { Politica } from "../../componentes/Politica";
import { api, baixarJson, ErroApi } from "../../lib/api";
import { useSessao } from "../../lib/sessao";
import type { Tutor } from "../../lib/tipos";

export function ClienteDados() {
  const { sair } = useSessao();
  const [perfil, setPerfil] = useState<Tutor | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [politica, setPolitica] = useState(false);

  useEffect(() => {
    api<Tutor>("/api/cliente/perfil").then((p) => {
      setPerfil(p);
      setNome(p.nome);
      setTelefone(p.telefone);
    });
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErros({});
    try {
      setPerfil(await api<Tutor>("/api/cliente/perfil", { metodo: "PUT", corpo: { nome, telefone } }));
      setAviso("Dados salvos");
      setTimeout(() => setAviso(""), 2500);
    } catch (e) {
      if (e instanceof ErroApi) setErros(e.campos);
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  async function excluir() {
    try {
      await api("/api/cliente/conta", { metodo: "DELETE" });
      sair("Sua conta e seus dados foram excluídos.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  }

  if (!perfil) return <p className="text-suave">Carregando…</p>;
  return (
    <div className="max-w-xl space-y-10">
      <form onSubmit={salvar} noValidate aria-label="Meus dados" className="space-y-4">
        <h1 className="titulo text-3xl">Meus dados</h1>
        <p className="text-sm text-suave">E-mail de acesso: {perfil.email}</p>
        <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
        <Campo rotulo="Telefone (WhatsApp)" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} erro={erros.telefone} />
        <button type="submit" className={botao}>Salvar</button>
        <p role="status" className="text-sm text-folha">{aviso}</p>
      </form>

      <section aria-label="Privacidade" className="rounded-xl border border-linha bg-cartao p-5">
        <h2 className="titulo text-xl">Privacidade (LGPD)</h2>
        <p className="mt-1 text-sm text-suave">
          Veja a{" "}
          <button type="button" onClick={() => setPolitica(true)} className="font-semibold text-folha underline underline-offset-2">Política de Privacidade</button>. Você pode baixar seus dados ou excluir a conta a qualquer momento.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={async () => baixarJson("meus-dados-patas-do-pico.json", await api("/api/cliente/exportacao"))} className={botaoSecundario}>
            <Download className="size-4" aria-hidden /> Baixar meus dados
          </button>
          {!confirmando && (
            <button type="button" onClick={() => setConfirmando(true)} className={`${botaoSecundario} text-coral`}>
              <Trash2 className="size-4" aria-hidden /> Excluir minha conta
            </button>
          )}
        </div>
        {confirmando && (
          <div className="mt-4 rounded-lg border border-coral/40 bg-coral/10 p-4 text-sm">
            <p className="font-bold">Excluir sua conta?</p>
            <p className="mt-1">Seus dados e os dos seus pets são apagados. Os atendimentos já feitos ficam no caixa da loja, sem o seu nome. Não dá para desfazer.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={excluir} className="rounded-lg bg-coral px-4 py-2 font-bold text-white">Sim, excluir minha conta</button>
              <button type="button" onClick={() => setConfirmando(false)} className="px-3 py-2 font-semibold">Cancelar</button>
            </div>
          </div>
        )}
        {erro && <div className="mt-3"><Alerta>{erro}</Alerta></div>}
      </section>
      {politica && <Politica aoFechar={() => setPolitica(false)} />}
    </div>
  );
}
