package br.com.patasdopico;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class EquipeTest extends TesteIntegracao {

    private String login(String login, String senha) {
        return "{\"login\":\"" + login + "\",\"senha\":\"" + senha + "\"}";
    }

    @Test
    void donoCriaFuncionarioQueConsegueEntrar() throws Exception {
        String login = "func" + UUID.randomUUID().toString().substring(0, 6);
        mvc.perform(post("/api/equipe").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Marta\",\"login\":\"" + login + "\",\"senha\":\"provisoria-123\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.papel").value("FUNCIONARIO"))
                .andExpect(jsonPath("$.ativo").value(true));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(login, "provisoria-123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.papel").value("FUNCIONARIO"));
        mvc.perform(get("/api/equipe").header("Authorization", token()))
                .andExpect(jsonPath("$[*].login", hasItem(login)))
                .andExpect(jsonPath("$[*].papel", not(hasItem("CLIENTE"))));
    }

    @Test
    void desativarBloqueiaEReativarLibera() throws Exception {
        String login = "func" + UUID.randomUUID().toString().substring(0, 6);
        Integer id = campo(mvc.perform(post("/api/equipe").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Leo\",\"login\":\"" + login + "\",\"senha\":\"provisoria-123\"}")).andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(patch("/api/equipe/" + id + "/ativo").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
                .andExpect(jsonPath("$.ativo").value(false));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(login, "provisoria-123"))).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/equipe/" + id + "/ativo").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":true}"));
        mvc.perform(patch("/api/equipe/" + id + "/senha").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON).content("{\"senha\":\"nova-senha-456\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(login, "nova-senha-456"))).andExpect(status().isOk());
    }

    @Test
    void loginRepetidoEDonoSeDesativandoSaoRecusados() throws Exception {
        String login = "func" + UUID.randomUUID().toString().substring(0, 6);
        String corpo = "{\"nome\":\"Ana\",\"login\":\"" + login + "\",\"senha\":\"provisoria-123\"}";
        mvc.perform(post("/api/equipe").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON).content(corpo)).andExpect(status().isCreated());
        mvc.perform(post("/api/equipe").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Já existe alguém com esse login."));
        String equipe = mvc.perform(get("/api/equipe").header("Authorization", token())).andReturn().getResponse().getContentAsString();
        java.util.List<Integer> donos = campo(equipe, "$[?(@.papel == 'DONO')].id");
        mvc.perform(patch("/api/equipe/" + donos.get(0) + "/ativo").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON).content("{\"ativo\":false}"))
                .andExpect(status().isConflict());
    }
}
