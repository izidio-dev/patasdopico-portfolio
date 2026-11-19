package br.com.patasdopico.servico;

import br.com.patasdopico.atendimento.Atendimento.Servico;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

/** Preço e duração de cada serviço. Só o dono altera. */
@Entity
public class ServicoPreco {

    @Id
    @Enumerated(EnumType.STRING)
    private Servico servico;

    private long precoCentavos;
    private int duracaoMin;

    protected ServicoPreco() {}

    public Servico getServico() { return servico; }
    public long getPrecoCentavos() { return precoCentavos; }
    public int getDuracaoMin() { return duracaoMin; }

    public void alterar(long precoCentavos, int duracaoMin) {
        this.precoCentavos = precoCentavos;
        this.duracaoMin = duracaoMin;
    }
}
