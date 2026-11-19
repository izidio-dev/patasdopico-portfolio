package br.com.patasdopico.auth;

import br.com.patasdopico.tutor.Tutor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

/**
 * Quem entra no sistema. A senha é guardada só como hash BCrypt.
 * - DONO: acesso total (financeiro, equipe, preços).
 * - FUNCIONARIO: agenda, tutores, pets e serviços (sem financeiro).
 * - CLIENTE: só os próprios dados, pets e agendamentos (ligado a um tutor).
 */
@Entity
public class Usuario {

    public enum Papel { DONO, FUNCIONARIO, CLIENTE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(unique = true)
    private String login;

    private String senhaHash;

    @Enumerated(EnumType.STRING)
    private Papel papel;

    private boolean ativo = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;

    protected Usuario() {}

    public Usuario(String nome, String login, String senhaHash, Papel papel) {
        this.nome = nome;
        this.login = login;
        this.senhaHash = senhaHash;
        this.papel = papel;
    }

    /** Conta de cliente: o login é o e-mail e fica ligada à ficha de tutor. */
    public static Usuario cliente(Tutor tutor, String email, String senhaHash) {
        Usuario u = new Usuario(tutor.getNome(), email, senhaHash, Papel.CLIENTE);
        u.tutor = tutor;
        return u;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getLogin() { return login; }
    public String getSenhaHash() { return senhaHash; }
    public Papel getPapel() { return papel; }
    public boolean isAtivo() { return ativo; }
    public Tutor getTutor() { return tutor; }

    public void trocarSenha(String novoHash) { this.senhaHash = novoHash; }
    public void desativar() { this.ativo = false; }
    public void ativar() { this.ativo = true; }
    public void renomear(String nome) { this.nome = nome; }
}
