package br.com.patasdopico.auth;

import br.com.patasdopico.comum.NaoAutorizadoException;
import br.com.patasdopico.tutor.Tutor;
import br.com.patasdopico.tutor.TutorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Login")
@RestController
public class AuthController {

    /** Logins fixos de demonstração (sem senha conhecida: só entram pelo botão de demo). */
    public static final String LOGIN_DEMO_FUNCIONARIO = "demo";
    public static final String LOGIN_DEMO_DONO = "dono-demo";
    public static final String LOGIN_DEMO_CLIENTE = "cliente-demo@patasdopico.demo";
    static final Set<String> LOGINS_DEMO = Set.of(LOGIN_DEMO_FUNCIONARIO, LOGIN_DEMO_DONO, LOGIN_DEMO_CLIENTE);

    public record PedidoLogin(@NotBlank String login, @NotBlank String senha) {}

    public record RespostaLogin(String token, String nome, Usuario.Papel papel) {}

    private final UsuarioRepository usuarios;
    private final TutorRepository tutores;
    private final PasswordEncoder senhas;
    private final TokenService tokens;

    public AuthController(UsuarioRepository usuarios, TutorRepository tutores, PasswordEncoder senhas, TokenService tokens) {
        this.usuarios = usuarios;
        this.tutores = tutores;
        this.senhas = senhas;
        this.tokens = tokens;
    }

    @Operation(summary = "Entrar com login (equipe) ou e-mail (cliente) e senha")
    @PostMapping("/api/auth/login")
    public RespostaLogin login(@Valid @RequestBody PedidoLogin pedido) {
        // Mesma mensagem para usuário inexistente, desativado ou senha errada: não revela quem existe.
        Usuario u = usuarios.findByLogin(pedido.login().trim().toLowerCase())
                .or(() -> usuarios.findByLogin(pedido.login().trim()))
                .filter(x -> !LOGINS_DEMO.contains(x.getLogin()))
                .filter(Usuario::isAtivo)
                .filter(x -> senhas.matches(pedido.senha(), x.getSenhaHash()))
                .orElseThrow(() -> new NaoAutorizadoException("Usuário ou senha incorretos."));
        return new RespostaLogin(tokens.gerar(u, false), u.getNome(), u.getPapel());
    }

    @Operation(summary = "Entrar como demonstração: papel DONO, FUNCIONARIO ou CLIENTE")
    @PostMapping("/api/auth/demo")
    @Transactional
    public RespostaLogin demo(@RequestParam(defaultValue = "FUNCIONARIO") Usuario.Papel papel) {
        Usuario u = switch (papel) {
            case DONO -> usuarios.findByLogin(LOGIN_DEMO_DONO).orElseThrow(() -> new NaoAutorizadoException("Demonstração indisponível."));
            case FUNCIONARIO -> usuarios.findByLogin(LOGIN_DEMO_FUNCIONARIO).orElseThrow(() -> new NaoAutorizadoException("Demonstração indisponível."));
            case CLIENTE -> usuarios.findByLogin(LOGIN_DEMO_CLIENTE).orElseGet(this::criarClienteDemo);
        };
        return new RespostaLogin(tokens.gerar(u, true), u.getNome(), u.getPapel());
    }

    /** Se os dados de demonstração não criaram o cliente demo, cria um com ficha própria. */
    private Usuario criarClienteDemo() {
        Tutor t = tutores.save(new Tutor("Cliente de demonstração", "11900000099", LOGIN_DEMO_CLIENTE, null));
        return usuarios.save(Usuario.cliente(t, LOGIN_DEMO_CLIENTE, senhas.encode(UUID.randomUUID().toString())));
    }

    @Operation(summary = "Quem está logado")
    @GetMapping("/api/eu")
    public Map<String, Object> eu(@AuthenticationPrincipal Jwt jwt) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("login", jwt.getSubject());
        r.put("nome", jwt.getClaimAsString("nome"));
        r.put("papel", jwt.getClaimAsString("papel"));
        r.put("demo", Boolean.TRUE.equals(jwt.getClaimAsBoolean("demo")));
        return r;
    }
}
