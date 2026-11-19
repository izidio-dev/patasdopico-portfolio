package br.com.patasdopico.tutor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TutorRepository extends JpaRepository<Tutor, Long> {

    /** Busca por nome (sem diferenciar acento nem maiúscula) ou por parte do telefone. */
    @Query(value = """
            SELECT * FROM tutor
            WHERE unaccent(lower(nome)) LIKE unaccent(lower(concat('%', :texto, '%')))
               OR (:digitos <> '' AND telefone LIKE concat('%', :digitos, '%'))
            ORDER BY nome
            """,
            countQuery = """
            SELECT count(*) FROM tutor
            WHERE unaccent(lower(nome)) LIKE unaccent(lower(concat('%', :texto, '%')))
               OR (:digitos <> '' AND telefone LIKE concat('%', :digitos, '%'))
            """,
            nativeQuery = true)
    Page<Tutor> buscar(@Param("texto") String texto, @Param("digitos") String digitos, Pageable pagina);
}
