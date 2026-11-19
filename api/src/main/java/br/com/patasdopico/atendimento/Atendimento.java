package br.com.patasdopico.atendimento;

import br.com.patasdopico.comum.ConflitoException;
import br.com.patasdopico.pet.Pet;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;

/**
 * Serviço prestado a um pet. Quando o tutor é excluído (LGPD), o pet some e o
 * atendimento continua como registro financeiro anônimo (pet = null).
 */
@Entity
public class Atendimento {

    public enum Servico { BANHO, TOSA, BANHO_E_TOSA, VACINA, CONSULTA }

    public enum Status { AGENDADO, CONCLUIDO, CANCELADO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id")
    private Pet pet;

    @Enumerated(EnumType.STRING)
    private Servico servico;

    private LocalDateTime dataHora;
    private long valorCentavos;

    @Enumerated(EnumType.STRING)
    private Status status = Status.AGENDADO;

    private String observacoes;

    protected Atendimento() {}

    public Atendimento(Pet pet) {
        this.pet = pet;
    }

    public void atualizar(Servico servico, LocalDateTime dataHora, long valorCentavos, String observacoes) {
        if (status != Status.AGENDADO) throw new ConflitoException("Só é possível editar atendimentos agendados.");
        this.servico = servico;
        this.dataHora = dataHora;
        this.valorCentavos = valorCentavos;
        this.observacoes = observacoes;
    }

    /** Agendado pode virar concluído ou cancelado; depois disso o status fica fixo. */
    public void mudarStatus(Status novo) {
        if (novo == status) return;
        if (status == Status.CONCLUIDO) throw new ConflitoException("Atendimento concluído não pode mudar de status.");
        if (status == Status.CANCELADO) throw new ConflitoException("Atendimento cancelado não pode mudar de status.");
        if (novo == Status.AGENDADO) throw new ConflitoException("O atendimento já está agendado.");
        this.status = novo;
    }

    /** Remove o vínculo com o pet e as observações (podem conter dados pessoais). */
    public void anonimizar() {
        this.pet = null;
        this.observacoes = null;
    }

    public Long getId() { return id; }
    public Pet getPet() { return pet; }
    public Servico getServico() { return servico; }
    public LocalDateTime getDataHora() { return dataHora; }
    public long getValorCentavos() { return valorCentavos; }
    public Status getStatus() { return status; }
    public String getObservacoes() { return observacoes; }
}
