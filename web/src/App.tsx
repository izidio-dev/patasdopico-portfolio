import { Navigate, Route, Routes } from "react-router";
import { Layout } from "./componentes/Layout";
import { LayoutCliente } from "./componentes/LayoutCliente";
import { useSessao } from "./lib/sessao";
import { Agenda } from "./telas/Agenda";
import { ClienteAgendar } from "./telas/cliente/Agendar";
import { ClienteDados } from "./telas/cliente/Dados";
import { ClienteInicio } from "./telas/cliente/Inicio";
import { ClientePets } from "./telas/cliente/Pets";
import { Equipe } from "./telas/Equipe";
import { Financeiro } from "./telas/Financeiro";
import { Hoje } from "./telas/Hoje";
import { Login } from "./telas/Login";
import { Servicos } from "./telas/Servicos";
import { TutorDetalhe } from "./telas/TutorDetalhe";
import { Tutores } from "./telas/Tutores";

/** Cada papel tem suas telas. As rotas só escondem; quem bloqueia de verdade é a API (403). */
export default function App() {
  const { sessao } = useSessao();
  if (!sessao) return <Login />;

  if (sessao.papel === "CLIENTE")
    return (
      <Routes>
        <Route element={<LayoutCliente />}>
          <Route index element={<ClienteInicio />} />
          <Route path="agendar" element={<ClienteAgendar />} />
          <Route path="pets" element={<ClientePets />} />
          <Route path="dados" element={<ClienteDados />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );

  const dono = sessao.papel === "DONO";
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Hoje />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="tutores" element={<Tutores />} />
        <Route path="tutores/:id" element={<TutorDetalhe />} />
        <Route path="servicos" element={<Servicos />} />
        {dono && <Route path="financeiro" element={<Financeiro />} />}
        {dono && <Route path="equipe" element={<Equipe />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
