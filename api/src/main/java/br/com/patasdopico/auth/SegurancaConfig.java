package br.com.patasdopico.auth;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

/**
 * Segurança da API:
 * - login devolve um token JWT (assinado com HS256 e o segredo da variável JWT_SEGREDO);
 * - toda rota /api exige o token, exceto login, demo, saúde e a documentação (Swagger);
 * - sem sessão no servidor (cada pedido traz o token);
 * - erro 401 sempre em JSON (ProblemDetail), nunca uma página HTML.
 */
@Configuration
public class SegurancaConfig {

    @Bean
    SecurityFilterChain filtros(HttpSecurity http, JsonMapper json) throws Exception {
        return http
                .csrf(c -> c.disable()) // sem cookies de sessão: CSRF não se aplica
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/api/saude", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Só o dono: dinheiro e equipe.
                        .requestMatchers("/api/financeiro/**", "/api/equipe/**").hasRole("DONO")
                        .requestMatchers(HttpMethod.PUT, "/api/servicos/**").hasRole("DONO")
                        // Área do cliente.
                        .requestMatchers("/api/cliente/**").hasRole("CLIENTE")
                        // Todos os logados: quem sou eu e tabela de serviços.
                        .requestMatchers("/api/eu", "/api/servicos").authenticated()
                        // O resto é do balcão (dono e funcionário).
                        .anyRequest().hasAnyRole("DONO", "FUNCIONARIO"))
                .exceptionHandling(e -> e.accessDeniedHandler((req, res, ex) ->
                        escreverProblema(res, json, HttpStatus.FORBIDDEN, "Sem permissão", "Você não tem permissão para acessar esta área.")))
                .oauth2ResourceServer(o -> o
                        .jwt(j -> j.jwtAuthenticationConverter(papeis()))
                        .authenticationEntryPoint((req, res, ex) ->
                                escreverProblema(res, json, HttpStatus.UNAUTHORIZED, "Não autenticado", "Faça login para continuar.")))
                .build();
    }

    /** O papel vem do token (claim "papel") e vira ROLE_DONO, ROLE_FUNCIONARIO ou ROLE_CLIENTE. */
    private static JwtAuthenticationConverter papeis() {
        JwtGrantedAuthoritiesConverter autoridades = new JwtGrantedAuthoritiesConverter();
        autoridades.setAuthoritiesClaimName("papel");
        autoridades.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter conversor = new JwtAuthenticationConverter();
        conversor.setJwtGrantedAuthoritiesConverter(autoridades);
        return conversor;
    }

    private static void escreverProblema(jakarta.servlet.http.HttpServletResponse res, JsonMapper json, HttpStatus status, String titulo, String detalhe)
            throws java.io.IOException {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, detalhe);
        p.setTitle(titulo);
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        res.getWriter().write(json.writeValueAsString(p));
    }

    @Bean
    SecretKey chave(@Value("${app.jwt.segredo}") String segredo) {
        if (segredo.length() < 32) throw new IllegalStateException("JWT_SEGREDO precisa ter pelo menos 32 caracteres");
        return new SecretKeySpec(segredo.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey chave) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(chave));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey chave) {
        return NimbusJwtDecoder.withSecretKey(chave).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    PasswordEncoder senhas() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    // O nome do método importa: o Spring Security procura o bean "corsConfigurationSource".
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.origens}") List<String> origens) {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(origens);
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/**", c);
        return fonte;
    }
}
