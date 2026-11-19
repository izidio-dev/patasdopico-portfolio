package br.com.patasdopico.auth;

import br.com.patasdopico.comum.ConflitoException;
import br.com.patasdopico.comum.NaoAutorizadoException;
import br.com.patasdopico.tutor.Tutor;
import br.com.patasdopico.tutor.TutorRepository;
import br.com.patasdopico.tutor.TutorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Cadastro feito pelo próprio cliente (cria a ficha de tutor + a conta de acesso). */
@Tag(name = "Login")
@RestController
public class CadastroController {

    public record PedidoCadastro(
            @NotBlank(message = "Informe seu nome.") @Size(max = 100) String nome,
            @NotBlank(message = "Informe seu e-mail.") @Email(message = "E-mail inválido.") @Size(max = 120) String email,
            @NotBlank(message = "Informe seu telefone.") String telefone,
            @NotBlank(message = "Crie uma senha.") @Size(min = 8, max = 72, message = "A senha precisa ter pelo menos 8 caracteres.") String senha,
            @AssertTrue(message = "Para criar a conta, aceite a Política de Privacidade.") boolean aceitePrivacidade) {}

    private final boolean ativo;
    private final UsuarioRepository usuarios;
    private final TutorRepository tutores;
    private final PasswordEncoder senhas;
    private final TokenService tokens;

    public CadastroController(@Value("${app.cadastro-cliente.ativo}") boolean ativo, UsuarioRepository usuarios, TutorRepository tutores,
                              PasswordEncoder senhas, TokenService tokens) {
        this.ativo = ativo;
        this.usuarios = usuarios;
        this.tutores = tutores;
        this.senhas = senhas;
        this.tokens = tokens;
    }

    @Operation(summary = "Cliente cria a própria conta")
    @PostMapping("/api/auth/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AuthController.RespostaLogin cadastrar(@Valid @RequestBody PedidoCadastro p) {
        if (!ativo) throw new NaoAutorizadoException("O cadastro de clientes está desativado.");
        String email = p.email().trim().toLowerCase();
        if (usuarios.findByLogin(email).isPresent()) throw new ConflitoException("Já existe uma conta com este e-mail.");
        Tutor t = tutores.save(new Tutor(p.nome().trim(), TutorService.normalizarTelefone(p.telefone()), email, null));
        Usuario u = usuarios.save(Usuario.cliente(t, email, senhas.encode(p.senha())));
        return new AuthController.RespostaLogin(tokens.gerar(u, false), u.getNome(), u.getPapel());
    }
}
