export type Especie = "CAO" | "GATO" | "OUTRO";
export type Porte = "PEQUENO" | "MEDIO" | "GRANDE";
export type Servico = "BANHO" | "TOSA" | "BANHO_E_TOSA" | "VACINA" | "CONSULTA";
export type StatusAtendimento = "AGENDADO" | "CONCLUIDO" | "CANCELADO";

export type Pet = { id: number; tutorId: number; nome: string; especie: Especie; raca: string | null; porte: Porte; nascimento: string | null; observacoes: string | null };
export type TutorResumo = { id: number; nome: string; telefone: string; email: string | null; quantidadePets: number };
export type Tutor = { id: number; nome: string; telefone: string; email: string | null; observacoes: string | null; criadoEm: string; pets: Pet[] };
export type Pagina<T> = { itens: T[]; total: number; pagina: number; totalPaginas: number };
export type Atendimento = {
  id: number; petId: number | null; petNome: string | null; tutorId: number | null; tutorNome: string | null; tutorTelefone: string | null;
  servico: Servico; dataHora: string; valorCentavos: number; status: StatusAtendimento; observacoes: string | null;
};
export type Resumo = { hoje: { agendados: number; concluidos: number; cancelados: number }; faturamentoMesCentavos: number; proximos: Atendimento[] };
