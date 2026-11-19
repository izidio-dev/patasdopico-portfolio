package br.com.patasdopico.pet;

import br.com.patasdopico.tutor.Tutor;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDate;

@Entity
public class Pet {

    public enum Especie { CAO, GATO, OUTRO }

    public enum Porte { PEQUENO, MEDIO, GRANDE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;

    private String nome;

    @Enumerated(EnumType.STRING)
    private Especie especie;

    private String raca;

    @Enumerated(EnumType.STRING)
    private Porte porte;

    private LocalDate nascimento;
    private String observacoes;

    protected Pet() {}

    public Pet(Tutor tutor) {
        this.tutor = tutor;
    }

    public void atualizar(String nome, Especie especie, String raca, Porte porte, LocalDate nascimento, String observacoes) {
        this.nome = nome;
        this.especie = especie;
        this.raca = raca;
        this.porte = porte;
        this.nascimento = nascimento;
        this.observacoes = observacoes;
    }

    public Long getId() { return id; }
    public Tutor getTutor() { return tutor; }
    public String getNome() { return nome; }
    public Especie getEspecie() { return especie; }
    public String getRaca() { return raca; }
    public Porte getPorte() { return porte; }
    public LocalDate getNascimento() { return nascimento; }
    public String getObservacoes() { return observacoes; }
}
