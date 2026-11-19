package br.com.patasdopico.atendimento;

import br.com.patasdopico.atendimento.AtendimentoDtos.AtendimentoPedido;
import br.com.patasdopico.atendimento.AtendimentoDtos.AtendimentoResposta;
import br.com.patasdopico.atendimento.AtendimentoDtos.MudancaStatus;
import br.com.patasdopico.comum.NaoEncontradoException;
import br.com.patasdopico.financeiro.Lancamento;
import br.com.patasdopico.financeiro.LancamentoRepository;
import br.com.patasdopico.pet.PetRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Atendimentos")
@SecurityRequirement(name = "token")
@RestController
public class AtendimentoController {

    private final AtendimentoRepository atendimentos;
    private final PetRepository pets;
    private final LancamentoRepository lancamentos;

    public AtendimentoController(AtendimentoRepository atendimentos, PetRepository pets, LancamentoRepository lancamentos) {
        this.atendimentos = atendimentos;
        this.pets = pets;
        this.lancamentos = lancamentos;
    }

    private static String limpar(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Operation(summary = "Agenda do dia")
    @GetMapping("/api/atendimentos")
    @Transactional(readOnly = true)
    public List<AtendimentoResposta> doDia(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return atendimentos.findByDataHoraBetweenOrderByDataHora(data.atStartOfDay(), data.plusDays(1).atStartOfDay().minusNanos(1))
                .stream().map(AtendimentoResposta::de).toList();
    }

    @Operation(summary = "Histórico de atendimentos de um pet")
    @GetMapping("/api/pets/{petId}/atendimentos")
    @Transactional(readOnly = true)
    public List<AtendimentoResposta> doPet(@PathVariable Long petId) {
        return atendimentos.findByPetIdOrderByDataHoraDesc(petId).stream().map(AtendimentoResposta::de).toList();
    }

    @Operation(summary = "Agenda um atendimento")
    @PostMapping("/api/atendimentos")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AtendimentoResposta criar(@Valid @RequestBody AtendimentoPedido p) {
        var pet = pets.findById(p.petId()).orElseThrow(() -> new NaoEncontradoException("Pet não encontrado."));
        Atendimento a = new Atendimento(pet);
        a.atualizar(p.servico(), p.dataHora(), p.valorCentavos(), limpar(p.observacoes()));
        return AtendimentoResposta.de(atendimentos.save(a));
    }

    @Operation(summary = "Edita um atendimento agendado")
    @PutMapping("/api/atendimentos/{id}")
    @Transactional
    public AtendimentoResposta atualizar(@PathVariable Long id, @Valid @RequestBody AtendimentoPedido p) {
        Atendimento a = buscar(id);
        a.atualizar(p.servico(), p.dataHora(), p.valorCentavos(), limpar(p.observacoes()));
        return AtendimentoResposta.de(a);
    }

    @Operation(summary = "Conclui ou cancela um atendimento")
    @PatchMapping("/api/atendimentos/{id}/status")
    @Transactional
    public AtendimentoResposta mudarStatus(@PathVariable Long id, @Valid @RequestBody MudancaStatus m) {
        Atendimento a = buscar(id);
        a.mudarStatus(m.status());
        // Atendimento concluído vira entrada no financeiro (uma vez só, sem dados pessoais).
        if (a.getStatus() == Atendimento.Status.CONCLUIDO && a.getValorCentavos() > 0 && !lancamentos.existsByAtendimentoId(a.getId())) {
            lancamentos.save(new Lancamento(Lancamento.Tipo.ENTRADA, "Serviços", a.getServico().name(), a.getValorCentavos(),
                    a.getDataHora().toLocalDate(), a.getId()));
        }
        return AtendimentoResposta.de(a);
    }

    private Atendimento buscar(Long id) {
        return atendimentos.findById(id).orElseThrow(() -> new NaoEncontradoException("Atendimento não encontrado."));
    }
}
