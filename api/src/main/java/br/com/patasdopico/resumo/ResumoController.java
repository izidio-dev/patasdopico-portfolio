package br.com.patasdopico.resumo;

import br.com.patasdopico.atendimento.Atendimento.Status;
import br.com.patasdopico.atendimento.AtendimentoDtos.AtendimentoResposta;
import br.com.patasdopico.atendimento.AtendimentoRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Resumo")
@SecurityRequirement(name = "token")
@RestController
public class ResumoController {

    public record Hoje(long agendados, long concluidos, long cancelados) {}

    public record Resumo(Hoje hoje, long faturamentoMesCentavos, List<AtendimentoResposta> proximos) {}

    private final AtendimentoRepository atendimentos;
    private final Clock relogio;

    public ResumoController(AtendimentoRepository atendimentos, Clock relogio) {
        this.atendimentos = atendimentos;
        this.relogio = relogio;
    }

    @Operation(summary = "Números do dia, faturamento do mês e próximos atendimentos")
    @GetMapping("/api/resumo")
    @Transactional(readOnly = true)
    public Resumo resumo() {
        LocalDate hoje = LocalDate.now(relogio);
        LocalDateTime inicio = hoje.atStartOfDay();
        LocalDateTime fim = hoje.plusDays(1).atStartOfDay().minusNanos(1);
        LocalDate primeiroDia = hoje.withDayOfMonth(1);
        return new Resumo(
                new Hoje(atendimentos.countByStatusAndDataHoraBetween(Status.AGENDADO, inicio, fim),
                        atendimentos.countByStatusAndDataHoraBetween(Status.CONCLUIDO, inicio, fim),
                        atendimentos.countByStatusAndDataHoraBetween(Status.CANCELADO, inicio, fim)),
                atendimentos.somarConcluidos(primeiroDia.atStartOfDay(), primeiroDia.plusMonths(1).atStartOfDay()),
                atendimentos.findByStatusAndDataHoraAfterOrderByDataHora(Status.AGENDADO, LocalDateTime.now(relogio), Limit.of(5))
                        .stream().map(AtendimentoResposta::de).toList());
    }
}
