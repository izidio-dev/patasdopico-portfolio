package br.com.patasdopico.equipe;

import br.com.patasdopico.auth.Usuario;
import br.com.patasdopico.auth.UsuarioRepository;
import br.com.patasdopico.comum.ConflitoException;
import br.com.patasdopico.comum.NaoEncontradoException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Equipe da loja (dono e funcionários). Só o dono acessa (regra em SegurancaConfig). */
@Tag(name = "Equipe")
@SecurityRequirement(name = "token")
@RestController
@RequestMapping("/api/equipe")
public class EquipeController {

    public record MembroResposta(Long id, String nome, String login, Usuario.Papel papel, boolean ativo) {
        static MembroResposta de(Usuario u) {
            return new MembroResposta(u.getId(), u.getNome(), u.getLogin(), u.getPapel(), u.isAtivo());
        }
    }

    public record NovoFuncionario(@NotBlank(message = "Informe o nome.") @Size(max = 80) String nome,
                                  @NotBlank(message = "Informe o login.") @Pattern(regexp = "^[a-z0-9._-]{3,40}$", message = "Use 3 a 40 letras minúsculas, números, ponto ou traço.") String login,
                                  @NotBlank @Size(min = 8, max = 72, message = "A senha precisa ter pelo menos 8 caracteres.") String senha) {}

    public record MudancaAtivo(@NotNull Boolean ativo) {}

    public record NovaSenha(@NotBlank @Size(min = 8, max = 72, message = "A senha precisa ter pelo menos 8 caracteres.") String senha) {}

    private final UsuarioRepository usuarios;
    private final PasswordEncoder senhas;

    public EquipeController(UsuarioRepository usuarios, PasswordEncoder senhas) {
        this.usuarios = usuarios;
        this.senhas = senhas;
    }

    @Operation(summary = "Lista dono e funcionários")
    @GetMapping
    public List<MembroResposta> listar() {
        return usuarios.findByPapelNotOrderByNome(Usuario.Papel.CLIENTE).stream().map(MembroResposta::de).toList();
    }

    @Operation(summary = "Cria um funcionário com senha provisória")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MembroResposta criar(@Valid @RequestBody NovoFuncionario p) {
        if (usuarios.findByLogin(p.login()).isPresent()) throw new ConflitoException("Já existe alguém com esse login.");
        return MembroResposta.de(usuarios.save(new Usuario(p.nome().trim(), p.login(), senhas.encode(p.senha()), Usuario.Papel.FUNCIONARIO)));
    }

    @Operation(summary = "Ativa ou desativa o acesso de um funcionário")
    @PatchMapping("/{id}/ativo")
    @Transactional
    public MembroResposta mudarAtivo(@PathVariable Long id, @Valid @RequestBody MudancaAtivo m) {
        Usuario u = membro(id);
        if (u.getPapel() == Usuario.Papel.DONO) throw new ConflitoException("O acesso do dono não pode ser desativado por aqui.");
        if (m.ativo()) u.ativar();
        else u.desativar();
        return MembroResposta.de(u);
    }

    @Operation(summary = "Define uma nova senha para o funcionário")
    @PatchMapping("/{id}/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void redefinirSenha(@PathVariable Long id, @Valid @RequestBody NovaSenha s) {
        membro(id).trocarSenha(senhas.encode(s.senha()));
    }

    private Usuario membro(Long id) {
        return usuarios.findById(id).filter(u -> u.getPapel() != Usuario.Papel.CLIENTE)
                .orElseThrow(() -> new NaoEncontradoException("Pessoa da equipe não encontrada."));
    }
}
