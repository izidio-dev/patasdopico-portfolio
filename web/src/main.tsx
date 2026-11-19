import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { Acordando } from "./componentes/Acordando";
import { ProvedorSessao } from "./lib/sessao";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Acordando>
      <ProvedorSessao>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ProvedorSessao>
    </Acordando>
  </StrictMode>,
);
