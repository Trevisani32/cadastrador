package com.trevisani.cadastrador.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    // 32 bytes => chave HS256 válida (256 bits), codificada em Base64.
    private static final String SECRET =
            Base64.getEncoder().encodeToString("0123456789abcdef0123456789abcdef".getBytes());

    private final JwtService jwtService = new JwtService(SECRET, 86_400_000L);

    private UserDetails usuario(String username) {
        return new User(username, "irrelevante", List.of());
    }

    @Test
    void gerarToken_eExtrairUsername_devolveMesmoSubject() {
        String token = jwtService.gerarToken(usuario("fulano"));

        assertThat(jwtService.extrairUsername(token)).isEqualTo("fulano");
        assertThat(jwtService.tokenValido(token, usuario("fulano"))).isTrue();
    }

    @Test
    void tokenValido_falsoParaUsuarioDiferente() {
        String token = jwtService.gerarToken(usuario("fulano"));

        assertThat(jwtService.tokenValido(token, usuario("outro"))).isFalse();
    }

    @Test
    void tokenValido_falsoParaTokenAdulterado() {
        String token = jwtService.gerarToken(usuario("fulano"));
        String adulterado = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.tokenValido(adulterado, usuario("fulano"))).isFalse();
    }

    @Test
    void tokenExpirado_eConsideradoInvalido() {
        JwtService expirado = new JwtService(SECRET, -1_000L); // já nasce expirado
        String token = expirado.gerarToken(usuario("fulano"));

        assertThat(expirado.tokenValido(token, usuario("fulano"))).isFalse();
    }
}
