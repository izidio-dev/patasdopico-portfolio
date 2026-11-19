import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router";
import App from "./App";
import { Acordando } from "./componentes/Acordando";
import { PREVIA } from "./lib/api";
import { ProvedorSessao } from "./lib/sessao";

// Na prévia, as rotas ficam em memória (a página de prévia não muda de endereço).
const Roteador = PREVIA ? MemoryRouter : BrowserRouter;
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Acordando>
      <ProvedorSessao>
        <Roteador>
          <App />
        </Roteador>
      </ProvedorSessao>
    </Acordando>
  </StrictMode>,
);
