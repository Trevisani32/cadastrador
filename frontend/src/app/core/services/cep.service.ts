import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, retry, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ViaCepResposta {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/** Erro de negócio do serviço de CEP, já tratado para exibição ao usuário. */
export class CepError extends Error {}

@Injectable({ providedIn: 'root' })
export class CepService {
  private http = inject(HttpClient);
  private base = environment.viaCepUrl;

  /**
   * Consulta o CEP na API pública ViaCEP. Aceita CEP com ou sem máscara.
   * Lança `CepError` com mensagem amigável quando o CEP é inválido,
   * não existe ou a consulta falha/excede o tempo limite.
   */
  consultar(cep: string): Observable<ViaCepResposta> {
    const limpo = (cep ?? '').replace(/\D/g, '');
    if (limpo.length !== 8) {
      return throwError(() => new CepError('Informe um CEP com 8 dígitos.'));
    }

    return this.http.get<ViaCepResposta>(`${this.base}/${limpo}/json/`).pipe(
      timeout(5000),
      retry(1),
      map((resp) => {
        // A ViaCEP responde HTTP 200 com { erro: true } para CEP inexistente.
        if (resp.erro) {
          throw new CepError('CEP não encontrado.');
        }
        return resp;
      })
    );
  }
}
