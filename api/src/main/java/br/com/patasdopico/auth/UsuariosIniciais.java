package br.com.patasdopico.auth;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Na inicialização, garante:
 * - o usuário "demo" (senha aleatória: só entra pelo botão de demonstração);
 * - o administrador definido por ADMIN_LOGIN/ADMIN_SENHA, se essas variáveis existirem.
 */
@Component
@Order(1)
public class UsuariosIniciais implements ApplicationRunner {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder senhas;
    private final String adminLogin;
    private final String adminSenha;

    public UsuariosIniciais(UsuarioRepository usuarios, PasswordEncoder senhas,
                            @Value("${ADMIN_LOGIN:}") String adminLogin, @Value("${ADMIN_SENHA:}") String adminSenha) {
        this.usuarios = usuarios;
        this.senhas = senhas;
        this.adminLogin = adminLogin;
        this.adminSenha = adminSenha;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarios.findByLogin(AuthController.LOGIN_DEMO).isEmpty()) {
            usuarios.save(new Usuario("Equipe (demonstração)", AuthController.LOGIN_DEMO, senhas.encode(UUID.randomUUID().toString())));
        }
        if (!adminLogin.isBlank() && adminSenha.length() >= 10) {
            usuarios.findByLogin(adminLogin).ifPresentOrElse(
                    u -> u.trocarSenha(senhas.encode(adminSenha)),
                    () -> usuarios.save(new Usuario("Administrador", adminLogin, senhas.encode(adminSenha))));
        }
    }
}
