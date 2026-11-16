export interface Rol {
  idRol: number;
  nombre: string;
}

export interface NodoSimple {
  idNodo: number;
  nombre: string;
  localidad?: string | null;
}

export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  documento: string;
  correo: string;
  telefono: string;
  activo: boolean;
  rol: Rol;
  nodo?: NodoSimple | null;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  usuario: Usuario;
}

export interface LoginRequest {
  correo: string;
  password?: string;
}
