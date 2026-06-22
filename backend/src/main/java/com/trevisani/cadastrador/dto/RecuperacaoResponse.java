package com.trevisani.cadastrador.dto;

/**
 * Resposta da solicitação de recuperação de senha.
 * Em um cenário real o código iria por e-mail; neste projeto de demonstração
 * ele é devolvido aqui para que o fluxo possa ser testado sem servidor de e-mail.
 */
public record RecuperacaoResponse(
        String mensagem,
        boolean demo,
        String codigoDemo
) {
}
