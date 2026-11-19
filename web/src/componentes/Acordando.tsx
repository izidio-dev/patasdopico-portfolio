import { PawPrint } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { API, PREVIA } from "../lib/api";

/**
 * O servidor gratuito (Render) "dorme" depois de 15 min sem uso e leva até ~1 min
 * para voltar. Esta tela chama /api/saude até ele responder, sem parecer quebrado.
 */
export function Acordando({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(PREVIA);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (PREVIA) return;
    let ativo = true;
    const inicio = Date.now();
    const relogio = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);
    async function tentar() {
      while (ativo) {
        try {
          const r = await fetch(API + "/api/saude", { signal: AbortSignal.timeout(20000) });
          if (r.ok) {
            if (ativo) setPronto(true);
            return;
          }
        } catch {
          /* ainda acordando */
        }
        await new Promise((ok) => setTimeout(ok, 2500));
      }
    }
    tentar();
    return () => {
      ativo = false;
      clearInterval(relogio);
    };
  }, []);

  if (pronto) return <>{children}</>;
  return (
    <main className="grid min-h-dvh place-items-center bg-folha px-6 text-white">
      <div className="max-w-sm text-center" role="status" aria-live="polite">
        <PawPrint className="mx-auto size-12 animate-bounce motion-reduce:animate-none" aria-hidden />
        <p className="titulo mt-5 text-2xl">Acordando o servidor…</p>
        <p className="mt-2 text-white/80">
          Este sistema roda num servidor gratuito que descansa quando ninguém está usando. Leva até 1 minuto para voltar.
        </p>
        <p className="mt-4 text-sm text-white/70 tabular-nums">{segundos}s</p>
      </div>
    </main>
  );
}
