import { useState } from "react";
import { Alerta, botao, Campo, Selecao } from "./Campo";
import { Janela } from "./Janela";
import { api, ErroApi } from "../lib/api";
import { nomeEspecie, nomePorte } from "../lib/formato";
import type { Especie, Pet, Porte } from "../lib/tipos";

/** "cliente" = o próprio cliente cadastrando (rotas /api/cliente/pets). */
export function FormPet({ tutorId, pet, aoFechar, aoSalvar, cliente = false }: { tutorId: number; pet?: Pet; aoFechar: () => void; aoSalvar: (p: Pet) => void; cliente?: boolean }) {
  const [nome, setNome] = useState(pet?.nome ?? "");
  const [especie, setEspecie] = useState<Especie | "">(pet?.especie ?? "");
  const [raca, setRaca] = useState(pet?.raca ?? "");
  const [porte, setPorte] = useState<Porte | "">(pet?.porte ?? "");
  const [nascimento, setNascimento] = useState(pet?.nascimento ?? "");
  const [observacoes, setObservacoes] = useState(pet?.observacoes ?? "");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErros({});
    setErro("");
    const corpo = { nome, especie: especie || null, raca, porte: porte || null, nascimento: nascimento || null, observacoes };
    try {
      const url = cliente ? (pet ? `/api/cliente/pets/${pet.id}` : "/api/cliente/pets") : pet ? `/api/pets/${pet.id}` : `/api/tutores/${tutorId}/pets`;
      aoSalvar(await api<Pet>(url, { metodo: pet ? "PUT" : "POST", corpo }));
    } catch (e) {
      if (e instanceof ErroApi && Object.keys(e.campos).length) setErros(e.campos);
      else setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  return (
    <Janela titulo={pet ? "Editar pet" : "Novo pet"} aoFechar={aoFechar}>
      <form onSubmit={salvar} noValidate className="space-y-4">
        <Campo rotulo="Nome do pet" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} erro={erros.nome} />
        <div className="grid grid-cols-2 gap-3">
          <Selecao rotulo="Espécie" value={especie} onChange={(e) => setEspecie(e.target.value as Especie)} erro={erros.especie}>
            <option value="">Escolha…</option>
            {(Object.keys(nomeEspecie) as Especie[]).map((x) => (
              <option key={x} value={x}>
                {nomeEspecie[x]}
              </option>
            ))}
          </Selecao>
          <Selecao rotulo="Porte" value={porte} onChange={(e) => setPorte(e.target.value as Porte)} erro={erros.porte}>
            <option value="">Escolha…</option>
            {(Object.keys(nomePorte) as Porte[]).map((x) => (
              <option key={x} value={x}>
                {nomePorte[x]}
              </option>
            ))}
          </Selecao>
        </div>
        <Campo rotulo="Raça (opcional)" value={raca} onChange={(e) => setRaca(e.target.value)} maxLength={60} />
        <Campo rotulo="Nascimento aproximado (opcional)" type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} erro={erros.nascimento} />
        <Campo rotulo="Observações (alergias, cuidados)" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={500} />
        {erro && <Alerta>{erro}</Alerta>}
        <button type="submit" className={`${botao} w-full`}>
          Salvar
        </button>
      </form>
    </Janela>
  );
}
