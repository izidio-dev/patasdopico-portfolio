package br.com.patasdopico;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.SpringApplication;

/**
 * Roda a API no computador sem instalar PostgreSQL: sobe um banco embutido,
 * liga os dados de demonstração e libera a tela em localhost:5173 e :4177.
 * Uso: mvn -q exec:java -Dexec.mainClass=br.com.patasdopico.RodarLocal -Dexec.classpathScope=test
 */
public class RodarLocal {
    public static void main(String[] args) throws Exception {
        EmbeddedPostgres banco = EmbeddedPostgres.start();
        System.setProperty("spring.datasource.url", banco.getJdbcUrl("postgres", "postgres"));
        System.setProperty("spring.datasource.username", "postgres");
        System.setProperty("spring.datasource.password", "postgres");
        System.setProperty("app.demo.reset", "true");
        System.setProperty("app.cors.origens", "http://localhost:5173,http://localhost:4177");
        SpringApplication.run(PetshopApplication.class, args);
    }
}
