import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EnvioCredencialItem,
  EnvioCredencialResumen,
  EstadoEnvioCredencial,
  LoteEnvioResultado
} from '../models/envio-credencial.models';
import { PaginaResponse, UserManagementScope } from '../models/user-management.models';

@Injectable({
  providedIn: 'root'
})
export class EnvioCredencialService {
  private http = inject(HttpClient);

  private baseUrl(scope: UserManagementScope): string {
    return scope === 'admin'
      ? '/api/admin/envios-credenciales'
      : '/api/directivo/envios-credenciales';
  }

  obtenerResumen(scope: UserManagementScope): Observable<EnvioCredencialResumen> {
    return this.http.get<EnvioCredencialResumen>(`${this.baseUrl(scope)}/resumen`);
  }

  listarRegistros(
    scope: UserManagementScope,
    estado: EstadoEnvioCredencial | null,
    page = 0,
    size = 8
  ): Observable<PaginaResponse<EnvioCredencialItem>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<PaginaResponse<EnvioCredencialItem>>(`${this.baseUrl(scope)}/registros`, { params });
  }

  procesarLote(scope: UserManagementScope): Observable<LoteEnvioResultado> {
    return this.http.post<LoteEnvioResultado>(`${this.baseUrl(scope)}/procesar-lote`, {});
  }

  reintentarFallidos(scope: UserManagementScope): Observable<LoteEnvioResultado> {
    return this.http.post<LoteEnvioResultado>(`${this.baseUrl(scope)}/reintentar-fallidos`, {});
  }
}
