import { Cat, Dog, PawPrint, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { botao } from "../../componentes/Campo";
import { FormPet } from "../../componentes/FormPet";
import { api } from "../../lib/api";
import { idade, nomeEspecie, nomePorte } from "../../lib/formato";
import type { Pet, Tutor } from "../../lib/tipos";

const icone = { CAO: Dog, GATO: Cat, OUTRO: PawPrint };

export function ClientePets() {
  const [perfil, setPerfil] = useState<Tutor | null>(null);
  const [form, setForm] = useState<Pet | "novo" | null>(null);

  useEffect(() => {
    api<Tutor>("/api/cliente/perfil").then(setPerfil).catch(() => {});
  }, []);

  if (!perfil) return <p className="text-suave">Carregando…</p>;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo text-3xl">Meus pets</h1>
        <button type="button" onClick={() => setForm("novo")} className={botao}>
          <Plus className="size-4" aria-hidden /> Adicionar pet
        </button>
      </div>
      <section aria-label="Pets" className="mt-6 grid gap-3 sm:grid-cols-2">
        {perfil.pets.map((p) => {
          const I = icone[p.especie];
          return (
            <article key={p.id} className="flex items-start gap-3 rounded-xl border border-linha bg-cartao p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-folha-clara text-folha-escura">
                <I className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="titulo text-lg">{p.nome}</h2>
                <p className="text-sm text-suave">
                  {nomeEspecie[p.especie]} · {nomePorte[p.porte]}
                  {p.raca && ` · ${p.raca}`}
                  {idade(p.nascimento) && ` · ${idade(p.nascimento)}`}
                </p>
                {p.observacoes && <p className="mt-1 text-sm text-coral">⚠ {p.observacoes}</p>}
              </div>
              <button type="button" onClick={() => setForm(p)} aria-label={`Editar ${p.nome}`} className="grid size-8 place-items-center rounded-full hover:bg-fundo">
                <Pencil className="size-4" aria-hidden />
              </button>
            </article>
          );
        })}
        {perfil.pets.length === 0 && <p className="rounded-xl border border-dashed border-linha p-6 text-center text-suave sm:col-span-2">Você ainda não cadastrou nenhum pet.</p>}
      </section>
      {form && (
        <FormPet
          cliente
          tutorId={perfil.id}
          pet={form === "novo" ? undefined : form}
          aoFechar={() => setForm(null)}
          aoSalvar={(p) => {
            setPerfil({ ...perfil, pets: form === "novo" ? [...perfil.pets, p] : perfil.pets.map((x) => (x.id === p.id ? p : x)) });
            setForm(null);
          }}
        />
      )}
    </>
  );
}
