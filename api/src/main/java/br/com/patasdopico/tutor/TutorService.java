package br.com.patasdopico.tutor;

import br.com.patasdopico.atendimento.AtendimentoDtos.AtendimentoResposta;
import br.com.patasdopico.atendimento.AtendimentoRepository;
import br.com.patasdopico.comum.CampoInvalidoException;
import br.com.patasdopico.comum.NaoEncontradoException;
import br.com.patasdopico.comum.Pagina;
import br.com.patasdopico.tutor.TutorDtos.TutorDetalhe;
import br.com.patasdopico.tutor.TutorDtos.TutorPedido;
import br.com.patasdopico.tutor.TutorDtos.TutorResumo;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TutorService {

    /** Tudo que o sistema guarda sobre o tutor (LGPD, art. 18, II — acesso aos dados). */
    public record Exportacao(LocalDateTime geradoEm, TutorDetalhe tutor, List<AtendimentoResposta> atendimentos) {}

    private final TutorRepository tutores;
    private final AtendimentoRepository atendimentos;
    private final Clock relogio;

    public TutorService(TutorRepository tutores, AtendimentoRepository atendimentos, Clock relogio) {
        this.tutores = tutores;
        this.atendimentos = atendimentos;
        this.relogio = relogio;
    }

    @Transactional(readOnly = true)
    public Exportacao exportar(Long id) {
        Tutor t = buscar(id);
        return new Exportacao(LocalDateTime.now(relogio), TutorDetalhe.de(t),
                atendimentos.findByPetTutorId(id).stream().map(AtendimentoResposta::de).toList());
    }

    /**
     * Exclusão a pedido do titular (LGPD, art. 18, VI): apaga tutor e pets. Os atendimentos
     * ficam como registro financeiro anônimo — sem pet, sem tutor e sem observações.
     */
    @Transactional
    public void excluir(Long id) {
        Tutor t = buscar(id);
        atendimentos.findByPetTutorId(id).forEach(a -> a.anonimizar());
        atendimentos.flush();
        tutores.delete(t);
    }

    /** "(11) 98765-4321" → "11987654321"; recusa o que não tiver 10 ou 11 dígitos. */
    static String normalizarTelefone(String telefone) {
        String digitos = telefone == null ? "" : telefone.replaceAll("\\D", "");
        if (digitos.length() != 10 && digitos.length() != 11)
            throw new CampoInvalidoException("telefone", "Telefone precisa ter DDD + número (10 ou 11 dígitos).");
        return digitos;
    }

    private static String vazioParaNulo(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Transactional(readOnly = true)
    public Pagina<TutorResumo> listar(String busca, int pagina, int tamanho) {
        String texto = busca == null ? "" : busca.trim();
        String digitos = texto.replaceAll("\\D", "");
        PageRequest p = PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 50));
        return Pagina.de(tutores.buscar(texto, digitos, p), TutorResumo::de);
    }

    @Transactional(readOnly = true)
    public TutorDetalhe detalhar(Long id) {
        return TutorDetalhe.de(buscar(id));
    }

    @Transactional
    public TutorDetalhe criar(TutorPedido p) {
        Tutor t = new Tutor(p.nome().trim(), normalizarTelefone(p.telefone()), vazioParaNulo(p.email()), vazioParaNulo(p.observacoes()));
        return TutorDetalhe.de(tutores.save(t));
    }

    @Transactional
    public TutorDetalhe atualizar(Long id, TutorPedido p) {
        Tutor t = buscar(id);
        t.atualizar(p.nome().trim(), normalizarTelefone(p.telefone()), vazioParaNulo(p.email()), vazioParaNulo(p.observacoes()));
        return TutorDetalhe.de(t);
    }

    Tutor buscar(Long id) {
        return tutores.findById(id).orElseThrow(() -> new NaoEncontradoException("Tutor não encontrado."));
    }
}
