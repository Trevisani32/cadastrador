package com.trevisani.cadastrador.controller;

import com.trevisani.cadastrador.service.ClienteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração da camada web focados em autorização: prova que a exclusão
 * de clientes é restrita a ROLE_ADMIN e que rotas protegidas exigem autenticação.
 */
@SpringBootTest
@ActiveProfiles("test")
class ClienteControllerSecurityTest {

    @MockBean
    private ClienteService clienteService;

    private MockMvc mockMvc;

    @Autowired
    void setup(WebApplicationContext context) {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void delete_semAutenticacao_naoAutorizado() throws Exception {
        mockMvc.perform(delete("/api/clientes/1"))
                .andExpect(status().is4xxClientError()); // 401/403: não passa sem login
    }

    @Test
    @WithMockUser(roles = "USER")
    void delete_comUsuarioComum_proibido() throws Exception {
        mockMvc.perform(delete("/api/clientes/1"))
                .andExpect(status().isForbidden()); // 403
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_comAdmin_permitido() throws Exception {
        mockMvc.perform(delete("/api/clientes/1"))
                .andExpect(status().isNoContent()); // 204

        verify(clienteService).excluir(1L);
    }

    @Test
    @WithMockUser(roles = "USER")
    void get_listar_permitidoParaQualquerAutenticado() throws Exception {
        mockMvc.perform(get("/api/clientes"))
                .andExpect(status().isOk());
    }
}
