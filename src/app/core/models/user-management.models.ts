import { NodoSimple, Rol, Usuario } from './auth.models';

export type UserManagementScope = 'admin' | 'directivo';

export interface PaginaResponse<T> {
  contenido: T[];
  paginaActual: number;
  tamanoPagina: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}

export interface UsuarioCatalogos {
  roles: Rol[];
  nodos: NodoSimple[];
}

export interface UsuarioFiltro {
  busqueda?: string;
  idRol?: number | null;
  idNodo?: number | null;
  activo?: boolean | null;
  page?: number;
  size?: number;
}

export interface UsuarioCrearRequest {
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string;
  password: string;
  telefono?: string | null;
  idRol: number;
  idNodo?: number | null;
  activo?: boolean;
  enviarCredencialesPorCorreo?: boolean;
}

export interface UsuarioActualizarRequest {
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string;
  password?: string | null;
  telefono?: string | null;
  idRol: number;
  idNodo?: number | null;
  activo?: boolean;
  enviarCredencialesPorCorreo?: boolean;
}

export interface CargaMasivaError {
  fila: number;
  documento: string;
  correo: string;
  motivo: string;
}

export interface CargaMasivaUsuariosResponse {
  totalFilasProcesadas: number;
  exitosos: number;
  fallidos: number;
  vinculadosAGrupo: number;
  encoladosParaEnvio: number;
  errores: CargaMasivaError[];
}

export type UsuarioItem = Usuario;
