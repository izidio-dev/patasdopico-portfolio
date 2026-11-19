package br.com.patasdopico;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class TutorTest extends TesteIntegracao {

    private String criarTutor(String nome, String telefone) throws Exception {
        return mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"" + nome + "\",\"telefone\":\"" + telefone + "\",\"email\":\"\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void criaTutorGuardandoSoOsDigitosDoTelefone() throws Exception {
        String r = criarTutor("Ana Paula", "(11) 98765-4321");
        Integer id = campo(r, "$.id");
        mvc.perform(get("/api/tutores/" + id).header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.telefone").value("11987654321"))
                .andExpect(jsonPath("$.pets").isEmpty());
    }

    @Test
    void buscaIgnoraAcentoEMaiusculaEAchaPorTelefone() throws Exception {
        criarTutor("João Antônio Ribeiro", "11 91111-2222");
        mvc.perform(get("/api/tutores").param("busca", "joao antonio").header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].nome").value("João Antônio Ribeiro"));
        mvc.perform(get("/api/tutores").param("busca", "91111").header("Authorization", token()))
                .andExpect(jsonPath("$.itens[0].nome").value("João Antônio Ribeiro"));
    }

    @Test
    void telefoneInvalidoDevolveErroNoCampo() throws Exception {
        mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Bia\",\"telefone\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.telefone").value("Telefone precisa ter DDD + número (10 ou 11 dígitos)."));
        mvc.perform(post("/api/tutores").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"telefone\":\"11912345678\",\"email\":\"nao-e-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists());
    }

    @Test
    void tutorInexistenteResponde404() throws Exception {
        mvc.perform(get("/api/tutores/999999").header("Authorization", token()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Tutor não encontrado."));
    }

    @Test
    void editaTutor() throws Exception {
        Integer id = campo(criarTutor("Carla", "11922223333"), "$.id");
        mvc.perform(put("/api/tutores/" + id).header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Carla Mendes\",\"telefone\":\"11922223333\",\"observacoes\":\"Prefere sábado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carla Mendes"))
                .andExpect(jsonPath("$.observacoes").value("Prefere sábado"));
    }

    @Test
    void cadastraEditaEExcluiPet() throws Exception {
        Integer tutor = campo(criarTutor("Davi", "11933334444"), "$.id");
        String pet = mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Paçoca\",\"especie\":\"CAO\",\"raca\":\"Vira-lata\",\"porte\":\"MEDIO\",\"nascimento\":\"2021-03-10\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer petId = campo(pet, "$.id");

        mvc.perform(get("/api/tutores/" + tutor).header("Authorization", token()))
                .andExpect(jsonPath("$.pets[0].nome").value("Paçoca"))
                .andExpect(jsonPath("$.pets[0].especie").value("CAO"));

        mvc.perform(put("/api/pets/" + petId).header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Paçoca\",\"especie\":\"CAO\",\"porte\":\"GRANDE\",\"observacoes\":\"Alérgico a frango\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.porte").value("GRANDE"));

        mvc.perform(delete("/api/pets/" + petId).header("Authorization", token())).andExpect(status().isNoContent());
        mvc.perform(get("/api/tutores/" + tutor).header("Authorization", token())).andExpect(jsonPath("$.pets").isEmpty());
    }

    @Test
    void especieInvalidaOuNascimentoNoFuturoSaoRecusados() throws Exception {
        Integer tutor = campo(criarTutor("Eva", "11944445555"), "$.id");
        mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Mimi\",\"especie\":\"DRAGAO\",\"porte\":\"PEQUENO\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/tutores/" + tutor + "/pets").header("Authorization", token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Mimi\",\"especie\":\"GATO\",\"porte\":\"PEQUENO\",\"nascimento\":\"2999-01-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nascimento").exists());
    }
}
