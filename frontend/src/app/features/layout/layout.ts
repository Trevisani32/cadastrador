import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly nome = this.auth.nome;

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
