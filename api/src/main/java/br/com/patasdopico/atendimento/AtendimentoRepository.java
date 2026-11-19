package br.com.patasdopico.atendimento;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {

    @EntityGraph(attributePaths = {"pet", "pet.tutor"})
    List<Atendimento> findByDataHoraBetweenOrderByDataHora(LocalDateTime inicio, LocalDateTime fim);

    @EntityGraph(attributePaths = {"pet", "pet.tutor"})
    List<Atendimento> findByPetIdOrderByDataHoraDesc(Long petId);

    @EntityGraph(attributePaths = {"pet", "pet.tutor"})
    List<Atendimento> findByStatusAndDataHoraAfterOrderByDataHora(Atendimento.Status status, LocalDateTime depois, Limit limite);

    List<Atendimento> findByPetTutorId(Long tutorId);

    long countByStatusAndDataHoraBetween(Atendimento.Status status, LocalDateTime inicio, LocalDateTime fim);

    @Query("select coalesce(sum(a.valorCentavos), 0) from Atendimento a where a.status = 'CONCLUIDO' and a.dataHora >= ?1 and a.dataHora < ?2")
    long somarConcluidos(LocalDateTime inicio, LocalDateTime fim);
}
