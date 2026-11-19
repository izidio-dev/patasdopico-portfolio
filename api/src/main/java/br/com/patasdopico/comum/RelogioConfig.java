package br.com.patasdopico.comum;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Relógio no fuso de São Paulo: "hoje" e "este mês" seguem o horário da loja, não o do servidor. */
@Configuration
public class RelogioConfig {
    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    @Bean
    Clock relogio() {
        return Clock.system(FUSO);
    }
}
