package br.com.patasdopico;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AtendimentoTest extends TesteIntegracao {

    static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    private Integer criarPet() throws Exception {
        String t = mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Fábio\",\"telefone\":\"11955556666\"}")).andReturn().getResponse().getContentAsString();
        Integer tutor = campo(t, "$.id");
        String p = mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Bolinha\",\"especie\":\"CAO\",\"porte\":\"PEQUENO\"}")).andReturn().getResponse().getContentAsString();
        return campo(p, "$.id");
    }

    private String agendar(Integer pet, String servico, LocalDateTime quando, long valor) throws Exception {
        return mvc.perform(post("/api/atendimentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petId\":" + pet + ",\"servico\":\"" + servico + "\",\"dataHora\":\"" + quando + "\",\"valorCentavos\":" + valor + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AGENDADO"))
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void agendaAparecemNoDiaComPetETutor() throws Exception {
        Integer pet = criarPet();
        LocalDateTime hoje15h = LocalDate.now(SP).atTime(15, 0);
        agendar(pet, "BANHO", hoje15h, 6000);
        mvc.perform(get("/api/atendimentos").param("data", LocalDate.now(SP).toString()).header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].petNome", hasItem("Bolinha")))
                .andExpect(jsonPath("$[*].tutorNome", hasItem("Fábio")));
    }

    @Test
    void concluirEntraNoFaturamentoDoMes() throws Exception {
        Integer pet = criarPet();
        String a = agendar(pet, "BANHO_E_TOSA", LocalDate.now(SP).atTime(9, 0), 12345);
        Integer id = campo(a, "$.id");
        String antes = mvc.perform(get("/api/resumo").header("Authorization", token())).andReturn().getResponse().getContentAsString();
        Number faturamentoAntes = campo(antes, "$.faturamentoMesCentavos");

        mvc.perform(patch("/api/atendimentos/" + id + "/status").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONCLUIDO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDO"));

        mvc.perform(get("/api/resumo").header("Authorization", token()))
                .andExpect(jsonPath("$.faturamentoMesCentavos").value(faturamentoAntes.longValue() + 12345))
                .andExpect(jsonPath("$.hoje.concluidos", greaterThanOrEqualTo(1)));
    }

    @Test
    void atendimentoCanceladoNaoPodeSerConcluido() throws Exception {
        Integer pet = criarPet();
        Integer id = campo(agendar(pet, "TOSA", LocalDate.now(SP).plusDays(1).atTime(10, 0), 5000), "$.id");
        mvc.perform(patch("/api/atendimentos/" + id + "/status").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"CANCELADO\"}")).andExpect(status().isOk());
        mvc.perform(patch("/api/atendimentos/" + id + "/status").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONCLUIDO\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Atendimento cancelado não pode mudar de status."));
    }

    @Test
    void valorNegativoEPetInexistenteSaoRecusados() throws Exception {
        Integer pet = criarPet();
        mvc.perform(post("/api/atendimentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petId\":" + pet + ",\"servico\":\"BANHO\",\"dataHora\":\"2026-12-01T10:00:00\",\"valorCentavos\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.valorCentavos").exists());
        mvc.perform(post("/api/atendimentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petId\":999999,\"servico\":\"BANHO\",\"dataHora\":\"2026-12-01T10:00:00\",\"valorCentavos\":100}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void historicoDoPetListaAtendimentos() throws Exception {
        Integer pet = criarPet();
        agendar(pet, "VACINA", LocalDate.now(SP).minusDays(3).atTime(11, 0), 9000);
        mvc.perform(get("/api/pets/" + pet + "/atendimentos").header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].servico").value("VACINA"));
    }

    @Test
    void proximosMostraAgendamentosFuturos() throws Exception {
        Integer pet = criarPet();
        agendar(pet, "CONSULTA", LocalDateTime.now(SP).plusHours(2), 15000);
        mvc.perform(get("/api/resumo").header("Authorization", token()))
                .andExpect(jsonPath("$.proximos[*].servico", hasItem("CONSULTA")));
    }
}
