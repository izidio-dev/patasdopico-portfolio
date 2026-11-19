package br.com.patasdopico.comum;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Página de resultados com formato estável para o frontend. */
public record Pagina<T>(List<T> itens, long total, int pagina, int totalPaginas) {
    public static <E, T> Pagina<T> de(Page<E> page, Function<E, T> conversor) {
        return new Pagina<>(page.getContent().stream().map(conversor).toList(), page.getTotalElements(), page.getNumber(), page.getTotalPages());
    }
}
