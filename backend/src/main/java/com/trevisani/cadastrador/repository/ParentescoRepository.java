package com.trevisani.cadastrador.repository;

import com.trevisani.cadastrador.domain.Parentesco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParentescoRepository extends JpaRepository<Parentesco, Long> {

    /** Remove vínculos em que o cliente aparece como parente de outros (evita erro de FK ao excluir). */
    @Modifying
    @Query("DELETE FROM Parentesco p WHERE p.parente.id = :clienteId")
    void removerReferenciasAoParente(@Param("clienteId") Long clienteId);
}
