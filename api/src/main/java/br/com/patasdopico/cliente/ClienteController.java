package br.com.patasdopico.cliente;

import br.com.patasdopico.atendimento.Atendimento;
import br.com.patasdopico.atendimento.AtendimentoDtos.AtendimentoResposta;
import br.com.patasdopico.atendimento.AtendimentoRepository;
import br.com.patasdopico.auth.Usuario;
import br.com.patasdopico.auth.UsuarioRepository;
import br.com.patasdopico.comum.ConflitoException;
import br.com.patasdopico.comum.NaoAutorizadoException;
import br.com.patasdopico.comum.NaoEncontradoException;
import br.com.patasdopico.pet.Pet;
import br.com.patasdopico.pet.PetDtos.PetPedido;
import br.com.patasdopico.pet.PetDtos.PetResposta;
import br.com.patasdopico.pet.PetRepository;
import br.com.patasdopico.servico.ServicoPrecoRepository;
import br.com.patasdopico.tutor.Tutor;
import br.com.patasdopico.tutor.TutorDtos.TutorDetalhe;
import br.com.patasdopico.tutor.TutorRepository;
import br.com.patasdopico.tutor.TutorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Área do cliente. Tudo é filtrado pela ficha de tutor ligada à conta logada:
 * pet ou agendamento de outra pessoa responde 404 (não revela que existe).
 */
@Tag(name = "Área do cliente")
@SecurityRequirement(name = "token")
@RestController
@RequestMapping("/api/cliente")
public class ClienteController {

    /** Horários de atendimento: 09:00 às 17:30, a cada 30 minutos. */
    static final LocalTime ABRE = LocalTime.of(9, 0);
    static final LocalTime ULTIMO_HORARIO = LocalTime.of(17, 30);

    public record PerfilPedido(@NotBlank(message = "Informe seu nome.") @Size(max = 100) String nome,
                               @NotBlank(message = "Informe seu telefone.") String telefone) {}

    public record AgendamentoPedido(@NotNull(message = "Escolha o pet.") Long petId,
                                    @NotNull(message = "Escolha o serviço.") Atendimento.Servico servico,
                                    @NotNull(message = "Escolha data e horário.") LocalDateTime dataHora,
                                    @Size(max = 500) String observacoes) {}

    private final UsuarioRepository usuarios;
    private final TutorRepository tutores;
    private final TutorService tutorService;
    private final PetRepository pets;
    private final AtendimentoRepository atendimentos;
    private final ServicoPrecoRepository precos;
    private final Clock relogio;

    public ClienteController(UsuarioRepository usuarios, TutorRepository tutores, TutorService tutorService, PetRepository pets,
                             AtendimentoRepository atendimentos, ServicoPrecoRepository precos, Clock relogio) {
        this.usuarios = usuarios;
        this.tutores = tutores;
        this.tutorService = tutorService;
        this.pets = pets;
        this.atendimentos = atendimentos;
        this.precos = precos;
        this.relogio = relogio;
    }

    /** Conta logada (vem do token) e a ficha de tutor ligada a ela. */
    private Usuario conta(Jwt jwt) {
        return usuarios.findByLogin(jwt.getSubject())
                .filter(u -> u.getTutor() != null)
                .orElseThrow(() -> new NaoAutorizadoException("Conta não encontrada. Entre de novo."));
    }

    private Tutor tutor(Jwt jwt) {
        return conta(jwt).getTutor();
    }

    private Pet meuPet(Jwt jwt, Long petId) {
        Long tutorId = tutor(jwt).getId();
        return pets.findById(petId).filter(p -> p.getTutor().getId().equals(tutorId))
                .orElseThrow(() -> new NaoEncontradoException("Pet não encontrado."));
    }

    private static String limpar(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Operation(summary = "Meus dados e meus pets")
    @GetMapping("/perfil")
    @Transactional(readOnly = true)
    public TutorDetalhe perfil(@AuthenticationPrincipal Jwt jwt) {
        return TutorDetalhe.de(tutor(jwt));
    }

    @Operation(summary = "Atualiza nome e telefone")
    @PutMapping("/perfil")
    @Transactional
    public TutorDetalhe atualizarPerfil(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PerfilPedido p) {
        Tutor t = tutor(jwt);
        t.atualizar(p.nome().trim(), TutorService.normalizarTelefone(p.telefone()), t.getEmail(), t.getObservacoes());
        conta(jwt).renomear(t.getNome());
        return TutorDetalhe.de(t);
    }

    @Operation(summary = "Cadastra um pet meu")
    @PostMapping("/pets")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PetResposta criarPet(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PetPedido p) {
        Tutor t = tutor(jwt);
        Pet pet = new Pet(t);
        pet.atualizar(p.nome().trim(), p.especie(), limpar(p.raca()), p.porte(), p.nascimento(), limpar(p.observacoes()));
        t.getPets().add(pet);
        return PetResposta.de(pets.save(pet));
    }

    @Operation(summary = "Atualiza um pet meu")
    @PutMapping("/pets/{id}")
    @Transactional
    public PetResposta atualizarPet(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody PetPedido p) {
        Pet pet = meuPet(jwt, id);
        pet.atualizar(p.nome().trim(), p.especie(), limpar(p.raca()), p.porte(), p.nascimento(), limpar(p.observacoes()));
        return PetResposta.de(pet);
    }

    @Operation(summary = "Horários livres de um dia")
    @GetMapping("/horarios")
    @Transactional(readOnly = true)
    public List<String> horarios(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        Set<LocalTime> ocupados = atendimentos
                .findByDataHoraBetweenAndStatusNot(data.atStartOfDay(), data.plusDays(1).atStartOfDay().minusNanos(1), Atendimento.Status.CANCELADO)
                .stream().map(a -> a.getDataHora().toLocalTime()).collect(Collectors.toSet());
        LocalDateTime agora = LocalDateTime.now(relogio);
        List<String> livres = new ArrayList<>();
        for (LocalTime h = ABRE; !h.isAfter(ULTIMO_HORARIO); h = h.plusMinutes(30)) {
            if (!ocupados.contains(h) && data.atTime(h).isAfter(agora)) livres.add(h.toString());
        }
        return livres;
    }

    @Operation(summary = "Meus agendamentos")
    @GetMapping("/agendamentos")
    @Transactional(readOnly = true)
    public List<AtendimentoResposta> meusAgendamentos(@AuthenticationPrincipal Jwt jwt) {
        return atendimentos.findByPetTutorIdOrderByDataHoraDesc(tutor(jwt).getId()).stream().map(AtendimentoResposta::de).toList();
    }

    @Operation(summary = "Pede um agendamento (a equipe confirma)")
    @PostMapping("/agendamentos")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public AtendimentoResposta agendar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AgendamentoPedido p) {
        Pet pet = meuPet(jwt, p.petId());
        LocalDateTime quando = p.dataHora().withSecond(0).withNano(0);
        LocalTime hora = quando.toLocalTime();
        if (!quando.isAfter(LocalDateTime.now(relogio))) throw new ConflitoException("Escolha um horário a partir de agora.");
        if (hora.isBefore(ABRE) || hora.isAfter(ULTIMO_HORARIO) || hora.getMinute() % 30 != 0)
            throw new ConflitoException("Atendemos das 09:00 às 17:30, a cada 30 minutos.");
        if (atendimentos.existsByDataHoraAndStatusNot(quando, Atendimento.Status.CANCELADO))
            throw new ConflitoException("Esse horário não está mais disponível. Escolha outro.");
        long preco = precos.findById(p.servico()).map(x -> x.getPrecoCentavos()).orElse(0L);
        Atendimento a = new Atendimento(pet);
        a.atualizar(p.servico(), quando, preco, limpar(p.observacoes()));
        a.solicitar();
        return AtendimentoResposta.de(atendimentos.save(a));
    }

    @Operation(summary = "Cancela um agendamento meu que ainda não aconteceu")
    @PatchMapping("/agendamentos/{id}/cancelar")
    @Transactional
    public AtendimentoResposta cancelar(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        Long tutorId = tutor(jwt).getId();
        Atendimento a = atendimentos.findById(id)
                .filter(x -> x.getPet() != null && x.getPet().getTutor().getId().equals(tutorId))
                .orElseThrow(() -> new NaoEncontradoException("Agendamento não encontrado."));
        if (!a.getDataHora().isAfter(LocalDateTime.now(relogio))) throw new ConflitoException("Esse horário já passou.");
        a.mudarStatus(Atendimento.Status.CANCELADO);
        return AtendimentoResposta.de(a);
    }

    @Operation(summary = "Baixa todos os meus dados (LGPD)")
    @GetMapping("/exportacao")
    public TutorService.Exportacao exportar(@AuthenticationPrincipal Jwt jwt) {
        return tutorService.exportar(tutor(jwt).getId());
    }

    @Operation(summary = "Exclui minha conta, meus pets e meus dados (LGPD)")
    @DeleteMapping("/conta")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void excluirConta(@AuthenticationPrincipal Jwt jwt) {
        Usuario u = conta(jwt);
        Long tutorId = u.getTutor().getId();
        usuarios.delete(u);
        usuarios.flush();
        tutorService.excluir(tutorId);
    }
}
