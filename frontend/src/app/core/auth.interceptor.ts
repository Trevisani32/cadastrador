import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  // Só anexa o token a requisições para a própria API. Domínios externos
  // (ex.: ViaCEP) jamais devem receber a credencial do usuário.
  const ehApiPropria = req.url.startsWith(environment.apiUrl);
  const requisicao = token && ehApiPropria
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      const ehLogin = req.url.includes('/auth/');
      // 401 = não autenticado (token ausente/expirado) → encerra a sessão.
      // 403 = autenticado, mas sem permissão → mantém a sessão; só propaga o erro.
      if (erro.status === 401 && !ehLogin) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => erro);
    })
  );
};
