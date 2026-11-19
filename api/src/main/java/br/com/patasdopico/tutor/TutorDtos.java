package br.com.patasdopico.tutor;

import br.com.patasdopico.pet.PetDtos.PetResposta;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/** Formatos de entrada e saída da API de tutores. */
public final class TutorDtos {

    private TutorDtos() {}

    public record TutorPedido(
            @NotBlank(message = "Informe o nome.") @Size(max = 100, message = "Use até 100 caracteres.") String nome,
            @NotBlank(message = "Informe o telefone.") String telefone,
            @Email(message = "E-mail inválido.") @Size(max = 120) String email,
            @Size(max = 500, message = "Use até 500 caracteres.") String observacoes) {}

    public record TutorResumo(Long id, String nome, String telefone, String email, int quantidadePets) {
        public static TutorResumo de(Tutor t) {
            return new TutorResumo(t.getId(), t.getNome(), t.getTelefone(), t.getEmail(), t.getPets().size());
        }
    }

    public record TutorDetalhe(Long id, String nome, String telefone, String email, String observacoes,
                               LocalDateTime criadoEm, List<PetResposta> pets) {
        public static TutorDetalhe de(Tutor t) {
            return new TutorDetalhe(t.getId(), t.getNome(), t.getTelefone(), t.getEmail(), t.getObservacoes(),
                    t.getCriadoEm(), t.getPets().stream().map(PetResposta::de).toList());
        }
    }
}
