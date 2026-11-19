package br.com.patasdopico.tutor;

import br.com.patasdopico.pet.Pet;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Dono(a) do pet. Dados pessoais mínimos: nome, telefone e e-mail opcional. */
@Entity
public class Tutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String telefone;
    private String email;
    private String observacoes;
    private LocalDateTime criadoEm = LocalDateTime.now();

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("nome")
    private List<Pet> pets = new ArrayList<>();

    protected Tutor() {}

    public Tutor(String nome, String telefone, String email, String observacoes) {
        atualizar(nome, telefone, email, observacoes);
    }

    public void atualizar(String nome, String telefone, String email, String observacoes) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
        this.observacoes = observacoes;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getTelefone() { return telefone; }
    public String getEmail() { return email; }
    public String getObservacoes() { return observacoes; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public List<Pet> getPets() { return pets; }
}
