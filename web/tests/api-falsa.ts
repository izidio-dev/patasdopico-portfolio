import type { Page, Route } from "@playwright/test";

/** API simulada em memória, com o mesmo formato da API Java. */
export async function apiFalsa(page: Page, opcoes: { saudeFalhaVezes?: number; tokenExpirado?: boolean } = {}) {
  let falhas = opcoes.saudeFalhaVezes ?? 0;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const tutores = [
    { id: 1, nome: "Ana Beatriz Carvalho", telefone: "11900000001", email: "ana@exemplo.com", observacoes: null, criadoEm: "2026-11-01T10:00:00", pets: [{ id: 11, tutorId: 1, nome: "Paçoca", especie: "CAO", raca: "Vira-lata", porte: "MEDIO", nascimento: "2022-03-01", observacoes: "Medo de secador" }] },
    { id: 2, nome: "Bruno Henrique Lopes", telefone: "11900000002", email: null, observacoes: null, criadoEm: "2026-11-02T10:00:00", pets: [] },
  ];
  const agenda = [
    { id: 100, petId: 11, petNome: "Paçoca", tutorId: 1, tutorNome: "Ana Beatriz Carvalho", tutorTelefone: "11900000001", servico: "BANHO", dataHora: `${hoje}T14:30:00`, valorCentavos: 6000, status: "AGENDADO", observacoes: null },
  ];
  let proximoId = 500;
  const json = (route: Route, status: number, corpo: unknown) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(corpo), headers: { "access-control-allow-origin": "*" } });

  await page.route("http://api.teste/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const caminho = url.pathname;
    const metodo = req.method();
    if (metodo === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (caminho === "/api/saude") {
      if (falhas > 0) { falhas--; return route.abort(); }
      return json(route, 200, { status: "ok", banco: "ok" });
    }
    if (caminho === "/api/auth/demo") return json(route, 200, { token: "tok-demo", nome: "Equipe (demonstração)" });
    if (caminho === "/api/auth/login") return json(route, 401, { title: "Não autorizado", detail: "Usuário ou senha incorretos." });
    if (opcoes.tokenExpirado) return json(route, 401, { detail: "Faça login para continuar." });
    if (caminho === "/api/eu") return json(route, 200, { login: "demo", nome: "Equipe (demonstração)", demo: true });
    if (caminho === "/api/resumo")
      return json(route, 200, { hoje: { agendados: agenda.filter((a) => a.status === "AGENDADO").length, concluidos: agenda.filter((a) => a.status === "CONCLUIDO").length, cancelados: 0 }, faturamentoMesCentavos: 482000, proximos: agenda.filter((a) => a.status === "AGENDADO") });
    if (caminho === "/api/atendimentos" && metodo === "GET") return json(route, 200, url.searchParams.get("data") === hoje ? agenda : []);
    const status = caminho.match(/^\/api\/atendimentos\/(\d+)\/status$/);
    if (status) {
      const a = agenda.find((x) => x.id === Number(status[1]))!;
      a.status = JSON.parse(req.postData() ?? "{}").status;
      return json(route, 200, a);
    }
    if (caminho === "/api/atendimentos" && metodo === "POST") {
      const b = JSON.parse(req.postData() ?? "{}");
      const pet = tutores.flatMap((t) => t.pets).find((p) => p.id === b.petId)!;
      const t = tutores.find((x) => x.id === pet.tutorId)!;
      const novo = { id: proximoId++, petId: pet.id, petNome: pet.nome, tutorId: t.id, tutorNome: t.nome, tutorTelefone: t.telefone, servico: b.servico, dataHora: b.dataHora, valorCentavos: b.valorCentavos, status: "AGENDADO", observacoes: b.observacoes ?? null };
      agenda.push(novo);
      return json(route, 201, novo);
    }
    if (caminho === "/api/tutores" && metodo === "GET") {
      const busca = (url.searchParams.get("busca") ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const itens = tutores
        .filter((t) => t.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(busca) || (busca && t.telefone.includes(busca)))
        .map((t) => ({ id: t.id, nome: t.nome, telefone: t.telefone, email: t.email, quantidadePets: t.pets.length }));
      return json(route, 200, { itens, total: itens.length, pagina: 0, totalPaginas: 1 });
    }
    if (caminho === "/api/tutores" && metodo === "POST") {
      const b = JSON.parse(req.postData() ?? "{}");
      const tel = String(b.telefone ?? "").replace(/\D/g, "");
      if (tel.length < 10) return json(route, 400, { title: "Dados inválidos", detail: "Confira os campos destacados.", campos: { telefone: "Telefone precisa ter DDD + número (10 ou 11 dígitos)." } });
      const novo = { id: proximoId++, nome: b.nome, telefone: tel, email: b.email || null, observacoes: b.observacoes || null, criadoEm: new Date().toISOString(), pets: [] };
      tutores.push(novo);
      return json(route, 201, novo);
    }
    const tutor = caminho.match(/^\/api\/tutores\/(\d+)(\/exportacao|\/pets)?$/);
    if (tutor) {
      const t = tutores.find((x) => x.id === Number(tutor[1]));
      if (!t) return json(route, 404, { detail: "Tutor não encontrado." });
      if (tutor[2] === "/exportacao") return json(route, 200, { geradoEm: new Date().toISOString(), tutor: t, atendimentos: [] });
      if (tutor[2] === "/pets") {
        const b = JSON.parse(req.postData() ?? "{}");
        const pet = { id: proximoId++, tutorId: t.id, nome: b.nome, especie: b.especie, raca: b.raca ?? null, porte: b.porte, nascimento: b.nascimento ?? null, observacoes: b.observacoes ?? null };
        t.pets.push(pet);
        return json(route, 201, pet);
      }
      if (metodo === "DELETE") { tutores.splice(tutores.indexOf(t), 1); return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } }); }
      return json(route, 200, t);
    }
    if (/^\/api\/pets\/\d+\/atendimentos$/.test(caminho)) return json(route, 200, agenda.filter((a) => `/api/pets/${a.petId}/atendimentos` === caminho));
    return json(route, 404, { detail: "Rota não simulada: " + caminho });
  });
}
