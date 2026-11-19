import { Navigate, Route, Routes } from "react-router";
import { Layout } from "./componentes/Layout";
import { useSessao } from "./lib/sessao";
import { Agenda } from "./telas/Agenda";
import { Hoje } from "./telas/Hoje";
import { Login } from "./telas/Login";
import { TutorDetalhe } from "./telas/TutorDetalhe";
import { Tutores } from "./telas/Tutores";

export default function App() {
  const { sessao } = useSessao();
  if (!sessao) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Hoje />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="tutores" element={<Tutores />} />
        <Route path="tutores/:id" element={<TutorDetalhe />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
