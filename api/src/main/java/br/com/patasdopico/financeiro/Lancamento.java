package br.com.patasdopico.financeiro;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;

/**
 * Movimento de dinheiro da loja. Entradas de atendimentos concluídos são criadas
 * automaticamente (atendimentoId preenchido); o resto o dono lança à mão.
 * Não guarda dados pessoais de clientes.
 */
@Entity
public class Lancamento {

    public enum Tipo { ENTRADA, SAIDA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Tipo tipo;

    private String categoria;
    private String descricao;
    private long valorCentavos;
    private LocalDate data;
    private Long atendimentoId;

    protected Lancamento() {}

    public Lancamento(Tipo tipo, String categoria, String descricao, long valorCentavos, LocalDate data, Long atendimentoId) {
        this.tipo = tipo;
        this.categoria = categoria;
        this.descricao = descricao;
        this.valorCentavos = valorCentavos;
        this.data = data;
        this.atendimentoId = atendimentoId;
    }

    public Long getId() { return id; }
    public Tipo getTipo() { return tipo; }
    public String getCategoria() { return categoria; }
    public String getDescricao() { return descricao; }
    public long getValorCentavos() { return valorCentavos; }
    public LocalDate getData() { return data; }
    public Long getAtendimentoId() { return atendimentoId; }
}
