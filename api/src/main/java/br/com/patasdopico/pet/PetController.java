package br.com.patasdopico.pet;

import br.com.patasdopico.comum.NaoEncontradoException;
import br.com.patasdopico.pet.PetDtos.PetPedido;
import br.com.patasdopico.pet.PetDtos.PetResposta;
import br.com.patasdopico.tutor.TutorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Pets")
@SecurityRequirement(name = "token")
@RestController
public class PetController {

    private final PetRepository pets;
    private final TutorRepository tutores;

    public PetController(PetRepository pets, TutorRepository tutores) {
        this.pets = pets;
        this.tutores = tutores;
    }

    private static String limpar(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Operation(summary = "Cadastra pet de um tutor")
    @PostMapping("/api/tutores/{tutorId}/pets")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PetResposta criar(@PathVariable Long tutorId, @Valid @RequestBody PetPedido p) {
        var tutor = tutores.findById(tutorId).orElseThrow(() -> new NaoEncontradoException("Tutor não encontrado."));
        Pet pet = new Pet(tutor);
        pet.atualizar(p.nome().trim(), p.especie(), limpar(p.raca()), p.porte(), p.nascimento(), limpar(p.observacoes()));
        tutor.getPets().add(pet);
        return PetResposta.de(pets.save(pet));
    }

    @Operation(summary = "Atualiza pet")
    @PutMapping("/api/pets/{id}")
    @Transactional
    public PetResposta atualizar(@PathVariable Long id, @Valid @RequestBody PetPedido p) {
        Pet pet = pets.findById(id).orElseThrow(() -> new NaoEncontradoException("Pet não encontrado."));
        pet.atualizar(p.nome().trim(), p.especie(), limpar(p.raca()), p.porte(), p.nascimento(), limpar(p.observacoes()));
        return PetResposta.de(pet);
    }

    @Operation(summary = "Exclui pet (atendimentos antigos ficam como registro, sem o pet)")
    @DeleteMapping("/api/pets/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void excluir(@PathVariable Long id) {
        Pet pet = pets.findById(id).orElseThrow(() -> new NaoEncontradoException("Pet não encontrado."));
        pet.getTutor().getPets().remove(pet);
    }
}
