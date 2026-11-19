export type Especie = "CAO" | "GATO" | "OUTRO";
export type Porte = "PEQUENO" | "MEDIO" | "GRANDE";
export type Servico = "BANHO" | "TOSA" | "BANHO_E_TOSA" | "VACINA" | "CONSULTA";
export type StatusAtendimento = "SOLICITADO" | "AGENDADO" | "CONCLUIDO" | "CANCELADO";
export type Papel = "DONO" | "FUNCIONARIO" | "CLIENTE";

export type Pet = { id: number; tutorId: number; nome: string; especie: Especie; raca: string | null; porte: Porte; nascimento: string | null; observacoes: string | null };
export type TutorResumo = { id: number; nome: string; telefone: string; email: string | null; quantidadePets: number };
export type Tutor = { id: number; nome: string; telefone: string; email: string | null; observacoes: string | null; criadoEm: string; pets: Pet[] };
export type Pagina<T> = { itens: T[]; total: number; pagina: number; totalPaginas: number };
export type Atendimento = {
  id: number; petId: number | null; petNome: string | null; tutorId: number | null; tutorNome: string | null; tutorTelefone: string | null;
  servico: Servico; dataHora: string; valorCentavos: number; status: StatusAtendimento; observacoes: string | null;
};
/** faturamentoMesCentavos vem null para funcionário. */
export type Resumo = { hoje: { agendados: number; concluidos: number; cancelados: number }; faturamentoMesCentavos: number | null; proximos: Atendimento[] };
export type ServicoPreco = { servico: Servico; precoCentavos: number; duracaoMin: number };
export type TipoLancamento = "ENTRADA" | "SAIDA";
export type Lancamento = { id: number; tipo: TipoLancamento; categoria: string; descricao: string | null; valorCentavos: number; data: string; atendimentoId: number | null; automatico: boolean };
export type ResumoFinanceiro = {
  mes: string; entradasCentavos: number; saidasCentavos: number; saldoCentavos: number;
  porCategoria: { tipo: TipoLancamento; categoria: string; totalCentavos: number }[];
  ultimosMeses: { mes: string; entradasCentavos: number; saidasCentavos: number }[];
};
export type Membro = { id: number; nome: string; login: string; papel: Papel; ativo: boolean };
