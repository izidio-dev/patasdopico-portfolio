package br.com.patasdopico.servico;

import br.com.patasdopico.atendimento.Atendimento.Servico;
import br.com.patasdopico.comum.NaoEncontradoException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.Comparator;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Tabela de serviços: todos os logados veem; só o dono altera (regra em SegurancaConfig). */
@Tag(name = "Serviços")
@SecurityRequirement(name = "token")
@RestController
public class ServicoController {

    public record ServicoResposta(Servico servico, long precoCentavos, int duracaoMin) {
        static ServicoResposta de(ServicoPreco s) {
            return new ServicoResposta(s.getServico(), s.getPrecoCentavos(), s.getDuracaoMin());
        }
    }

    public record ServicoPedido(@NotNull(message = "Informe o preço.") @PositiveOrZero(message = "O preço não pode ser negativo.") Long precoCentavos,
                                @NotNull(message = "Informe a duração.") @Min(value = 15, message = "Mínimo de 15 minutos.") @Max(value = 480, message = "Máximo de 8 horas.") Integer duracaoMin) {}

    private final ServicoPrecoRepository servicos;

    public ServicoController(ServicoPrecoRepository servicos) {
        this.servicos = servicos;
    }

    @Operation(summary = "Lista serviços com preço e duração")
    @GetMapping("/api/servicos")
    public List<ServicoResposta> listar() {
        return servicos.findAll().stream().sorted(Comparator.comparing(ServicoPreco::getServico)).map(ServicoResposta::de).toList();
    }

    @Operation(summary = "Altera preço e duração (só o dono)")
    @PutMapping("/api/servicos/{servico}")
    @Transactional
    public ServicoResposta alterar(@PathVariable Servico servico, @Valid @RequestBody ServicoPedido p) {
        ServicoPreco s = servicos.findById(servico).orElseThrow(() -> new NaoEncontradoException("Serviço não encontrado."));
        s.alterar(p.precoCentavos(), p.duracaoMin());
        return ServicoResposta.de(s);
    }
}
