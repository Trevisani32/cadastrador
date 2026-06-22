import { Component, HostListener, inject } from '@angular/core';
import { ConfirmacaoService } from '../../core/services/confirmacao.service';

@Component({
  selector: 'app-confirmacao',
  templateUrl: './confirmacao.html',
  styleUrl: './confirmacao.scss'
})
export class Confirmacao {
  protected readonly servico = inject(ConfirmacaoService);

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.servico.pedido()) {
      this.servico.responder(false);
    }
  }
}
