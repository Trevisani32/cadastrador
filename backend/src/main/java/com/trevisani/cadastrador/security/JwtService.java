package com.trevisani.cadastrador.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey chave;
    private final long expiracaoMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration}") long expiracaoMs) {
        if (secret == null || secret.isBlank()) {
            // Sem segredo configurado: gera uma chave aleatória em memória. Os tokens
            // deixam de ser válidos a cada reinício — aceitável apenas em desenvolvimento.
            this.chave = Jwts.SIG.HS256.key().build();
            log.warn("app.jwt.secret não definido — usando chave aleatória em memória. "
                    + "Defina a variável de ambiente JWT_SECRET (Base64, 256 bits) em produção.");
        } else {
            this.chave = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        }
        this.expiracaoMs = expiracaoMs;
    }

    public String gerarToken(UserDetails usuario) {
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + expiracaoMs);
        return Jwts.builder()
                .subject(usuario.getUsername())
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(chave)
                .compact();
    }

    public String extrairUsername(String token) {
        return parse(token).getSubject();
    }

    public boolean tokenValido(String token, UserDetails usuario) {
        try {
            Claims claims = parse(token);
            return claims.getSubject().equals(usuario.getUsername())
                    && claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(chave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
