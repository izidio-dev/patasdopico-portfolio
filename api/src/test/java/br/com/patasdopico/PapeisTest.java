package br.com.patasdopico;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.patasdopico.auth.Usuario;
import br.com.patasdopico.auth.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

class PapeisTest extends TesteIntegracao {

    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder senhas;

    @Test
    void demoDeCadaPapelDevolveOPapelCerto() throws Exception {
        for (String papel : new String[] {"DONO", "FUNCIONARIO", "CLIENTE"}) {
            mvc.perform(get("/api/eu").header("Authorization", tokenDe(papel)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.papel").value(papel));
        }
    }

    @Test
    void funcionarioNaoVeFaturamentoMasDonoVe() throws Exception {
        mvc.perform(get("/api/resumo").header("Authorization", tokenDe("FUNCIONARIO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faturamentoMesCentavos").value(nullValue()))
                .andExpect(jsonPath("$.hoje").exists());
        mvc.perform(get("/api/resumo").header("Authorization", tokenDe("DONO")))
                .andExpect(jsonPath("$.faturamentoMesCentavos").isNumber());
    }

    @Test
    void funcionarioRecebe403NoFinanceiroENaEquipeEmJson() throws Exception {
        mvc.perform(get("/api/financeiro/resumo").header("Authorization", tokenDe("FUNCIONARIO")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Você não tem permissão para acessar esta área."));
        mvc.perform(get("/api/equipe").header("Authorization", tokenDe("FUNCIONARIO")))
                .andExpect(status().isForbidden());
    }

    @Test
    void clienteNaoAcessaRotasDaEquipe() throws Exception {
        mvc.perform(get("/api/tutores").header("Authorization", tokenDe("CLIENTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/atendimentos").param("data", "2026-11-19").header("Authorization", tokenDe("CLIENTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/resumo").header("Authorization", tokenDe("CLIENTE"))).andExpect(status().isForbidden());
    }

    @Test
    void funcionarioDesativadoNaoEntra() throws Exception {
        Usuario u = usuarios.findByLogin("joana").orElseGet(() -> usuarios.save(new Usuario("Joana", "joana", senhas.encode("senha-da-joana"), Usuario.Papel.FUNCIONARIO)));
        u.desativar();
        usuarios.save(u);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"login\":\"joana\",\"senha\":\"senha-da-joana\"}"))
                .andExpect(status().isUnauthorized());
    }
}
