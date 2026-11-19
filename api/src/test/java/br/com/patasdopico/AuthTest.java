package br.com.patasdopico;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.patasdopico.auth.Usuario;
import br.com.patasdopico.auth.UsuarioRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

class AuthTest extends TesteIntegracao {

    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder senhas;

    @BeforeEach
    void criarUsuario() {
        if (usuarios.findByLogin("rafael").isEmpty()) {
            usuarios.save(new Usuario("Rafael", "rafael", senhas.encode("senha-forte-123")));
        }
    }

    @Test
    void loginCorretoDevolveTokenQueAbreRotaProtegida() throws Exception {
        String resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"rafael\",\"senha\":\"senha-forte-123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(emptyString())))
                .andExpect(jsonPath("$.nome").value("Rafael"))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(resposta, "$.token");

        mvc.perform(get("/api/eu").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Rafael"))
                .andExpect(jsonPath("$.demo").value(false));
    }

    @Test
    void senhaErradaResponde401SemDizerQualCampoErrou() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"rafael\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Usuário ou senha incorretos."));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"ninguem\",\"senha\":\"x\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Usuário ou senha incorretos."));
    }

    @Test
    void demoEntraSemSenha() throws Exception {
        String resposta = mvc.perform(post("/api/auth/demo"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(resposta, "$.token");
        mvc.perform(get("/api/eu").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.demo").value(true));
    }

    @Test
    void tokenFalsoResponde401() throws Exception {
        mvc.perform(get("/api/eu").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }
}
