import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CargaMasivaUsuariosResponse,
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

  private buildFiltroParams(scope: UserManagementScope, filtro: UsuarioFiltro): HttpParams {
    let params = new HttpParams();
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
    return params;
  }

  listar(scope: UserManagementScope, filtro: UsuarioFiltro): Observable<PaginaResponse<UsuarioItem>> {
    const params = this.buildFiltroParams(scope, filtro)
      .set('page', String(filtro.page ?? 0))
      .set('size', String(filtro.size ?? 10));

    return this.http.get<PaginaResponse<UsuarioItem>>(this.baseUrl(scope), { params });
  }

  exportarExcel(scope: UserManagementScope, filtro: UsuarioFiltro): Observable<Blob> {
    const params = this.buildFiltroParams(scope, filtro);
    return this.http.get(`${this.baseUrl(scope)}/exportar`, {
      params,
      responseType: 'blob'
    });
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

  descargarPlantilla(scope: UserManagementScope): Observable<Blob> {
    return this.http.get(`${this.baseUrl(scope)}/plantilla-estudiantes`, {
      responseType: 'blob'
    });
  }

  cargarMasiva(
    scope: UserManagementScope,
    archivo: File,
    idNodo?: number | null,
    encolarEnvio = false
  ): Observable<CargaMasivaUsuariosResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('encolarEnvio', String(encolarEnvio));
    if (scope === 'admin' && idNodo != null) {
      formData.append('idNodo', String(idNodo));
    }
    return this.http.post<CargaMasivaUsuariosResponse>(`${this.baseUrl(scope)}/carga-masiva`, formData);
  }
}
