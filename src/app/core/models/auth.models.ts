export interface Rol {
  idRol: number;
  nombre: string;
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
