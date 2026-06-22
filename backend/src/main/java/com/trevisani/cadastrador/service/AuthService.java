package com.trevisani.cadastrador.service;

import com.trevisani.cadastrador.domain.Role;
import com.trevisani.cadastrador.domain.TokenRecuperacao;
import com.trevisani.cadastrador.domain.Usuario;
import com.trevisani.cadastrador.dto.*;
import com.trevisani.cadastrador.exception.RegraNegocioException;
import com.trevisani.cadastrador.repository.TokenRecuperacaoRepository;
import com.trevisani.cadastrador.repository.UsuarioRepository;
import com.trevisani.cadastrador.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int VALIDADE_CODIGO_MINUTOS = 15;

    private static final String MSG_RECUPERACAO_GENERICA =
            "Se houver uma conta associada a esse e-mail, enviaremos as instruções de recuperação.";
    private static final String MSG_CODIGO_INVALIDO =
            "Código de verificação inválido ou expirado.";

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacaoRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final boolean exporCodigo;

    public AuthService(UsuarioRepository usuarioRepository, TokenRecuperacaoRepository tokenRepository,
                       PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       @org.springframework.beans.factory.annotation.Value("${app.recuperacao.expor-codigo:false}")
                       boolean exporCodigo) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.exporCodigo = exporCodigo;
    }

    @Transactional
    public AuthResponse registrar(RegisterRequest req) {
        if (usuarioRepository.existsByUsername(req.username())) {
            throw new RegraNegocioException("Nome de usuário já está em uso");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(req.email())) {
            throw new RegraNegocioException("E-mail já está em uso");
        }
        Usuario usuario = new Usuario(
                req.nome(),
                req.username(),
                req.email(),
                passwordEncoder.encode(req.senha()),
                Role.ROLE_USER
        );
        usuarioRepository.save(usuario);
        return gerarResposta(usuario);
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.senha()));
        Usuario usuario = usuarioRepository.findByUsername(req.username()).orElseThrow();
        return gerarResposta(usuario);
    }

    @Transactional
    public RecuperacaoResponse solicitarRecuperacao(EsqueciSenhaRequest req) {
        var usuarioOpt = usuarioRepository.findByEmailIgnoreCase(req.email());
        if (usuarioOpt.isEmpty()) {
            // Resposta idêntica à de sucesso para não revelar se o e-mail existe (anti-enumeração).
            return new RecuperacaoResponse(MSG_RECUPERACAO_GENERICA, false, null);
        }
        Usuario usuario = usuarioOpt.get();

        String codigo = gerarCodigo();
        TokenRecuperacao token = new TokenRecuperacao(
                usuario.getUsername(),
                codigo,
                LocalDateTime.now().plusMinutes(VALIDADE_CODIGO_MINUTOS));
        tokenRepository.save(token);

        if (exporCodigo) {
            // Modo desenvolvimento: sem servidor de e-mail, o código é registrado e devolvido.
            log.info("Código de recuperação para {} ({}): {}", usuario.getUsername(), usuario.getEmail(), codigo);
            return new RecuperacaoResponse(
                    "Código de verificação gerado (modo demonstração).", true, codigo);
        }

        // Em produção, aqui seria disparado o e-mail com o código. O código nunca é
        // retornado na resposta nem registrado em log.
        return new RecuperacaoResponse(MSG_RECUPERACAO_GENERICA, false, null);
    }

    @Transactional
    public void redefinirSenha(RedefinirSenhaRequest req) {
        // Mesma mensagem para e-mail inexistente e código inválido (anti-enumeração).
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new RegraNegocioException(MSG_CODIGO_INVALIDO));

        TokenRecuperacao token = tokenRepository
                .findFirstByUsernameAndCodigoOrderByIdDesc(usuario.getUsername(), req.codigo())
                .orElseThrow(() -> new RegraNegocioException(MSG_CODIGO_INVALIDO));

        if (!token.estaValido()) {
            throw new RegraNegocioException(MSG_CODIGO_INVALIDO);
        }

        usuario.setSenha(passwordEncoder.encode(req.novaSenha()));
        usuarioRepository.save(usuario);

        token.setUsado(true);
        tokenRepository.save(token);
    }

    private String gerarCodigo() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    private AuthResponse gerarResposta(Usuario usuario) {
        User userDetails = new User(usuario.getUsername(), usuario.getSenha(), List.of());
        String token = jwtService.gerarToken(userDetails);
        return AuthResponse.bearer(token, usuario.getUsername(), usuario.getNome(), usuario.getRole().name());
    }
}
