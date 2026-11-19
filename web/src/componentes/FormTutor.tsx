import { useState } from "react";
import { Alerta, botao, Campo } from "./Campo";
import { Janela } from "./Janela";
import { api, ErroApi } from "../lib/api";
import type { Tutor } from "../lib/tipos";

/** Cadastro e edição de tutor. Os erros por campo vêm da validação da API Java. */
export function FormTutor({ tutor, aoFechar, aoSalvar }: { tutor?: Tutor; aoFechar: () => void; aoSalvar: (t: Tutor) => void }) {
  const [nome, setNome] = useState(tutor?.nome ?? "");
  const [telefone, setTelefone] = useState(tutor?.telefone ?? "");
  const [email, setEmail] = useState(tutor?.email ?? "");
  const [observacoes, setObservacoes] = useState(tutor?.observacoes ?? "");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErros({});
    setErro("");
    try {
      const corpo = { nome, telefone, email, observacoes };
      aoSalvar(tutor ? await api<Tutor>(`/api/tutores/${tutor.id}`, { metodo: "PUT", corpo }) : await api<Tutor>("/api/tutores", { metodo: "POST", corpo }));
    } catch (e) {
      if (e instanceof ErroApi && Object.keys(e.campos).length) setErros(e.campos);
      else setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <Janela titulo={tutor ? "Editar tutor" : "Novo tutor"} aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="space-y-4">
        <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} erro={erros.nome} />
        <Campo rotulo="Telefone" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 91234-5678" erro={erros.telefone} />
        <Campo rotulo="E-mail (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} erro={erros.email} />
        <Campo rotulo="Observações (opcional)" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={500} erro={erros.observacoes} />
        {erro && <Alerta>{erro}</Alerta>}
        <button type="submit" className={`${botao} w-full`}>
          Salvar
        </button>
      </form>
    </Janela>
  );
}
