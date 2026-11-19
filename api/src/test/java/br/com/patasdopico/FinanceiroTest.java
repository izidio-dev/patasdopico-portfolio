package br.com.patasdopico;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class FinanceiroTest extends TesteIntegracao {

    static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Test
    void funcionarioVeServicosMasSoODonoAlteraPreco() throws Exception {
        mvc.perform(get("/api/servicos").header("Authorization", tokenDe("FUNCIONARIO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[*].servico", hasItem("BANHO")));
        mvc.perform(put("/api/servicos/TOSA").header("Authorization", tokenDe("FUNCIONARIO")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"precoCentavos\":1,\"duracaoMin\":60}"))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/servicos/TOSA").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"precoCentavos\":7500,\"duracaoMin\":60}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precoCentavos").value(7500));
    }

    @Test
    void concluirAtendimentoGeraEntradaAutomatica() throws Exception {
        Integer tutor = campo(mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Rui Financeiro\",\"telefone\":\"11988887777\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        Integer pet = campo(mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Kiko\",\"especie\":\"GATO\",\"porte\":\"PEQUENO\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        Integer atendimento = campo(mvc.perform(post("/api/atendimentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"petId\":" + pet + ",\"servico\":\"VACINA\",\"dataHora\":\"" + LocalDate.now(SP).atTime(7, 0) + "\",\"valorCentavos\":9100}"))
                .andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(patch("/api/atendimentos/" + atendimento + "/status").header("Authorization", tokenDe("FUNCIONARIO")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"CONCLUIDO\"}")).andExpect(status().isOk());

        mvc.perform(get("/api/financeiro/lancamentos").param("mes", YearMonth.now(SP).toString()).header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.atendimentoId == " + atendimento + ")].valorCentavos").value(9100))
                .andExpect(jsonPath("$[?(@.atendimentoId == " + atendimento + ")].categoria").value("Serviços"));
    }

    @Test
    void donoLancaDespesaEVeSaldoPorCategoriaEUltimosMeses() throws Exception {
        String mes = YearMonth.now(SP).toString();
        Integer id = campo(mvc.perform(post("/api/financeiro/lancamentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"SAIDA\",\"categoria\":\"Aluguel\",\"descricao\":\"Aluguel da loja\",\"valorCentavos\":250000,\"data\":\"" + LocalDate.now(SP) + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");

        String resumo = mvc.perform(get("/api/financeiro/resumo").param("mes", mes).header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saidasCentavos", greaterThanOrEqualTo(250000)))
                .andExpect(jsonPath("$.porCategoria[*].categoria", hasItem("Aluguel")))
                .andExpect(jsonPath("$.ultimosMeses.length()").value(6))
                .andReturn().getResponse().getContentAsString();
        Number entradas = campo(resumo, "$.entradasCentavos");
        Number saidas = campo(resumo, "$.saidasCentavos");
        Number saldo = campo(resumo, "$.saldoCentavos");
        org.junit.jupiter.api.Assertions.assertEquals(entradas.longValue() - saidas.longValue(), saldo.longValue());

        mvc.perform(delete("/api/financeiro/lancamentos/" + id).header("Authorization", token())).andExpect(status().isNoContent());
    }

    @Test
    void lancamentoInvalidoOuDeAtendimentoNaoPodeSerApagado() throws Exception {
        mvc.perform(post("/api/financeiro/lancamentos").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipo\":\"SAIDA\",\"categoria\":\"\",\"valorCentavos\":0,\"data\":\"2026-11-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.valorCentavos").exists())
                .andExpect(jsonPath("$.campos.categoria").exists());
        mvc.perform(get("/api/financeiro/resumo").header("Authorization", tokenDe("FUNCIONARIO"))).andExpect(status().isForbidden());
    }
}
