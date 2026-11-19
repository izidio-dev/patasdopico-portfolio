package br.com.patasdopico.demo;

import br.com.patasdopico.atendimento.Atendimento;
import br.com.patasdopico.atendimento.Atendimento.Servico;
import br.com.patasdopico.atendimento.Atendimento.Status;
import br.com.patasdopico.atendimento.AtendimentoRepository;
import br.com.patasdopico.pet.Pet;
import br.com.patasdopico.pet.Pet.Especie;
import br.com.patasdopico.pet.Pet.Porte;
import br.com.patasdopico.tutor.Tutor;
import br.com.patasdopico.tutor.TutorRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Demo pública: com DEMO_RESET=true, apaga tudo e recria dados fictícios a cada
 * inicialização. O Render gratuito reinicia sozinho depois de 15 min parado, então
 * a demo "se arruma" se alguém bagunçar. Nomes e telefones são inventados.
 */
@Component
@Order(2)
public class DadosDemonstracao implements ApplicationRunner {

    private static final Map<Servico, Long> PRECOS = Map.of(
            Servico.BANHO, 6000L, Servico.TOSA, 7000L, Servico.BANHO_E_TOSA, 11000L, Servico.VACINA, 9000L, Servico.CONSULTA, 15000L);

    private record PetFicticio(String nome, Especie especie, String raca, Porte porte, int anos, String obs) {}

    private record TutorFicticio(String nome, String telefone, String email, List<PetFicticio> pets) {}

    private static final List<TutorFicticio> TUTORES = List.of(
            new TutorFicticio("Ana Beatriz Carvalho", "11900000001", "ana.demo@exemplo.com", List.of(
                    new PetFicticio("Paçoca", Especie.CAO, "Vira-lata caramelo", Porte.MEDIO, 4, "Tem medo de secador."))),
            new TutorFicticio("Bruno Henrique Lopes", "11900000002", null, List.of(
                    new PetFicticio("Mel", Especie.CAO, "Shih-tzu", Porte.PEQUENO, 6, null),
                    new PetFicticio("Fubá", Especie.CAO, "Shih-tzu", Porte.PEQUENO, 2, null))),
            new TutorFicticio("Camila Nogueira", "11900000003", "camila.demo@exemplo.com", List.of(
                    new PetFicticio("Luna", Especie.GATO, "Siamês", Porte.PEQUENO, 3, "Alérgica a shampoo com perfume."))),
            new TutorFicticio("Diego Martins", "11900000004", null, List.of(
                    new PetFicticio("Thor", Especie.CAO, "Golden Retriever", Porte.GRANDE, 5, null))),
            new TutorFicticio("Eduarda Siqueira", "11900000005", null, List.of(
                    new PetFicticio("Pipoca", Especie.CAO, "Poodle", Porte.PEQUENO, 8, "Idoso: banho mais curto."),
                    new PetFicticio("Nina", Especie.GATO, "SRD", Porte.PEQUENO, 1, null))),
            new TutorFicticio("Felipe Andrade", "11900000006", "felipe.demo@exemplo.com", List.of(
                    new PetFicticio("Bob", Especie.CAO, "Bulldog francês", Porte.MEDIO, 2, "Respiração curta: evitar calor."))),
            new TutorFicticio("Gabriela Rocha", "11900000007", null, List.of(
                    new PetFicticio("Amora", Especie.CAO, "Spitz alemão", Porte.PEQUENO, 3, null))),
            new TutorFicticio("Henrique Takahashi", "11900000008", null, List.of(
                    new PetFicticio("Sushi", Especie.GATO, "Persa", Porte.PEQUENO, 7, null))),
            new TutorFicticio("Isabela Freitas", "11900000009", "isabela.demo@exemplo.com", List.of(
                    new PetFicticio("Zeca", Especie.OUTRO, "Calopsita", Porte.PEQUENO, 2, "Só consulta."))),
            new TutorFicticio("João Pedro Almeida", "11900000010", null, List.of(
                    new PetFicticio("Rex", Especie.CAO, "Pastor alemão", Porte.GRANDE, 6, null),
                    new PetFicticio("Café", Especie.CAO, "Dachshund", Porte.PEQUENO, 4, null))));

    private final boolean reset;
    private final TutorRepository tutores;
    private final AtendimentoRepository atendimentos;
    private final Clock relogio;

    public DadosDemonstracao(@Value("${app.demo.reset}") boolean reset, TutorRepository tutores,
                             AtendimentoRepository atendimentos, Clock relogio) {
        this.reset = reset;
        this.tutores = tutores;
        this.atendimentos = atendimentos;
        this.relogio = relogio;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!reset) return;
        atendimentos.deleteAllInBatch();
        tutores.deleteAll();

        LocalDate hoje = LocalDate.now(relogio);
        List<Pet> pets = new ArrayList<>();
        for (TutorFicticio tf : TUTORES) {
            Tutor t = new Tutor(tf.nome(), tf.telefone(), tf.email(), null);
            for (PetFicticio pf : tf.pets()) {
                Pet p = new Pet(t);
                p.atualizar(pf.nome(), pf.especie(), pf.raca(), pf.porte(), hoje.minusYears(pf.anos()).withDayOfMonth(1), pf.obs());
                t.getPets().add(p);
                pets.add(p);
            }
            tutores.save(t);
        }

        // Semente fixa: a demo fica igual a cada reinício.
        Random r = new Random(42);
        Servico[] servicos = Servico.values();
        // Últimos 20 dias: atendimentos concluídos (alguns cancelados) → faturamento do mês.
        for (int dia = 20; dia >= 1; dia--) {
            for (int i = 0; i < 2 + r.nextInt(3); i++) {
                Servico s = servicos[r.nextInt(servicos.length)];
                Atendimento a = new Atendimento(pets.get(r.nextInt(pets.size())));
                a.atualizar(s, hoje.minusDays(dia).atTime(9 + r.nextInt(8), r.nextBoolean() ? 0 : 30), PRECOS.get(s), null);
                a.mudarStatus(r.nextInt(10) == 0 ? Status.CANCELADO : Status.CONCLUIDO);
                atendimentos.save(a);
            }
        }
        // Hoje: manhã concluída, tarde agendada.
        int[][] hojeHorarios = {{9, 0}, {10, 30}, {13, 0}, {14, 30}, {16, 0}};
        for (int i = 0; i < hojeHorarios.length; i++) {
            Servico s = servicos[i % servicos.length];
            Atendimento a = new Atendimento(pets.get(i * 2 % pets.size()));
            a.atualizar(s, hoje.atTime(hojeHorarios[i][0], hojeHorarios[i][1]), PRECOS.get(s), i == 2 ? "Cliente pediu laço rosa." : null);
            if (i < 2) a.mudarStatus(Status.CONCLUIDO);
            atendimentos.save(a);
        }
        // Próximos 5 dias: agenda.
        for (int dia = 1; dia <= 5; dia++) {
            for (int i = 0; i < 2; i++) {
                Servico s = servicos[r.nextInt(servicos.length)];
                Atendimento a = new Atendimento(pets.get(r.nextInt(pets.size())));
                a.atualizar(s, hoje.plusDays(dia).atTime(9 + r.nextInt(8), 0), PRECOS.get(s), null);
                atendimentos.save(a);
            }
        }
    }
}
