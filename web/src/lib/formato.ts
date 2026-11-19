import type { Especie, Porte, Servico, StatusAtendimento } from "./tipos";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = (centavos: number) => moeda.format(centavos / 100).replace(/ /g, " ");

/** "11987654321" → "(11) 98765-4321". */
export function telefone(t: string) {
  const d = t.replace(/\D/g, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : t;
}

export const hora = (iso: string) => iso.slice(11, 16);
export const dataCurta = (iso: string) => new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
/** Data de hoje no fuso da loja, no formato AAAA-MM-DD. */
export const hojeISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

export const nomeServico: Record<Servico, string> = { BANHO: "Banho", TOSA: "Tosa", BANHO_E_TOSA: "Banho e tosa", VACINA: "Vacina", CONSULTA: "Consulta" };
export const nomeStatus: Record<StatusAtendimento, string> = { AGENDADO: "Agendado", CONCLUIDO: "Concluído", CANCELADO: "Cancelado" };
export const nomeEspecie: Record<Especie, string> = { CAO: "Cão", GATO: "Gato", OUTRO: "Outro" };
export const nomePorte: Record<Porte, string> = { PEQUENO: "Pequeno", MEDIO: "Médio", GRANDE: "Grande" };
export const precoSugerido: Record<Servico, number> = { BANHO: 6000, TOSA: 7000, BANHO_E_TOSA: 11000, VACINA: 9000, CONSULTA: 15000 };

/** "70,00" / "70" / "R$ 1.234,50" → centavos; inválido → null. */
export function paraCentavos(texto: string): number | null {
  const limpo = texto.replace(/R\$|\s|\./g, "");
  if (!/^\d+(,\d{1,2})?$/.test(limpo)) return null;
  const [r, c = "0"] = limpo.split(",");
  return Number(r) * 100 + Number(c.padEnd(2, "0"));
}

/** Idade aproximada a partir do nascimento. */
export function idade(nascimento: string | null) {
  if (!nascimento) return null;
  const meses = Math.floor((Date.now() - new Date(nascimento).getTime()) / (30.44 * 86_400_000));
  return meses < 12 ? `${meses} ${meses === 1 ? "mês" : "meses"}` : `${Math.floor(meses / 12)} ${Math.floor(meses / 12) === 1 ? "ano" : "anos"}`;
}

/** "quinta-feira, 19 de novembro" → "Quinta-feira, 19 de novembro". */
export const maiusculaInicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
