import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, map, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DemoStore } from './demo-store';
import { Cliente } from '../models/cliente.model';

/**
 * Modo demonstração (GitHub Pages): intercepta as chamadas para a API e responde
 * com dados do {@link DemoStore} (navegador), sem backend. Chamadas externas
 * (ex.: ViaCEP) passam direto e usam a API real.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demoMode || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const store = inject(DemoStore);
  const url = new URL(req.url, location.origin);
  const path = url.pathname.substring(new URL(environment.apiUrl, location.origin).pathname.length);
  const p = url.searchParams;
  const body: any = req.body ?? {};
  const idDe = (sufixo: string) => Number(sufixo.split('/')[2]);

  const responder = () =>
    of(null).pipe(
      delay(150),
      map(() => {
        try {
          // ----- Autenticação -----
          if (req.method === 'POST' && path === '/auth/login') {
            return ok(store.login(body.username, body.senha));
          }
          if (req.method === 'POST' && path === '/auth/registrar') {
            return ok(store.registrar(body.nome, body.username, body.email, body.senha));
          }
          if (req.method === 'POST' && path === '/auth/esqueci-senha') {
            return ok(store.esqueciSenha(body.email));
          }
          if (req.method === 'POST' && path === '/auth/redefinir-senha') {
            store.redefinirSenha(body.email, body.codigo, body.novaSenha);
            return ok({ mensagem: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
          }

          // ----- Clientes -----
          if (req.method === 'GET' && path === '/clientes/bairros') {
            return ok(store.bairros());
          }
          if (req.method === 'GET' && path === '/clientes') {
            return ok(store.listar(
              p.get('termo') ?? '', p.get('tipoPessoa') ?? '', p.get('bairro') ?? '',
              Number(p.get('page') ?? 0), Number(p.get('size') ?? 10)
            ));
          }
          if (req.method === 'GET' && path.startsWith('/clientes/')) {
            return ok(store.buscar(idDe(path)));
          }
          if (req.method === 'POST' && path === '/clientes') {
            return ok(store.criar(body as Cliente), 201);
          }
          if (req.method === 'PUT' && path.startsWith('/clientes/')) {
            return ok(store.atualizar(idDe(path), body as Cliente));
          }
          if (req.method === 'DELETE' && path.startsWith('/clientes/')) {
            store.excluir(idDe(path));
            return new HttpResponse({ status: 204 });
          }

          throw { status: 404, error: { mensagem: 'Rota não encontrada (demo): ' + path } };
        } catch (e: any) {
          throw new HttpErrorResponse({ status: e.status ?? 500, error: e.error ?? { mensagem: 'Erro na demo' } });
        }
      })
    );

  return responder();
};

function ok(body: unknown, status = 200): HttpResponse<unknown> {
  return new HttpResponse({ status, body });
}
