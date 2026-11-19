package br.com.patasdopico.tutor;

import br.com.patasdopico.comum.Pagina;
import br.com.patasdopico.tutor.TutorDtos.TutorDetalhe;
import br.com.patasdopico.tutor.TutorDtos.TutorPedido;
import br.com.patasdopico.tutor.TutorDtos.TutorResumo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Tutores")
@SecurityRequirement(name = "token")
@RestController
@RequestMapping("/api/tutores")
public class TutorController {

    private final TutorService servico;

    public TutorController(TutorService servico) {
        this.servico = servico;
    }

    @Operation(summary = "Lista tutores (busca por nome ou telefone)")
    @GetMapping
    public Pagina<TutorResumo> listar(@RequestParam(defaultValue = "") String busca,
                                      @RequestParam(defaultValue = "0") int pagina,
                                      @RequestParam(defaultValue = "20") int tamanho) {
        return servico.listar(busca, pagina, tamanho);
    }

    @Operation(summary = "Detalhes do tutor com os pets")
    @GetMapping("/{id}")
    public TutorDetalhe detalhar(@PathVariable Long id) {
        return servico.detalhar(id);
    }

    @Operation(summary = "Cadastra tutor")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TutorDetalhe criar(@Valid @RequestBody TutorPedido pedido) {
        return servico.criar(pedido);
    }

    @Operation(summary = "Atualiza tutor")
    @PutMapping("/{id}")
    public TutorDetalhe atualizar(@PathVariable Long id, @Valid @RequestBody TutorPedido pedido) {
        return servico.atualizar(id, pedido);
    }

    @Operation(summary = "Exporta todos os dados do tutor (LGPD)")
    @GetMapping("/{id}/exportacao")
    public TutorService.Exportacao exportar(@PathVariable Long id) {
        return servico.exportar(id);
    }

    @Operation(summary = "Exclui o tutor e os pets (LGPD); atendimentos viram registro anônimo")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        servico.excluir(id);
    }
}
