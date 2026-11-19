package br.com.patasdopico;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Com DEMO_RESET ligado, a API sobe com dados fictícios prontos para explorar. */
@TestPropertySource(properties = "app.demo.reset=true")
class DemoSeedTest extends TesteIntegracao {

    @Test
    void demoTemTutoresAgendaDeHojeEFaturamento() throws Exception {
        mvc.perform(get("/api/tutores").header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(8)));
        mvc.perform(get("/api/atendimentos").param("data", LocalDate.now(ZoneId.of("America/Sao_Paulo")).toString()).header("Authorization", token()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(3)));
        mvc.perform(get("/api/resumo").header("Authorization", token()))
                .andExpect(jsonPath("$.faturamentoMesCentavos", greaterThanOrEqualTo(1)));
    }

    @Test
    void swaggerEstaPublico() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Patas do Pico — API"))
                .andExpect(jsonPath("$.components.securitySchemes.token.scheme").value("bearer"));
    }
}
