import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ActualizarParametroRequest,
  ParametroGeneral
} from '../models/parametro-general.models';

@Injectable({
  providedIn: 'root'
})
export class ParametroGeneralService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/admin/parametros';

  listarParametros(): Observable<ParametroGeneral[]> {
    return this.http.get<ParametroGeneral[]>(this.baseUrl);
  }

  obtenerParametro(clave: string): Observable<ParametroGeneral> {
    return this.http.get<ParametroGeneral>(`${this.baseUrl}/${encodeURIComponent(clave)}`);
  }

  actualizarParametro(
    clave: string,
    request: ActualizarParametroRequest
  ): Observable<ParametroGeneral> {
    return this.http.put<ParametroGeneral>(
      `${this.baseUrl}/${encodeURIComponent(clave)}`,
      request
    );
  }
}
