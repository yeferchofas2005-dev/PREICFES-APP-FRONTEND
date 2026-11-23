export type EstadoEnvioCredencial = 'PENDIENTE' | 'PROCESANDO' | 'ENVIADO' | 'FALLIDO';

export interface EnvioCredencialResumen {
  totalRegistros: number;
  enviados: number;
  pendientes: number;
  procesando: number;
  fallidos: number;
  porcentajeAvance: number;
  enviadosHoyGlobal: number;
  limiteDiario: number;
  cupoRestanteHoy: number;
  loteEnProceso: boolean;
  diasEstimadosRestantes: number;
}

export interface EnvioCredencialItem {
  idEnvio: number;
  idUsuario: number;
  nombreCompleto: string;
  documento: string;
  correo: string;
  rol: string;
  nodo: string;
  estado: EstadoEnvioCredencial;
  prioridad: number;
  intentos: number;
  ultimoError: string | null;
  fechaProgramada: string;
  fechaEnvio: string | null;
}

export interface LoteEnvioResultado {
  iniciado: boolean;
  mensaje: string;
  cupoRestanteHoy: number;
  pendientesEnCola: number;
  registrosAfectados: number;
}
