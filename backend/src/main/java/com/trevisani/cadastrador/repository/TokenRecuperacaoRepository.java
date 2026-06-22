package com.trevisani.cadastrador.repository;

import com.trevisani.cadastrador.domain.TokenRecuperacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenRecuperacaoRepository extends JpaRepository<TokenRecuperacao, Long> {

    Optional<TokenRecuperacao> findFirstByUsernameAndCodigoOrderByIdDesc(String username, String codigo);
}
