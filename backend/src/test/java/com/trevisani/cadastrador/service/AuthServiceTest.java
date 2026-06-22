package com.trevisani.cadastrador.service;

import com.trevisani.cadastrador.domain.Role;
import com.trevisani.cadastrador.domain.TokenRecuperacao;
import com.trevisani.cadastrador.domain.Usuario;
import com.trevisani.cadastrador.dto.EsqueciSenhaRequest;
import com.trevisani.cadastrador.dto.RecuperacaoResponse;
import com.trevisani.cadastrador.dto.RedefinirSenhaRequest;
import com.trevisani.cadastrador.exception.RegraNegocioException;
import com.trevisani.cadastrador.repository.TokenRecuperacaoRepository;
import com.trevisani.cadastrador.repository.UsuarioRepository;
import com.trevisani.cadastrador.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Testes unitários do fluxo de recuperação de senha, focados nas garantias de
 * segurança: anti-enumeração de e-mails e não vazamento do código.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UsuarioRepository usuarioRepository;
    @Mock TokenRecuperacaoRepository tokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtService jwtService;

    private AuthService comExposicao(boolean exporCodigo) {
        return new AuthService(usuarioRepository, tokenRepository, passwordEncoder,
                authenticationManager, jwtService, exporCodigo);
    }

    private Usuario usuario() {
        return new Usuario("Fulano", "fulano", "fulano@exemplo.com", "hash", Role.ROLE_USER);
    }

    @Test
    void solicitarRecuperacao_emailInexistente_naoRevelaENaoGeraToken() {
        when(usuarioRepository.findByEmailIgnoreCase("naoexiste@x.com")).thenReturn(Optional.empty());

        RecuperacaoResponse resp = comExposicao(false)
                .solicitarRecuperacao(new EsqueciSenhaRequest("naoexiste@x.com"));

        assertThat(resp.demo()).isFalse();
        assertThat(resp.codigoDemo()).isNull();
        assertThat(resp.mensagem()).doesNotContainIgnoringCase("não encontrada");
        verify(tokenRepository, never()).save(any());
    }

    @Test
    void solicitarRecuperacao_emailExistenteSemExpor_geraTokenMasNaoRetornaCodigo() {
        when(usuarioRepository.findByEmailIgnoreCase("fulano@exemplo.com")).thenReturn(Optional.of(usuario()));

        RecuperacaoResponse resp = comExposicao(false)
                .solicitarRecuperacao(new EsqueciSenhaRequest("fulano@exemplo.com"));

        assertThat(resp.demo()).isFalse();
        assertThat(resp.codigoDemo()).isNull();
        verify(tokenRepository).save(any(TokenRecuperacao.class)); // token criado, código só por e-mail
    }

    @Test
    void solicitarRecuperacao_emailExistenteComExpor_retornaCodigoDeDemonstracao() {
        when(usuarioRepository.findByEmailIgnoreCase("fulano@exemplo.com")).thenReturn(Optional.of(usuario()));

        RecuperacaoResponse resp = comExposicao(true)
                .solicitarRecuperacao(new EsqueciSenhaRequest("fulano@exemplo.com"));

        assertThat(resp.demo()).isTrue();
        assertThat(resp.codigoDemo()).isNotNull().hasSize(8).containsOnlyDigits();
    }

    @Test
    void redefinirSenha_emailInexistente_lancaMensagemGenerica() {
        when(usuarioRepository.findByEmailIgnoreCase("x@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> comExposicao(false)
                .redefinirSenha(new RedefinirSenhaRequest("x@x.com", "12345678", "novaSenha")))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("inválido");
    }

    @Test
    void redefinirSenha_codigoInexistente_usaMesmaMensagemQueEmailInvalido() {
        when(usuarioRepository.findByEmailIgnoreCase("fulano@exemplo.com")).thenReturn(Optional.of(usuario()));
        when(tokenRepository.findFirstByUsernameAndCodigoOrderByIdDesc("fulano", "00000000"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> comExposicao(false)
                .redefinirSenha(new RedefinirSenhaRequest("fulano@exemplo.com", "00000000", "novaSenha")))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("inválido"); // idêntica à de e-mail inexistente
    }
}
