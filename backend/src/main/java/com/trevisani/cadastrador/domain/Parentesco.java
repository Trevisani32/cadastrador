package com.trevisani.cadastrador.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "parentescos")
public class Parentesco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cliente dono do vínculo. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Cliente relacionado (parente). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parente_id", nullable = false)
    private Cliente parente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoParentesco tipo;

    /** Descrição livre usada quando o tipo é OUTRO. */
    @Column(length = 100)
    private String descricao;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Cliente getParente() {
        return parente;
    }

    public void setParente(Cliente parente) {
        this.parente = parente;
    }

    public TipoParentesco getTipo() {
        return tipo;
    }

    public void setTipo(TipoParentesco tipo) {
        this.tipo = tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}
