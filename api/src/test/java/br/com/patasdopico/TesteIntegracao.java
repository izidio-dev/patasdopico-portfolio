package br.com.patasdopico;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.jayway.jsonpath.JsonPath;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Base dos testes: sobe um PostgreSQL de verdade embutido (uma vez por execução)
 * e aponta a aplicação para ele. As migrações do Flyway rodam como em produção.
 */
@SpringBootTest(properties = {"logging.level.root=WARN", "logging.level.org.springframework=WARN"})
@AutoConfigureMockMvc
public abstract class TesteIntegracao {

    private static final EmbeddedPostgres BANCO;

    static {
        try {
            BANCO = EmbeddedPostgres.start();
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível iniciar o PostgreSQL de teste", e);
        }
    }

    @DynamicPropertySource
    static void banco(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> BANCO.getJdbcUrl("postgres", "postgres"));
        r.add("spring.datasource.username", () -> "postgres");
        r.add("spring.datasource.password", () -> "postgres");
    }

    @Autowired
    protected MockMvc mvc;

    /** Cabeçalho "Bearer ..." do usuário de demonstração. */
    protected String token() throws Exception {
        String r = mvc.perform(post("/api/auth/demo")).andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(r, "$.token");
    }

    /** Lê um campo da resposta JSON. */
    protected static <T> T campo(String json, String caminho) {
        return JsonPath.read(json, caminho);
    }
}
