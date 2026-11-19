package br.com.patasdopico.comum;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Usado pela tela para "acordar" o servidor gratuito e saber quando ele está pronto. */
@Tag(name = "Saúde")
@RestController
@RequestMapping("/api/saude")
public class SaudeController {

    private final JdbcTemplate jdbc;

    public SaudeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Operation(summary = "Confere se a API e o banco estão no ar")
    @GetMapping
    public Map<String, String> saude() {
        jdbc.queryForObject("SELECT 1", Integer.class);
        return Map.of("status", "ok", "banco", "ok");
    }
}
