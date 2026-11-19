package br.com.patasdopico.pet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class PetDtos {

    private PetDtos() {}

    public record PetPedido(
            @NotBlank(message = "Informe o nome do pet.") @Size(max = 60) String nome,
            @NotNull(message = "Escolha a espécie.") Pet.Especie especie,
            @Size(max = 60) String raca,
            @NotNull(message = "Escolha o porte.") Pet.Porte porte,
            @PastOrPresent(message = "A data de nascimento não pode estar no futuro.") LocalDate nascimento,
            @Size(max = 500) String observacoes) {}

    public record PetResposta(Long id, Long tutorId, String nome, Pet.Especie especie, String raca, Pet.Porte porte,
                              LocalDate nascimento, String observacoes) {
        public static PetResposta de(Pet p) {
            return new PetResposta(p.getId(), p.getTutor().getId(), p.getNome(), p.getEspecie(), p.getRaca(), p.getPorte(),
                    p.getNascimento(), p.getObservacoes());
        }
    }
}
