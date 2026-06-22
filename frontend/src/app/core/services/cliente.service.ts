import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, Page, TipoPessoa } from '../models/cliente.model';

export interface FiltroClientes {
  termo?: string;
  tipoPessoa?: TipoPessoa | '';
  bairro?: string;
  pagina?: number;
  tamanho?: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clientes`;

  listar(filtro: FiltroClientes = {}): Observable<Page<Cliente>> {
    let params = new HttpParams()
      .set('termo', filtro.termo ?? '')
      .set('bairro', filtro.bairro ?? '')
      .set('page', filtro.pagina ?? 0)
      .set('size', filtro.tamanho ?? 10)
      .set('sort', 'nome');
    if (filtro.tipoPessoa) {
      params = params.set('tipoPessoa', filtro.tipoPessoa);
    }
    return this.http.get<Page<Cliente>>(this.base, { params });
  }

  listarBairros(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/bairros`);
  }

  buscar(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  criar(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, cliente);
  }

  atualizar(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, cliente);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
