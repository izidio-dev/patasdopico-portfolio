/**
 * API simulada no navegador, usada SÓ na versão de prévia (modo "previa") e nos testes de fluxo.
 * Imita a API Java: mesmos caminhos, mesmas respostas e as mesmas regras de permissão por papel.
 */
import type { Atendimento, Lancamento, Membro, Papel, Pet, Servico, ServicoPreco, StatusAtendimento, Tutor } from "./tipos";

type Resposta = { status: number; dados: unknown };

const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
const mesHoje = hoje.slice(0, 7);
const dia = (n: number) => {
  const d = new Date(hoje + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const somarMes = (mes: string, n: number) => {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

let id = 1000;
const servicos: ServicoPreco[] = [
  { servico: "BANHO", precoCentavos: 6000, duracaoMin: 60 },
  { servico: "TOSA", precoCentavos: 7000, duracaoMin: 60 },
  { servico: "BANHO_E_TOSA", precoCentavos: 11000, duracaoMin: 90 },
  { servico: "VACINA", precoCentavos: 9000, duracaoMin: 30 },
  { servico: "CONSULTA", precoCentavos: 15000, duracaoMin: 30 },
];
const preco = (s: Servico) => servicos.find((x) => x.servico === s)!.precoCentavos;

const tutores: Tutor[] = [
  ["Ana Beatriz Carvalho", "11900000001", "cliente-demo@patasdopico.demo", [["Paçoca", "CAO", "Vira-lata caramelo", "MEDIO", "Tem medo de secador."]]],
  ["Bruno Henrique Lopes", "11900000002", null, [["Mel", "CAO", "Shih-tzu", "PEQUENO", null], ["Fubá", "CAO", "Shih-tzu", "PEQUENO", null]]],
  ["Camila Nogueira", "11900000003", null, [["Luna", "GATO", "Siamês", "PEQUENO", "Alérgica a shampoo com perfume."]]],
  ["Diego Martins", "11900000004", null, [["Thor", "CAO", "Golden Retriever", "GRANDE", null]]],
  ["Eduarda Siqueira", "11900000005", null, [["Pipoca", "CAO", "Poodle", "PEQUENO", "Idoso: banho mais curto."], ["Nina", "GATO", "SRD", "PEQUENO", null]]],
  ["Felipe Andrade", "11900000006", null, [["Bob", "CAO", "Bulldog francês", "MEDIO", "Respiração curta: evitar calor."]]],
  ["Gabriela Rocha", "11900000007", null, [["Amora", "CAO", "Spitz alemão", "PEQUENO", null]]],
  ["João Pedro Almeida", "11900000010", null, [["Rex", "CAO", "Pastor alemão", "GRANDE", null], ["Café", "CAO", "Dachshund", "PEQUENO", null]]],
].map(([nome, telefone, email, pets], i) => {
  const tutorId = i + 1;
  return {
    id: tutorId, nome: nome as string, telefone: telefone as string, email: email as string | null, observacoes: null, criadoEm: dia(-60) + "T10:00:00",
    pets: (pets as [string, Pet["especie"], string, Pet["porte"], string | null][]).map(([n, e, r, p, o]) => ({ id: id++, tutorId, nome: n, especie: e, raca: r, porte: p, nascimento: dia(-900), observacoes: o })),
  };
});
const todosPets = () => tutores.flatMap((t) => t.pets);
const nomesServicos = servicos.map((s) => s.servico);

/** Conta do cliente demo e contas criadas pelo cadastro: e-mail → tutorId. */
const contasCliente = new Map<string, number>([["cliente-demo@patasdopico.demo", 1]]);
let clienteLogado = 1;

const equipe: Membro[] = [
  { id: 1, nome: "Dono (demonstração)", login: "dono-demo", papel: "DONO", ativo: true },
  { id: 2, nome: "Funcionário (demonstração)", login: "demo", papel: "FUNCIONARIO", ativo: true },
  { id: 3, nome: "Marta Souza", login: "marta", papel: "FUNCIONARIO", ativo: true },
];

const lancamentos: Lancamento[] = [];
function lancar(tipo: Lancamento["tipo"], categoria: string, descricao: string | null, valor: number, data: string, atendimentoId: number | null = null) {
  lancamentos.push({ id: id++, tipo, categoria, descricao, valorCentavos: valor, data, atendimentoId, automatico: atendimentoId !== null });
}

function novoAtendimento(pet: Pet, servico: Servico, data: string, horaMin: string, status: StatusAtendimento, observacoes: string | null = null): Atendimento {
  const t = tutores.find((x) => x.id === pet.tutorId)!;
  return { id: id++, petId: pet.id, petNome: pet.nome, tutorId: t.id, tutorNome: t.nome, tutorTelefone: t.telefone, servico, dataHora: `${data}T${horaMin}:00`, valorCentavos: preco(servico), status, observacoes };
}
function concluir(a: Atendimento) {
  a.status = "CONCLUIDO";
  if (a.valorCentavos > 0 && !lancamentos.some((l) => l.atendimentoId === a.id)) lancar("ENTRADA", "Serviços", a.servico, a.valorCentavos, a.dataHora.slice(0, 10), a.id);
}

const atendimentos: Atendimento[] = [];
todosPets().forEach((p, i) => {
  for (let d = 1; d <= 19; d += 2) {
    const a = novoAtendimento(p, nomesServicos[(i + d) % 5], dia(-d - (i % 3)), "10:00", "AGENDADO");
    atendimentos.push(a);
    concluir(a);
  }
});
[["09:00", "CONCLUIDO"], ["10:30", "CONCLUIDO"], ["13:00", "AGENDADO"], ["14:30", "AGENDADO"], ["16:00", "AGENDADO"]].forEach(([h, s], i) => {
  const a = novoAtendimento(todosPets()[i * 2], nomesServicos[i], hoje, h, "AGENDADO", i === 2 ? "Cliente pediu laço rosa." : null);
  atendimentos.push(a);
  if (s === "CONCLUIDO") concluir(a);
});
for (let d = 1; d <= 4; d++) atendimentos.push(novoAtendimento(todosPets()[d + 3], nomesServicos[d], dia(d), "11:00", "AGENDADO"));
atendimentos.push(novoAtendimento(tutores[0].pets[0], "BANHO_E_TOSA", dia(3), "15:30", "SOLICITADO", "Pode usar o shampoo neutro?"));
for (let i = 0; i < 6; i++) {
  const m = somarMes(mesHoje, -i);
  const d5 = i === 0 && hoje < `${m}-05` ? hoje : `${m}-05`;
  lancar("SAIDA", "Aluguel", "Aluguel da loja", 250000, d5);
  lancar("SAIDA", "Salários", "Folha da equipe", 420000, d5);
  lancar("SAIDA", "Produtos", "Shampoos, toalhas e perfumes", 70000 + i * 4000, d5);
  lancar("SAIDA", "Contas", "Água, luz e internet", 52000 - i * 1500, d5);
  lancar("ENTRADA", "Vendas", "Ração e acessórios", 210000 + i * 9000, d5);
  if (i > 0) lancar("ENTRADA", "Serviços", "Atendimentos do mês", 900000 + ((i * 73000) % 250000), `${m}-20`);
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const erro = (status: number, detail: string, campos?: Record<string, string>): Resposta => ({ status, dados: { detail, campos } });
const ok = (dados: unknown, status = 200): Resposta => ({ status, dados });
const proibido = () => erro(403, "Você não tem permissão para acessar esta área.");
const telefoneValido = (t: unknown) => {
  const d = String(t ?? "").replace(/\D/g, "");
  return d.length === 10 || d.length === 11 ? d : null;
};
const doMes = (mes: string) => lancamentos.filter((l) => l.data.startsWith(mes));
const soma = (l: Lancamento[], tipo: Lancamento["tipo"]) => l.filter((x) => x.tipo === tipo).reduce((s, x) => s + x.valorCentavos, 0);

function horariosLivres(data: string) {
  const ocupados = new Set(atendimentos.filter((a) => a.dataHora.startsWith(data) && a.status !== "CANCELADO").map((a) => a.dataHora.slice(11, 16)));
  const agora = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T").slice(0, 16);
  const livres: string[] = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) {
    const h = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    if (!ocupados.has(h) && `${data}T${h}` > agora) livres.push(h);
  }
  return livres;
}

export function tratarPrevia(caminho: string, metodo: string, corpo: any, papel?: Papel): Resposta {
  const url = new URL(caminho, "http://previa");
  const p = url.pathname;

  // ---------- Login e cadastro ----------
  if (p === "/api/auth/demo") {
    const pp = (url.searchParams.get("papel") ?? "FUNCIONARIO") as Papel;
    if (pp === "CLIENTE") clienteLogado = 1;
    const nome = pp === "DONO" ? "Dono (demonstração)" : pp === "FUNCIONARIO" ? "Funcionário (demonstração)" : "Ana Beatriz Carvalho";
    return ok({ token: "previa", nome, papel: pp });
  }
  if (p === "/api/auth/login") return erro(401, "Usuário ou senha incorretos.");
  if (p === "/api/auth/cadastro") {
    const campos: Record<string, string> = {};
    if (!String(corpo.nome ?? "").trim()) campos.nome = "Informe seu nome.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(corpo.email ?? ""))) campos.email = "E-mail inválido.";
    if (!telefoneValido(corpo.telefone)) campos.telefone = "Telefone precisa ter DDD + número (10 ou 11 dígitos).";
    if (String(corpo.senha ?? "").length < 8) campos.senha = "A senha precisa ter pelo menos 8 caracteres.";
    if (!corpo.aceitePrivacidade) campos.aceitePrivacidade = "Para criar a conta, aceite a Política de Privacidade.";
    if (Object.keys(campos).length) return erro(400, "Confira os campos destacados.", campos);
    const email = corpo.email.trim().toLowerCase();
    if (contasCliente.has(email)) return erro(409, "Já existe uma conta com este e-mail.");
    const t: Tutor = { id: id++, nome: corpo.nome.trim(), telefone: telefoneValido(corpo.telefone)!, email, observacoes: null, criadoEm: new Date().toISOString(), pets: [] };
    tutores.push(t);
    contasCliente.set(email, t.id);
    clienteLogado = t.id;
    return ok({ token: "previa", nome: t.nome, papel: "CLIENTE" }, 201);
  }
  if (!papel) return erro(401, "Faça login para continuar.");

  // ---------- Área do cliente ----------
  if (p.startsWith("/api/cliente/")) {
    if (papel !== "CLIENTE") return proibido();
    const eu = tutores.find((t) => t.id === clienteLogado);
    if (!eu) return erro(401, "Conta não encontrada. Entre de novo.");
    if (p === "/api/cliente/perfil" && metodo === "GET") return ok(eu);
    if (p === "/api/cliente/perfil" && metodo === "PUT") {
      const tel = telefoneValido(corpo.telefone);
      if (!tel) return erro(400, "Confira os campos destacados.", { telefone: "Telefone precisa ter DDD + número (10 ou 11 dígitos)." });
      Object.assign(eu, { nome: corpo.nome.trim(), telefone: tel });
      return ok(eu);
    }
    if (p === "/api/cliente/pets" && metodo === "POST") {
      if (!corpo.nome?.trim() || !corpo.especie || !corpo.porte) return erro(400, "Confira os campos destacados.", { ...(!corpo.nome?.trim() && { nome: "Informe o nome do pet." }), ...(!corpo.especie && { especie: "Escolha a espécie." }), ...(!corpo.porte && { porte: "Escolha o porte." }) });
      const pet: Pet = { id: id++, tutorId: eu.id, nome: corpo.nome.trim(), especie: corpo.especie, raca: corpo.raca || null, porte: corpo.porte, nascimento: corpo.nascimento || null, observacoes: corpo.observacoes || null };
      eu.pets.push(pet);
      return ok(pet, 201);
    }
    const meuPet = p.match(/^\/api\/cliente\/pets\/(\d+)$/);
    if (meuPet) {
      const pet = eu.pets.find((x) => x.id === Number(meuPet[1]));
      if (!pet) return erro(404, "Pet não encontrado.");
      Object.assign(pet, { nome: corpo.nome, especie: corpo.especie, raca: corpo.raca || null, porte: corpo.porte, nascimento: corpo.nascimento || null, observacoes: corpo.observacoes || null });
      return ok(pet);
    }
    if (p === "/api/cliente/horarios") return ok(horariosLivres(url.searchParams.get("data") ?? hoje));
    if (p === "/api/cliente/agendamentos" && metodo === "GET")
      return ok(atendimentos.filter((a) => a.tutorId === eu.id).sort((a, b) => b.dataHora.localeCompare(a.dataHora)));
    if (p === "/api/cliente/agendamentos" && metodo === "POST") {
      const pet = eu.pets.find((x) => x.id === corpo.petId);
      if (!pet) return erro(404, "Pet não encontrado.");
      const data = corpo.dataHora.slice(0, 10);
      const hora = corpo.dataHora.slice(11, 16);
      if (!horariosLivres(data).includes(hora)) return erro(409, "Esse horário não está mais disponível. Escolha outro.");
      const a = novoAtendimento(pet, corpo.servico, data, hora, "SOLICITADO", corpo.observacoes || null);
      atendimentos.push(a);
      return ok(a, 201);
    }
    const cancelar = p.match(/^\/api\/cliente\/agendamentos\/(\d+)\/cancelar$/);
    if (cancelar) {
      const a = atendimentos.find((x) => x.id === Number(cancelar[1]) && x.tutorId === eu.id);
      if (!a) return erro(404, "Agendamento não encontrado.");
      if (a.status === "CONCLUIDO" || a.status === "CANCELADO") return erro(409, "Este agendamento não pode mais ser cancelado.");
      a.status = "CANCELADO";
      return ok(a);
    }
    if (p === "/api/cliente/exportacao") return ok({ geradoEm: new Date().toISOString(), tutor: eu, atendimentos: atendimentos.filter((a) => a.tutorId === eu.id) });
    if (p === "/api/cliente/conta" && metodo === "DELETE") {
      atendimentos.filter((a) => a.tutorId === eu.id).forEach((a) => Object.assign(a, { petId: null, petNome: null, tutorId: null, tutorNome: null, tutorTelefone: null, observacoes: null }));
      tutores.splice(tutores.indexOf(eu), 1);
      [...contasCliente].filter(([, t]) => t === eu.id).forEach(([e]) => contasCliente.delete(e));
      return ok(undefined, 204);
    }
    return erro(404, "Não encontrado.");
  }

  if (p === "/api/servicos") return ok(servicos);
  if (papel === "CLIENTE") return proibido();

  // ---------- Só o dono ----------
  const servicoPut = p.match(/^\/api\/servicos\/(\w+)$/);
  if (servicoPut) {
    if (papel !== "DONO") return proibido();
    const s = servicos.find((x) => x.servico === servicoPut[1])!;
    if (!(corpo.precoCentavos >= 0)) return erro(400, "Confira os campos destacados.", { precoCentavos: "Informe o preço." });
    Object.assign(s, { precoCentavos: corpo.precoCentavos, duracaoMin: corpo.duracaoMin });
    return ok(s);
  }
  if (p.startsWith("/api/financeiro") || p.startsWith("/api/equipe")) {
    if (papel !== "DONO") return proibido();
    const mes = url.searchParams.get("mes") || mesHoje;
    if (p === "/api/financeiro/resumo") {
      const l = doMes(mes);
      const grupos = new Map<string, { tipo: Lancamento["tipo"]; categoria: string; totalCentavos: number }>();
      l.forEach((x) => {
        const k = x.tipo + x.categoria;
        const g = grupos.get(k) ?? { tipo: x.tipo, categoria: x.categoria, totalCentavos: 0 };
        g.totalCentavos += x.valorCentavos;
        grupos.set(k, g);
      });
      return ok({
        mes, entradasCentavos: soma(l, "ENTRADA"), saidasCentavos: soma(l, "SAIDA"), saldoCentavos: soma(l, "ENTRADA") - soma(l, "SAIDA"),
        porCategoria: [...grupos.values()].sort((a, b) => a.tipo.localeCompare(b.tipo) || b.totalCentavos - a.totalCentavos),
        ultimosMeses: [5, 4, 3, 2, 1, 0].map((i) => {
          const m = somarMes(mes, -i);
          return { mes: m, entradasCentavos: soma(doMes(m), "ENTRADA"), saidasCentavos: soma(doMes(m), "SAIDA") };
        }),
      });
    }
    if (p === "/api/financeiro/lancamentos" && metodo === "GET") return ok(doMes(mes).sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id));
    if (p === "/api/financeiro/lancamentos" && metodo === "POST") {
      const campos: Record<string, string> = {};
      if (!String(corpo.categoria ?? "").trim()) campos.categoria = "Informe a categoria.";
      if (!(corpo.valorCentavos > 0)) campos.valorCentavos = "O valor precisa ser maior que zero.";
      if (Object.keys(campos).length) return erro(400, "Confira os campos destacados.", campos);
      lancar(corpo.tipo, corpo.categoria.trim(), corpo.descricao || null, corpo.valorCentavos, corpo.data);
      return ok(lancamentos[lancamentos.length - 1], 201);
    }
    const apagar = p.match(/^\/api\/financeiro\/lancamentos\/(\d+)$/);
    if (apagar) {
      const l = lancamentos.find((x) => x.id === Number(apagar[1]));
      if (!l) return erro(404, "Lançamento não encontrado.");
      if (l.automatico) return erro(409, "Entradas de atendimentos não podem ser apagadas aqui.");
      lancamentos.splice(lancamentos.indexOf(l), 1);
      return ok(undefined, 204);
    }
    if (p === "/api/equipe" && metodo === "GET") return ok(equipe);
    if (p === "/api/equipe" && metodo === "POST") {
      if (!/^[a-z0-9._-]{3,40}$/.test(String(corpo.login ?? ""))) return erro(400, "Confira os campos destacados.", { login: "Use 3 a 40 letras minúsculas, números, ponto ou traço." });
      if (String(corpo.senha ?? "").length < 8) return erro(400, "Confira os campos destacados.", { senha: "A senha precisa ter pelo menos 8 caracteres." });
      if (equipe.some((m) => m.login === corpo.login)) return erro(409, "Já existe alguém com esse login.");
      const m: Membro = { id: id++, nome: corpo.nome, login: corpo.login, papel: "FUNCIONARIO", ativo: true };
      equipe.push(m);
      return ok(m, 201);
    }
    const ativo = p.match(/^\/api\/equipe\/(\d+)\/ativo$/);
    if (ativo) {
      const m = equipe.find((x) => x.id === Number(ativo[1]))!;
      if (m.papel === "DONO") return erro(409, "O acesso do dono não pode ser desativado por aqui.");
      m.ativo = corpo.ativo;
      return ok(m);
    }
    if (/^\/api\/equipe\/\d+\/senha$/.test(p)) return ok(undefined, 204);
    return erro(404, "Não encontrado.");
  }

  // ---------- Balcão (dono e funcionário) ----------
  if (p === "/api/resumo") {
    const doDia = atendimentos.filter((a) => a.dataHora.startsWith(hoje));
    return ok({
      hoje: { agendados: doDia.filter((a) => a.status === "AGENDADO").length, concluidos: doDia.filter((a) => a.status === "CONCLUIDO").length, cancelados: doDia.filter((a) => a.status === "CANCELADO").length },
      faturamentoMesCentavos: papel === "DONO" ? atendimentos.filter((a) => a.status === "CONCLUIDO" && a.dataHora.startsWith(mesHoje)).reduce((s, a) => s + a.valorCentavos, 0) : null,
      proximos: atendimentos.filter((a) => a.status === "AGENDADO").slice(0, 5),
    });
  }
  if (p === "/api/atendimentos" && metodo === "GET")
    return ok(atendimentos.filter((a) => a.dataHora.startsWith(url.searchParams.get("data") ?? "")).sort((a, b) => a.dataHora.localeCompare(b.dataHora)));
  if (p === "/api/atendimentos" && metodo === "POST") {
    const pet = todosPets().find((x) => x.id === corpo.petId);
    if (!pet) return erro(404, "Pet não encontrado.");
    const a = novoAtendimento(pet, corpo.servico, corpo.dataHora.slice(0, 10), corpo.dataHora.slice(11, 16), "AGENDADO", corpo.observacoes || null);
    a.valorCentavos = corpo.valorCentavos;
    atendimentos.push(a);
    return ok(a, 201);
  }
  const st = p.match(/^\/api\/atendimentos\/(\d+)\/status$/);
  if (st) {
    const a = atendimentos.find((x) => x.id === Number(st[1]))!;
    const novo = corpo.status as StatusAtendimento;
    if (a.status === "CONCLUIDO" || a.status === "CANCELADO") return erro(409, "Este atendimento não pode mudar de status.");
    if (a.status === "SOLICITADO" && novo === "CONCLUIDO") return erro(409, "Confirme o pedido antes de concluir.");
    if (novo === "CONCLUIDO") concluir(a);
    else a.status = novo;
    return ok(a);
  }
  if (p === "/api/tutores" && metodo === "GET") {
    const b = semAcento(url.searchParams.get("busca") ?? "");
    const dig = b.replace(/\D/g, "");
    const itens = tutores
      .filter((t) => semAcento(t.nome).includes(b) || (dig && t.telefone.includes(dig)))
      .sort((x, y) => x.nome.localeCompare(y.nome))
      .map((t) => ({ id: t.id, nome: t.nome, telefone: t.telefone, email: t.email, quantidadePets: t.pets.length }));
    return ok({ itens, total: itens.length, pagina: 0, totalPaginas: 1 });
  }
  if (p === "/api/tutores" && metodo === "POST") {
    const tel = telefoneValido(corpo.telefone);
    const campos: Record<string, string> = {};
    if (!String(corpo.nome ?? "").trim()) campos.nome = "Informe o nome.";
    if (!tel) campos.telefone = "Telefone precisa ter DDD + número (10 ou 11 dígitos).";
    if (Object.keys(campos).length) return erro(400, "Confira os campos destacados.", campos);
    const t: Tutor = { id: id++, nome: corpo.nome.trim(), telefone: tel!, email: corpo.email || null, observacoes: corpo.observacoes || null, criadoEm: new Date().toISOString(), pets: [] };
    tutores.push(t);
    return ok(t, 201);
  }
  const tm = p.match(/^\/api\/tutores\/(\d+)(\/exportacao|\/pets)?$/);
  if (tm) {
    const t = tutores.find((x) => x.id === Number(tm[1]));
    if (!t) return erro(404, "Tutor não encontrado.");
    if (tm[2] === "/exportacao") return ok({ geradoEm: new Date().toISOString(), tutor: t, atendimentos: atendimentos.filter((a) => a.tutorId === t.id) });
    if (tm[2] === "/pets") {
      if (!corpo.nome?.trim() || !corpo.especie || !corpo.porte) return erro(400, "Confira os campos destacados.", { ...(!corpo.nome?.trim() && { nome: "Informe o nome do pet." }), ...(!corpo.especie && { especie: "Escolha a espécie." }), ...(!corpo.porte && { porte: "Escolha o porte." }) });
      const pet: Pet = { id: id++, tutorId: t.id, nome: corpo.nome.trim(), especie: corpo.especie, raca: corpo.raca || null, porte: corpo.porte, nascimento: corpo.nascimento || null, observacoes: corpo.observacoes || null };
      t.pets.push(pet);
      return ok(pet, 201);
    }
    if (metodo === "PUT") {
      const tel = telefoneValido(corpo.telefone);
      if (!tel) return erro(400, "Confira os campos destacados.", { telefone: "Telefone precisa ter DDD + número (10 ou 11 dígitos)." });
      Object.assign(t, { nome: corpo.nome, telefone: tel, email: corpo.email || null, observacoes: corpo.observacoes || null });
      return ok(t);
    }
    if (metodo === "DELETE") {
      atendimentos.filter((a) => a.tutorId === t.id).forEach((a) => Object.assign(a, { petId: null, petNome: null, tutorId: null, tutorNome: null, tutorTelefone: null, observacoes: null }));
      tutores.splice(tutores.indexOf(t), 1);
      return ok(undefined, 204);
    }
    return ok(t);
  }
  const pm = p.match(/^\/api\/pets\/(\d+)(\/atendimentos)?$/);
  if (pm) {
    const petId = Number(pm[1]);
    if (pm[2]) return ok(atendimentos.filter((a) => a.petId === petId).sort((a, b) => b.dataHora.localeCompare(a.dataHora)));
    const t = tutores.find((x) => x.pets.some((y) => y.id === petId));
    if (!t) return erro(404, "Pet não encontrado.");
    if (metodo === "DELETE") {
      t.pets = t.pets.filter((y) => y.id !== petId);
      return ok(undefined, 204);
    }
    const pet = t.pets.find((y) => y.id === petId)!;
    Object.assign(pet, { nome: corpo.nome, especie: corpo.especie, raca: corpo.raca || null, porte: corpo.porte, nascimento: corpo.nascimento || null, observacoes: corpo.observacoes || null });
    return ok(pet);
  }
  return erro(404, "Não encontrado.");
}
