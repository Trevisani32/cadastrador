package com.trevisani.cadastrador.repository;

import com.trevisani.cadastrador.domain.Cliente;
import com.trevisani.cadastrador.domain.TipoPessoa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("""
            SELECT DISTINCT c FROM Cliente c
            LEFT JOIN c.enderecos e
            WHERE (:termo IS NULL OR :termo = ''
                   OR LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')))
              AND (:tipoPessoa IS NULL OR c.tipoPessoa = :tipoPessoa)
              AND (:bairro IS NULL OR :bairro = ''
                   OR LOWER(e.bairro) LIKE LOWER(CONCAT('%', :bairro, '%')))
            """)
    Page<Cliente> buscar(@Param("termo") String termo,
                         @Param("tipoPessoa") TipoPessoa tipoPessoa,
                         @Param("bairro") String bairro,
                         Pageable pageable);

    /** Bairros distintos cadastrados, para popular o filtro. */
    @Query("SELECT DISTINCT e.bairro FROM Endereco e WHERE e.bairro IS NOT NULL AND e.bairro <> '' ORDER BY e.bairro")
    List<String> listarBairros();
}
