package br.com.patasdopico.financeiro;

import br.com.patasdopico.comum.ConflitoException;
import br.com.patasdopico.comum.NaoEncontradoException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Financeiro da loja: só o dono acessa (regra em SegurancaConfig). */
@Tag(name = "Financeiro")
@SecurityRequirement(name = "token")
@RestController
@RequestMapping("/api/financeiro")
public class FinanceiroController {

    public record LancamentoPedido(@NotNull(message = "Escolha entrada ou saída.") Lancamento.Tipo tipo,
                                   @NotBlank(message = "Informe a categoria.") @Size(max = 40) String categoria,
                                   @Size(max = 200) String descricao,
                                   @NotNull(message = "Informe o valor.") @Positive(message = "O valor precisa ser maior que zero.") Long valorCentavos,
                                   @NotNull(message = "Informe a data.") LocalDate data) {}

    public record LancamentoResposta(Long id, Lancamento.Tipo tipo, String categoria, String descricao, long valorCentavos,
                                     LocalDate data, Long atendimentoId, boolean automatico) {
        static LancamentoResposta de(Lancamento l) {
            return new LancamentoResposta(l.getId(), l.getTipo(), l.getCategoria(), l.getDescricao(), l.getValorCentavos(), l.getData(),
                    l.getAtendimentoId(), l.getAtendimentoId() != null);
        }
    }

    public record Categoria(Lancamento.Tipo tipo, String categoria, long totalCentavos) {}

    public record Mes(String mes, long entradasCentavos, long saidasCentavos) {}

    public record Resumo(String mes, long entradasCentavos, long saidasCentavos, long saldoCentavos, List<Categoria> porCategoria, List<Mes> ultimosMeses) {}

    private final LancamentoRepository lancamentos;
    private final Clock relogio;

    public FinanceiroController(LancamentoRepository lancamentos, Clock relogio) {
        this.lancamentos = lancamentos;
        this.relogio = relogio;
    }

    private YearMonth mesOuAtual(String mes) {
        return mes == null || mes.isBlank() ? YearMonth.now(relogio) : YearMonth.parse(mes);
    }

    private List<Lancamento> doMes(YearMonth m) {
        return lancamentos.findByDataBetweenOrderByDataDescIdDesc(m.atDay(1), m.atEndOfMonth());
    }

    private static long soma(List<Lancamento> l, Lancamento.Tipo tipo) {
        return l.stream().filter(x -> x.getTipo() == tipo).mapToLong(Lancamento::getValorCentavos).sum();
    }

    @Operation(summary = "Entradas, saídas e saldo do mês, por categoria e últimos 6 meses")
    @GetMapping("/resumo")
    @Transactional(readOnly = true)
    public Resumo resumo(@RequestParam(required = false) String mes) {
        YearMonth m = mesOuAtual(mes);
        List<Lancamento> lista = doMes(m);
        long entradas = soma(lista, Lancamento.Tipo.ENTRADA);
        long saidas = soma(lista, Lancamento.Tipo.SAIDA);
        Map<String, List<Lancamento>> grupos = lista.stream().collect(Collectors.groupingBy(l -> l.getTipo() + "|" + l.getCategoria()));
        List<Categoria> categorias = grupos.values().stream()
                .map(g -> new Categoria(g.get(0).getTipo(), g.get(0).getCategoria(), g.stream().mapToLong(Lancamento::getValorCentavos).sum()))
                .sorted(Comparator.comparing(Categoria::tipo).thenComparing(Comparator.comparingLong(Categoria::totalCentavos).reversed()))
                .toList();
        List<Mes> meses = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth x = m.minusMonths(i);
            List<Lancamento> lx = doMes(x);
            meses.add(new Mes(x.toString(), soma(lx, Lancamento.Tipo.ENTRADA), soma(lx, Lancamento.Tipo.SAIDA)));
        }
        return new Resumo(m.toString(), entradas, saidas, entradas - saidas, categorias, meses);
    }

    @Operation(summary = "Lançamentos do mês")
    @GetMapping("/lancamentos")
    @Transactional(readOnly = true)
    public List<LancamentoResposta> listar(@RequestParam(required = false) String mes) {
        return doMes(mesOuAtual(mes)).stream().map(LancamentoResposta::de).toList();
    }

    @Operation(summary = "Lança uma entrada ou saída")
    @PostMapping("/lancamentos")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public LancamentoResposta criar(@Valid @RequestBody LancamentoPedido p) {
        String descricao = p.descricao() == null || p.descricao().isBlank() ? null : p.descricao().trim();
        return LancamentoResposta.de(lancamentos.save(new Lancamento(p.tipo(), p.categoria().trim(), descricao, p.valorCentavos(), p.data(), null)));
    }

    @Operation(summary = "Apaga um lançamento feito à mão")
    @DeleteMapping("/lancamentos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void apagar(@PathVariable Long id) {
        Lancamento l = lancamentos.findById(id).orElseThrow(() -> new NaoEncontradoException("Lançamento não encontrado."));
        if (l.getAtendimentoId() != null) throw new ConflitoException("Entradas de atendimentos não podem ser apagadas aqui.");
        lancamentos.delete(l);
    }
}
