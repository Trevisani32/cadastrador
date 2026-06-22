import { Injectable, signal } from '@angular/core';

export type TipoNotificacao = 'sucesso' | 'erro' | 'info';

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  mensagem: string;
}

/** Duração padrão (ms) que cada notificação fica visível antes de sumir sozinha. */
const DURACAO_PADRAO = 4000;

/**
 * Notificações próprias do sistema (toasts), exibidas no topo da tela.
 * Substitui os avisos nativos do navegador (alert) por uma UI consistente.
 */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private seq = 0;
  readonly itens = signal<Notificacao[]>([]);

  sucesso(mensagem: string): void {
    this.adicionar('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.adicionar('erro', mensagem);
  }

  info(mensagem: string): void {
    this.adicionar('info', mensagem);
  }

  fechar(id: number): void {
    this.itens.update((lista) => lista.filter((n) => n.id !== id));
  }

  private adicionar(tipo: TipoNotificacao, mensagem: string): void {
    const id = ++this.seq;
    this.itens.update((lista) => [...lista, { id, tipo, mensagem }]);
    setTimeout(() => this.fechar(id), DURACAO_PADRAO);
  }
}
