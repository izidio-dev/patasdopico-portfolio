import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Janela modal (<dialog> nativo: foco, Esc e acessibilidade prontos). */
export function Janela({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl bg-cartao p-0 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-linha px-5 py-4">
        <h2 className="titulo text-xl">{titulo}</h2>
        <button type="button" onClick={aoFechar} aria-label="Fechar" className="grid size-9 place-items-center rounded-full hover:bg-fundo">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
