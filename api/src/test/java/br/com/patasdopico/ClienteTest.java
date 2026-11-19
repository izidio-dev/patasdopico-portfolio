package br.com.patasdopico;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ClienteTest extends TesteIntegracao {

    static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    /** Cria uma conta de cliente nova e devolve o cabeçalho "Bearer ...". */
    private String cadastrar(String email) throws Exception {
        String r = mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Lia Cliente\",\"email\":\"" + email + "\",\"telefone\":\"(11) 95555-1234\",\"senha\":\"senha-segura\",\"aceitePrivacidade\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.papel").value("CLIENTE"))
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + campo(r, "$.token");
    }

    private static String email() {
        return "cliente-" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
    }

    private Integer criarPet(String token) throws Exception {
        return campo(mvc.perform(post("/api/cliente/pets").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Bento\",\"especie\":\"CAO\",\"porte\":\"MEDIO\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    @Test
    void clienteCriaContaEVeOProprioPerfil() throws Exception {
        String email = email();
        String token = cadastrar(email);
        mvc.perform(get("/api/cliente/perfil").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Lia Cliente"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.telefone").value("11955551234"))
                .andExpect(jsonPath("$.pets").isEmpty());
        // A conta nova consegue entrar com e-mail e senha.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"" + email.toUpperCase() + "\",\"senha\":\"senha-segura\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void cadastroExigeAceiteSenhaForteEEmailUnico() throws Exception {
        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"X\",\"email\":\"x@teste.com\",\"telefone\":\"11955551234\",\"senha\":\"123\",\"aceitePrivacidade\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.aceitePrivacidade").exists())
                .andExpect(jsonPath("$.campos.senha").exists());
        String email = email();
        cadastrar(email);
        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Y\",\"email\":\"" + email + "\",\"telefone\":\"11955551234\",\"senha\":\"senha-segura\",\"aceitePrivacidade\":true}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Já existe uma conta com este e-mail."));
    }

    @Test
    void clienteNaoMexeNoPetDeOutroCliente() throws Exception {
        String ana = cadastrar(email());
        String bia = cadastrar(email());
        Integer petDaAna = criarPet(ana);
        mvc.perform(put("/api/cliente/pets/" + petDaAna).header("Authorization", bia).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Roubado\",\"especie\":\"CAO\",\"porte\":\"MEDIO\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/cliente/perfil").header("Authorization", bia)).andExpect(jsonPath("$.pets").isEmpty());
    }

    @Test
    void agendaEmHorarioLivreComPrecoDaTabelaEHorarioFicaOcupado() throws Exception {
        String token = cadastrar(email());
        Integer pet = criarPet(token);
        String amanha = LocalDate.now(SP).plusDays(1).toString();
        mvc.perform(get("/api/cliente/horarios").param("data", amanha).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem("10:30")));

        mvc.perform(post("/api/cliente/agendamentos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petId\":" + pet + ",\"servico\":\"BANHO\",\"dataHora\":\"" + amanha + "T10:30:00\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SOLICITADO"))
                .andExpect(jsonPath("$.valorCentavos").value(6000));

        mvc.perform(get("/api/cliente/horarios").param("data", amanha).header("Authorization", token))
                .andExpect(jsonPath("$", not(hasItem("10:30"))));
        mvc.perform(post("/api/cliente/agendamentos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petId\":" + pet + ",\"servico\":\"TOSA\",\"dataHora\":\"" + amanha + "T10:30:00\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Esse horário não está mais disponível. Escolha outro."));
        mvc.perform(post("/api/cliente/agendamentos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"petId\":" + pet + ",\"servico\":\"TOSA\",\"dataHora\":\"2020-01-01T10:00:00\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void equipeConfirmaPedidoEClienteCancelaOProprio() throws Exception {
        String token = cadastrar(email());
        Integer pet = criarPet(token);
        String depois = LocalDate.now(SP).plusDays(2).toString();
        Integer pedido = campo(mvc.perform(post("/api/cliente/agendamentos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"petId\":" + pet + ",\"servico\":\"CONSULTA\",\"dataHora\":\"" + depois + "T09:00:00\"}")).andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(patch("/api/atendimentos/" + pedido + "/status").header("Authorization", tokenDe("FUNCIONARIO")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"AGENDADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AGENDADO"));

        String outro = cadastrar(email());
        mvc.perform(patch("/api/cliente/agendamentos/" + pedido + "/cancelar").header("Authorization", outro)).andExpect(status().isNotFound());
        mvc.perform(patch("/api/cliente/agendamentos/" + pedido + "/cancelar").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"));
        mvc.perform(get("/api/cliente/agendamentos").header("Authorization", token))
                .andExpect(jsonPath("$[0].status").value("CANCELADO"));
    }

    @Test
    void clienteExportaEExcluiAPropriaConta() throws Exception {
        String email = email();
        String token = cadastrar(email);
        criarPet(token);
        mvc.perform(get("/api/cliente/exportacao").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tutor.email").value(email))
                .andExpect(jsonPath("$.tutor.pets[0].nome").value("Bento"));
        mvc.perform(delete("/api/cliente/conta").header("Authorization", token)).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"" + email + "\",\"senha\":\"senha-segura\"}"))
                .andExpect(status().isUnauthorized());
    }
}
