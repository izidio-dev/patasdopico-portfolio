package br.com.patasdopico.comum;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Documentação interativa em /swagger-ui.html (botão "Authorize" aceita o token do login). */
@Configuration
public class DocumentacaoConfig {

    @Bean
    OpenAPI documentacao() {
        return new OpenAPI()
                .info(new Info()
                        .title("Patas do Pico — API")
                        .version("1.0.0")
                        .description("""
                                API do sistema de pet shop (projeto de portfólio, dados fictícios).
                                Para testar: chame POST /api/auth/demo, copie o token e clique em "Authorize"."""))
                .components(new Components().addSecuritySchemes("token",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
