package br.com.patasdopico;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class SaudeTest extends TesteIntegracao {

    @Test
    void saudeEhPublicaEConfereOBanco() throws Exception {
        mvc.perform(get("/api/saude"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.banco").value("ok"));
    }

    @Test
    void rotaProtegidaSemTokenResponde401EmJson() throws Exception {
        mvc.perform(get("/api/tutores"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    void telaAutorizadaPodeChamarAApi() throws Exception {
        mvc.perform(options("/api/resumo")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void siteDesconhecidoNaoPodeChamarAApi() throws Exception {
        mvc.perform(options("/api/resumo")
                        .header("Origin", "https://site-malicioso.exemplo")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
