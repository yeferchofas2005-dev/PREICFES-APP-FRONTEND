import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaginaResponse,
  UserManagementScope,
  UsuarioActualizarRequest,
  UsuarioCatalogos,
  UsuarioCrearRequest,
  UsuarioFiltro,
  UsuarioItem
} from '../models/user-management.models';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private http = inject(HttpClient);

  private baseUrl(scope: UserManagementScope): string {
    return scope === 'admin' ? '/api/admin/usuarios' : '/api/directivo/usuarios';
  }

  listar(scope: UserManagementScope, filtro: UsuarioFiltro): Observable<PaginaResponse<UsuarioItem>> {
    let params = new HttpParams()
      .set('page', String(filtro.page ?? 0))
      .set('size', String(filtro.size ?? 10));

    if (filtro.busqueda && filtro.busqueda.trim().length > 0) {
      params = params.set('busqueda', filtro.busqueda.trim());
    }
    if (filtro.idRol != null) {
      params = params.set('idRol', String(filtro.idRol));
    }
    if (scope === 'admin' && filtro.idNodo != null) {
      params = params.set('idNodo', String(filtro.idNodo));
    }
    if (filtro.activo !== undefined && filtro.activo !== null) {
      params = params.set('activo', String(filtro.activo));
    }

    return this.http.get<PaginaResponse<UsuarioItem>>(this.baseUrl(scope), { params });
  }

  obtenerCatalogos(scope: UserManagementScope): Observable<UsuarioCatalogos> {
    return this.http.get<UsuarioCatalogos>(`${this.baseUrl(scope)}/catalogos`);
  }

  crear(scope: UserManagementScope, payload: UsuarioCrearRequest): Observable<UsuarioItem> {
    return this.http.post<UsuarioItem>(this.baseUrl(scope), payload);
  }

  actualizar(scope: UserManagementScope, idUsuario: number, payload: UsuarioActualizarRequest): Observable<UsuarioItem> {
    return this.http.put<UsuarioItem>(`${this.baseUrl(scope)}/${idUsuario}`, payload);
  }

  cambiarEstado(scope: UserManagementScope, idUsuario: number, activo: boolean): Observable<UsuarioItem> {
    return this.http.patch<UsuarioItem>(`${this.baseUrl(scope)}/${idUsuario}/estado`, { activo });
  }
}
