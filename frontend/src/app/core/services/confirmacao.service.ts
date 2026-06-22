import { Injectable, signal } from '@angular/core';

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  textoCancelar: string;
  perigo: boolean;
}

/**
 * Diálogo de confirmação próprio do sistema, em substituição ao confirm() nativo
 * do navegador. Use `perguntar(...)` e aguarde o booleano da escolha do usuário.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  readonly pedido = signal<PedidoConfirmacao | null>(null);
  private resolver?: (valor: boolean) => void;

  perguntar(opcoes: { mensagem: string; titulo?: string; textoConfirmar?: string; textoCancelar?: string; perigo?: boolean }): Promise<boolean> {
    this.pedido.set({
      titulo: opcoes.titulo ?? 'Confirmar',
      mensagem: opcoes.mensagem,
      textoConfirmar: opcoes.textoConfirmar ?? 'Confirmar',
      textoCancelar: opcoes.textoCancelar ?? 'Cancelar',
      perigo: opcoes.perigo ?? false
    });
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  responder(valor: boolean): void {
    this.pedido.set(null);
    this.resolver?.(valor);
    this.resolver = undefined;
  }
}
