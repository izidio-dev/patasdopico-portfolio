package br.com.patasdopico.auth;

import br.com.patasdopico.comum.NaoAutorizadoException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Login")
@RestController
public class AuthController {

    /** Login fixo do usuário de demonstração (criado na inicialização). */
    public static final String LOGIN_DEMO = "demo";

    public record PedidoLogin(@NotBlank String login, @NotBlank String senha) {}

    public record RespostaLogin(String token, String nome) {}

    private final UsuarioRepository usuarios;
    private final PasswordEncoder senhas;
    private final TokenService tokens;

    public AuthController(UsuarioRepository usuarios, PasswordEncoder senhas, TokenService tokens) {
        this.usuarios = usuarios;
        this.senhas = senhas;
        this.tokens = tokens;
    }

    @Operation(summary = "Entrar com usuário e senha da equipe")
    @PostMapping("/api/auth/login")
    public RespostaLogin login(@Valid @RequestBody PedidoLogin pedido) {
        // Mesma mensagem para usuário inexistente e senha errada: não revela quais logins existem.
        Usuario u = usuarios.findByLogin(pedido.login().trim())
                .filter(x -> !x.getLogin().equals(LOGIN_DEMO))
                .filter(x -> senhas.matches(pedido.senha(), x.getSenhaHash()))
                .orElseThrow(() -> new NaoAutorizadoException("Usuário ou senha incorretos."));
        return new RespostaLogin(tokens.gerar(u, false), u.getNome());
    }

    @Operation(summary = "Entrar como demonstração (dados fictícios)")
    @PostMapping("/api/auth/demo")
    public RespostaLogin demo() {
        Usuario u = usuarios.findByLogin(LOGIN_DEMO)
                .orElseThrow(() -> new NaoAutorizadoException("Modo demonstração indisponível."));
        return new RespostaLogin(tokens.gerar(u, true), u.getNome());
    }

    @Operation(summary = "Quem está logado")
    @GetMapping("/api/eu")
    public Map<String, Object> eu(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("login", jwt.getSubject(), "nome", jwt.getClaimAsString("nome"), "demo", Boolean.TRUE.equals(jwt.getClaimAsBoolean("demo")));
    }
}
