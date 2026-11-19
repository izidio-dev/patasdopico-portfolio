package br.com.patasdopico;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class LgpdTest extends TesteIntegracao {

    @Test
    void exportaTudoQueOSistemaGuardaDoTutor() throws Exception {
        Integer tutor = campo(mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Gabi Exporta\",\"telefone\":\"11966667777\",\"email\":\"gabi@teste.com\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        Integer pet = campo(mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Nina\",\"especie\":\"GATO\",\"porte\":\"PEQUENO\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(post("/api/atendimentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"petId\":" + pet + ",\"servico\":\"CONSULTA\",\"dataHora\":\"2026-11-10T10:00:00\",\"valorCentavos\":15000}"));

        mvc.perform(get("/api/tutores/" + tutor + "/exportacao").header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tutor.email").value("gabi@teste.com"))
                .andExpect(jsonPath("$.tutor.pets[0].nome").value("Nina"))
                .andExpect(jsonPath("$.atendimentos[0].servico").value("CONSULTA"))
                .andExpect(jsonPath("$.geradoEm").exists());
    }

    @Test
    void excluirTutorApagaDadosPessoaisMasMantemOFaturamento() throws Exception {
        LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        Integer tutor = campo(mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Hugo Apagado\",\"telefone\":\"11977778888\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        Integer pet = campo(mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Thor\",\"especie\":\"CAO\",\"porte\":\"GRANDE\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        Integer atendimento = campo(mvc.perform(post("/api/atendimentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"petId\":" + pet + ",\"servico\":\"BANHO\",\"dataHora\":\"" + hoje.atTime(8, 0) + "\",\"valorCentavos\":7000,\"observacoes\":\"Hugo pediu perfume\"}"))
                .andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(patch("/api/atendimentos/" + atendimento + "/status").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"CONCLUIDO\"}"));
        Number faturamento = campo(mvc.perform(get("/api/resumo").header("Authorization", token())).andReturn().getResponse().getContentAsString(), "$.faturamentoMesCentavos");

        mvc.perform(delete("/api/tutores/" + tutor).header("Authorization", token())).andExpect(status().isNoContent());

        mvc.perform(get("/api/tutores/" + tutor).header("Authorization", token())).andExpect(status().isNotFound());
        mvc.perform(get("/api/resumo").header("Authorization", token()))
                .andExpect(jsonPath("$.faturamentoMesCentavos").value(faturamento.longValue()));
        mvc.perform(get("/api/atendimentos").param("data", hoje.toString()).header("Authorization", token()))
                .andExpect(jsonPath("$[*].tutorNome", not(hasItem("Hugo Apagado"))))
                .andExpect(jsonPath("$[*].observacoes", not(hasItem("Hugo pediu perfume"))));
    }
}
