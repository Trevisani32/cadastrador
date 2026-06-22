import { Component, inject } from '@angular/core';
import { NotificacaoService } from '../../core/services/notificacao.service';

@Component({
  selector: 'app-notificacoes',
  templateUrl: './notificacoes.html',
  styleUrl: './notificacoes.scss'
})
export class Notificacoes {
  protected readonly servico = inject(NotificacaoService);
}
