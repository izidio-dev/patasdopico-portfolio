package br.com.patasdopico.atendimento;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class AtendimentoDtos {

    private AtendimentoDtos() {}

    public record AtendimentoPedido(
            @NotNull(message = "Escolha o pet.") Long petId,
            @NotNull(message = "Escolha o serviço.") Atendimento.Servico servico,
            @NotNull(message = "Informe data e hora.") LocalDateTime dataHora,
            @NotNull(message = "Informe o valor.") @PositiveOrZero(message = "O valor não pode ser negativo.") Long valorCentavos,
            @Size(max = 500) String observacoes) {}

    public record MudancaStatus(@NotNull(message = "Informe o status.") Atendimento.Status status) {}

    /** Atendimento com os nomes de pet e tutor para a agenda. Nomes nulos = registro anonimizado. */
    public record AtendimentoResposta(Long id, Long petId, String petNome, Long tutorId, String tutorNome, String tutorTelefone,
                                      Atendimento.Servico servico, LocalDateTime dataHora, long valorCentavos,
                                      Atendimento.Status status, String observacoes) {
        public static AtendimentoResposta de(Atendimento a) {
            var pet = a.getPet();
            var tutor = pet == null ? null : pet.getTutor();
            return new AtendimentoResposta(a.getId(), pet == null ? null : pet.getId(), pet == null ? null : pet.getNome(),
                    tutor == null ? null : tutor.getId(), tutor == null ? null : tutor.getNome(), tutor == null ? null : tutor.getTelefone(),
                    a.getServico(), a.getDataHora(), a.getValorCentavos(), a.getStatus(), a.getObservacoes());
        }
    }
}
