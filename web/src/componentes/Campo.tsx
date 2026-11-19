import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const estilo = "mt-1 w-full rounded-lg border bg-cartao px-3 py-2 outline-none focus:border-folha";

/** Campo com rótulo e mensagem de erro logo abaixo (erro vem da validação da API). */
export function Campo({ rotulo, erro, ...props }: { rotulo: string; erro?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">
      {rotulo}
      <input {...props} aria-invalid={!!erro} className={`${estilo} ${erro ? "border-coral" : "border-linha"}`} />
      {erro && <span className="mt-1 block text-xs font-normal text-coral">{erro}</span>}
    </label>
  );
}

export function Selecao({ rotulo, erro, children, ...props }: { rotulo: string; erro?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block text-sm font-semibold">
      {rotulo}
      <select {...props} aria-invalid={!!erro} className={`${estilo} ${erro ? "border-coral" : "border-linha"}`}>
        {children}
      </select>
      {erro && <span className="mt-1 block text-xs font-normal text-coral">{erro}</span>}
    </label>
  );
}

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm">
      {children}
    </p>
  );
}

export const botao = "inline-flex items-center justify-center gap-2 rounded-lg bg-folha px-4 py-2.5 text-sm font-bold text-white hover:bg-folha-escura disabled:opacity-60";
export const botaoSecundario = "inline-flex items-center justify-center gap-2 rounded-lg border border-linha bg-cartao px-4 py-2.5 text-sm font-semibold hover:border-folha";
