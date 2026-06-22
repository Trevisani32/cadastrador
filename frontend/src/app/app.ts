import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notificacoes } from './shared/notificacoes/notificacoes';
import { Confirmacao } from './shared/confirmacao/confirmacao';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Notificacoes, Confirmacao],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
